import os
import sys

from app.db.database import SessionLocal
from app.models.models import Show, Episode, PublishRun
import json

def audit():
    db = SessionLocal()
    
    shows = db.query(Show).all()
    episodes = db.query(Episode).all()
    runs = db.query(PublishRun).order_by(PublishRun.created_at.desc()).all()
    
    raw_episodes = len(episodes)
    raw_shows = len(shows)
    
    draft_episodes = len([e for e in episodes if e.status == 'draft'])
    published_episodes = len([e for e in episodes if e.status == 'published'])
    archived_episodes = len([e for e in episodes if e.status == 'archived'])
    
    print(f"Raw Episodes (Total Episode Rows): {raw_episodes}")
    print(f"Draft Episodes: {draft_episodes}")
    print(f"Published Episodes: {published_episodes}")
    print(f"Archived Episodes: {archived_episodes}")
    print(f"Raw Shows: {raw_shows}")
    print(f"Latest Publish Runs:")
    for i, r in enumerate(runs[:3]):
        print(f"  Run {i+1}: ID={r.id}, Status={r.status}, Published={r.published_records}, Blocked={r.blocked_records}, Stats={r.stats}")

if __name__ == "__main__":
    audit()
