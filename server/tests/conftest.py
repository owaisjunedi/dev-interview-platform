import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app, fastapi_app
import asyncio
from fastapi.testclient import TestClient

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    future=True
)

TestingSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

@pytest_asyncio.fixture(scope="function")
async def test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

# Override the dependency
@pytest.fixture(autouse=True)
def override_dependency(test_db):
    async def _get_db_override():
        yield test_db
    fastapi_app.dependency_overrides[get_db] = _get_db_override
    
    # Also override SessionLocal in main.py for Socket.IO handlers
    import app.main
    app.main.SessionLocal = TestingSessionLocal

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

@pytest_asyncio.fixture(scope="session")
async def server():
    """Starts a real uvicorn server for Socket.IO tests using subprocess"""
    import subprocess
    import time
    import socket
    import os
    from httpx import AsyncClient

    # Find a free port
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(('127.0.0.1', 0))
    port = sock.getsockname()[1]
    sock.close()

    # Use the same database for the subprocess
    # Since we are using in-memory SQLite, this won't work across processes!
    # We should use a temporary file-based database for these tests.
    test_db_file = "test_sync.db"
    if os.path.exists(test_db_file):
        os.remove(test_db_file)
    
    db_url = f"sqlite+aiosqlite:///./{test_db_file}"
    
    cmd = [
        "uv", "run", "uvicorn", "app.main:app",
        "--host", "127.0.0.1",
        "--port", str(port),
        "--log-level", "error"
    ]
    
    env = os.environ.copy()
    env["PYTHONPATH"] = "."
    env["DATABASE_URL"] = db_url
    
    process = subprocess.Popen(cmd, env=env, cwd=os.getcwd())
    
    base_url = f"http://127.0.0.1:{port}"
    
    # Wait for server to be ready
    max_retries = 50
    for _ in range(max_retries):
        try:
            async with AsyncClient() as client:
                res = await client.get(f"{base_url}/health")
                if res.status_code == 200:
                    break
        except Exception:
            pass
        await asyncio.sleep(0.2)
    
    yield base_url
    
    process.terminate()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
    
    if os.path.exists(test_db_file):
        try:
            os.remove(test_db_file)
        except:
            pass

