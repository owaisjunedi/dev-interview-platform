# DevInterview.io

A real-time collaborative coding interview platform with browser-based execution and interview helper tools.

## Features
- ⚡ **Real-time Collaboration:** Sync code and whiteboard (Tldraw) instantly.
- 🏃 **Browser-Based Execution:** Run Python (Pyodide) and JS (Web Workers) safely on the client.
- 🧑‍💻 **Multi-language Support:** Syntax highlighting for C++, Java, Go, Python, JS.
- 📋 **Interviewer Tools:** - "Top 10 Questions" generator (Role/Language based).
  - Session history and grading.
  - One-click session termination.
- 🤖 **Automated Insights:** Basic code analysis and suggestions.

## Tech Stack
- **Frontend:** React, Vite, Tailwind, Zustand, Monaco Editor.
- **Backend:** FastAPI (Python), Socket.io, PostgreSQL.
- **Deployment:** Docker (Render).

## Getting Started

### 1. Installation
```bash
npm install # Installs root dependencies (concurrently)

# Frontend
cd client && npm install

# Backend
cd server
pip install uv
uv sync

```

### 2. Running Locally

Run both client and server:

```bash
npm start

```

* Frontend: http://localhost:5173
* Backend: http://localhost:8000

### 3. Testing

```bash
npm run test:all

```

## Deployment

Push to GitHub. The CI/CD pipeline will:

1. Run tests.
2. Build the Docker container.
3. Deploy to Render.

```