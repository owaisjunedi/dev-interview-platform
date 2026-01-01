import pytest
import datetime
from app.main import get_session, create_session, SessionCreate
from app import models
from sqlalchemy import select

@pytest.mark.asyncio
async def test_time_format(test_db):
    # Setup
    session_data = SessionCreate(
        candidateName="Time Test",
        candidateEmail="time@test.com",
        language="python"
    )
    
    # We call the route handler directly, injecting the db
    session = await create_session(session_data, db=test_db)
    
    # Check date format
    assert session.date.endswith("+00:00") or session.date.endswith("Z")
    
    # Check serverTime format (injected in get_session)
    retrieved_session = await get_session(session.id, db=test_db)
    assert retrieved_session.serverTime is not None
    assert retrieved_session.serverTime.endswith("+00:00") or retrieved_session.serverTime.endswith("Z")
    
    # Verify it parses as UTC
    dt = datetime.datetime.fromisoformat(retrieved_session.serverTime)
    assert dt.tzinfo == datetime.timezone.utc
