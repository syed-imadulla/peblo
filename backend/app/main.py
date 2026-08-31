from fastapi import FastAPI, Depends, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.config import settings
from app.core.exceptions import ValidationErrorException, validation_exception_handler
from app.api import admin, catalog, auth, crud, artwork, settings as settings_api
import os

app = FastAPI(title="Peblo TV Mini Backend")

# Enable CORS for CMS and Viewer frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure DATA_DIR and ASSETS_DIR exist
os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.ASSETS_DIR, exist_ok=True)
# Mount assets directory for serving artwork (challenge fixtures + uploaded files)
app.mount("/assets", StaticFiles(directory=settings.ASSETS_DIR), name="assets")

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(crud.router)
app.include_router(artwork.router)
app.include_router(catalog.router)
app.include_router(settings_api.router)

app.add_exception_handler(ValidationErrorException, validation_exception_handler)

@app.get("/health")
def health_check(response: Response, db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "db": "connected"
        }
    except Exception:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"error": "Database disconnected"}
