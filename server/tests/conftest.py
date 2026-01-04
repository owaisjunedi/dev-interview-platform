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
    import signal
    import sys
    from httpx import AsyncClient

    # Find a free port
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(('127.0.0.1', 0))
    port = sock.getsockname()[1]
    sock.close()

    # Use a temporary file-based database for these tests.
    test_db_file = f"test_sync_{port}.db"
    if os.path.exists(test_db_file):
        os.remove(test_db_file)
    
    db_url = f"sqlite+aiosqlite:///./{test_db_file}"
    
    # Use sys.executable to ensure we use the same environment
    cmd = [
        sys.executable, "-m", "uvicorn", "app.main:app",
        "--host", "127.0.0.1",
        "--port", str(port),
        "--log-level", "info"
    ]
    
    env = os.environ.copy()
    env["PYTHONPATH"] = "."
    env["DATABASE_URL"] = db_url
    
    # Redirect output to a file to avoid hanging GitHub Actions
    log_file = f"server_{port}.log"
    with open(log_file, "w") as f:
        # Start in a new process group
        process = subprocess.Popen(
            cmd, 
            env=env, 
            cwd=os.getcwd(),
            start_new_session=True,
            stdout=f,
            stderr=f
        )
    
    base_url = f"http://127.0.0.1:{port}"
    
    # Wait for server to be ready
    max_retries = 100 # 20 seconds
    server_ready = False
    for i in range(max_retries):
        try:
            async with AsyncClient() as client:
                res = await client.get(f"{base_url}/health")
                if res.status_code == 200:
                    server_ready = True
                    break
        except Exception:
            pass
        
        # Check if process died
        if process.poll() is not None:
            break
            
        await asyncio.sleep(0.2)
    
    if not server_ready:
        if os.path.exists(log_file):
            with open(log_file, "r") as f:
                print(f"\n[Test Server] Startup failed. Logs:\n{f.read()}")
        try:
            os.killpg(os.getpgid(process.pid), signal.SIGKILL)
        except:
            pass
        raise RuntimeError(f"Test server failed to start on {base_url}")

    yield base_url
    
    # Shutdown
    try:
        os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        # Give it a moment to shut down gracefully
        for _ in range(50):
            if process.poll() is not None:
                break
            await asyncio.sleep(0.1)
        
        if process.poll() is None:
            os.killpg(os.getpgid(process.pid), signal.SIGKILL)
    except:
        pass
    
    # Cleanup files
    for file in [test_db_file, log_file]:
        if os.path.exists(file):
            for _ in range(5):
                try:
                    os.remove(file)
                    break
                except:
                    await asyncio.sleep(0.5)
