# 🎯 DevInterview.io - Real-Time Technical Interview Platform

A production-ready, real-time collaborative coding interview platform built with modern web technologies. Conduct technical interviews with live code execution, collaborative whiteboard, and synchronized timers.

[![CI/CD Pipeline](https://github.com/YOUR_USERNAME/dev-interview-platform/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/YOUR_USERNAME/dev-interview-platform/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development Guide](#development-guide)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### Core Functionality
- 🎨 **Real-Time Collaborative Code Editor** - Monaco Editor with live synchronization across all participants
- 🚀 **Client-Side Code Execution** - Run Python (via Pyodide/WASM) and JavaScript securely in the browser
- 🎨 **Interactive Whiteboard** - TLDraw-powered collaborative drawing canvas for system design discussions
- ⏱️ **Synchronized Timer** - Real-time countdown timer visible to all participants
- 📝 **Session Management** - Create, track, and review interview sessions with detailed history
- 💾 **Persistent State** - All session data (code, whiteboard, notes) saved to PostgreSQL database
- 🎯 **Question Bank** - Curated collection of coding interview questions by difficulty and category
- 📊 **Scoring & Notes** - Interviewer tools for rating and documenting candidate performance

### Technical Highlights
- 🔐 **JWT Authentication** - Secure user authentication with role-based access (interviewer/candidate)
- 🔄 **WebSocket Communication** - Socket.IO for real-time bidirectional updates
- 🎨 **Syntax Highlighting** - Multi-language support with Monaco Editor
- 🐳 **Containerized** - Docker + Nginx for consistent deployment
- 🚀 **CI/CD Pipeline** - Automated testing and deployment via GitHub Actions
- 📱 **Responsive Design** - Works seamlessly on desktop and tablet devices

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast HMR and optimized builds)
- **Styling**: TailwindCSS + Shadcn UI components
- **Code Editor**: Monaco Editor (VS Code engine)
- **Whiteboard**: TLDraw v4
- **Real-Time**: Socket.IO Client
- **Code Execution**: Pyodide (Python WASM), Native JavaScript
- **State Management**: React Hooks (useState, useEffect, custom hooks)
- **Routing**: React Router v6

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Real-Time**: Python-SocketIO (async)
- **Database**: PostgreSQL (production), SQLite (development)
- **ORM**: SQLAlchemy 2.0 (async)
- **Authentication**: JWT (PyJWT)
- **API Docs**: Auto-generated OpenAPI/Swagger
- **Package Manager**: uv (fast Python package installer)

### DevOps & Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (reverse proxy + static file serving)
- **CI/CD**: GitHub Actions
- **Deployment**: Render (Platform-as-a-Service)
- **Testing**: Pytest (backend), Vitest (frontend)

---

## 🏗 Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ React UI     │  │ Monaco Editor│  │ TLDraw       │     │
│  │ (TypeScript) │  │ (Code)       │  │ (Whiteboard) │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                 │
│                    ┌──────▼──────┐                         │
│                    │ Socket.IO   │                         │
│                    │ Client      │                         │
│                    └──────┬──────┘                         │
└───────────────────────────┼─────────────────────────────────┘
                            │ WebSocket (wss://)
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
                            │  │ (Real-time events)     │  │
                            │  └────────────────────────┘  │
                            │  ┌────────────────────────┐  │
                            │  │ REST API Endpoints     │  │
                            │  │ (/auth, /sessions)     │  │
                            │  └────────────────────────┘  │
                            └───────────┬──────────────────┘
                                        │
                            ┌───────────▼──────────────┐
                            │  PostgreSQL Database     │
                            │  ┌────────────────────┐  │
                            │  │ users              │  │
                            │  │ sessions           │  │
                            │  └────────────────────┘  │
                            └──────────────────────────┘
```

### Real-Time Sync Flow

1. **User A types in editor** → Socket.IO emits `code_change` event
2. **Server receives event** → Saves to database + broadcasts to room
3. **User B receives event** → Updates editor with new code
4. **All in ~50ms** → Near-instantaneous synchronization

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js**: v20 or higher ([Download](https://nodejs.org/))
- **Python**: v3.12 or higher ([Download](https://www.python.org/))
- **uv**: Fast Python package installer ([Install](https://github.com/astral-sh/uv))
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```

### Optional (for Docker deployment)
- **Docker**: v24 or higher ([Download](https://www.docker.com/))
- **Docker Compose**: v2 or higher (included with Docker Desktop)

### Verify Installation
```bash
# Check Node.js version
node --version  # Should be v20+

# Check Python version
python --version  # Should be 3.12+

# Check uv installation
uv --version

# Check Docker (optional)
docker --version
docker-compose --version
```

---

## 🚀 Installation & Setup

### Method 1: Quick Start (Recommended for Development)

This method runs both frontend and backend concurrently from the root directory.

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/dev-interview-platform.git
   cd dev-interview-platform
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   uv sync
   cd ..
   ```

4. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

5. **Run both services**
   ```bash
   npm run dev
   ```

   This starts:
   - Backend API at `http://localhost:8000`
   - Frontend at `http://localhost:8080`

6. **Open your browser**
   Navigate to `http://localhost:8080`

### Method 2: Manual Setup (Separate Terminals)

#### Backend Setup

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies with uv**
   ```bash
   uv sync
   ```

3. **Set environment variables (optional)**
   ```bash
   # For development, defaults to SQLite
   export DATABASE_URL="sqlite+aiosqlite:///./test.db"
   
   # For production with PostgreSQL
   export DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/dbname"
   ```

4. **Run the server**
   ```bash
   uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The server will:
   - Start on `http://localhost:8000`
   - Auto-reload on code changes
   - Create database tables automatically
   - Seed mock users for testing

#### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Use correct Node.js version (if using nvm)**
   ```bash
   nvm use
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   The frontend will:
   - Start on `http://localhost:8080`
   - Hot-reload on code changes
   - Proxy API requests to backend

### Method 3: Docker (Production-like Environment)

1. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   - Application: `http://localhost:8080`
   - API docs: `http://localhost:8080/api/docs`

3. **Stop services**
   ```bash
   docker-compose down
   ```

4. **Clean everything (including database)**
   ```bash
   docker-compose down -v
   ```

---

## 🎮 Running the Application

### Development Mode

**Option A: Concurrent (Recommended)**
```bash
# From root directory
npm run dev
```

**Option B: Separate Terminals**
```bash
# Terminal 1: Backend
cd server
uv run uvicorn app.main:app --reload

# Terminal 2: Frontend
cd client
npm run dev
```

### Production Mode (Docker)

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Accessing the Application

Once running, you can access:

- **Frontend**: http://localhost:8080
- **API Documentation**: http://localhost:8000/docs
- **API Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

### Mock Users for Testing

The application seeds mock users on startup. Use these credentials:

| Email | Password | Role |
|-------|----------|------|
| `interviewer@example.com` | `password123` | Interviewer |
| `tech.lead@example.com` | `securepass` | Interviewer |
| `candidate@example.com` | `candidate123` | Candidate |
| `junior@example.com` | `juniorpass` | Candidate |

See [MOCK_USERS.md](MOCK_USERS.md) for complete details.

---

## 🧪 Testing

### Backend Tests - SERVER (Pytest)

The backend uses `pytest` with async support for comprehensive testing.

#### Run All Tests
```bash
cd server
PYTHONPATH=. uv run pytest
```

#### Run Specific Test Files
```bash
# Authentication tests
PYTHONPATH=. uv run pytest tests/test_auth.py

# Session management tests
PYTHONPATH=. uv run pytest tests/test_sessions.py

# Real-time sync tests
PYTHONPATH=. uv run pytest tests/test_sync_scenarios.py

# Integration tests
PYTHONPATH=. uv run pytest tests_integration/
```

#### Run with Verbose Output
```bash
PYTHONPATH=. uv run pytest -v
```

#### Run with Coverage Report
```bash
PYTHONPATH=. uv run pytest --cov=app --cov-report=html
# Open htmlcov/index.html in browser
```

#### Run with Timeout Protection
```bash
PYTHONPATH=. uv run pytest --timeout=300
```

#### API Verification Script
```bash
cd server
# Ensure the server is running (uv run uvicorn app.main:app)
uv run verify_api.py
```

### Frontend Tests - CLIENT (Vitest)

The frontend uses Vitest and React Testing Library.

#### Run All Tests
```bash
cd client
npm run test
```

#### Run Tests in Watch Mode
```bash
npm run test:watch
```

#### Run Tests with UI
```bash
npx vitest --ui
```

#### Run with Coverage
```bash
npm run test -- --coverage
```

### Test Structure

```
server/
├── tests/                    # Unit tests
│   ├── conftest.py          # Test fixtures
│   ├── test_auth.py         # Authentication tests
│   ├── test_sessions.py     # Session CRUD tests
│   ├── test_socket.py       # Socket.IO event tests
│   └── test_sync_scenarios.py # Real-time sync tests
└── tests_integration/        # Integration tests
    └── test_session_flow.py # End-to-end workflows

client/
└── src/
    └── __tests__/           # Component tests
        └── useSocket.test.ts
```

---

## 🚀 Deployment

### Deploy to Render (Recommended)

This project includes a `render.yaml` Blueprint for one-click deployment.

#### Prerequisites
1. Create a [Render account](https://render.com)
2. Push your code to GitHub
3. Set up GitHub secrets for CI/CD (optional)

#### Steps

1. **Connect Repository to Render**
   - Go to Render Dashboard
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will detect `render.yaml`

2. **Configure Environment Variables**
   - `DATABASE_URL`: Auto-populated from PostgreSQL service
   - `PORT`: Set to `8080` (required)

3. **Deploy**
   - Click "Apply"
   - Render will:
     - Create PostgreSQL database
     - Build Docker image
     - Deploy web service
     - Connect database to service

4. **Access Your Application**
   - URL: `https://your-app-name.onrender.com`
   - Health check: `https://your-app-name.onrender.com/health`

#### Automatic Deployments (CI/CD)

Set up automatic deployments on every push to `main`:

1. **Get Deploy Hook URL**
   - Render Dashboard → Your Service → Settings
   - Copy "Deploy Hook" URL

2. **Add to GitHub Secrets**
   - GitHub Repository → Settings → Secrets and variables → Actions
   - New secret: `RENDER_DEPLOY_HOOK_URL`
   - Paste the deploy hook URL

3. **Push to Main**
   - GitHub Actions will run tests
   - If all pass, triggers Render deployment

### Deploy with Docker

#### Build Production Image
```bash
docker build -t devinterview:latest .
```

#### Run Container
```bash
docker run -d \
  -p 8080:8080 \
  -e DATABASE_URL="postgresql+asyncpg://user:pass@host:5432/db" \
  devinterview:latest
```

#### Using Docker Compose
```bash
# Production mode
docker-compose -f docker-compose.yml up -d

# With custom environment
docker-compose --env-file .env.production up -d
```

---

## 📚 API Documentation

### Interactive Documentation

When the server is running, access interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login and get JWT token

#### Sessions
- `GET /sessions` - List all sessions
- `POST /sessions` - Create new session
- `GET /sessions/{id}` - Get session details
- `PUT /sessions/{id}` - Update session
- `DELETE /sessions/{id}` - Delete session
- `POST /sessions/{id}/terminate` - End session and calculate duration

#### Questions
- `GET /questions` - Get question bank
- `GET /questions/{language}` - Get questions by language

#### Health
- `GET /health` - Health check endpoint

### WebSocket Events

#### Client → Server
- `join_room` - Join interview session
- `leave_room` - Leave interview session
- `code_change` - Send code update
- `whiteboard_update` - Send whiteboard changes
- `custom_question` - Set custom question
- `execution_result` - Send code execution result

#### Server → Client
- `session_updated` - Session state changed
- `code_change` - Code was updated
- `whiteboard_update` - Whiteboard was updated
- `custom_question` - Question was set
- `execution_result` - Code execution completed
- `room_users` - User list updated
- `user_joined` - User joined session
- `user_left` - User left session

---

## 📁 Project Structure

```
dev-interview-platform/
├── client/                      # Frontend React application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── CodeEditor.tsx
│   │   │   ├── Whiteboard.tsx
│   │   │   └── ui/              # Shadcn UI components
│   │   ├── hooks/               # Custom React hooks
│   │   │   └── useSocket.ts     # Socket.IO hook
│   │   ├── lib/                 # Utilities
│   │   │   └── codeExecution.ts # WASM execution
│   │   ├── pages/               # Route pages
│   │   │   ├── Dashboard.tsx
│   │   │   └── InterviewRoom.tsx
│   │   ├── services/            # API clients
│   │   │   └── api.ts
│   │   └── App.tsx              # Root component
│   ├── package.json
│   └── vite.config.ts
│
├── server/                      # Backend FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app + Socket.IO
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── database.py          # Database connection
│   │   └── schemas.py           # Pydantic schemas
│   ├── tests/                   # Unit tests
│   │   ├── conftest.py          # Test fixtures
│   │   ├── test_auth.py
│   │   ├── test_sessions.py
│   │   └── test_sync_scenarios.py
│   ├── tests_integration/       # Integration tests
│   └── pyproject.toml           # Python dependencies
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml            # GitHub Actions pipeline
│
├── Dockerfile                   # Multi-stage Docker build
├── docker-compose.yml           # Local development with DB
├── nginx.conf                   # Nginx configuration
├── render.yaml                  # Render deployment blueprint
├── start.sh                     # Container startup script
├── AGENT.md                     # Comprehensive project guide
├── MOCK_USERS.md               # Test user credentials
└── README.md                    # This file
```

---

## 💻 Development Guide

### Adding a New Feature

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Backend changes**
   - Add endpoint in `server/app/main.py`
   - Add database model in `server/app/models.py`
   - Write tests in `server/tests/`

3. **Frontend changes**
   - Add component in `client/src/components/`
   - Add API call in `client/src/services/api.ts`
   - Update types in TypeScript

4. **Test your changes**
   ```bash
   # Backend
   cd server && PYTHONPATH=. uv run pytest
   
   # Frontend
   cd client && npm run test
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   ```

### Code Style

#### Backend (Python)
- Follow PEP 8
- Use type hints
- Document functions with docstrings
- Use async/await for I/O operations

#### Frontend (TypeScript)
- Use functional components
- Prefer hooks over class components
- Use TypeScript strict mode
- Follow React best practices

### Environment Variables

#### Backend (.env)
```bash
DATABASE_URL=sqlite+aiosqlite:///./test.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

#### 2. Database Connection Error
```bash
# Reset database
rm server/test.db
# Restart server - it will recreate tables
```

#### 3. WebSocket Connection Failed
- Check that backend is running on port 8000
- Verify CORS settings in `server/app/main.py`
- Check browser console for errors

#### 4. Pyodide Loading Error
- Clear browser cache
- Check internet connection (Pyodide loads from CDN)
- Verify `codeExecution.ts` has correct CDN URL

#### 5. Tests Hanging
```bash
# Kill hanging processes
pkill -f pytest
pkill -f uvicorn

# Run with timeout
PYTHONPATH=. uv run pytest --timeout=300
```

#### 6. Docker Build Fails
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### Getting Help

1. Check [AGENT.md](AGENT.md) for detailed technical guide
2. Review [GitHub Issues](https://github.com/YOUR_USERNAME/dev-interview-platform/issues)
3. Check server logs: `docker-compose logs -f`
4. Enable verbose logging in backend

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Pull Request Guidelines

- Write clear, descriptive commit messages
- Include tests for new features
- Update documentation as needed
- Ensure all tests pass
- Follow existing code style

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Monaco Editor** - VS Code's editor engine
- **TLDraw** - Collaborative whiteboard library
- **FastAPI** - Modern Python web framework
- **Socket.IO** - Real-time communication library
- **Pyodide** - Python in WebAssembly
- **Render** - Deployment platform

---

## 📞 Support

For questions or issues:
- 📧 Email: support@devinterview.io
- 💬 GitHub Issues: [Create an issue](https://github.com/YOUR_USERNAME/dev-interview-platform/issues)
- 📖 Documentation: [AGENT.md](AGENT.md)

---

**Built with ❤️ using AI-assisted development**

For a comprehensive guide on how this project was built using AI, see [AGENT.md](AGENT.md).