# DevInterview Platform

A real-time collaborative coding interview platform.

## Features
-   **Collaborative Code Editor**: Real-time code synchronization using Monaco Editor and Socket.IO.
-   **Code Execution**: Run Python and JavaScript code safely in the browser via WASM and native JS.
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

### Quick Start (Both Client & Server)
Run both the client and server concurrently from the root directory:
1.  Install root dependencies:
    ```bash
    npm install
    ```
2.  Run both:
    ```bash
    npm run dev
    ```

### Manual Setup
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
    > **Note**: This project includes a `.nvmrc` file specifying the recommended Node.js version. If you use `nvm`, you can run `nvm use` to switch to the correct version.
    > The `package-lock.json` ensures dependency consistency across environments.

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

### Backend (Server)

The backend uses `pytest` for unit and integration testing.

1.  **Unit & Integration Tests**:
    Run all tests in the `tests` and `tests_integration` directories:
    ```bash
    cd server
    PYTHONPATH=. uv run pytest
    ```

2.  **API Verification Script**:
    Run a manual verification script that tests the main API endpoints:
    ```bash
    cd server
    # Ensure the server is running (uv run uvicorn app.main:app)
    uv run verify_api.py
    ```

### Frontend (Client)

The frontend uses `vitest` for component and hook testing.

1.  **Run Tests**:
    ```bash
    cd client
    npm run test
    ```

2.  **Run Tests in UI Mode**:
    ```bash
    cd client
    npx vitest --ui
    ```

3.  **Coverage Report**:
    ```bash
    cd client
    npm run test -- --coverage
    ```

## Development Notes

- **Real-time Sync**: The platform uses Socket.IO for real-time collaboration. The state is persisted in a SQLite database (`server/test.db`).
- **Code Execution**: Python and JavaScript code are executed client-side using WASM (Pyodide) and native JS respectively, ensuring security and performance.
- **Whiteboard**: The whiteboard state is synced via WebSockets and persisted in the session data.

## API Documentation
OpenAPI specification is available at `openapi.yaml`.
Swagger UI is available at `http://localhost:8000/docs` when the server is running.