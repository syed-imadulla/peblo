import os
import sys
import urllib.request
import urllib.error
import json
from pprint import pprint

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.core.database import SessionLocal
from app.models.models import Show, Episode, PublishRun
from app.api.admin import _build_validation_report
from app.services.publish import PublishService

BASE_URL = "http://localhost:8000"

def get_token():
    data = json.dumps({"username": "admin", "password": "admin"}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/auth/login", data=data, headers={"Content-Type": "application/json"})
    r_login = urllib.request.urlopen(req)
    return json.loads(r_login.read().decode())["access_token"]

def main():
    print("--- 1. DATABASE TRUTH ---")
    db = SessionLocal()
    raw_shows = db.query(Show).count()
    raw_episodes = db.query(Episode).count()
    draft = db.query(Episode).filter(Episode.status == 'draft').count()
    published = db.query(Episode).filter(Episode.status == 'published').count()
    archived = db.query(Episode).filter(Episode.status == 'archived').count()
    
    print(f"Total Shows: {raw_shows}")
    print(f"Total Episode Rows: {raw_episodes}")
    print(f"Draft Episodes: {draft}")
    print(f"Published Episodes: {published}")
    print(f"Archived Episodes: {archived}")

    print("\n--- 2. API TRUTH (Validation & Preview) ---")
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    req_val = urllib.request.Request(f"{BASE_URL}/admin/validation-report", headers=headers)
    val_data = json.loads(urllib.request.urlopen(req_val).read().decode())
    
    blocked = val_data["blocked_records_count"]
    valid_report = val_data["valid_records_count"]
    publishable = published - blocked
    print(f"Blocked Records (Validation API): {blocked}")
    print(f"Valid/Publishable Records (Validation API computes total-blocked): {valid_report}")
    print(f"Actual Publishable (Published - Blocked): {publishable}")
    
    for issue in val_data["issues"]:
        if issue["severity"] == "critical":
            print(f"  CRITICAL ISSUE_TYPE EXACT: '{issue['issue_type']}' for ID {issue.get('episode_id')}")

    req_preview = urllib.request.Request(f"{BASE_URL}/admin/catalog/preview", headers=headers)
    prev_data = json.loads(urllib.request.urlopen(req_preview).read().decode())
    
    cat_entries = sum(
        len(show.get("trailers", [])) + sum(len(s.get("episodes", [])) for s in show.get("seasons", []))
        for section in prev_data.values() for show in section
    )
    cat_shows = sum(len(section) for section in prev_data.values())
    cat_langs = set()
    cat_sects = set([k for k, v in prev_data.items() if v])
    for section in prev_data.values():
        for show in section:
            for t in show.get("trailers", []):
                cat_langs.update(t.get("languages", []))
            for s in show.get("seasons", []):
                for e in s.get("episodes", []):
                    cat_langs.update(e.get("languages", []))
                    
    print(f"Generated Catalogue Entries: {cat_entries}")
    print(f"Unique Shows in Catalogue: {cat_shows}")
    print(f"Unique Languages: {len(cat_langs)}")
    print(f"Unique Sections: {len(cat_sects)}")
    
    print("\n--- 3. PUBLISHRUN SNAPSHOT TRUTH ---")
    req_pub = urllib.request.Request(f"{BASE_URL}/admin/catalog/publish", headers=headers, data=b"{}")
    try:
        r_pub = urllib.request.urlopen(req_pub)
        pub_data = json.loads(r_pub.read().decode())
        run_id = pub_data['run_id']
        run_db = db.query(PublishRun).filter(PublishRun.id == run_id).first()
        print(f"PublishRun Published Records: {run_db.published_records}")
        print(f"PublishRun Blocked Records: {run_db.blocked_records}")
        print(f"PublishRun Stats: {json.dumps(run_db.stats)}")
    except urllib.error.HTTPError as e:
        print(f"Publish rejected: {e.read().decode()}")

    db.close()

if __name__ == '__main__':
    main()
