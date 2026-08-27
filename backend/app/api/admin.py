from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.publish import PublishService
from app.models.models import Episode
from app.services.validation import ValidationService
from app.api.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/admin")

@router.get("/validation-report")
def get_validation_report(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    episodes = db.query(Episode).filter(Episode.status == 'published').all()
    all_issues = []
    blocked_count = 0
    
    for ep in episodes:
        errors = ValidationService.validate_for_publish(db, ep)
        if errors.has_blocking_errors():
            blocked_count += 1
            for issue in errors.issues:
                all_issues.append(issue.model_dump())
                
    return {
        "blocked_records_count": blocked_count,
        "issues": all_issues
    }

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
