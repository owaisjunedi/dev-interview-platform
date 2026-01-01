from sqlalchemy import Column, String, Integer, Text, JSON
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    name = Column(String)
    role = Column(String)

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)
    candidate_name = Column(String)
    candidate_email = Column(String)
    date = Column(String)
    duration = Column(Integer, default=0)
    score = Column(Integer, nullable=True)
    status = Column(String)
    language = Column(String)
    notes = Column(Text, nullable=True)
    start_time = Column(String, nullable=True)
    code = Column(Text, nullable=True)
    output = Column(Text, nullable=True)
    question = Column(JSON, nullable=True)
    server_time = Column(String, nullable=True)
    whiteboard = Column(JSON, nullable=True)
