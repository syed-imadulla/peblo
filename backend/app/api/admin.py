from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.core.database import get_db
from app.services.publish import PublishService
from app.services.validation import ValidationService
from app.models.models import Episode, Season, Show, Artwork, PublishRun
from app.api.auth import get_current_user, get_current_admin
from pydantic import BaseModel

router = APIRouter(prefix="/admin")


def _build_validation_report(db: Session):
    """
    Builds a rich validation report scanning ALL episodes (published + draft).
    Severity tiers:
      critical  - missing artwork OR missing duration on a PUBLISHED episode (blocks publish)
      warning   - missing section on published show, OR artwork/duration missing on draft episode
      info      - missing synopsis (informational; never blocks publish)
    """
    episodes = db.query(Episode).options(
        joinedload(Episode.season).joinedload(Season.show),
        joinedload(Episode.artwork)
    ).all()

    issues = []
    blocked_episode_ids = set()

    for ep in episodes:
        season = ep.season
        show = season.show if season else None
        show_title = show.title if show else "Unknown Show"
        season_number = season.season_number if season else None
        ep_id = str(ep.id)
        is_published = ep.status == "published"

        # --- CRITICAL: missing artwork on published episode ---
        has_art = len(ep.artwork) > 0
        if not has_art and is_published:
            blocked_episode_ids.add(ep_id)
            issues.append({
                "id": f"missing_artwork_{ep_id}",
                "severity": "critical",
                "issue_type": "Missing Artwork",
                "description": "Episode is missing one or more required artwork images.",
                "content_type": "Thumbnail",
                "episode_id": ep_id,
                "episode_title": ep.episode_title,
                "show_title": show_title,
                "season_number": season_number,
                "language": ep.language,
                "status": "open",
                "created_at": ep.updated_at.isoformat() if ep.updated_at else ep.created_at.isoformat(),
            })
        elif not has_art and not is_published:
            # Warning for drafts missing artwork
            issues.append({
                "id": f"missing_artwork_draft_{ep_id}",
                "severity": "warning",
                "issue_type": "Missing Artwork",
                "description": "Draft episode has no artwork. Artwork is required before publishing.",
                "content_type": "Thumbnail",
                "episode_id": ep_id,
                "episode_title": ep.episode_title,
                "show_title": show_title,
                "season_number": season_number,
                "language": ep.language,
                "status": "open",
                "created_at": ep.updated_at.isoformat() if ep.updated_at else ep.created_at.isoformat(),
            })

        # --- CRITICAL: missing duration on published episode ---
        if (not ep.duration_seconds or ep.duration_seconds <= 0) and is_published:
            blocked_episode_ids.add(ep_id)
            issues.append({
                "id": f"missing_duration_{ep_id}",
                "severity": "critical",
                "issue_type": "Missing Duration",
                "description": "Duration is required for published episodes.",
                "content_type": "Duration",
                "episode_id": ep_id,
                "episode_title": ep.episode_title,
                "show_title": show_title,
                "season_number": season_number,
                "language": ep.language,
                "status": "open",
                "created_at": ep.updated_at.isoformat() if ep.updated_at else ep.created_at.isoformat(),
            })
        elif (not ep.duration_seconds or ep.duration_seconds <= 0) and not is_published:
            issues.append({
                "id": f"missing_duration_draft_{ep_id}",
                "severity": "warning",
                "issue_type": "Missing Duration",
                "description": "Draft episode has no duration. Duration is required before publishing.",
                "content_type": "Duration",
                "episode_id": ep_id,
                "episode_title": ep.episode_title,
                "show_title": show_title,
                "season_number": season_number,
                "language": ep.language,
                "status": "open",
                "created_at": ep.updated_at.isoformat() if ep.updated_at else ep.created_at.isoformat(),
            })

        # --- WARNING: missing section on published show ---
        if show and not show.section and is_published:
            blocked_episode_ids.add(ep_id)
            issues.append({
                "id": f"missing_section_{ep_id}",
                "severity": "warning",
                "issue_type": "Missing Show Section",
                "description": "Published show must have a section assigned for catalogue grouping.",
                "content_type": "Section",
                "episode_id": ep_id,
                "episode_title": ep.episode_title,
                "show_title": show_title,
                "season_number": season_number,
                "language": ep.language,
                "status": "open",
                "created_at": ep.updated_at.isoformat() if ep.updated_at else ep.created_at.isoformat(),
            })

        # --- INFO: missing synopsis ---
        if not ep.synopsis:
            issues.append({
                "id": f"missing_synopsis_{ep_id}",
                "severity": "info",
                "issue_type": "Missing Synopsis",
                "description": "Synopsis is recommended for better content discovery.",
                "content_type": "Synopsis",
                "episode_id": ep_id,
                "episode_title": ep.episode_title,
                "show_title": show_title,
                "season_number": season_number,
                "language": ep.language,
                "status": "open",
                "created_at": ep.updated_at.isoformat() if ep.updated_at else ep.created_at.isoformat(),
            })

    critical_count = sum(1 for i in issues if i["severity"] == "critical")
    warning_count = sum(1 for i in issues if i["severity"] == "warning")
    info_count = sum(1 for i in issues if i["severity"] == "info")

    return {
        "total_issues": len(issues),
        "critical_count": critical_count,
        "warning_count": warning_count,
        "info_count": info_count,
        "blocked_records_count": len(blocked_episode_ids),
        "issues": issues,
    }


@router.get("/validation-report")
def get_validation_report(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return _build_validation_report(db)


@router.post("/run-validation")
def run_validation(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Re-runs validation and returns fresh results. Validation is stateless — no DB write needed."""
    return _build_validation_report(db)

@router.post("/catalog/publish")
def publish_catalog(db: Session = Depends(get_db), admin_user: dict = Depends(get_current_admin)):
    try:
        run = PublishService.publish_catalogue(db)
        if run.status == "failed":
            raise HTTPException(status_code=500, detail="Publish Failed")
            
        return {
            "status": "success",
            "run_id": str(run.id),
            "published_records": run.published_records,
            "blocked_records": run.blocked_records
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/publish-history")
def get_publish_history(db: Session = Depends(get_db), admin_user: dict = Depends(get_current_admin)):
    runs = db.query(PublishRun).order_by(PublishRun.created_at.desc()).limit(50).all()
    
    # Format them for the frontend
    history = []
    for run in runs:
        history.append({
            "id": str(run.id),
            "status": run.status,
            "total_records_processed": run.total_records_processed,
            "published_records": run.published_records,
            "blocked_records": run.blocked_records,
            "created_at": run.created_at.isoformat(),
            "triggered_by": str(run.triggered_by) if run.triggered_by else None
        })
        
    return history
