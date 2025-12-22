# DevInterview Platform

A real-time collaborative coding interview platform.

## Features
-   **Collaborative Code Editor**: Real-time code synchronization using Monaco Editor and Socket.IO.
-   **Code Execution**: Run Python and JavaScript code safely in the browser (via backend).
-   **Whiteboard**: Interactive whiteboard for system design discussions.
-   **Video/Audio**: (Placeholder for future WebRTC integration).
-   **Question Bank**: Access top interview questions.
-   **Admin Tools**: Session management, notes, and termination.

## Tech Stack
-   **Frontend**: React, Vite, TailwindCSS, Shadcn UI, Monaco Editor, Tldraw.
-   **Backend**: FastAPI, Socket.IO, JWT Auth.
-   **Database**: Mock (In-memory) for this homework.

## Prerequisites
-   Node.js (v18+)
-   Python (v3.12+)
-   `uv` (Python package manager)

## Setup & Run

### Backend
1.  Navigate to `server` directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    uv sync
    ```
3.  Run the server:
    ```bash
    uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```

### Frontend
1.  Navigate to `client` directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:8080](http://localhost:8080) (or the port shown in terminal).

## Testing
### Backend Verification
Run the verification script to test API endpoints:
```bash
cd server
uv run verify_api.py
```

## API Documentation
OpenAPI specification is available at `openapi.yaml`.
Swagger UI is available at `http://localhost:8000/docs` when the server is running.