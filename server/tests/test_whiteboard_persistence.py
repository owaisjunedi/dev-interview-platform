import pytest
from unittest.mock import AsyncMock, patch
from app.main import whiteboard_update, Session, create_session, SessionCreate
from app import models
from sqlalchemy import select
from app.database import SessionLocal

@pytest.mark.asyncio
async def test_whiteboard_persistence(test_db):
    # Setup
    session_id = "test-session-wb"
    
    # Create session in DB
    new_session = models.Session(
        id=session_id,
        candidate_name="Test",
        candidate_email="test@example.com",
        date="2024-01-01",
        duration=0,
        status="scheduled",
        language="python"
    )
    test_db.add(new_session)
    await test_db.commit()
    
    sid = "test-sid"
    data = {
        "roomId": session_id,
        "changes": {"added": {"shape:1": {"id": "shape:1", "type": "geo"}}}
    }
    
    # Mock sio.emit to avoid actual network calls
    with patch('app.main.sio.emit', new_callable=AsyncMock) as mock_emit:
        # We need to patch SessionLocal to return our test_db
        # Because whiteboard_update uses SessionLocal() internally
        
        # Create a mock that returns an async context manager yielding our test_db
        class MockSessionContext:
            def __init__(self, db):
                self.db = db
            async def __aenter__(self):
                return self.db
            async def __aexit__(self, exc_type, exc_val, exc_tb):
                pass
                
        with patch('app.main.SessionLocal', return_value=MockSessionContext(test_db)):
            # Act: Send whiteboard update
            await whiteboard_update(sid, data)
        
        # Assert: Check if data is persisted in DB
        result = await test_db.execute(select(models.Session).where(models.Session.id == session_id))
        session = result.scalars().first()
        assert session is not None
        
        # We expect the whiteboard field to exist and contain the data
        assert session.whiteboard is not None
        # We store flattened records
        expected_record = data['changes']['added']['shape:1']
        assert session.whiteboard['shape:1'] == expected_record
