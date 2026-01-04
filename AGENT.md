# 📖 The DevInterview.io Bible: AI-Driven Full-Stack Development

Welcome! This document is a comprehensive guide to the **DevInterview.io** project. It serves as both a technical manual and a learning resource for college students interested in modern web development and AI-assisted engineering.

---

## 🚀 Project Overview

**DevInterview.io** is a real-time technical interview platform. It allows interviewers to create sessions, share them with candidates, and collaborate on code and a whiteboard in real-time.

### Key Features:
- **Real-time Sync**: Code, whiteboard, and timer stay in sync across all participants.
- **Client-Side Execution**: Python and JavaScript code run safely in the browser using WebAssembly (WASM).
- **Syntax Highlighting**: Rich code editing experience for multiple languages.
- **Containerized Architecture**: Fully packaged using Docker and Nginx.
- **Automated CI/CD**: Tests and deployments are handled automatically via GitHub Actions.

---

## 🛠 The Tech Stack

### Frontend: React & TypeScript
- **Why?** React is the industry standard for building dynamic user interfaces. TypeScript adds "type safety," which prevents common bugs by ensuring variables are used correctly.
- **Key Libraries**:
  - `tldraw`: For the collaborative whiteboard.
  - `monaco-editor`: The same engine that powers VS Code.
  - `socket.io-client`: For real-time communication.

### Backend: FastAPI (Python)
- **Why?** FastAPI is incredibly fast and uses Python's `async/await` for high performance. It also automatically generates API documentation.
- **Key Libraries**:
  - `python-socketio`: Handles real-time events.
  - `SQLAlchemy`: An ORM (Object Relational Mapper) that lets us talk to the database using Python objects instead of raw SQL.

### Database: PostgreSQL
- **Why?** A robust, production-ready relational database. We started with SQLite for simplicity and moved to PostgreSQL for the cloud.

### DevOps: Docker, Nginx, & GitHub Actions
- **Docker**: Packages the app into "containers" so it runs the same way on every machine.
- **Nginx**: Acts as a "Reverse Proxy," serving the frontend and routing API requests to the backend.
- **GitHub Actions**: Our CI/CD pipeline that runs tests on every push.

---

## 🤖 AI-Assisted Development: How We Built This

Building this project wasn't just about writing code; it was about **collaborating with an AI Agent**. Here is the flow we followed and the prompts that drove it.

### Phase 1: The Foundation (Frontend & Specs)
We started with a frontend built in **Lovable**. 
- **AI Strategy**: We extracted the OpenAPI specifications from the frontend code to understand what endpoints the backend needed to provide.
- **Prompt Example**: *"Analyze the frontend services and generate a FastAPI backend structure that matches these API calls."*

### Phase 2: Implementing the Backend
We built the FastAPI server to handle authentication, session management, and real-time sync.
- **Challenge**: Real-time sync is hard.
- **Solution**: We used Socket.IO "rooms" to isolate session data.
- **Prompt Example**: *"Implement a Socket.IO handler that joins users to a room based on their `session_id` and broadcasts code changes only to that room."*

### Phase 3: Advanced Features (WASM & Highlighting)
To make the app secure, we moved code execution from the server to the client.
- **Tech used**: `Pyodide` (Python in WASM).
- **Prompt Example**: *"I want to remove the server-side `/execute` endpoint. Instead, use Pyodide in the React frontend to run Python code locally in the browser."*

### Phase 4: Fixing Bugs & Refinement
During our session, we noticed the "Duration" column was empty.
- **The Fix**: We modified the `terminate_session` endpoint to calculate the difference between `start_time` and the current time.
- **Prompt Example**: *"The duration column in the dashboard is empty. Update the backend to calculate the session duration in minutes when a session is terminated and save it to the database."*

### Phase 5: Containerization (The "Docker" Phase)
We needed to package the app for the cloud.
- **The Challenge**: Nginx, FastAPI, and React all need to work together on one port.
- **The Solution**: A multi-stage `Dockerfile` and an `nginx.conf` proxy.
- **Prompt Example**: *"Create a Dockerfile that builds the React frontend, installs the FastAPI backend, and uses Nginx to serve both on port 8080. Also, create a docker-compose.yml with a PostgreSQL database."*

### Phase 6: Cloud Deployment & CI/CD
Finally, we deployed to Render and set up GitHub Actions.
- **The Fix**: We encountered a `psycopg2` error on Render.
- **Prompt Example**: *"Render is failing with 'ModuleNotFoundError: No module named psycopg2'. I am using asyncpg. Update the database connection logic to handle Render's postgres:// URL and convert it to the async-compatible postgresql+asyncpg:// format."*

---

## 🎓 Learning for Students: Tips for Success

1.  **Don't Fear the Error**: Errors are just the AI's way of telling you what's missing. When you see a `ModuleNotFoundError`, it usually means a dependency isn't in your `pyproject.toml` or `package.json`.
2.  **Think in Components**: In React, break everything down. The Whiteboard is a component, the Editor is a component. This makes the code easier to manage.
3.  **State is Everything**: In a real-time app, the "Single Source of Truth" is the database. Use WebSockets to tell other users when that truth changes.
4.  **AI is a Pair Programmer**: Treat the AI as a senior dev. Ask it "Why did you choose this approach?" or "Can you explain this line of code?"

---

## 🛠 How to Use This Project

1.  **Local Dev**: `npm run dev` (runs both client and server).
2.  **Docker**: `docker-compose up --build`.
3.  **Tests**: `cd server && uv run pytest` or `cd client && npm run test`.

**Happy Coding!** 🚀
