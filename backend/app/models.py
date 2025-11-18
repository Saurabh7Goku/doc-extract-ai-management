from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from enum import Enum as PyEnum

Base = declarative_base()

class UserRole(PyEnum):
    ADMIN = "admin"
    MEMBER = "member"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.MEMBER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class JobStatus(PyEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    prompt = Column(Text, nullable=False)
    fields = Column(JSON, nullable=False)  # e.g., {"name": {"type": "str", "required": True}, ...}
    assigned_emails = Column(JSON, nullable=False)  # List of emails
    status = Column(Enum(JobStatus), default=JobStatus.DRAFT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class PDF(Base):
    __tablename__ = "pdfs"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="uploaded")  # uploaded, processing, completed, failed

class Result(Base):
    __tablename__ = "results"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    pdf_id = Column(Integer, ForeignKey("pdfs.id"), nullable=False)
    extracted_fields = Column(JSON, nullable=False)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())
    errors = Column(JSON, default=list)  # List of error messages

class TaskLog(Base):
    __tablename__ = "task_logs"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, nullable=False)
    status = Column(String, nullable=False)  # waiting, running, finished, failed
    log_message = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())