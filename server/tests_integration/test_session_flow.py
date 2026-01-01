import pytest

@pytest.mark.asyncio
async def test_session_lifecycle(client):
    # 1. Create a session
    session_data = {
        "candidateName": "Test Candidate",
        "candidateEmail": "test@example.com",
        "language": "python"
    }
    response = await client.post("/sessions", json=session_data)
    assert response.status_code == 201
    session = response.json()
    session_id = session["id"]
    assert session["candidateName"] == "Test Candidate"
    assert session["status"] == "scheduled"

    # 2. Get the session
    response = await client.get(f"/sessions/{session_id}")
    assert response.status_code == 200
    assert response.json()["id"] == session_id

    # 3. Update the session (save code)
    save_data = {
        "code": "print('hello world')",
        "language": "python"
    }
    response = await client.post(f"/sessions/{session_id}/save_code", json=save_data)
    assert response.status_code == 200

    # Verify update
    response = await client.get(f"/sessions/{session_id}")
    assert response.json()["code"] == "print('hello world')"

    # 4. Update session score and notes
    update_data = {
        "score": 95,
        "notes": "Excellent candidate"
    }
    response = await client.put(f"/sessions/{session_id}", json=update_data)
    assert response.status_code == 200
    assert response.json()["score"] == 95
    assert response.json()["notes"] == "Excellent candidate"

    # 5. Delete the session
    response = await client.delete(f"/sessions/{session_id}")
    assert response.status_code == 200
    assert response.json()["message"] == "Session deleted"

    # 6. Verify deletion
    response = await client.get(f"/sessions/{session_id}")
    assert response.status_code == 404
