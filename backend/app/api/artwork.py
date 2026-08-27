from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from uuid import UUID
import uuid
import os
from PIL import Image
import io

from app.core.database import get_db
from app.core.config import settings
from app.models.models import Artwork, Show, Season, Episode
from app.api.auth import get_current_user
from app.services.storage import storage

router = APIRouter(prefix="/admin", dependencies=[Depends(get_current_user)])

MAX_SIZE_BYTES = 200 * 1024

def validate_dimensions(img: Image.Image, expected_type: str):
    width, height = img.size
    
    if expected_type == "poster":
        # Expect 2:3 aspect ratio
        if abs(width / height - 2/3) > 0.1:
            raise HTTPException(status_code=400, detail="Poster must have a 2:3 aspect ratio")
    elif expected_type in ["banner", "thumbnail"]:
        # Expect 16:9 aspect ratio
        if abs(width / height - 16/9) > 0.1:
            raise HTTPException(status_code=400, detail=f"{expected_type.capitalize()} must have a 16:9 aspect ratio")
    else:
        raise HTTPException(status_code=400, detail="Invalid artwork type")

@router.post("/artwork", response_model=dict)
async def upload_artwork(
    entity_type: str = Form(...),
    entity_id: UUID = Form(...),
    type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if entity_type not in ["show", "season", "episode"]:
        raise HTTPException(status_code=400, detail="Invalid entity type")
        
    contents = await file.read()
    size_bytes = len(contents)
    
    if size_bytes > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="This image is too large. Maximum file size is 200 KB. Please choose a smaller image.")
        
    try:
        img = Image.open(io.BytesIO(contents))
        img.verify() # Verify it's a valid image
        
        # Re-open for size check because verify() breaks the image object for some formats
        img = Image.open(io.BytesIO(contents))
        validate_dimensions(img, type)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file format")
        
    # Verify entity exists
    if entity_type == "show":
        entity = db.query(Show).filter(Show.id == entity_id).first()
    elif entity_type == "season":
        entity = db.query(Season).filter(Season.id == entity_id).first()
    else:
        entity = db.query(Episode).filter(Episode.id == entity_id).first()
        
    if not entity:
        raise HTTPException(status_code=404, detail=f"{entity_type.capitalize()} not found")
        
    # Generate filename and save to storage
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"artwork_{uuid.uuid4().hex[:8]}.{ext}"
    
    # Store using the existing storage provider (which writes to DATA_DIR)
    # The storage provider expects strings, we will just write binary directly using python if needed
    # But storage provider write() takes string... wait, let's write as binary directly
    # Wait, storage provider doesn't have a binary write method. We might need to add one.
    
    # Save to ASSETS_DIR so it is served from the /assets static mount
    filepath = os.path.join(settings.ASSETS_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)
        
    # Remove existing artwork of this type for this entity
    existing = db.query(Artwork).filter(
        Artwork.type == type,
        getattr(Artwork, f"{entity_type}_id") == entity_id
    ).first()
    
    if existing:
        db.delete(existing)
        
    artwork = Artwork(
        type=type,
        url=f"/assets/{filename}", # URL accessible from frontend
        size_bytes=size_bytes
    )
    setattr(artwork, f"{entity_type}_id", entity_id)
    
    db.add(artwork)
    db.commit()
    db.refresh(artwork)
    
    return {
        "status": "success",
        "artwork": {
            "id": str(artwork.id),
            "url": artwork.url,
            "type": artwork.type,
            "size_bytes": artwork.size_bytes
        }
    }
