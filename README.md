# CodeSync-AI

An end-to-end real-time collaborative technical interview platform powered by AI.

## Features
- 🚀 **Real-time Collaboration:** Live coding (Monaco Editor) and Whiteboard (Tldraw).
- 🧠 **AI Copilot for Interviewers:** Real-time code analysis, bug detection, and interview question suggestions.
- ⚡ **Browser-based Execution:** Code runs safely in the browser using WASM (Pyodide for Python).
- 🔐 **Admin Dashboard:** Interviewers can view session history, logs, and grading notes.
- 🎨 **Modern UI:** Dark/Light themes, smooth animations.

## Architecture
- **Frontend:** React, Vite, Tailwind, Zustand (State), Monaco Editor.
- **Backend:** Python FastAPI, Socket.io, PostgreSQL, SQLAlchemy.
- **Deployment:** Docker container on Render.

## Prerequisites
- Node.js v18+
- Python 3.10+
- `uv` (Python dependency manager)
- Docker

## Getting Started

### 1. Installation
Install root dependencies (for running concurrently):
```bash
npm install

```

**Frontend:**

```bash
cd client
npm install

```

**Backend:**

```bash
cd server
pip install uv
uv sync

```

### 2. Running Locally (Development)

We use `concurrently` to run both client and server:

```bash
# From root directory
npm run dev

```

* Client: http://localhost:5173
* Server: http://localhost:8000
* API Docs: http://localhost:8000/docs

### 3. Testing

**Unit Tests:**

```bash
# Frontend
cd client && npm run test

# Backend
cd server && uv run pytest

```

**Integration Tests:**

```bash
# From root
npm run test:integration

```

### 4. Deployment

The application is containerized using Docker.

```bash
docker build -t codesync .
docker run -p 8000:8000 codesync

```

## API Specification

See `openapi.yaml` for full REST API contract.

```

**Root `package.json` (for concurrency):**
```json
{
  "name": "codesync-root",
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix client\" \"cd server && uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000\"",
    "test:integration": "playwright test"
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}

```
