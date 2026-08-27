from app.models.models import Episode, Show
from app.services.validation import ValidationService

def test_missing_artwork_is_blocked(db_session):
    # ep_0036 is the one missing artwork in the seed
    ep_missing_art = db_session.query(Episode).filter(Episode.episode_title == 'Lost in the Museum').first()
    if ep_missing_art:
        errors = ValidationService.validate_for_publish(db_session, ep_missing_art)
        assert errors.has_blocking_errors()
        assert any(e.type == 'missing_artwork' for e in errors.issues)

def test_duplicate_variants_blocked(db_session):
    # ep_0004 and ep_9001 are duplicates in the seed
    ep = db_session.query(Episode).filter(Episode.content_group == 'motis-many-lives-s01e02', Episode.language == 'hi').first()
    if ep:
        errors = ValidationService.validate_for_publish(db_session, ep)
        assert errors.has_blocking_errors()
        assert any(e.type == 'duplicate_variant' for e in errors.issues)
