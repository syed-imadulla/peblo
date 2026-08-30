import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.models.models import PublishRun, User

db = SessionLocal()
runs = db.query(PublishRun).all()
print("Total Runs:", len(runs))
for r in runs:
    print(f"Run {r.id}: triggered_by={r.triggered_by}")
    if r.triggered_by:
        user = db.query(User).filter(User.id == r.triggered_by).first()
        print(f"  User: {user.email if user else 'NOT FOUND'}")
