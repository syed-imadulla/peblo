import json
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.publish import PublishService
from app.models.models import Episode, Artwork

db = SessionLocal()
print("Preview Catalogue Output:")
catalogue = PublishService.preview_catalogue(db)

# Let's see what the artwork looks like for the first show
for section, shows in catalogue.items():
    if shows:
        for show in shows:
            print(f"Show: {show['title']}")
            # Check trailers
            for trailer in show.get('trailers', []):
                print(f"  Trailer: {trailer['title']}")
                print(f"  Artwork: {trailer['artwork']}")
            # Check episodes
            for season in show.get('seasons', []):
                for ep in season.get('episodes', []):
                    print(f"  Episode: {ep['title']}")
                    print(f"  Artwork: {ep['artwork']}")
            print("---")
            break
        break
db.close()
