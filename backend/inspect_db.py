import os
import sys
from collections import defaultdict
from pprint import pprint

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.core.database import SessionLocal
from app.models.models import Show, Episode, PublishRun
from app.services.validation import ValidationService
from app.services.publish import PublishService

db = SessionLocal()

print("--- POSTGRESQL TRUTH ---")
shows = db.query(Show).all()
episodes = db.query(Episode).all()

print(f"Total Shows: {len(shows)}")
print(f"Total Episode Rows: {len(episodes)}")

status_counts = defaultdict(int)
for e in episodes:
    status_counts[e.status] += 1
    
print(f"Draft Episodes: {status_counts.get('draft', 0)}")
print(f"Published Episodes: {status_counts.get('published', 0)}")
print(f"Archived Episodes: {status_counts.get('archived', 0)}")

print("\n--- VALIDATION TRUTH ---")
from app.api.admin import _build_validation_report
report = _build_validation_report(db)
print(f"Blocked Records: {report['blocked_records_count']}")
print(f"Valid/Publishable Records: {report['valid_records_count']}")

# Print issues
for issue in report['issues']:
    if issue['severity'] == "critical":
        print(f"CRITICAL: {issue['issue_type']} - Ep: {issue.get('episode_id', 'None')}")

print("\n--- CATALOGUE GENERATOR TRUTH ---")
valid_episodes = [ep for ep in episodes if ep.status == 'published']
# But wait, we need to filter out blocked records to get the true catalogue preview
publishable = []
for ep in valid_episodes:
    errs = ValidationService.validate_for_publish(db, ep)
    if not errs.has_blocking_errors():
        publishable.append(ep)

cat_preview = PublishService._generate_catalogue(publishable)
cat_shows = 0
cat_entries = 0
unique_languages = set()
unique_sections = set()

for section, s_shows in cat_preview.items():
    if s_shows:
        unique_sections.add(section)
    for s in s_shows:
        cat_shows += 1
        for t in s.get("trailers", []):
            cat_entries += 1
            for lang in t.get("languages", []):
                unique_languages.add(lang)
        for season in s.get("seasons", []):
            for e in season.get("episodes", []):
                cat_entries += 1
                for lang in e.get("languages", []):
                    unique_languages.add(lang)

print(f"Unique Shows in Catalogue: {cat_shows}")
print(f"Generated Catalogue Entries: {cat_entries}")
print(f"Unique Languages: {len(unique_languages)} {list(unique_languages)}")
print(f"Unique Sections: {len(unique_sections)} {list(unique_sections)}")

db.close()
