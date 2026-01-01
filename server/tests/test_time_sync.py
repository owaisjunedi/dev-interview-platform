import pytest
import datetime
from app.main import get_session, create_session, SessionCreate, sessions_db

def test_time_format():
    # Setup
    session_data = SessionCreate(
        candidateName="Time Test",
        candidateEmail="time@test.com",
        language="python"
    )
    session = create_session(session_data)
    
    # Check date format
    assert session.date.endswith("+00:00") or session.date.endswith("Z")
    
    # Check serverTime format (injected in get_session)
    # We need to call get_session to see serverTime
    retrieved_session = get_session(session.id)
    assert retrieved_session.serverTime is not None
    assert retrieved_session.serverTime.endswith("+00:00") or retrieved_session.serverTime.endswith("Z")
    
    # Verify it parses as UTC
    dt = datetime.datetime.fromisoformat(retrieved_session.serverTime)
    assert dt.tzinfo == datetime.timezone.utc
