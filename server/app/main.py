import uuid
import jwt
import datetime
import subprocess
import sys
import asyncio
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import socketio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update

from .database import engine, Base, get_db, SessionLocal
from . import models

# --- Configuration ---
SECRET_KEY = "supersecretkey"  # Change in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- Models ---
class UserLogin(BaseModel):
    email: str
    password: str

class UserSignup(BaseModel):
    email: str
    password: str
    name: str

class User(BaseModel):
    id: str
    email: str
    name: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class SessionCreate(BaseModel):
    candidateName: str
    candidateEmail: str
    language: str

# Default code templates
DEFAULT_CODE = {
    "python": """# Welcome to DevInterview.io
# Write your solution below

def solution():
    # Your code here
    pass

# Example usage
if __name__ == "__main__":
    result = solution()
    print(result)
""",
    "javascript": """// Welcome to DevInterview.io
// Write your solution below

function solution() {
    // Your code here
}

// Example usage
console.log(solution());
""",
    "java": """// Welcome to DevInterview.io
// Write your solution below

public class Solution {
    public static void main(String[] args) {
        # Your code here
    }
}
""",
    "cpp": """// Welcome to DevInterview.io
// Write your solution below

#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}
""",
    "go": """// Welcome to DevInterview.io
// Write your solution below

package main

import "fmt"

func main() {
    // Your code here
    fmt.Println("Hello, DevInterview!")
}
"""
}

class Session(BaseModel):
    id: str
    candidateName: str
    candidateEmail: str
    date: str
    duration: int
    score: Optional[int] = None
    status: str
    language: str
    notes: Optional[str] = None
    startTime: Optional[str] = None
    code: Optional[str] = None
    output: Optional[str] = None
    question: Optional[dict] = None
    serverTime: Optional[str] = None
    whiteboard: Optional[dict] = None

    class Config:
        from_attributes = True

class ExecuteRequest(BaseModel):
    code: str
    language: str

class ExecuteResponse(BaseModel):
    output: str
    error: Optional[str] = None

# --- Mock Database ---
# users_db and sessions_db removed in favor of SQLAlchemy


# --- Socket.IO Setup ---
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
sio_app = socketio.ASGIApp(sio)

fastapi_app = FastAPI()

@fastapi_app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed mock users if database is empty
    async with SessionLocal() as db:
        result = await db.execute(select(models.User))
        if not result.scalars().first():
            print("Seeding mock users...")
            mock_users = [
                models.User(id="user-1", email="interviewer@example.com", password="password123", name="Alice Interviewer", role="interviewer"),
                models.User(id="user-2", email="tech.lead@example.com", password="securepass", name="Bob Lead", role="interviewer"),
                models.User(id="user-3", email="candidate@example.com", password="candidate123", name="Charlie Candidate", role="candidate"),
                models.User(id="user-4", email="junior@example.com", password="juniorpass", name="Dave Junior", role="candidate"),
            ]
            db.add_all(mock_users)
            await db.commit()
            print("Seeding complete.")

# Mount Socket.IO at /ws
# fastapi_app.mount("/ws", sio_app)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Auth Utils ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Routes ---

@fastapi_app.post("/auth/signup", response_model=Dict)
async def signup(user_data: UserSignup, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(models.User).where(models.User.email == user_data.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    new_user = models.User(
        id=user_id,
        email=user_data.email,
        password=user_data.password, # In production, hash this!
        name=user_data.name,
        role="interviewer"
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    token = create_access_token({"sub": user_data.email})
    return {
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role
        },
        "token": token
    }

@fastapi_app.post("/auth/login", response_model=Dict)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).where(models.User.email == user_data.email))
    user = result.scalars().first()
    
    if not user or user.password != user_data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user_data.email})
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        },
        "token": token
    }

@fastapi_app.get("/sessions", response_model=List[Session])
async def get_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Session))
    sessions = result.scalars().all()
    return [
        Session(
            id=s.id,
            candidateName=s.candidate_name,
            candidateEmail=s.candidate_email,
            date=s.date,
            duration=s.duration,
            score=s.score,
            status=s.status,
            language=s.language,
            notes=s.notes,
            startTime=s.start_time,
            code=s.code,
            output=s.output,
            question=s.question,
            serverTime=s.server_time,
            whiteboard=s.whiteboard
        ) for s in sessions
    ]

@fastapi_app.post("/sessions", response_model=Session, status_code=201)
async def create_session(session_data: SessionCreate, db: AsyncSession = Depends(get_db)):
    session_id = str(uuid.uuid4())[:8] # Short ID for easier sharing
    new_session = models.Session(
        id=session_id,
        candidate_name=session_data.candidateName,
        candidate_email=session_data.candidateEmail,
        date=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        duration=0,
        status="scheduled",
        language=session_data.language,
        code=DEFAULT_CODE.get(session_data.language, ""),
        output=""
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    
    # Map back to Pydantic model (fields match mostly, but snake_case vs camelCase needs handling if not using aliases)
    # Our Pydantic model uses camelCase for some fields (candidateName), but DB uses snake_case (candidate_name).
    # We should probably update Pydantic model to use aliases or map manually.
    # For now, manual mapping or constructing the response.
    # Actually, FastAPI/Pydantic can handle ORM objects if `from_attributes = True` (v2) or `orm_mode = True` (v1).
    # Let's update the Pydantic model to support ORM mode.
    return Session(
        id=new_session.id,
        candidateName=new_session.candidate_name,
        candidateEmail=new_session.candidate_email,
        date=new_session.date,
        duration=new_session.duration,
        score=new_session.score,
        status=new_session.status,
        language=new_session.language,
        notes=new_session.notes,
        startTime=new_session.start_time,
        code=new_session.code,
        output=new_session.output,
        question=new_session.question,
        serverTime=new_session.server_time,
        whiteboard=new_session.whiteboard
    )

@fastapi_app.get("/sessions/{session_id}", response_model=Session)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Session).where(models.Session.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Inject current server time for sync
    # We don't save serverTime to DB usually, it's a transient field for sync?
    # The model has server_time.
    # Let's set it on the object before returning.
    session.server_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    return Session(
        id=session.id,
        candidateName=session.candidate_name,
        candidateEmail=session.candidate_email,
        date=session.date,
        duration=session.duration,
        score=session.score,
        status=session.status,
        language=session.language,
        notes=session.notes,
        startTime=session.start_time,
        code=session.code,
        output=session.output,
        question=session.question,
        serverTime=session.server_time,
        whiteboard=session.whiteboard
    )

@fastapi_app.post("/sessions/{session_id}/terminate")
async def terminate_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Session).where(models.Session.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.status = "completed"
    await db.commit()
    await sio.emit('session_ended', {}, room=session_id)
    return {"message": "Session terminated"}

@fastapi_app.delete("/sessions/{session_id}")
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Session).where(models.Session.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    await db.delete(session)
    await db.commit()
    return {"message": "Session deleted"}

@fastapi_app.put("/sessions/{session_id}")
async def update_session(session_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Session).where(models.Session.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if "score" in data:
        session.score = data["score"]
    if "notes" in data:
        session.notes = data["notes"]
        
    await db.commit()
    await db.refresh(session)
    
    return Session(
        id=session.id,
        candidateName=session.candidate_name,
        candidateEmail=session.candidate_email,
        date=session.date,
        duration=session.duration,
        score=session.score,
        status=session.status,
        language=session.language,
        notes=session.notes,
        startTime=session.start_time,
        code=session.code,
        output=session.output,
        question=session.question,
        serverTime=session.server_time,
        whiteboard=session.whiteboard
    )

@fastapi_app.post("/sessions/{session_id}/save_code")
async def save_code_endpoint(session_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Session).where(models.Session.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if "code" in data:
        session.code = data["code"]
    if "language" in data:
        session.language = data["language"]
        
    await db.commit()
    return {"message": "Code saved successfully"}

@fastapi_app.post("/execute", response_model=ExecuteResponse)
async def execute_code(request: ExecuteRequest):
    output = ""
    error = None
    
    if request.language == "python":
        try:
            # Run python code in a subprocess
            # WARNING: This is unsafe for production. Use a sandbox (e.g., Docker, gVisor)
            proc = await asyncio.create_subprocess_exec(
                sys.executable, "-c", request.code,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()
            
            output = stdout.decode()
            error = stderr.decode()
            
            if proc.returncode != 0:
                pass # Error is already captured
                
        except Exception as e:
            error = str(e)
            
    elif request.language == "javascript":
        try:
             # Run node code in a subprocess
            proc = await asyncio.create_subprocess_exec(
                "node", "-e", request.code,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()
            
            output = stdout.decode()
            error = stderr.decode()
            
            if proc.returncode != 0:
                pass # Error is already captured
        except Exception as e:
             error = str(e) + "\nMake sure Node.js is installed."
    else:
        error = f"Execution for {request.language} not supported on server yet."

    return {"output": output, "error": error}

# --- Question Bank ---
QUESTION_BANK = {
    "python": [
        {"id": "1", "title": "Reverse String", "difficulty": "easy", "category": "Strings"},
        {"id": "2", "title": "Two Sum", "difficulty": "medium", "category": "Arrays"},
    ],
    "javascript": [
        {"id": "3", "title": "Event Loop", "difficulty": "medium", "category": "Async"},
        {"id": "4", "title": "Closures", "difficulty": "easy", "category": "Functions"},
    ]
}

@fastapi_app.get("/resources/questions")
def get_questions(language: str, level: str):
    lang_lower = language.lower()
    return QUESTION_BANK.get(lang_lower, [])

# --- Socket Events ---
# Track users in rooms: room_id -> {user_id: user_data}
room_users: Dict[str, Dict[str, dict]] = {}
# Track sid to room/user for disconnect cleanup: sid -> (room_id, user_id)
sid_map: Dict[str, tuple] = {}

@sio.event
async def connect(sid, environ):
    print(f"Connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Disconnected: {sid}")
    if sid in sid_map:
        room_id, user_id = sid_map[sid]
        del sid_map[sid]
        
        if room_id in room_users and user_id in room_users[room_id]:
            # Only remove if this sid matches the user's current sid
            # This handles the case where a user refreshes (new sid joins before old sid leaves)
            if room_users[room_id][user_id].get('sid') == sid:
                del room_users[room_id][user_id]
                
                # Broadcast updated user list
                users_list = list(room_users[room_id].values())
                await sio.emit('room_users', {'users': users_list}, room=room_id)
                await sio.emit('user_left', {'userId': user_id}, room=room_id)

@sio.event
async def join_room(sid, data):
    # data = {roomId: "123", user: {...}}
    room_id = data['roomId']
    user = data['user']
    
    await sio.enter_room(sid, room_id)
    
    if room_id not in room_users:
        room_users[room_id] = {}
    
    # Add user to room tracking
    user['sid'] = sid
    room_users[room_id][user['id']] = user
    sid_map[sid] = (room_id, user['id'])
    
    # Start timer if not started
    async with SessionLocal() as db:
        result = await db.execute(select(models.Session).where(models.Session.id == room_id))
        session = result.scalars().first()
        
        if session:
            if session.start_time is None:
                session.start_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
                await db.commit()
                # Broadcast session update or just let clients fetch it?
                # Better to emit an event so clients update timer immediately
                # We need to serialize the session manually or use Pydantic
                session_dict = {
                    "id": session.id,
                    "startTime": session.start_time,
                    # Add other fields if needed by frontend
                }
                await sio.emit('session_updated', session_dict, room=room_id)
            
            await sio.emit('code_change', {'code': session.code, 'language': session.language}, room=sid)
            if session.question:
                await sio.emit('custom_question', {'question': session.question}, room=sid)
            if session.output:
                await sio.emit('execution_result', {'output': session.output}, room=sid)
            if session.whiteboard:
                 # Send full whiteboard state on join
                 # Frontend expects { changes: { added: ... } } or just the state?
                 # Frontend 'initialState' prop handles the load on mount.
                 # But if we join late, we might need an event?
                 # The 'whiteboard_update' event sends changes.
                 # If we rely on 'initialState' via API, we don't need to emit here.
                 # But let's check frontend logic.
                 # Frontend uses 'initialState' prop passed from InterviewRoom.
                 # InterviewRoom fetches session via API.
                 # So we don't strictly need to emit here if the user just loaded the page.
                 # However, if they reconnect via socket without reloading page?
                 # Let's emit it just in case, or skip it if API handles it.
                 # Existing code didn't emit whiteboard on join, it relied on 'whiteboard_update' broadcast?
                 # No, existing code didn't have persistence.
                 # Let's leave it to API for initial load.
                 pass

    # Broadcast updated user list to EVERYONE in the room
    users_list = list(room_users[room_id].values())
    await sio.emit('room_users', {'users': users_list}, room=room_id)
    
    # Also emit user_joined for toast notifications if desired
    await sio.emit('user_joined', {'user': user}, room=room_id)

@sio.event
async def leave_room(sid, data):
    room_id = data['roomId']
    user_id = data['userId']
    
    await sio.leave_room(sid, room_id)
    
    if sid in sid_map:
        del sid_map[sid]
    
    if room_id in room_users and user_id in room_users[room_id]:
        del room_users[room_id][user_id]
        
    # Broadcast updated user list
    if room_id in room_users:
        users_list = list(room_users[room_id].values())
        await sio.emit('room_users', {'users': users_list}, room=room_id)
        
    await sio.emit('user_left', {'userId': user_id}, room=room_id)

@sio.event
async def code_change(sid, data):
    # Broadcast code to everyone else in the room
    # data = {roomId: "...", code: "...", language: "..."}
    room_id = data['roomId']
    
    async with SessionLocal() as db:
        result = await db.execute(select(models.Session).where(models.Session.id == room_id))
        session = result.scalars().first()
        if session:
            session.code = data['code']
            session.language = data['language']
            await db.commit()
        
    await sio.emit('code_change', data, room=room_id, skip_sid=sid)

@sio.event
async def cursor_move(sid, data):
    await sio.emit('cursor_move', data, room=data['roomId'], skip_sid=sid)

@sio.event
async def whiteboard_update(sid, data):
    room_id = data['roomId']
    
    async with SessionLocal() as db:
        result = await db.execute(select(models.Session).where(models.Session.id == room_id))
        session = result.scalars().first()
        
        if session:
            # data['changes'] contains the tldraw updates
            # We need to merge these into the session state
            
            # Ensure whiteboard is a dict (it might be None initially)
            # Note: SQLAlchemy JSON type returns dict or list, or None.
            # We need to be careful about mutating it.
            # For JSON types, often you need to re-assign the field to trigger update if mutable tracking isn't perfect.
            current_wb = dict(session.whiteboard) if session.whiteboard else {}
            
            # Apply changes to our in-memory store
            # changes = { added: {...}, updated: {...}, removed: {...} }
            changes = data.get('changes', {})
            
            added = changes.get('added', {})
            updated = changes.get('updated', {})
            removed = changes.get('removed', {})
            
            for k, v in added.items():
                current_wb[k] = v
                
            for k, v in updated.items():
                if isinstance(v, list) and len(v) == 2:
                    current_wb[k] = v[1]
                else:
                    current_wb[k] = v
                    
            for k, v in removed.items():
                if k in current_wb:
                    del current_wb[k]
            
            session.whiteboard = current_wb
            await db.commit()
                
    await sio.emit('whiteboard_update', data, room=data['roomId'], skip_sid=sid)

@sio.event
async def custom_question(sid, data):
    # data = {roomId: "...", question: {...}}
    room_id = data['roomId']
    
    async with SessionLocal() as db:
        result = await db.execute(select(models.Session).where(models.Session.id == room_id))
        session = result.scalars().first()
        if session:
            session.question = data['question']
            await db.commit()
        
    await sio.emit('custom_question', data, room=room_id)

@sio.event
async def execution_result(sid, data):
    # data = {roomId: "...", output: "...", error: "..."}
    room_id = data['roomId']
    
    async with SessionLocal() as db:
        result = await db.execute(select(models.Session).where(models.Session.id == room_id))
        session = result.scalars().first()
        if session:
            session.output = data.get('output') or data.get('error')
            await db.commit()
        
    await sio.emit('execution_result', data, room=data['roomId'])

# Wrap FastAPI app with Socket.IO
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
