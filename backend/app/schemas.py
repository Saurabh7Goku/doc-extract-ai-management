from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any, Optional
from datetime import datetime
from .models import UserRole, JobStatus

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.MEMBER

class AdminCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

class JobBase(BaseModel):
    title: str
    description: Optional[str]
    prompt: str
    fields: Dict[str, Dict[str, Any]]
    assigned_emails: List[str]

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    prompt: Optional[str]
    fields: Optional[Dict[str, Dict[str, Any]]]
    assigned_emails: Optional[List[str]]
    status: Optional[JobStatus]

class JobDeleteRequest(BaseModel):
    job_ids: List[int]

class Job(JobBase):
    id: int
    status: JobStatus
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class PDFUpload(BaseModel):
    job_id: int
    file_path: str  # Will be set by backend

class ResultBase(BaseModel):
    job_id: int
    pdf_id: int
    extracted_fields: Dict[str, Any]
    errors: List[str] = []

class ResultCreate(ResultBase):
    pass

class Result(ResultBase):
    id: int
    processed_at: datetime

    class Config:
        from_attributes = True

class TaskStatus(BaseModel):
    task_id: str
    status: str
    message: Optional[str]