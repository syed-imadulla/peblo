from app.models.models import Episode
from app.scripts.seed import seed_db

def test_95_seed_records_loaded(db_session):
    # Re-seed to ensure a clean state of 95 episodes
    seed_db("../docs/challenge/seed_shows.json")
    
    count = db_session.query(Episode).count()
    assert count == 95
