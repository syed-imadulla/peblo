import asyncio
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import PublishRun, User
from app.api.admin import get_publish_history
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://peblo_user:peblo_password@localhost:5432/peblo_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def audit():
    db = SessionLocal()
    total_db = db.query(PublishRun).count()
    success_db = db.query(PublishRun).filter(PublishRun.status == 'success').count()
    failed_db = db.query(PublishRun).filter(PublishRun.status == 'failed').count()
    
    print(f"DB Total: {total_db}")
    print(f"DB Success: {success_db}")
    print(f"DB Failed: {failed_db}")
    
    # Let's test the endpoint without parameters (defaults)
    res = get_publish_history(page=1, page_size=10, search=None, status=None, date_range=None, db=db, current_user=None)
    print(f"API Total Count: {res['total_count']}")
    print(f"API Total Pages: {res['total_pages']}")
    print(f"API Global Stats: {res['global_stats']}")
    print(f"API Data Length: {len(res['data'])}")

audit()
