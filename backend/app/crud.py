from sqlalchemy.orm import Session
from typing import Optional, List, Set
from .models import User, Job, PDF, Result, TaskLog
from .schemas import UserCreate, JobCreate, JobUpdate, ResultCreate, PDFUpload
from .core.security import get_password_hash, verify_password


def _normalize_email(email: str) -> Optional[str]:
    if not isinstance(email, str):
        return None
    normalized = email.strip().lower()
    return normalized or None


def _normalize_email_list(emails: Optional[List[str]]) -> List[str]:
    if not emails:
        return []
    seen: Set[str] = set()
    normalized_list: List[str] = []
    for email in emails:
        normalized = _normalize_email(email)
        if normalized and normalized not in seen:
            normalized_list.append(normalized)
            seen.add(normalized)
    return normalized_list


def _job_has_email(job: Job, email: str) -> bool:
    normalized = _normalize_email(email)
    if not normalized:
        return False
    return normalized in _normalize_email_list(job.assigned_emails or [])

def create_user(db: Session, user: UserCreate) -> User:
    hashed_password = get_password_hash(user.password)
    normalized_email = _normalize_email(user.email)
    if not normalized_email:
        raise ValueError("Invalid email address")
    db_user = User(email=normalized_email, hashed_password=hashed_password, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    normalized_email = _normalize_email(email)
    if not normalized_email:
        return None
    return db.query(User).filter(User.email == normalized_email).first()

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def create_job(db: Session, job: JobCreate, user_id: int = None) -> Job:
    # Assuming admin check elsewhere
    job_data = job.dict()
    job_data["assigned_emails"] = _normalize_email_list(job_data.get("assigned_emails"))
    db_job = Job(**job_data)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

def get_jobs(db: Session, skip: int = 0, limit: int = 100) -> List[Job]:
    return db.query(Job).offset(skip).limit(limit).all()

def get_job(db: Session, job_id: int) -> Optional[Job]:
    return db.query(Job).filter(Job.id == job_id).first()

def update_job(db: Session, job_id: int, job_update: JobUpdate) -> Optional[Job]:
    db_job = get_job(db, job_id)
    if db_job:
        update_data = job_update.dict(exclude_unset=True)
        if "assigned_emails" in update_data:
            update_data["assigned_emails"] = _normalize_email_list(update_data["assigned_emails"])
        for field, value in update_data.items():
            setattr(db_job, field, value)
        db.commit()
        db.refresh(db_job)
    return db_job

def delete_job(db: Session, job_id: int) -> Optional[Job]:
    db_job = get_job(db, job_id)
    if db_job:
        db.delete(db_job)
        db.commit()
    return db_job

def delete_jobs(db: Session, job_ids: List[int]) -> int:
    deleted = db.query(Job).filter(Job.id.in_(job_ids)).delete(synchronize_session=False)
    db.commit()
    return deleted


def get_jobs_assigned_to_email(db: Session, email: str) -> List[Job]:
    normalized = _normalize_email(email)
    if not normalized:
        return []
    jobs = db.query(Job).filter(Job.assigned_emails.isnot(None)).all()
    return [job for job in jobs if _job_has_email(job, normalized)]


def get_first_job_for_email(db: Session, email: str) -> Optional[Job]:
    jobs = get_jobs_assigned_to_email(db, email)
    return jobs[0] if jobs else None

def create_pdf(db: Session, pdf: PDFUpload) -> PDF:
    db_pdf = PDF(**pdf.dict())
    db.add(db_pdf)
    db.commit()
    db.refresh(db_pdf)
    return db_pdf

def create_result(db: Session, result: ResultCreate) -> Result:
    db_result = Result(**result.dict())
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

def create_task_log(db: Session, task_id: str, status: str, message: Optional[str] = None):
    db_log = TaskLog(task_id=task_id, status=status, log_message=message)
    db.add(db_log)
    db.commit()