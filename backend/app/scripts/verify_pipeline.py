import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.core.database import SessionLocal
from app.models.models import Episode, Show
from app.services.validation import ValidationService

def verify():
    db = SessionLocal()
    try:
        total_episodes = db.query(Episode).count()
        print(f"Total raw seed records in DB: {total_episodes}")
        assert total_episodes == 95, f"Expected 95, got {total_episodes}"

        published_episodes = db.query(Episode).filter(Episode.status == 'published').all()
        print(f"Published (eligible) records: {len(published_episodes)}")
        assert len(published_episodes) == 85, f"Expected 85, got {len(published_episodes)}"

        publishable_records = []
        blocked_records = 0
        for ep in published_episodes:
            errors = ValidationService.validate_for_publish(db, ep)
            if errors.has_blocking_errors():
                blocked_records += 1
            else:
                publishable_records.append(ep)
        
        print(f"Blocked records: {blocked_records}")
        assert blocked_records == 3, f"Expected 3, got {blocked_records}"
        
        print(f"Publishable records: {len(publishable_records)}")
        assert len(publishable_records) == 82, f"Expected 82, got {len(publishable_records)}"

        # Catalogue grouping
        catalogue_entries = set()
        trailers = set()
        
        for ep in publishable_records:
            if ep.season.season_number == 0:
                # trailers are still grouped by content_group?
                # Actually, the grouping rule: "one catalogue entry per content_group"
                # "Season 0 is published into a separate trailers array"
                # Let's count total unique content groups overall.
                pass
            
            catalogue_entries.add(ep.content_group)
            
            if ep.season.season_number == 0:
                trailers.add(ep.content_group)

        unique_groups = len(catalogue_entries)
        unique_trailers = len(trailers)

        print(f"Unique content groups (catalogue entries + trailers): {unique_groups}")
        assert unique_groups == 65, f"Expected 65, got {unique_groups}"
        
        print(f"Trailer groups: {unique_trailers}")
        assert unique_trailers == 2, f"Expected 2, got {unique_trailers}"
        
        print("PIPELINE TRACE VERIFIED SUCCESSFULLY.")
    finally:
        db.close()

if __name__ == "__main__":
    verify()
