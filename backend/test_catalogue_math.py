import os
import sys

# Setup path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.models import Show, Episode, PublishRun
from app.services.validation import ValidationService
from app.services.publish import PublishService
import json

def verify():
    db = SessionLocal()
    
    # 1. PostgreSQL DB Counts
    shows = db.query(Show).all()
    episodes = db.query(Episode).all()
    
    raw_episodes = len(episodes)
    raw_shows = len(shows)
    
    published_episodes = [e for e in episodes if e.status == 'published']
    draft_episodes = [e for e in episodes if e.status == 'draft']
    archived_episodes = [e for e in episodes if e.status == 'archived']
    
    # 2. Validation Service
    report = ValidationService.validate_for_publish(db)
    blocked_count = report["blocked_records_count"]
    publishable_episodes = len(published_episodes) - blocked_count
    
    print(f"--- DATABASE COUNTS ---")
    print(f"Total Raw Shows: {raw_shows}")
    print(f"Total Raw Episodes: {raw_episodes}")
    print(f"Draft Episodes: {len(draft_episodes)}")
    print(f"Published Episodes: {len(published_episodes)}")
    print(f"Archived Episodes: {len(archived_episodes)}")
    print(f"Blocked Episodes: {blocked_count}")
    print(f"Publishable Episodes (85-3?): {publishable_episodes}")
    
    # 3. Publish Service (Preview)
    catalogue = PublishService._generate_catalogue(db, list(shows), published_episodes)
    
    # Let's count the catalogue structure
    cat_shows = 0
    cat_episodes = 0
    cat_languages = set()
    cat_sections = set()
    
    for section, sect_shows in catalogue.items():
        if sect_shows:
            cat_sections.add(section)
        for show in sect_shows:
            cat_shows += 1
            for t in show.get("trailers", []):
                cat_episodes += 1
                for lang in t.get("languages", []):
                    cat_languages.add(lang)
            for s in show.get("seasons", []):
                for e in s.get("episodes", []):
                    cat_episodes += 1
                    for lang in e.get("languages", []):
                        cat_languages.add(lang)
                        
    print(f"--- API PREVIEW COUNTS ---")
    print(f"Unique Shows in Catalogue: {cat_shows}")
    print(f"Total Catalogue Episode Entries: {cat_episodes}")
    print(f"Unique Languages: {len(cat_languages)} ({cat_languages})")
    print(f"Unique Sections: {len(cat_sections)} ({cat_sections})")
    
    # 4. Prove mathematically why 82 publishable records = 65 grouped entries.
    # Group by content_group
    publishable_records = [e for e in published_episodes if e.id not in [i.affected_episode_id for i in report["issues"]]]
    print(f"\n--- PROOF: 82 publishable DB records -> 65 Catalogue Entries ---")
    
    grouped = {}
    for ep in publishable_records:
        if ep.content_group not in grouped:
            grouped[ep.content_group] = []
        grouped[ep.content_group].append(ep)
        
    print(f"Number of unique content_groups: {len(grouped)}")
    print(f"Does unique content_groups ({len(grouped)}) equal catalogue entries ({cat_episodes})? {len(grouped) == cat_episodes}")
    
    # Print the ones with > 1 language variant to show the collapse
    collapsed = {k: [e.language for e in v] for k, v in grouped.items() if len(v) > 1}
    print(f"Content groups with multiple variants that collapse into 1 catalogue entry:")
    for k, v in collapsed.items():
        print(f"  {k}: {v}")

    db.close()

if __name__ == "__main__":
    verify()
