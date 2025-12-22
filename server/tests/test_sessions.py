import pytest

def test_create_session(client):
    response = client.post("/sessions", json={
        "candidateName": "John Doe",
        "candidateEmail": "john@example.com",
        "language": "python"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["candidateName"] == "John Doe"
    assert data["status"] == "scheduled"
    assert "id" in data

def test_get_session(client):
    # Create session
    create_res = client.post("/sessions", json={
        "candidateName": "John Doe",
        "candidateEmail": "john@example.com",
        "language": "python"
    })
    session_id = create_res.json()["id"]

    # Get session
    response = client.get(f"/sessions/{session_id}")
    assert response.status_code == 200
    assert response.json()["id"] == session_id

def test_get_nonexistent_session(client):
    response = client.get("/sessions/nonexistent")
    assert response.status_code == 404

def test_update_session(client):
    # Create session
    create_res = client.post("/sessions", json={
        "candidateName": "John Doe",
        "candidateEmail": "john@example.com",
        "language": "python"
    })
    session_id = create_res.json()["id"]

    # Update session
    response = client.put(f"/sessions/{session_id}", json={
        "score": 85,
        "notes": "Good candidate"
    })
    assert response.status_code == 200
    assert response.json()["score"] == 85
