import pytest
import socketio
import asyncio
import datetime
from httpx import AsyncClient, ASGITransport
from app.main import app

BASE_URL = "http://localhost:8000"

@pytest.mark.asyncio
async def test_sync_and_persistence():
    # 1. Create Session
    async with AsyncClient(base_url=BASE_URL) as ac:
        res = await ac.post("/sessions", json={
            "candidateName": "Test Candidate",
            "candidateEmail": "test@example.com",
            "language": "python"
        })
        assert res.status_code == 201
        session_data = res.json()
        session_id = session_data["id"]

    # 2. Connect Client A (Interviewer)
    sio_a = socketio.AsyncClient()
    
    # Future to capture session update
    future_session_update = asyncio.Future()
    
    @sio_a.on('session_updated')
    async def on_session_updated(data):
        if not future_session_update.done():
            future_session_update.set_result(data)

    await sio_a.connect(BASE_URL, socketio_path='/socket.io')
    await sio_a.emit('join_room', {
        'roomId': session_id,
        'user': {'id': 'user_a', 'name': 'Interviewer', 'role': 'interviewer'}
    })

    # 3. Verify Time Sync (UTC)
    # Wait for session update which contains startTime
    session_update = await asyncio.wait_for(future_session_update, timeout=2)
    start_time = session_update['startTime']
    assert start_time.endswith('Z') or start_time.endswith('+00:00') # Should be UTC ISO format

    # 4. Verify History Persistence
    # A makes a code change
    test_code = "print('Hello World')"
    await sio_a.emit('code_change', {
        'roomId': session_id,
        'code': test_code,
        'language': 'python'
    })
    
    # Allow some time for server to process
    await asyncio.sleep(0.5)
    
    # A disconnects
    await sio_a.disconnect()
    
    # 5. Connect Client B (Candidate) and verify history
    sio_b = socketio.AsyncClient()
    future_code_sync = asyncio.Future()
    
    @sio_b.on('code_change')
    async def on_code_change(data):
        if not future_code_sync.done():
            future_code_sync.set_result(data)
            
    await sio_b.connect(BASE_URL, socketio_path='/socket.io')
    await sio_b.emit('join_room', {
        'roomId': session_id,
        'user': {'id': 'user_b', 'name': 'Candidate', 'role': 'candidate'}
    })
    
    # B should receive the code change immediately upon joining
    code_data = await asyncio.wait_for(future_code_sync, timeout=2)
    assert code_data['code'] == test_code
    
    await sio_b.disconnect()

@pytest.mark.asyncio
async def test_user_presence():
    # 1. Create Session
    async with AsyncClient(base_url=BASE_URL) as ac:
        res = await ac.post("/sessions", json={
            "candidateName": "Test Candidate",
            "candidateEmail": "test@example.com",
            "language": "python"
        })
        session_id = res.json()["id"]

    sio_a = socketio.AsyncClient()
    sio_b = socketio.AsyncClient()
    
    future_users_b = asyncio.Future()
    
    @sio_b.on('room_users')
    async def on_room_users_b(data):
        # We want the update where there are 2 users
        if len(data['users']) == 2 and not future_users_b.done():
            future_users_b.set_result(data)

    # A joins
    await sio_a.connect(BASE_URL, socketio_path='/socket.io')
    await sio_a.emit('join_room', {
        'roomId': session_id,
        'user': {'id': 'user_a', 'name': 'Interviewer', 'role': 'interviewer'}
    })
    
    # B joins
    await sio_b.connect(BASE_URL, socketio_path='/socket.io')
    await sio_b.emit('join_room', {
        'roomId': session_id,
        'user': {'id': 'user_b', 'name': 'Candidate', 'role': 'candidate'}
    })
    
    # Verify both are present
    data = await asyncio.wait_for(future_users_b, timeout=2)
    assert len(data['users']) == 2
    
    # A leaves explicitly
    future_users_b_leave = asyncio.Future()
    @sio_b.on('room_users')
    async def on_room_users_b_leave(data):
        if not future_users_b_leave.done():
            future_users_b_leave.set_result(data)
            
    await sio_a.emit('leave_room', {'roomId': session_id, 'userId': 'user_a'})
    await sio_a.disconnect()
    
    # Verify A is gone
    data_leave = await asyncio.wait_for(future_users_b_leave, timeout=2)
    assert len(data_leave['users']) == 1
    assert data_leave['users'][0]['id'] == 'user_b'
    
    await sio_b.disconnect()

@pytest.mark.asyncio
async def test_whiteboard_sync():
    # 1. Create Session
    async with AsyncClient(base_url=BASE_URL) as ac:
        res = await ac.post("/sessions", json={
            "candidateName": "Test Candidate",
            "candidateEmail": "test@example.com",
            "language": "python"
        })
        session_id = res.json()["id"]

    sio_a = socketio.AsyncClient()
    sio_b = socketio.AsyncClient()
    
    # B listens for whiteboard updates
    future_wb_update = asyncio.Future()
    
    @sio_b.on('whiteboard_update')
    async def on_whiteboard_update(data):
        if not future_wb_update.done():
            future_wb_update.set_result(data)

    # Connect both
    await sio_a.connect(BASE_URL, socketio_path='/socket.io')
    await sio_a.emit('join_room', {
        'roomId': session_id,
        'user': {'id': 'user_a', 'name': 'Interviewer', 'role': 'interviewer'}
    })
    
    await sio_b.connect(BASE_URL, socketio_path='/socket.io')
    await sio_b.emit('join_room', {
        'roomId': session_id,
        'user': {'id': 'user_b', 'name': 'Candidate', 'role': 'candidate'}
    })
    
    # A sends whiteboard update
    wb_data = {'changes': {'added': {'shape:1': {'id': 'shape:1', 'type': 'geo'}}}}
    await sio_a.emit('whiteboard_update', {
        'roomId': session_id,
        **wb_data
    })
    
    # B should receive it
    received_data = await asyncio.wait_for(future_wb_update, timeout=2)
    assert received_data['changes']['added']['shape:1']['type'] == 'geo'
    
    await sio_a.disconnect()
    await sio_b.disconnect()
