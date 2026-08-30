import os
import re

# 1. Update storage.py
storage_path = "backend/app/services/storage.py"
with open(storage_path, "r") as f:
    storage_code = f.read()

storage_code = storage_code.replace(
"""    def write(self, filename: str, content: str):
        raise NotImplementedError""",
"""    def write(self, filename: str, content: str):
        raise NotImplementedError

    def write_binary(self, filename: str, content: bytes):
        raise NotImplementedError"""
)

storage_code = storage_code.replace(
"""    def write(self, filename: str, content: str):
        with open(os.path.join(self.base_path, filename), "w") as f:
            f.write(content)""",
"""    def write(self, filename: str, content: str):
        with open(os.path.join(self.base_path, filename), "w") as f:
            f.write(content)

    def write_binary(self, filename: str, content: bytes):
        with open(os.path.join(self.base_path, filename), "wb") as f:
            f.write(content)"""
)

storage_code = storage_code.replace(
"""storage = LocalStorageProvider()""",
"""storage = LocalStorageProvider()
asset_storage = LocalStorageProvider(base_path=settings.ASSETS_DIR)"""
)

with open(storage_path, "w") as f:
    f.write(storage_code)


# 2. Update artwork.py
artwork_path = "backend/app/api/artwork.py"
with open(artwork_path, "r") as f:
    artwork_code = f.read()

artwork_code = artwork_code.replace(
"""from app.services.storage import storage""",
"""from app.services.storage import storage, asset_storage"""
)

artwork_code = artwork_code.replace(
"""    # Store using the existing storage provider (which writes to DATA_DIR)
    # The storage provider expects strings, we will just write binary directly using python if needed
    # But storage provider write() takes string... wait, let's write as binary directly
    # Wait, storage provider doesn't have a binary write method. We might need to add one.
    
    # Save to ASSETS_DIR so it is served from the /assets static mount
    filepath = os.path.join(settings.ASSETS_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)""",
"""    # Store using the existing storage provider configured for assets
    asset_storage.write_binary(filename, contents)"""
)

with open(artwork_path, "w") as f:
    f.write(artwork_code)


# 3. Update auth.py
auth_path = "backend/app/api/auth.py"
with open(auth_path, "r") as f:
    auth_code = f.read()

auth_code = auth_code.replace(
"""from fastapi import APIRouter, HTTPException, Depends""",
"""from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User"""
)

auth_code = auth_code.replace(
"""@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    # Dummy auth logic
    if req.username == "admin" and req.password == "admin":
        role = "admin"
    elif req.username == "editor" and req.password == "editor":
        role = "editor"
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = create_access_token({"sub": req.username, "role": role})
    return {"access_token": token, "role": role}""",
"""@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    if req.username == "admin" and req.password == "admin":
        user = db.query(User).filter(User.email == "admin@peblo.tv").first()
        if not user:
            user = User(email="admin@peblo.tv", role="admin")
            db.add(user)
            db.commit()
        role = "admin"
        sub = str(user.id)
    elif req.username == "editor" and req.password == "editor":
        user = db.query(User).filter(User.email == "editor@peblo.tv").first()
        if not user:
            user = User(email="editor@peblo.tv", role="editor")
            db.add(user)
            db.commit()
        role = "editor"
        sub = str(user.id)
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = create_access_token({"sub": sub, "role": role})
    return {"access_token": token, "role": role}"""
)

with open(auth_path, "w") as f:
    f.write(auth_code)


# 4. Update admin.py
admin_path = "backend/app/api/admin.py"
with open(admin_path, "r") as f:
    admin_code = f.read()

admin_code = admin_code.replace(
"""    try:
        run = PublishService.publish_catalogue(db)
        if run.status == "failed":""",
"""    try:
        run = PublishService.publish_catalogue(db, triggered_by=admin_user.get("sub"))
        if run.status == "failed":"""
)

with open(admin_path, "w") as f:
    f.write(admin_code)

print("Updates applied successfully.")
