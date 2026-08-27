from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.models.models import Episode, Show, Season, Artwork

class ValidationErrorItem(BaseModel):
    type: str
    description: str
    affected_episode_id: Optional[str] = None
    affected_content_group: Optional[str] = None

class ValidationErrors(BaseModel):
    issues: List[ValidationErrorItem] = []
    
    def has_blocking_errors(self) -> bool:
        return len(self.issues) > 0

class ValidationService:
    @staticmethod
    def validate_for_publish(db: Session, episode: Episode) -> ValidationErrors:
        errors = ValidationErrors(issues=[])
        
        # Rule: Must have artwork
        has_art = db.query(Artwork).filter(Artwork.episode_id == episode.id).count() > 0
        if not has_art:
            errors.issues.append(ValidationErrorItem(
                type="missing_artwork",
                description="Episode is missing required artwork",
                affected_episode_id=str(episode.id)
            ))
            
        # Rule: Duration > 0
        if not episode.duration_seconds or episode.duration_seconds <= 0:
            errors.issues.append(ValidationErrorItem(
                type="missing_duration",
                description="Episode has no valid duration",
                affected_episode_id=str(episode.id)
            ))
            
        # Rule: Published show requires a section
        if not episode.season.show.section:
            errors.issues.append(ValidationErrorItem(
                type="missing_section",
                description="Published show requires a section",
                affected_episode_id=str(episode.id)
            ))
            
        # Rule: Unique (content_group, language)
        # If any duplicate exists in the DB, this variant is blocked.
        duplicate_count = db.query(Episode).filter(
            Episode.content_group == episode.content_group,
            Episode.language == episode.language,
            Episode.status == 'published',
            Episode.id != episode.id
        ).count()
        
        if duplicate_count > 0:
            errors.issues.append(ValidationErrorItem(
                type="duplicate_variant",
                description="Duplicate language variants exist for this content group",
                affected_content_group=episode.content_group,
                affected_episode_id=str(episode.id)
            ))
            
        return errors
