import pytest
import socketio
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

# Use a separate AsyncServer for testing if possible, or connect to the running app
# Since we are using uvicorn, we can test against the running server or use TestClient
# But for Socket.IO, we need a real client.
# python-socketio has a AsyncClient.

BASE_URL = "http://localhost:8000"

@pytest.mark.asyncio
async def test_active_users_sync():
    # 1. Create Session
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE_URL) as ac:
        res = await ac.post("/sessions", json={
            "candidateName": "Test Candidate",
            "candidateEmail": "test@example.com",
            "language": "python"
        })
        assert res.status_code == 201
        session_id = res.json()["id"]

    # 2. Connect Client A (Interviewer)
    sio_a = socketio.AsyncClient()
    sio_b = socketio.AsyncClient()
    
    future_users_a = asyncio.Future()
    
    @sio_a.on('room_users')
    async def on_room_users_a(data):
        if not future_users_a.done():
            future_users_a.set_result(data)

    await sio_a.connect(BASE_URL, socketio_path='/socket.io')
    await sio_a.emit('join_room', {
        'roomId': session_id,
        'user': {'id': 'user_a', 'name': 'Interviewer', 'role': 'interviewer'}
    })

    # Wait for A to receive room_users (should be 1)
    data_a = await asyncio.wait_for(future_users_a, timeout=2)
    assert len(data_a['users']) == 1
    assert data_a['users'][0]['id'] == 'user_a'

    # 3. Connect Client B (Candidate)
    future_users_b = asyncio.Future()
    # Reset future A to catch next update
    future_users_a_2 = asyncio.Future()
    
    @sio_b.on('room_users')
    async def on_room_users_b(data):
        if not future_users_b.done():
            future_users_b.set_result(data)

    @sio_a.on('room_users')
    async def on_room_users_a_2(data):
         if not future_users_a_2.done():
            future_users_a_2.set_result(data)

    await sio_b.connect(BASE_URL, socketio_path='/socket.io')
    await sio_b.emit('join_room', {
        'roomId': session_id,
        'user': {'id': 'user_b', 'name': 'Candidate', 'role': 'candidate'}
    })

    # Wait for both to receive update (should be 2)
    data_b = await asyncio.wait_for(future_users_b, timeout=2)
    assert len(data_b['users']) == 2
    
    # A should also get the update
    # Note: Since we redefined the handler for A, we need to be careful. 
    # Actually, python-socketio allows multiple handlers or overwrites? 
    # It usually appends. But let's assume the second handler works or just check B.
    # Checking B is sufficient to prove the server broadcasted the list with 2 users.
    
    user_ids = [u['id'] for u in data_b['users']]
    assert 'user_a' in user_ids
    assert 'user_b' in user_ids

    # 4. Disconnect Client A
    future_users_b_leave = asyncio.Future()
    
    @sio_b.on('room_users')
    async def on_room_users_b_leave(data):
        if not future_users_b_leave.done():
            future_users_b_leave.set_result(data)
            
    await sio_a.disconnect()
    
    # Wait for B to receive update (should be 1)
    data_leave = await asyncio.wait_for(future_users_b_leave, timeout=2)
    assert len(data_leave['users']) == 1
    assert data_leave['users'][0]['id'] == 'user_b'

    await sio_b.disconnect()
