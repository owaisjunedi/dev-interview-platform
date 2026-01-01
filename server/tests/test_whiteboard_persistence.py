import pytest
from unittest.mock import AsyncMock, patch
from app.main import whiteboard_update, sessions_db, Session, create_session, SessionCreate

@pytest.mark.asyncio
async def test_whiteboard_persistence():
    # Setup
    session_id = "test-session-wb"
    sessions_db[session_id] = Session(
        id=session_id,
        candidateName="Test",
        candidateEmail="test@example.com",
        date="2024-01-01",
        duration=0,
        status="scheduled",
        language="python"
    )
    
    sid = "test-sid"
    data = {
        "roomId": session_id,
        "changes": {"added": {"shape:1": {"id": "shape:1", "type": "geo"}}}
    }
    
    # Mock sio.emit to avoid actual network calls
    with patch('app.main.sio.emit', new_callable=AsyncMock) as mock_emit:
        # Act: Send whiteboard update
        await whiteboard_update(sid, data)
        
        # Assert: Check if data is persisted in DB
        # CURRENTLY THIS SHOULD FAIL because we haven't implemented persistence yet
        session = sessions_db.get(session_id)
        assert session is not None
        
        # We expect the whiteboard field to exist and contain the data
        # Note: The 'whiteboard' field doesn't exist on Session yet, so this will raise AttributeError or fail
        try:
            assert hasattr(session, 'whiteboard')
            # We store flattened records
            expected_record = data['changes']['added']['shape:1']
            assert session.whiteboard['shape:1'] == expected_record
        except AttributeError:
            pytest.fail("Session model missing 'whiteboard' field")
        except AssertionError:
            pytest.fail(f"Whiteboard data not persisted. Got: {getattr(session, 'whiteboard', 'None')}")
