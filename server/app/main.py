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

class Session(BaseModel):
    id: str
    candidateName: str
    candidateEmail: str
    date: str
    duration: int
    score: Optional[int] = None
    status: str
    language: str

class ExecuteRequest(BaseModel):
    code: str
    language: str

class ExecuteResponse(BaseModel):
    output: str
    error: Optional[str] = None

# --- Mock Database ---
users_db: Dict[str, dict] = {}  # email -> user_dict
sessions_db: Dict[str, Session] = {}

# --- Socket.IO Setup ---
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
sio_app = socketio.ASGIApp(sio)

app = FastAPI()

# Mount Socket.IO at /ws
app.mount("/ws", sio_app)

app.add_middleware(
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
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Routes ---

@app.post("/auth/signup", response_model=Dict)
def signup(user_data: UserSignup):
    if user_data.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    new_user = {
        "id": user_id,
        "email": user_data.email,
        "password": user_data.password, # In production, hash this!
        "name": user_data.name,
        "role": "interviewer"
    }
    users_db[user_data.email] = new_user
    
    token = create_access_token({"sub": user_data.email})
    return {
        "user": {k: v for k, v in new_user.items() if k != "password"},
        "token": token
    }

@app.post("/auth/login", response_model=Dict)
def login(user_data: UserLogin):
    user = users_db.get(user_data.email)
    if not user or user["password"] != user_data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user_data.email})
    return {
        "user": {k: v for k, v in user.items() if k != "password"},
        "token": token
    }

@app.get("/sessions", response_model=List[Session])
def get_sessions():
    return list(sessions_db.values())

@app.post("/sessions", response_model=Session, status_code=201)
def create_session(session_data: SessionCreate):
    session_id = str(uuid.uuid4())[:8] # Short ID for easier sharing
    new_session = Session(
        id=session_id,
        candidateName=session_data.candidateName,
        candidateEmail=session_data.candidateEmail,
        date=datetime.datetime.now().isoformat(),
        duration=0,
        status="scheduled",
        language=session_data.language
    )
    sessions_db[session_id] = new_session
    return new_session

@app.get("/sessions/{session_id}", response_model=Session)
def get_session(session_id: str):
    session = sessions_db.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.post("/sessions/{session_id}/terminate")
async def terminate_session(session_id: str):
    session = sessions_db.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.status = "completed"
    await sio.emit('session_ended', {}, room=session_id)
    return {"message": "Session terminated"}

@app.put("/sessions/{session_id}")
async def update_session(session_id: str, data: dict):
    session = sessions_db.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if "score" in data:
        session.score = data["score"]
    if "notes" in data:
        # In a real DB we would save notes, here we just acknowledge
        pass
        
    return session

@app.post("/execute", response_model=ExecuteResponse)
@app.post("/execute", response_model=ExecuteResponse)
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

    # Broadcast result to room if session_id is provided (we might need to update ExecuteRequest to include it)
    # But ExecuteRequest currently only has code and language.
    # Ideally, we should pass session_id. For now, let's assume the client will emit the result manually 
    # OR we update the API to accept session_id.
    # Let's update ExecuteRequest model first.
    
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

@app.get("/resources/questions")
def get_questions(language: str, level: str):
    lang_lower = language.lower()
    return QUESTION_BANK.get(lang_lower, [])

# --- Socket Events ---
# Track users in rooms: room_id -> {user_id: user_data}
room_users: Dict[str, Dict[str, dict]] = {}

@sio.event
async def connect(sid, environ):
    print(f"Connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Disconnected: {sid}")
    # Find which room this sid belongs to and remove
    # This is a bit inefficient without a reverse lookup, but fine for now
    for room_id, users in room_users.items():
        # We need to map sid to user_id or store sid in user data
        # Let's assume we can't easily know which user_id corresponds to this sid 
        # unless we stored it.
        # Let's iterate and find the user who might have this sid? 
        # Actually, join_room data has user info.
        # Better approach: store sid -> (room_id, user_id)
        pass
    
    # For now, we rely on explicit leave_room or handle cleanup if we track sids.
    # Since we don't track sids in a global map yet, let's just print.
    # Real implementation should track sid -> user mapping to handle unexpected disconnects.

@sio.event
async def join_room(sid, data):
    # data = {roomId: "123", user: {...}}
    room_id = data['roomId']
    user = data['user']
    
    await sio.enter_room(sid, room_id)
    
    if room_id not in room_users:
        room_users[room_id] = {}
    
    # Add user to room tracking
    # We add a 'sid' field to help with cleanup if needed later
    user['sid'] = sid
    room_users[room_id][user['id']] = user
    
    # Broadcast updated user list to EVERYONE in the room
    # Convert dict values to list
    users_list = list(room_users[room_id].values())
    await sio.emit('room_users', {'users': users_list}, room=room_id)
    
    # Also emit user_joined for toast notifications if desired
    await sio.emit('user_joined', {'user': user}, room=room_id)

@sio.event
async def leave_room(sid, data):
    room_id = data['roomId']
    user_id = data['userId']
    
    await sio.leave_room(sid, room_id)
    
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
    await sio.emit('code_change', data, room=data['roomId'], skip_sid=sid)

@sio.event
async def cursor_move(sid, data):
    await sio.emit('cursor_move', data, room=data['roomId'], skip_sid=sid)

@sio.event
async def whiteboard_update(sid, data):
    await sio.emit('whiteboard_update', data, room=data['roomId'], skip_sid=sid)

@sio.event
async def custom_question(sid, data):
    # data = {roomId: "...", question: {...}}
    await sio.emit('custom_question', data, room=data['roomId'])

@sio.event
async def execution_result(sid, data):
    # data = {roomId: "...", output: "...", error: "..."}
    await sio.emit('execution_result', data, room=data['roomId'])
