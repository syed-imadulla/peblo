from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from collections import defaultdict
from datetime import datetime, timezone
from app.core.database import get_db
from app.services.publish import PublishService
from app.models.models import Episode, Season, Show, Artwork, PublishRun
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


@router.post("/catalog/publish")
def publish_catalog(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_current_admin),
):
    try:
        run = PublishService.publish_catalogue(db)
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
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),  # read-only — all authenticated users
):
    runs = (
        db.query(PublishRun)
        .order_by(PublishRun.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": str(run.id),
            "status": run.status,
            "total_records_processed": run.total_records_processed,
            "published_records": run.published_records,
            "blocked_records": run.blocked_records,
            "error_log": run.error_log,
            "created_at": run.created_at.isoformat(),
            "triggered_by": str(run.triggered_by) if run.triggered_by else None,
        }
        for run in runs
    ]
