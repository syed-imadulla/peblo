import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.api.admin import get_publish_history

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://peblo_user:peblo_password@localhost:5432/peblo_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def audit():
    db = SessionLocal()
    
    # Let's search for "pub" which shouldn't match UUID directly (UUID is hex + hyphens)
    # Ah wait, the frontend prefixes "pub_" visually, but the database stores UUID!
    # "pub_" is just a UI prefix: "pub_${run.id.substring(0, 8)}"
    # So if the user searches "pub_abc", they expect it to match "abc..." in DB?
    # Actually the previous frontend search was:
    # run.id.toLowerCase().includes(term)
    
    # If the user searches "admin", does it find User.email?
    res = get_publish_history(page=1, page_size=10, search="admin", status=None, date_range=None, db=db, current_user=None)
    print(f"Search 'admin' count: {res['total_count']}")

    res2 = get_publish_history(page=1, page_size=10, search="123", status=None, date_range=None, db=db, current_user=None)
    print(f"Search '123' count: {res2['total_count']}")
    
audit()
