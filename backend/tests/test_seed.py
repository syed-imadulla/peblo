from app.models.models import Episode

def test_95_seed_records_loaded(db_session):
    count = db_session.query(Episode).count()
    assert count == 95
