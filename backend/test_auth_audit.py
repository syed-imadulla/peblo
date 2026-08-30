import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import User, Show, Episode, Artwork

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://peblo_user:peblo_password@localhost:5432/peblo_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def audit():
    db = SessionLocal()
    
    users = db.query(User).count()
    shows = db.query(Show).count()
    episodes = db.query(Episode).count()
    artworks = db.query(Artwork).count()
    
    print(f"Users: {users}")
    print(f"Shows: {shows}")
    print(f"Episodes: {episodes}")
    print(f"Artworks: {artworks}")
    
audit()
