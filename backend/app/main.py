from fastapi import FastAPI, WebSocket, Depends, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
from sqlalchemy.orm import Session
from celery.result import AsyncResult
from .core.database import engine, SessionLocal
from .models import Base, User, UserRole
from .api.v1 import auth, jobs, users
from .core.config import settings
from .core.websocket_manager import manager
from .tasks import process_pdf_task
from .crud import create_pdf, create_task_log
from .dependencies import get_db, get_current_user_from_token, require_admin
from .schemas import PDFUpload

# Create tables if they don't exist (only if database is available)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not connect to database: {e}")
    print("Database tables will be created when the database is available.")

app = FastAPI(title="SaaS App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only, replace with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]  # This ensures all headers are exposed to the client
)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["jobs"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])

@app.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    await manager.connect(websocket, task_id)
    try:
        while True:
            await websocket.receive_text()
    except:
        manager.disconnect(task_id)

# File upload endpoint
@app.post("/api/v1/upload-pdf/")
async def upload_pdf(
    job_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.MEMBER:
        raise HTTPException(403, "Members only")
    
    os.makedirs(settings.upload_dir, exist_ok=True)
    file_path = os.path.join(settings.upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    pdf = create_pdf(db, PDFUpload(job_id=job_id, file_path=file_path))
    
    # Start Celery task
    task = process_pdf_task.delay(file_path, job_id, settings.database_url)
    
    # Log start
    create_task_log(db, task.id, "waiting", "Task queued")
    
    return {"task_id": task.id, "pdf_id": pdf.id}

# Task status endpoint
@app.get("/api/v1/task/{task_id}")
def get_task_status(task_id: str):
    result = AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": result.status,
        "result": result.result if result.ready() else None
    }

# Test prompt endpoint for admin
@app.post("/api/v1/test-prompt/{job_id}")
async def test_prompt(
    job_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin)
):
    # Similar to upload, but for testing, run sync or async, return result immediately
    # Implementation similar to upload, but sync call to task
    file_path = ...  # Save temp
    result = process_pdf_task(file_path, job_id, settings.database_url)  # Sync call for test
    return result