import pytest
from fastapi.testclient import TestClient
from app.main import app, users_db, sessions_db, room_users

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture(autouse=True)
def clear_dbs():
    """Clear in-memory databases before each test"""
    users_db.clear()
    sessions_db.clear()
    room_users.clear()
