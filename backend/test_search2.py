import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.api.admin import get_publish_history
from app.models.models import PublishRun

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://peblo_user:peblo_password@localhost:5432/peblo_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_search():
    db = SessionLocal()
    # Get a real run ID
    first_run = db.query(PublishRun).first()
    run_id = str(first_run.id)
    print(f"Testing with real run ID: {run_id}")
    
    # Test 1: pub_<first_8_chars>
    pub_prefix_search = f"pub_{run_id[:8]}"
    res1 = get_publish_history(page=1, page_size=10, search=pub_prefix_search, status=None, date_range=None, db=db, current_user=None)
    print(f"Search '{pub_prefix_search}' count: {res1['total_count']} (Expected >= 1)")
    
    # Test 2: raw uuid first 8 chars
    raw_prefix_search = run_id[:8]
    res2 = get_publish_history(page=1, page_size=10, search=raw_prefix_search, status=None, date_range=None, db=db, current_user=None)
    print(f"Search '{raw_prefix_search}' count: {res2['total_count']} (Expected >= 1)")
    
    # Test 3: PUB_<first_8_chars>
    pub_upper_search = f"PUB_{run_id[:8].upper()}"
    res3 = get_publish_history(page=1, page_size=10, search=pub_upper_search, status=None, date_range=None, db=db, current_user=None)
    print(f"Search '{pub_upper_search}' count: {res3['total_count']} (Expected >= 1)")

    # Test 4: full uuid
    res4 = get_publish_history(page=1, page_size=10, search=run_id, status=None, date_range=None, db=db, current_user=None)
    print(f"Search '{run_id}' count: {res4['total_count']} (Expected 1)")

    # Test 5: unrelated search still fails safely
    res5 = get_publish_history(page=1, page_size=10, search="admin_fake_email", status=None, date_range=None, db=db, current_user=None)
    print(f"Search 'admin_fake_email' count: {res5['total_count']} (Expected 0)")

test_search()
