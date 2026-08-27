import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app
import os
import tempfile
from app.services.storage import storage

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://peblo_user:peblo_password@localhost:5432/peblo_db")
engine = create_engine(DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def isolated_storage():
    with tempfile.TemporaryDirectory() as temp_dir:
        original_base = storage.base_path
        storage.base_path = temp_dir
        yield
        storage.base_path = original_base

@pytest.fixture(scope="session", autouse=True)
def seed_test_database():
    """Ensure the database has the required challenge seed data before tests run."""
    from app.scripts.seed import seed_db
    seed_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "docs", "challenge", "seed_shows.json")
    if os.path.exists(seed_file):
        seed_db(seed_file)

@pytest.fixture(scope="module")
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c
