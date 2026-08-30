from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl
from typing import List

from app.core.database import get_db
from app.api.auth import get_current_admin
from app.models.models import SystemSettings
from app.services.storage import asset_storage, storage

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

@router.get("")
def read_settings(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_current_admin)
):
    settings_obj = get_settings(db)
    return settings_obj

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
        # Write a temporary test file to ensure local storage works
        test_filename = ".connection_test"
        storage.write(test_filename, "test")
        
        # Verify it can be read
        content = storage.read(test_filename)
        if content != "test":
            raise Exception("Read value did not match written value.")
            
        return StorageTestResponse(success=True, message="Storage connection successful. Base path is writable.")
    except Exception as e:
        return StorageTestResponse(success=False, message=str(e))
