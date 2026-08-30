from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, cast, String, func, case
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.services.publish import PublishService
from app.models.models import Episode, Season, Show, Artwork, PublishRun, User
from app.api.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/admin")


# ──────────────────────────────────────────────────────────────────────────────
# Validation report builder — pure function, no DB side-effects
# ──────────────────────────────────────────────────────────────────────────────
def _build_validation_report(db: Session) -> dict:
    """
    Scans ALL episodes (published + draft) and returns a structured report.

    Severity tiers (aligned with challenge rules):
      critical  – missing artwork OR missing duration on a PUBLISHED episode
                  OR duplicate content_group + language pair (catalogue uniqueness)
      warning   – same issues on DRAFT episodes; OR missing section on a show
      info      – missing synopsis (informational, never blocks publish)

    The blocked_records_count reflects episodes that would be rejected by
    PublishService.publish_catalogue().
    """
    episodes = (
        db.query(Episode)
        .options(
            joinedload(Episode.season).joinedload(Season.show),
            joinedload(Episode.artwork),
        )
        .all()
    )

    issues: list[dict] = []
    blocked_episode_ids: set[str] = set()

    # ── Duplicate content_group + language detection ──────────────────────────
    # Challenge rule: each content_group + language pair must be unique in the
    # catalogue so language variants collapse correctly.
    cg_lang_map: dict = defaultdict(list)
    for ep in episodes:
        if ep.content_group and ep.language:
            cg_lang_map[(ep.content_group, ep.language)].append(ep)

    seen_dup_ids: set[str] = set()
    for (cg, lang), eps in cg_lang_map.items():
        if len(eps) > 1:
            for ep in eps:
                ep_id = str(ep.id)
                if ep_id in seen_dup_ids:
                    continue
                seen_dup_ids.add(ep_id)
                season = ep.season
                show = season.show if season else None
                blocked_episode_ids.add(ep_id)
                ts = ep.updated_at.isoformat() if ep.updated_at else ep.created_at.isoformat()
                issues.append({
                    "id": f"duplicate_variant_{ep_id}",
                    "severity": "critical",
                    "issue_type": "Duplicate Content Group",
                    "description": (
                        f"content_group '{cg}' + language '{lang}' is not unique. "
                        "The catalogue requires each content_group/language pair to appear exactly once."
                    ),
                    "content_type": "Content Group",
                    "episode_id": ep_id,
                    "affected_episode_id": ep_id,
                    "show_title": show.title if show else "Unknown Show",
                    "season_number": season.season_number if season else None,
                    "episode_title": ep.episode_title,
                    "language": ep.language,
                    "status": "open",
                    "created_at": ts,
                })

    # ── Per-episode checks ────────────────────────────────────────────────────
    for ep in episodes:
        season = ep.season
        show = season.show if season else None
        show_title = show.title if show else "Unknown Show"
        season_number = season.season_number if season else None
        ep_id = str(ep.id)
        is_published = ep.status == "published"
        ts = ep.updated_at.isoformat() if ep.updated_at else ep.created_at.isoformat()

        # ── Artwork ────────────────────────────────────────────────────────────
        has_art = len(ep.artwork) > 0
        if not has_art:
            if is_published:
                blocked_episode_ids.add(ep_id)
                issues.append({
                    "id": f"missing_artwork_{ep_id}",
                    "severity": "critical",
                    "issue_type": "Missing Artwork",
                    "description": "Published episode is missing artwork. A thumbnail is required before publishing.",
                    "content_type": "Thumbnail",
                    "episode_id": ep_id,
                    "affected_episode_id": ep_id,
                    "show_title": show_title,
                    "season_number": season_number,
                    "episode_title": ep.episode_title,
                    "language": ep.language,
                    "status": "open",
                    "created_at": ts,
                })
            else:
                issues.append({
                    "id": f"missing_artwork_draft_{ep_id}",
                    "severity": "warning",
                    "issue_type": "Missing Artwork",
                    "description": "Draft episode has no artwork. Required before publishing.",
                    "content_type": "Thumbnail",
                    "episode_id": ep_id,
                    "affected_episode_id": ep_id,
                    "show_title": show_title,
                    "season_number": season_number,
                    "episode_title": ep.episode_title,
                    "language": ep.language,
                    "status": "open",
                    "created_at": ts,
                })

        # ── Duration ───────────────────────────────────────────────────────────
        no_dur = not ep.duration_seconds or ep.duration_seconds <= 0
        if no_dur:
            if is_published:
                blocked_episode_ids.add(ep_id)
                issues.append({
                    "id": f"missing_duration_{ep_id}",
                    "severity": "critical",
                    "issue_type": "Missing Duration",
                    "description": "Published episode has no duration. Duration is required.",
                    "content_type": "Duration",
                    "episode_id": ep_id,
                    "affected_episode_id": ep_id,
                    "show_title": show_title,
                    "season_number": season_number,
                    "episode_title": ep.episode_title,
                    "language": ep.language,
                    "status": "open",
                    "created_at": ts,
                })
            else:
                issues.append({
                    "id": f"missing_duration_draft_{ep_id}",
                    "severity": "warning",
                    "issue_type": "Missing Duration",
                    "description": "Draft episode has no duration. Required before publishing.",
                    "content_type": "Duration",
                    "episode_id": ep_id,
                    "affected_episode_id": ep_id,
                    "show_title": show_title,
                    "season_number": season_number,
                    "episode_title": ep.episode_title,
                    "language": ep.language,
                    "status": "open",
                    "created_at": ts,
                })

        # ── Missing section on show ────────────────────────────────────────────
        if show and not show.section:
            if is_published:
                blocked_episode_ids.add(ep_id)
                issues.append({
                    "id": f"missing_section_{ep_id}",
                    "severity": "critical",
                    "issue_type": "Missing Show Section",
                    "description": "Published show must have a section assigned for catalogue grouping.",
                    "content_type": "Section",
                    "episode_id": ep_id,
                    "affected_episode_id": ep_id,
                    "show_title": show_title,
                    "season_number": season_number,
                    "episode_title": ep.episode_title,
                    "language": ep.language,
                    "status": "open",
                    "created_at": ts,
                })
            else:
                issues.append({
                    "id": f"missing_section_draft_{ep_id}",
                    "severity": "warning",
                    "issue_type": "Missing Show Section",
                    "description": f"Show '{show_title}' has no section assigned. It won't appear in catalogue categories when published.",
                    "content_type": "Section",
                    "episode_id": ep_id,
                    "affected_episode_id": ep_id,
                    "show_title": show_title,
                    "season_number": season_number,
                    "episode_title": ep.episode_title,
                    "language": ep.language,
                    "status": "open",
                    "created_at": ts,
                })

        # ── Missing synopsis ───────────────────────────────────────────────────
        if not ep.synopsis:
            issues.append({
                "id": f"missing_synopsis_{ep_id}",
                "severity": "info",
                "issue_type": "Missing Synopsis",
                "description": "Synopsis is recommended for better content discovery.",
                "content_type": "Synopsis",
                "episode_id": ep_id,
                "affected_episode_id": ep_id,
                "show_title": show_title,
                "season_number": season_number,
                "episode_title": ep.episode_title,
                "language": ep.language,
                "status": "open",
                "created_at": ts,
            })

    critical_count = sum(1 for i in issues if i["severity"] == "critical")
    warning_count  = sum(1 for i in issues if i["severity"] == "warning")
    info_count     = sum(1 for i in issues if i["severity"] == "info")

    return {
        "total_issues": len(issues),
        "critical_count": critical_count,
        "warning_count": warning_count,
        "info_count": info_count,
        "blocked_records_count": len(blocked_episode_ids),
        "total_records_processed": len(episodes),
        "valid_records_count": len(episodes) - len(blocked_episode_ids),
        "validated_at": datetime.now(timezone.utc).isoformat(),
        "issues": issues,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/validation-report")
def get_validation_report(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return _build_validation_report(db)


@router.post("/run-validation")
def run_validation(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Stateless re-run — re-derives from live DB without writing any state."""
    return _build_validation_report(db)


@router.get("/catalog/preview")
def preview_catalog(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    try:
        return PublishService.preview_catalogue(db)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/catalog/publish")
def publish_catalog(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_current_admin),
):
    try:
        run = PublishService.publish_catalogue(db, triggered_by=admin_user.get("sub"))
        if run.status == "failed":
            raise HTTPException(status_code=500, detail="Publish failed — no valid records")
        return {
            "status": "success",
            "run_id": str(run.id),
            "published_records": run.published_records,
            "blocked_records": run.blocked_records,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/publish-history")
def get_publish_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = None,
    status: str = None,
    date_range: str = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),  # read-only — all authenticated users
):
    query = db.query(PublishRun, User).outerjoin(User, PublishRun.triggered_by == User.id)

    # Search logic matching existing JS client-side behavior
    if search:
        raw_search = search.lower()
        if raw_search.startswith("pub_"):
            raw_search = raw_search[4:]
            
        search_term = f"%{raw_search}%"
        query = query.filter(
            or_(
                cast(PublishRun.id, String).ilike(search_term),
                User.email.ilike(search_term),
                cast(PublishRun.triggered_by, String).ilike(search_term)
            )
        )

    if status and status != 'all':
        query = query.filter(PublishRun.status == status)

    if date_range and date_range != 'all':
        now = datetime.utcnow()
        cutoff = None
        if date_range == '24h':
            cutoff = now - timedelta(hours=24)
        elif date_range == '7d':
            cutoff = now - timedelta(days=7)
        elif date_range == '30d':
            cutoff = now - timedelta(days=30)
        
        if cutoff:
            query = query.filter(PublishRun.created_at >= cutoff)

    total_count = query.count()
    total_pages = max(1, (total_count + page_size - 1) // page_size)

    runs = (
        query.order_by(PublishRun.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # Compute global stats (unfiltered database truth)
    stats_query = db.query(
        func.count(PublishRun.id).label("total"),
        func.sum(case((PublishRun.status == 'success', 1), else_=0)).label("success"),
        func.sum(case((PublishRun.status == 'failed', 1), else_=0)).label("failed"),
        func.avg(PublishRun.duration_seconds).label("avg_duration")
    ).one()
    
    avg_dur = stats_query.avg_duration
    global_stats = {
        "total": stats_query.total or 0,
        "success": stats_query.success or 0,
        "failed": stats_query.failed or 0,
        "avgDuration": int(avg_dur) if avg_dur is not None else None
    }
    
    # Compute the true global latest run
    latest_run_obj = db.query(PublishRun, User).outerjoin(User, PublishRun.triggered_by == User.id).order_by(PublishRun.created_at.desc()).first()
    latest_run_data = None
    if latest_run_obj:
        run_latest, user_latest = latest_run_obj
        latest_run_data = {
            "id": str(run_latest.id),
            "status": run_latest.status,
            "created_at": run_latest.created_at.isoformat(),
            "triggered_by": str(run_latest.triggered_by) if run_latest.triggered_by else None,
            "user": {"id": str(user_latest.id), "email": user_latest.email, "role": user_latest.role} if user_latest else None
        }

    data = [
        {
            "id": str(run.id),
            "status": run.status,
            "total_records_processed": run.total_records_processed,
            "published_records": run.published_records,
            "blocked_records": run.blocked_records,
            "error_log": run.error_log,
            "stats": run.stats,
            "duration_seconds": run.duration_seconds,
            "created_at": run.created_at.isoformat(),
            "triggered_by": str(run.triggered_by) if run.triggered_by else None,
            "user": {"id": str(user.id), "email": user.email, "role": user.role} if user else None
        }
        for run, user in runs
    ]

    return {
        "data": data,
        "total_count": total_count,
        "total_pages": total_pages,
        "global_stats": global_stats,
        "latest_run": latest_run_data
    }
