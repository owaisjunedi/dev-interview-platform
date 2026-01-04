# 📖 The DevInterview.io Bible: Complete AI-Driven Full-Stack Development Guide

Welcome! This document is your **complete guide** to the DevInterview.io project. It covers every aspect of building a modern full-stack application using AI assistance, from initial concept to production deployment.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack Deep Dive](#technology-stack-deep-dive)
3. [Architecture & Design](#architecture--design)
4. [Development Journey: Step-by-Step](#development-journey-step-by-step)
5. [AI-Assisted Development Workflow](#ai-assisted-development-workflow)
6. [Testing Strategy](#testing-strategy)
7. [Deployment & DevOps](#deployment--devops)
8. [Common Issues & Solutions](#common-issues--solutions)
9. [Learning Resources](#learning-resources)

---

## 🚀 Project Overview

**DevInterview.io** is a real-time technical interview platform that enables interviewers and candidates to collaborate on coding problems with live code execution, whiteboard drawing, and synchronized timers.

### Core Features
- ✅ **Real-time Collaboration**: Code, whiteboard, and timer sync across all participants using WebSockets
- ✅ **Client-Side Code Execution**: Python (via Pyodide/WASM) and JavaScript run securely in the browser
- ✅ **Rich Code Editor**: Monaco Editor with syntax highlighting for multiple languages
- ✅ **Collaborative Whiteboard**: TLDraw integration for visual problem-solving
- ✅ **Session Management**: Create, track, and review interview sessions
- ✅ **Containerized Deployment**: Docker + Nginx for consistent environments
- ✅ **Automated CI/CD**: GitHub Actions with comprehensive testing

### Project Goals
This project demonstrates:
1. Building full-stack applications with AI assistance
2. Implementing real-time features with WebSockets
3. Secure client-side code execution with WASM
4. Modern DevOps practices (Docker, CI/CD)
5. Production deployment to cloud platforms

---

## 🛠 Technology Stack Deep Dive

### Frontend: React + TypeScript + Vite

**Why React?**
- Component-based architecture makes UI development modular and reusable
- Massive ecosystem with libraries for every need
- Virtual DOM for efficient updates
- Industry standard with excellent job market demand

**Why TypeScript?**
- Catches bugs at compile-time instead of runtime
- Autocomplete and IntelliSense improve developer productivity
- Makes refactoring safer
- Self-documenting code through type definitions

**Key Frontend Libraries:**

#### 1. **Monaco Editor** (`@monaco-editor/react`)
```typescript
// Example from InterviewRoom.tsx
<Editor
  height="100%"
  language={language}
  value={code}
  onChange={(value) => handleCodeChange(value || '')}
  theme="vs-dark"
  options={{
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
  }}
/>
```
- The same editor that powers VS Code
- Supports 100+ programming languages
- Built-in syntax highlighting and IntelliSense

#### 2. **TLDraw** (`tldraw`)
```typescript
// Example from Whiteboard.tsx
<Tldraw
  onMount={handleMount}
  store={store}
/>
```
- Infinite canvas for drawing and diagramming
- Real-time collaboration support
- Undo/redo, shapes, arrows, text

#### 3. **Socket.IO Client** (`socket.io-client`)
```typescript
// Example from useSocket.ts
const socket = io(API_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
});

socket.on('code_change', (data) => {
  setCode(data.code);
});
```
- Enables real-time bidirectional communication
- Automatic reconnection
- Room-based messaging

#### 4. **Pyodide** (Python in WASM)
```typescript
// Example from codeExecution.ts
const pyodide = await loadPyodide();
await pyodide.loadPackagesFromImports(code);
const result = await pyodide.runPythonAsync(code);
```
- Full Python interpreter running in the browser
- No server-side execution needed (more secure!)
- Supports NumPy, Pandas, and other scientific libraries

### Backend: FastAPI + Python

**Why FastAPI?**
- Extremely fast (comparable to Node.js and Go)
- Automatic API documentation (Swagger UI)
- Built-in data validation with Pydantic
- Native async/await support
- Type hints throughout

**Key Backend Libraries:**

#### 1. **SQLAlchemy** (ORM)
```python
# Example from models.py
class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(String, primary_key=True, index=True)
    candidate_name = Column(String)
    candidate_email = Column(String)
    code = Column(Text)
    duration = Column(Integer, default=0)
```
- Object-Relational Mapping: Write Python instead of SQL
- Async support for non-blocking database operations
- Migration support with Alembic

#### 2. **Python-SocketIO** (`python-socketio`)
```python
# Example from main.py
@sio.event
async def code_change(sid, data):
    room_id = data['roomId']
    # Save to database
    async with SessionLocal() as db:
        session = await db.get(Session, room_id)
        session.code = data['code']
        await db.commit()
    # Broadcast to room
    await sio.emit('code_change', data, room=room_id, skip_sid=sid)
```
- Server-side WebSocket handling
- Room-based broadcasting
- Async event handlers

#### 3. **AsyncPG** (PostgreSQL Driver)
- Fastest PostgreSQL driver for Python
- Async/await support
- Connection pooling

### Database: PostgreSQL

**Why PostgreSQL?**
- ACID compliant (reliable transactions)
- JSON support for flexible schemas
- Full-text search capabilities
- Excellent performance at scale
- Free and open-source

**Schema Design:**
```sql
-- Users table
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE,
    password VARCHAR,
    name VARCHAR,
    role VARCHAR
);

-- Sessions table
CREATE TABLE sessions (
    id VARCHAR PRIMARY KEY,
    candidate_name VARCHAR,
    candidate_email VARCHAR,
    date VARCHAR,
    duration INTEGER DEFAULT 0,
    score INTEGER,
    status VARCHAR,
    language VARCHAR,
    code TEXT,
    whiteboard JSON,
    start_time VARCHAR
);
```

### DevOps: Docker + Nginx + GitHub Actions

#### Docker
**Why containerize?**
- "Works on my machine" → "Works everywhere"
- Consistent environments from dev to production
- Easy scaling and orchestration

**Our Multi-Stage Dockerfile:**
```dockerfile
# Stage 1: Build frontend
FROM node:20 AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Setup backend + Nginx
FROM python:3.12-slim
# Install Nginx
RUN apt-get update && apt-get install -y nginx
# Copy frontend build
COPY --from=frontend-build /app/client/dist /var/www/html
# Install Python dependencies
COPY server/ /app/server/
RUN pip install uv && cd /app/server && uv sync
# Start both Nginx and FastAPI
CMD ["/app/start.sh"]
```

#### Nginx
**Why Nginx?**
- Serves static files (React build) efficiently
- Reverse proxy for API requests
- Load balancing capabilities
- SSL/TLS termination

**Our Configuration:**
```nginx
server {
    listen 8080;
    
    # Serve React frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to FastAPI
    location /api {
        proxy_pass http://localhost:8000;
    }
    
    # Proxy WebSocket connections
    location /socket.io {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 🏗 Architecture & Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ React UI     │  │ Monaco Editor│  │ TLDraw       │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                 │
│                    ┌──────▼──────┐                         │
│                    │ Socket.IO   │                         │
│                    │ Client      │                         │
│                    └──────┬──────┘                         │
└───────────────────────────┼─────────────────────────────────┘
                            │ WebSocket
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Nginx (Port 8080)                      │
│  ┌─────────────────┐              ┌────────────────┐       │
│  │ Static Files    │              │ Reverse Proxy  │       │
│  │ (React Build)   │              │ /api, /socket  │       │
│  └─────────────────┘              └────────┬───────┘       │
└───────────────────────────────────────────┼─────────────────┘
                                            │
                            ┌───────────────▼──────────────┐
                            │  FastAPI (Port 8000)         │
                            │  ┌────────────────────────┐  │
                            │  │ Socket.IO Server       │  │
                            │  └────────────────────────┘  │
                            │  ┌────────────────────────┐  │
                            │  │ REST API Endpoints     │  │
                            │  └────────────────────────┘  │
                            └───────────┬──────────────────┘
                                        │
                            ┌───────────▼──────────────┐
                            │  PostgreSQL Database     │
                            │  - Users                 │
                            │  - Sessions              │
                            └──────────────────────────┘
```

### Real-Time Sync Flow

**Example: Code Change Propagation**

1. **User A types in Monaco Editor**
   ```typescript
   // InterviewRoom.tsx
   const handleCodeChange = (value: string) => {
     setCode(value);
     socket.emit('code_change', {
       roomId: sessionId,
       code: value,
       language: language
     });
   };
   ```

2. **Socket.IO sends to server**
   ```
   Client A → WebSocket → Nginx → FastAPI
   ```

3. **Server saves and broadcasts**
   ```python
   # main.py
   @sio.event
   async def code_change(sid, data):
       # Save to database
       async with SessionLocal() as db:
           session = await db.get(Session, data['roomId'])
           session.code = data['code']
           await db.commit()
       
       # Broadcast to all in room except sender
       await sio.emit('code_change', data, 
                      room=data['roomId'], 
                      skip_sid=sid)
   ```

4. **Other clients receive update**
   ```typescript
   // useSocket.ts
   socket.on('code_change', (data) => {
     setCode(data.code);
     setLanguage(data.language);
   });
   ```

### Database Schema Relationships

```
┌─────────────┐
│   Users     │
│─────────────│
│ id (PK)     │
│ email       │
│ password    │
│ name        │
│ role        │
└─────────────┘

┌──────────────────┐
│    Sessions      │
│──────────────────│
│ id (PK)          │
│ candidate_name   │
│ candidate_email  │
│ code             │
│ whiteboard (JSON)│
│ start_time       │
│ duration         │
│ score            │
└──────────────────┘
```

---

## 🔨 Development Journey: Step-by-Step

### Step 1: Frontend Creation with Lovable

**Initial Prompt:**
> "Create a technical interview platform with React and TypeScript. Include:
> - A dashboard to create and view interview sessions
> - An interview room with code editor, whiteboard, and timer
> - Real-time collaboration features
> - Modern, professional UI with dark mode"

**What Lovable Generated:**
- Complete React application with TypeScript
- Component structure (Dashboard, InterviewRoom, etc.)
- API service layer (`src/services/api.ts`)
- Socket.IO integration skeleton
- Routing with React Router

**Key Files Created:**
- `src/pages/Dashboard.tsx` - Session management
- `src/pages/InterviewRoom.tsx` - Main collaboration space
- `src/components/CodeEditor.tsx` - Monaco integration
- `src/components/Whiteboard.tsx` - TLDraw integration
- `src/hooks/useSocket.ts` - WebSocket management

### Step 2: Extract OpenAPI Specifications

**Prompt:**
> "Analyze the API calls in `src/services/api.ts` and generate an OpenAPI specification that documents all the endpoints the frontend expects."

**Generated Spec (Excerpt):**
```yaml
paths:
  /auth/login:
    post:
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                email: { type: string }
                password: { type: string }
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  user: { type: object }
                  token: { type: string }
```

### Step 3: Implement FastAPI Backend

**Prompt:**
> "Create a FastAPI backend that implements these endpoints:
> - POST /auth/login
> - POST /auth/signup
> - GET /sessions
> - POST /sessions
> - GET /sessions/{id}
> - PUT /sessions/{id}
> - DELETE /sessions/{id}
> 
> Use SQLAlchemy for the ORM and include Socket.IO for real-time features."

**Implementation Steps:**

1. **Project Structure**
   ```
   server/
   ├── app/
   │   ├── __init__.py
   │   ├── main.py          # FastAPI app + Socket.IO
   │   ├── models.py        # SQLAlchemy models
   │   ├── database.py      # DB connection
   │   └── schemas.py       # Pydantic schemas
   ├── tests/
   │   ├── test_auth.py
   │   ├── test_sessions.py
   │   └── conftest.py
   └── pyproject.toml       # Dependencies
   ```

2. **Database Models**
   ```python
   # models.py
   from sqlalchemy import Column, String, Integer, Text, JSON
   from sqlalchemy.ext.declarative import declarative_base
   
   Base = declarative_base()
   
   class User(Base):
       __tablename__ = "users"
       id = Column(String, primary_key=True)
       email = Column(String, unique=True)
       password = Column(String)
       name = Column(String)
       role = Column(String)
   
   class Session(Base):
       __tablename__ = "sessions"
       id = Column(String, primary_key=True)
       candidate_name = Column(String)
       code = Column(Text)
       whiteboard = Column(JSON)
       duration = Column(Integer, default=0)
   ```

3. **FastAPI Routes**
   ```python
   # main.py
   from fastapi import FastAPI, Depends
   from sqlalchemy.ext.asyncio import AsyncSession
   
   app = FastAPI()
   
   @app.post("/auth/login")
   async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
       user = await db.get(User, email=credentials.email)
       if not user or user.password != credentials.password:
           raise HTTPException(401, "Invalid credentials")
       token = create_access_token({"sub": user.email})
       return {"user": user, "token": token}
   ```

4. **Socket.IO Integration**
   ```python
   # main.py
   import socketio
   
   sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
   sio_app = socketio.ASGIApp(sio, other_asgi_app=app)
   
   @sio.event
   async def join_room(sid, data):
       room_id = data['roomId']
       await sio.enter_room(sid, room_id)
       await sio.emit('user_joined', data, room=room_id)
   ```

### Step 4: Add Database Support

**Prompt:**
> "Set up SQLAlchemy with async support. Use SQLite for development and PostgreSQL for production. Include database migrations."

**Database Configuration:**
```python
# database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")

# Handle Render's postgres:// URL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db():
    async with SessionLocal() as session:
        yield session
```

**Startup Logic:**
```python
# main.py
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed mock users for testing
    async with SessionLocal() as db:
        result = await db.execute(select(User))
        if not result.scalars().first():
            mock_users = [
                User(id="user-1", email="interviewer@example.com", 
                     password="password123", name="Alice", role="interviewer"),
            ]
            db.add_all(mock_users)
            await db.commit()
```

### Step 5: Implement Client-Side Code Execution

**The Problem:**
Server-side code execution is a security risk. Users could run malicious code.

**The Solution:**
Use WebAssembly to run code in the browser sandbox.

**Prompt:**
> "Remove the /execute endpoint. Instead, implement client-side code execution using Pyodide for Python and native eval for JavaScript. Add proper error handling and output capture."

**Implementation:**
```typescript
// codeExecution.ts
import { loadPyodide } from 'pyodide';

let pyodideInstance: any = null;

export async function executePython(code: string): Promise<ExecutionResult> {
  try {
    // Load Pyodide once
    if (!pyodideInstance) {
      pyodideInstance = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
      });
    }
    
    // Capture stdout
    pyodideInstance.runPython(`
      import sys
      from io import StringIO
      sys.stdout = StringIO()
    `);
    
    // Run user code
    await pyodideInstance.runPythonAsync(code);
    
    // Get output
    const output = pyodideInstance.runPython("sys.stdout.getvalue()");
    
    return { output, error: null };
  } catch (error) {
    return { output: '', error: error.message };
  }
}

export function executeJavaScript(code: string): ExecutionResult {
  try {
    // Capture console.log
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    
    // Run code
    eval(code);
    
    // Restore console.log
    console.log = originalLog;
    
    return { output: logs.join('\n'), error: null };
  } catch (error) {
    console.log = originalLog;
    return { output: '', error: error.message };
  }
}
```

### Step 6: Containerization

**Prompt:**
> "Create a production-ready Docker setup:
> 1. Multi-stage Dockerfile that builds the React frontend and sets up the Python backend
> 2. Nginx configuration to serve the frontend and proxy API requests
> 3. docker-compose.yml for local development with PostgreSQL
> 4. Startup script that runs both Nginx and FastAPI"

**Dockerfile:**
```dockerfile
# Stage 1: Build React frontend
FROM node:20 AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production image
FROM python:3.12-slim

# Install Nginx and system dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy frontend build to Nginx directory
COPY --from=frontend-build /app/client/dist /var/www/html

# Install uv (fast Python package installer)
RUN pip install uv

# Copy backend code
WORKDIR /app/server
COPY server/ ./
RUN uv sync

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/sites-available/default
RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 8080

CMD ["/app/start.sh"]
```

**Nginx Configuration:**
```nginx
server {
    listen 8080;
    server_name _;
    
    # Serve React frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests
    location /api {
        proxy_pass http://localhost:8000/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Proxy Socket.IO
    location /socket.io {
        proxy_pass http://localhost:8000/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**Startup Script:**
```bash
#!/bin/bash
set -e

echo "Starting Nginx..."
nginx

echo "Starting FastAPI..."
cd /app/server
exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**docker-compose.yml:**
```yaml
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/devinterview
    depends_on:
      - db
  
  db:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=devinterview
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Step 7: Deploy to Render

**Prompt:**
> "Create a render.yaml Blueprint file to deploy this application to Render with:
> - A web service using the Dockerfile
> - A PostgreSQL database
> - Automatic connection between them"

**render.yaml:**
```yaml
services:
  - type: web
    name: dev-interview-platform-25
    runtime: docker
    plan: free
    region: oregon
    dockerContext: .
    dockerfilePath: ./Dockerfile
    healthCheckPath: /
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: dev-interview-db-25
          property: connectionString
      - key: PORT
        value: 8080

databases:
  - name: dev-interview-db-25
    plan: free
    region: oregon
    postgresMajorVersion: 16
```

**Database URL Fix:**
```python
# database.py
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")

# Render provides postgres:// but we need postgresql+asyncpg://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
```

### Step 8: CI/CD Pipeline

**Prompt:**
> "Create a GitHub Actions workflow that:
> 1. Runs frontend tests (Vitest)
> 2. Runs backend tests (Pytest)
> 3. Runs integration tests separately
> 4. Deploys to Render only if all tests pass"

**.github/workflows/ci-cd.yml:**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: client/package-lock.json
      - name: Install dependencies
        run: cd client && npm ci
      - name: Run tests
        run: cd client && npm run test

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install uv
        uses: astral-sh/setup-uv@v5
        with:
          enable-cache: true
      - name: Set up Python
        run: uv python install
      - name: Install dependencies
        run: cd server && uv sync
      - name: Run backend tests
        run: cd server && PYTHONPATH=. uv run pytest

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install uv
        uses: astral-sh/setup-uv@v5
      - name: Set up Python
        run: uv python install
      - name: Install dependencies
        run: cd server && uv sync
      - name: Run integration tests
        run: cd server && PYTHONPATH=. uv run pytest tests_integration

  deploy:
    needs: [frontend-tests, backend-tests, integration-tests]
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master')
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render Deployment
        run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
```

---

## 🤖 AI-Assisted Development Workflow

### The Iterative Prompt Pattern

**1. Start Broad, Then Narrow**
```
❌ Bad: "Fix the code"
✅ Good: "The session duration is showing as 0 in the dashboard. 
         Update the terminate_session endpoint to calculate the 
         duration in minutes between start_time and now."
```

**2. Provide Context**
```
✅ "I'm getting a TypeScript error in Whiteboard.tsx:
    'persistenceKey' does not exist on type 'TldrawProps'.
    I'm using tldraw v4.2.1 and passing a custom store prop.
    How should I fix this?"
```

**3. Ask for Explanations**
```
✅ "Why did you choose to use asyncpg instead of psycopg2 for 
    the PostgreSQL connection?"
```

### Common Prompt Templates

#### Debugging
```
"I'm seeing this error: [paste error]
In this file: [file path]
Around line: [line number]
What's causing it and how do I fix it?"
```

#### Feature Implementation
```
"I want to add [feature description].
Current relevant code: [paste code]
Requirements:
- [requirement 1]
- [requirement 2]
Please implement this feature."
```

#### Refactoring
```
"This code works but it's messy: [paste code]
Can you refactor it to:
- Be more readable
- Follow best practices
- Add proper error handling"
```

#### Testing
```
"Write comprehensive tests for this function: [paste function]
Include:
- Happy path tests
- Edge cases
- Error scenarios"
```

---

## 🧪 Testing Strategy

### Frontend Tests (Vitest + React Testing Library)

**Example: useSocket Hook Test**
```typescript
// useSocket.test.ts
import { renderHook, act } from '@testing-library/react';
import { useSocket } from './useSocket';

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    emit: vi.fn(),
  })),
}));

describe('useSocket', () => {
  it('should connect to socket on mount', () => {
    const { result } = renderHook(() => useSocket('session-123'));
    expect(result.current.socket.connect).toHaveBeenCalled();
  });
  
  it('should disconnect on unmount', () => {
    const { result, unmount } = renderHook(() => useSocket('session-123'));
    unmount();
    expect(result.current.socket.disconnect).toHaveBeenCalled();
  });
});
```

### Backend Tests (Pytest + AsyncIO)

**Example: Authentication Test**
```python
# test_auth.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    response = await client.post("/auth/login", json={
        "email": "interviewer@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["user"]["email"] == "interviewer@example.com"

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post("/auth/login", json={
        "email": "wrong@example.com",
        "password": "wrong"
    })
    assert response.status_code == 401
```

### Integration Tests

**Example: Real-Time Sync Test**
```python
# test_sync_scenarios.py
import pytest
import socketio
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_code_sync_between_users(server):
    # Create session
    async with AsyncClient(base_url=server) as ac:
        res = await ac.post("/sessions", json={
            "candidateName": "Test",
            "candidateEmail": "test@example.com",
            "language": "python"
        })
        session_id = res.json()["id"]
    
    # Connect two clients
    client_a = socketio.AsyncClient()
    client_b = socketio.AsyncClient()
    
    code_received = asyncio.Future()
    
    @client_b.on('code_change')
    async def on_code_change(data):
        code_received.set_result(data['code'])
    
    await client_a.connect(server)
    await client_b.connect(server)
    
    await client_a.emit('join_room', {'roomId': session_id, 'user': {...}})
    await client_b.emit('join_room', {'roomId': session_id, 'user': {...}})
    
    # Client A sends code
    test_code = "print('Hello World')"
    await client_a.emit('code_change', {
        'roomId': session_id,
        'code': test_code
    })
    
    # Client B should receive it
    received = await asyncio.wait_for(code_received, timeout=2)
    assert received == test_code
```

### Test Fixtures (conftest.py)

**The Server Fixture:**
```python
# conftest.py
import pytest
import subprocess
import atexit
from httpx import AsyncClient

@pytest.fixture(scope="session")
async def server():
    """Starts a real uvicorn server for integration tests"""
    # Find free port
    sock = socket.socket()
    sock.bind(('127.0.0.1', 0))
    port = sock.getsockname()[1]
    sock.close()
    
    # Start server
    process = subprocess.Popen([
        sys.executable, "-m", "uvicorn", "app.main:app",
        "--host", "127.0.0.1",
        "--port", str(port)
    ])
    
    # Ensure cleanup
    def cleanup():
        process.terminate()
        process.wait(timeout=2)
    
    atexit.register(cleanup)
    
    # Wait for server to be ready
    base_url = f"http://127.0.0.1:{port}"
    for _ in range(100):
        try:
            async with AsyncClient() as client:
                if (await client.get(f"{base_url}/health")).status_code == 200:
                    break
        except:
            await asyncio.sleep(0.2)
    
    yield base_url
    cleanup()
```

---

## 🚀 Deployment & DevOps

### Local Development

**Start Everything:**
```bash
# Terminal 1: Start backend
cd server
uv run uvicorn app.main:app --reload

# Terminal 2: Start frontend
cd client
npm run dev
```

**Or use the root script:**
```bash
npm run dev  # Runs both concurrently
```

### Docker Development

```bash
# Build and start
docker-compose up --build

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Clean everything
docker-compose down -v  # Removes volumes too
```

### Render Deployment

**Steps:**
1. Push code to GitHub
2. Connect repository to Render
3. Choose "Blueprint" deployment
4. Render reads `render.yaml` and creates:
   - Web service (Docker container)
   - PostgreSQL database
   - Automatic connection between them

**Environment Variables:**
- `DATABASE_URL`: Auto-populated from database
- `PORT`: Set to 8080

**Monitoring:**
- View logs in Render dashboard
- Check health endpoint: `https://your-app.onrender.com/health`

### CI/CD Workflow

**On Every Push:**
1. GitHub Actions triggers
2. Runs frontend tests (Vitest)
3. Runs backend tests (Pytest)
4. Runs integration tests
5. If all pass and branch is `main`:
   - Triggers Render deployment via webhook

**Setting Up Deploy Hook:**
1. Go to Render Dashboard → Your Service → Settings
2. Copy "Deploy Hook" URL
3. Add to GitHub Secrets as `RENDER_DEPLOY_HOOK_URL`

---

## ⚠️ Common Issues & Solutions

### Issue 1: Socket.IO Connection Refused

**Error:**
```
ERR_CONNECTION_REFUSED on ws://localhost:8000/socket.io
```

**Cause:**
Frontend trying to connect to localhost, but in production it should use relative URLs.

**Solution:**
```typescript
// api.ts
const API_URL = '';  // Empty string for relative URLs
```

### Issue 2: Tldraw persistenceKey Error

**Error:**
```
Type '{ persistenceKey: string; store: TLStore; }' is not assignable to type 'TldrawProps'
```

**Cause:**
Tldraw v4+ doesn't support `persistenceKey` when using custom `store`.

**Solution:**
```typescript
// Remove persistenceKey
<Tldraw store={store} onMount={handleMount} />
```

### Issue 3: Database Connection Error on Render

**Error:**
```
ModuleNotFoundError: No module named 'psycopg2'
```

**Cause:**
Render provides `postgres://` URL, but async SQLAlchemy needs `postgresql+asyncpg://`.

**Solution:**
```python
# database.py
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
```

### Issue 4: CI/CD Pipeline Hangs

**Symptom:**
Tests pass but GitHub Actions never completes "post" steps.

**Cause:**
Background test server process not terminated.

**Solution:**
```python
# conftest.py
import atexit

def cleanup():
    process.terminate()
    process.wait(timeout=2)

atexit.register(cleanup)  # Guarantees cleanup
```

### Issue 5: Nginx 404 on API Routes

**Symptom:**
Frontend loads but API calls return 404.

**Cause:**
Trailing slashes in Nginx location blocks.

**Solution:**
```nginx
# ❌ Wrong
location /api/ {
    proxy_pass http://localhost:8000/api/;
}

# ✅ Correct
location /api {
    proxy_pass http://localhost:8000/api;
}
```

### Issue 6: Session Duration Shows 0

**Cause:**
`terminate_session` endpoint not calculating duration.

**Solution:**
```python
@app.post("/sessions/{session_id}/terminate")
async def terminate_session(session_id: str, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    
    # Calculate duration
    if session.start_time:
        start = datetime.fromisoformat(session.start_time)
        now = datetime.now(timezone.utc)
        duration_minutes = int((now - start).total_seconds() / 60)
        session.duration = duration_minutes
    
    session.status = "completed"
    await db.commit()
```

---

## 📚 Learning Resources

### React & TypeScript
- **Official Docs**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **React TypeScript Cheatsheet**: https://react-typescript-cheatsheet.netlify.app/

### FastAPI
- **Official Tutorial**: https://fastapi.tiangolo.com/tutorial/
- **Async Python**: https://realpython.com/async-io-python/
- **SQLAlchemy 2.0**: https://docs.sqlalchemy.org/en/20/

### WebSockets & Real-Time
- **Socket.IO Docs**: https://socket.io/docs/v4/
- **WebSocket Protocol**: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API

### Docker & DevOps
- **Docker Tutorial**: https://docs.docker.com/get-started/
- **Nginx Beginner's Guide**: http://nginx.org/en/docs/beginners_guide.html
- **GitHub Actions**: https://docs.github.com/en/actions

### Testing
- **Vitest**: https://vitest.dev/
- **Pytest**: https://docs.pytest.org/
- **Testing Library**: https://testing-library.com/docs/react-testing-library/intro/

---

## 🎯 Key Takeaways for Students

### 1. **Start Simple, Iterate**
Don't try to build everything at once. We started with:
- Basic CRUD operations
- Then added real-time features
- Then added code execution
- Then containerized
- Then deployed

### 2. **Type Safety Saves Time**
TypeScript catches bugs before runtime:
```typescript
// ❌ JavaScript - error at runtime
function add(a, b) {
  return a + b;
}
add("5", 3);  // "53" - oops!

// ✅ TypeScript - error at compile time
function add(a: number, b: number): number {
  return a + b;
}
add("5", 3);  // Error: Argument of type 'string' is not assignable
```

### 3. **Async/Await is Your Friend**
Modern async code is readable:
```python
# ❌ Callback hell
def get_user(callback):
    db.query("SELECT * FROM users", lambda result:
        callback(result))

# ✅ Async/await
async def get_user():
    result = await db.query("SELECT * FROM users")
    return result
```

### 4. **Test Early, Test Often**
Tests give you confidence to refactor:
```python
# Write test first
def test_login_with_valid_credentials():
    response = client.post("/auth/login", json={...})
    assert response.status_code == 200

# Then implement
@app.post("/auth/login")
async def login(...):
    # Implementation
```

### 5. **AI is a Tool, Not a Replacement**
- ✅ Use AI to generate boilerplate
- ✅ Use AI to explain unfamiliar code
- ✅ Use AI to debug errors
- ❌ Don't blindly copy AI code
- ❌ Don't skip understanding how it works

### 6. **Real-Time is Hard**
Challenges we faced:
- Race conditions (two users editing simultaneously)
- Connection drops (network issues)
- State synchronization (keeping everyone in sync)

Solutions:
- Room-based isolation
- Optimistic updates
- Conflict resolution strategies

### 7. **Production ≠ Development**
Development:
- SQLite database
- Hot reload
- Detailed error messages

Production:
- PostgreSQL database
- Optimized builds
- Generic error messages (security)
- Environment variables
- Health checks

---

## 🎓 Final Project Checklist

Use this to verify you've learned everything:

### Frontend
- [ ] Understand React component lifecycle
- [ ] Know how to use hooks (useState, useEffect, custom hooks)
- [ ] Can integrate third-party libraries (Monaco, TLDraw)
- [ ] Understand WebSocket communication
- [ ] Can write unit tests with Vitest

### Backend
- [ ] Can create REST API with FastAPI
- [ ] Understand async/await in Python
- [ ] Can use SQLAlchemy ORM
- [ ] Can implement WebSocket handlers
- [ ] Can write tests with Pytest

### DevOps
- [ ] Can write a Dockerfile
- [ ] Understand Nginx reverse proxy
- [ ] Can use docker-compose
- [ ] Can set up CI/CD pipeline
- [ ] Can deploy to cloud platform

### AI Skills
- [ ] Can write effective prompts
- [ ] Can debug AI-generated code
- [ ] Can iterate on AI suggestions
- [ ] Understand when to use AI vs. manual coding

---

## 🚀 Next Steps

Want to extend this project? Try:

1. **Add Video/Audio**: Integrate WebRTC for video calls
2. **Add More Languages**: Support Java, C++, Go
3. **Add Code Review**: Let interviewers comment on specific lines
4. **Add Analytics**: Track session metrics, success rates
5. **Add AI Hints**: Use GPT-4 to provide coding hints
6. **Add Replay**: Record and replay entire sessions
7. **Add Mobile App**: React Native version

---

**Remember**: The best way to learn is by building. Take this project, break it, fix it, extend it, and make it your own!

**Happy Coding!** 🎉
