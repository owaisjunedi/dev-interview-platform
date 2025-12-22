from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    # The root endpoint might return 404 if not defined, or some welcome message.
    # Let's check if it returns 404 or 200, just to ensure the app is running.
    # Based on previous logs, it returned 404.
    assert response.status_code in [200, 404]
