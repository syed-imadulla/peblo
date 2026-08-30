import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import PublishRun, User

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://peblo_user:peblo_password@localhost:5432/peblo_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def audit():
    db = SessionLocal()
    
    # Check what users exist
    users = db.query(User).all()
    print(f"Users in DB: {len(users)}")
    for u in users:
        print(f"User: {u.email} ({u.id})")
        
    # Check runs
    runs = db.query(PublishRun).limit(5).all()
    print(f"Total runs: {db.query(PublishRun).count()}")
    for r in runs:
        print(f"Run {r.id}: status={r.status}, triggered_by={r.triggered_by}, duration={r.duration_seconds}, stats={r.stats}, error_log={r.error_log}")
        
audit()
