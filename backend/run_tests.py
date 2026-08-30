import os
import sys
import urllib.request
import urllib.error
import json
from pprint import pprint

# Setup path for DB access
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.core.database import SessionLocal
from app.models.models import Show, Episode, PublishRun

BASE_URL = "http://localhost:8000"

def run_tests():
    print("=== STARTING BLACK-BOX VERIFICATION ===")
    
    # 1. Database baseline
    db = SessionLocal()
    shows_db = db.query(Show).all()
    episodes_db = db.query(Episode).all()
    runs_db = db.query(PublishRun).order_by(PublishRun.created_at.desc()).all()
    
    raw_episodes = len(episodes_db)
    raw_shows = len(shows_db)
    published_episodes = [e for e in episodes_db if e.status == 'published']
    draft_episodes = [e for e in episodes_db if e.status == 'draft']
    archived_episodes = [e for e in episodes_db if e.status == 'archived']
    
    print(f"\n[1] POSTGRESQL COUNTS")
    print(f"Total Shows: {raw_shows}")
    print(f"Total Episodes: {raw_episodes}")
    print(f"Published Episodes: {len(published_episodes)}")
    print(f"Draft Episodes: {len(draft_episodes)}")
    print(f"Archived Episodes: {len(archived_episodes)}")
    
    # 2. Login to API
    print(f"\n[2] API LOGIN")
    data = json.dumps({"username": "admin", "password": "admin"}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/auth/login", data=data, headers={"Content-Type": "application/json"})
    try:
        r_login = urllib.request.urlopen(req)
        token = json.loads(r_login.read().decode())["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful")
    except Exception as e:
        print("Login failed:", e)
        return
    
    # 3. Call Validation Report API
    print(f"\n[3] VALIDATION REPORT API (/api/admin/validation-report)")
    req = urllib.request.Request(f"{BASE_URL}/admin/validation-report", headers=headers)
    try:
        r_val = urllib.request.urlopen(req)
        val_data = json.loads(r_val.read().decode())
    except Exception as e:
        print("Validation report failed:", e)
        return
        
    blocked_count = val_data["blocked_records_count"]
    valid_count = val_data["valid_records_count"]
    
    print(f"Blocked Records: {blocked_count}")
    print(f"Valid Records: {valid_count}")
    print("Issues mapping:")
    for issue in val_data["issues"]:
        if issue["severity"] == "critical":
            print(f"  CRITICAL: {issue['issue_type']} - {issue['description']}")
            
    publishable_episodes_db = len(published_episodes) - blocked_count
    
    # 4. Call Catalog Preview API
    print(f"\n[4] CATALOG PREVIEW API (/api/admin/catalog/preview)")
    req = urllib.request.Request(f"{BASE_URL}/admin/catalog/preview", headers=headers)
    try:
        r_preview = urllib.request.urlopen(req)
        preview_data = json.loads(r_preview.read().decode())
    except Exception as e:
        print("Catalog preview failed:", e)
        return
    
    cat_shows = 0
    cat_episodes = 0
    cat_languages = set()
    cat_sections = set()
    
    for section, sect_shows in preview_data.items():
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

    print(f"Unique Shows: {cat_shows}")
    print(f"Grouped Catalogue Entries (Episodes): {cat_episodes}")
    print(f"Unique Languages: {len(cat_languages)}")
    print(f"Unique Sections: {len(cat_sections)}")
    
    # 5. Fix seed data in DB to allow publishing
    print(f"\n[5] FIXING DATABASE INVALID RECORDS TO TEST PUBLISHING")
    from app.models.models import Artwork
    
    fixed_count = 0
    for issue in val_data['issues']:
        if issue['severity'] == 'critical':
            ep_id = issue['episode_id']
            ep = db.query(Episode).filter(Episode.id == ep_id).first()
            if issue['issue_type'] == "Missing Artwork":
                art = Artwork(episode_id=ep.id, type="thumbnail", url="/assets/fallback.png", size_bytes=1000)
                db.add(art)
                fixed_count += 1
            elif issue['issue_type'] == "Missing Duration":
                ep.duration_seconds = 120
                fixed_count += 1
            elif issue['issue_type'] == "Missing Show Section":
                if ep.season and ep.season.show:
                    ep.season.show.section = "Series"
                    fixed_count += 1
            elif issue['issue_type'] == "Duplicate Content Group":
                ep.status = 'draft'
                fixed_count += 1
    db.commit()
    print(f"Fixed {fixed_count} critical validation issues in the database.")
    
    # 6. Re-check Validation Report
    print(f"\n[6] RE-CHECK VALIDATION REPORT API")
    req = urllib.request.Request(f"{BASE_URL}/admin/validation-report", headers=headers)
    r_val2 = urllib.request.urlopen(req)
    val_data2 = json.loads(r_val2.read().decode())
    blocked_count2 = val_data2["blocked_records_count"]
    print(f"Blocked Records After Fix: {blocked_count2}")
    if blocked_count2 > 0:
        print("WARNING: Still have blocking issues:")
        for issue in val_data2["issues"]:
            if issue["severity"] == "critical":
                print(f"  CRITICAL: {issue['issue_type']}")
    
    # 7. Test Real Publish API
    print(f"\n[7] REAL PUBLISH MUTATION (/admin/catalog/publish)")
    req = urllib.request.Request(f"{BASE_URL}/admin/catalog/publish", headers=headers, data=b"{}")
    try:
        r_pub = urllib.request.urlopen(req)
        pub_data = json.loads(r_pub.read().decode())
        print(f"Publish Status: {pub_data['status']}")
        run_id = pub_data['run_id']
        print(f"New Run ID: {run_id}")
    except Exception as e:
        print("Publish failed:", e)
        if hasattr(e, 'read'):
            print(e.read())
        run_id = None
    
    # 8. Check DB for the new Run
    if run_id:
        print(f"\n[8] DATABASE PUBLISH_RUN CHECK")
        db.expire_all()
        new_run = db.query(PublishRun).filter(PublishRun.id == run_id).first()
        print(f"Status in DB: {new_run.status}")
        print(f"Published Records: {new_run.published_records}")
        print(f"Stats JSON: {json.dumps(new_run.stats)}")
    
    db.close()

if __name__ == "__main__":
    run_tests()
