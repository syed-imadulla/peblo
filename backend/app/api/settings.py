from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Any, Dict
import json
import os

from app.core.database import get_db
from app.api.auth import get_current_admin
from app.models.models import SystemSettings
from app.services.storage import asset_storage, storage
from app.core.config import settings as app_settings

router = APIRouter(
    prefix="/admin/settings",
    tags=["Settings"],
)

# Pydantic Schemas

class SiteSettingsUpdate(BaseModel):
    site_name: str
    admin_email: str
    site_url: str
    timezone: str

class ContentSettingsUpdate(BaseModel):
    default_section: str
    default_languages: List[str]
    default_status: str
    season_0_handling: str
    content_grouping: str

class PublishingSettingsUpdate(BaseModel):
    auto_publish: bool
    generate_backup: bool
    catalogue_format: str
    atomic_publish: bool

class StorageTestResponse(BaseModel):
    success: bool
    message: str

def get_settings(db: Session) -> SystemSettings:
    settings_obj = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if not settings_obj:
        settings_obj = SystemSettings()
        db.add(settings_obj)
        db.commit()
        db.refresh(settings_obj)
    return settings_obj

def get_system_info() -> dict:
    try:
        # Load reference.json
        ref_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "docs", "challenge", "reference.json")
        with open(ref_path, "r") as f:
            reference_data = json.load(f)
            
        artwork_specs = reference_data.get("artwork_specs", {})
    except Exception as e:
        artwork_specs = {}

    # Define public URL depending on how the backend serves assets. 
    # Usually the backend mounts /assets or similar.
    # We will just expose the base path.
    return {
        "storage_provider": "LocalStorageProvider",
        "data_path": app_settings.DATA_DIR,
        "assets_path": app_settings.ASSETS_DIR,
        "artwork_specs": artwork_specs
    }

@router.get("")
def read_settings(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_current_admin)
):
    settings_obj = get_settings(db)
    system_info = get_system_info()
    return {
        "db_settings": settings_obj,
        "system_info": system_info
    }

@router.put("/site")
def update_site_settings(
    update_data: SiteSettingsUpdate,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_current_admin)
):
    settings_obj = get_settings(db)
    settings_obj.site_name = update_data.site_name
    settings_obj.admin_email = update_data.admin_email
    settings_obj.site_url = update_data.site_url
    settings_obj.timezone = update_data.timezone
    db.commit()
    db.refresh(settings_obj)
    return settings_obj

@router.put("/content")
def update_content_settings(
    update_data: ContentSettingsUpdate,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_current_admin)
):
    settings_obj = get_settings(db)
    settings_obj.default_section = update_data.default_section
    settings_obj.default_languages = update_data.default_languages
    settings_obj.default_status = update_data.default_status
    settings_obj.season_0_handling = update_data.season_0_handling
    settings_obj.content_grouping = update_data.content_grouping
    db.commit()
    db.refresh(settings_obj)
    return settings_obj

@router.put("/publishing")
def update_publishing_settings(
    update_data: PublishingSettingsUpdate,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_current_admin)
):
    settings_obj = get_settings(db)
    settings_obj.auto_publish = update_data.auto_publish
    settings_obj.generate_backup = update_data.generate_backup
    settings_obj.catalogue_format = update_data.catalogue_format
    settings_obj.atomic_publish = update_data.atomic_publish
    db.commit()
    db.refresh(settings_obj)
    return settings_obj

@router.post("/storage/test")
def test_storage_connection(
    admin_user: dict = Depends(get_current_admin)
):
    try:
        # Test BOTH storage and asset_storage
        test_filename = ".connection_test"
        
        # Test main data storage
        storage.write(test_filename, "test")
        content = storage.read(test_filename)
        if content != "test":
            raise Exception("Data storage read value did not match written value.")
            
        # Test asset storage
        asset_storage.write(test_filename, "test_asset")
        asset_content = asset_storage.read(test_filename)
        if asset_content != "test_asset":
            raise Exception("Asset storage read value did not match written value.")

        # Clean up
        try:
            storage.delete(test_filename)
            asset_storage.delete(test_filename)
        except Exception:
            pass
            
        return StorageTestResponse(success=True, message="Storage connection successful. Base path and assets path are writable.")
    except Exception as e:
        return StorageTestResponse(success=False, message=str(e))
