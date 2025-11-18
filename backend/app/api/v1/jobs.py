from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List
from ...crud import (
    create_job,
    get_jobs,
    get_job,
    update_job,
    delete_job,
    delete_jobs,
    get_jobs_assigned_to_email,
)
from ...schemas import Job, JobCreate, JobUpdate, JobDeleteRequest
from ...dependencies import get_db, require_admin, get_current_user_from_token
from ...models import UserRole

router = APIRouter()

@router.post("/", response_model=Job)
def create_new_job(job: JobCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    return create_job(db, job)

@router.get("/", response_model=List[Job])
def read_jobs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin=Depends(require_admin)):
    jobs = get_jobs(db, skip=skip, limit=limit)
    return jobs

@router.get("/assigned", response_model=List[Job])
def read_assigned_jobs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_from_token),
):
    if current_user.role == UserRole.ADMIN:
        return get_jobs(db)
    return get_jobs_assigned_to_email(db, current_user.email)

@router.get("/{job_id}", response_model=Job)
def read_job(job_id: int, db: Session = Depends(get_db)):
    db_job = get_job(db, job_id=job_id)
    if db_job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return db_job

@router.put("/{job_id}", response_model=Job)
def update_existing_job(job_id: int, job_update: JobUpdate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    updated_job = update_job(db, job_id=job_id, job_update=job_update)
    if updated_job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return updated_job

@router.delete("/{job_id}", status_code=204)
def delete_job_by_id(job_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    deleted_job = delete_job(db, job_id)
    if deleted_job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return Response(status_code=204)

@router.delete("/", response_model=dict)
def delete_multiple_jobs(payload: JobDeleteRequest, db: Session = Depends(get_db), admin=Depends(require_admin)):
    if not payload.job_ids:
        raise HTTPException(status_code=400, detail="No job IDs provided")
    deleted_count = delete_jobs(db, payload.job_ids)
    return {"deleted": deleted_count}