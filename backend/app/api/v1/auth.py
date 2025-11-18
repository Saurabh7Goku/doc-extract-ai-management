from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ...crud import (
    authenticate_user,
    create_user,
    get_first_job_for_email,
    get_user_by_email,
)
from ...core.security import create_access_token
from ...schemas import User, UserCreate, AdminCreate, UserBase
from ...dependencies import get_db
from ...models import UserRole
from datetime import timedelta

router = APIRouter()

@router.post("/login", response_model=dict)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    # Convert UserRole enum to string using .value
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value},  # Add .value here
        expires_delta=timedelta(minutes=30)
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role.value}

# Member registration (password set)
@router.post("/register-member", response_model=User)
def register_member(user_create: UserCreate, db: Session = Depends(get_db)):
    normalized_email = user_create.email.strip().lower()
    user_create.email = normalized_email

    existing_user = get_user_by_email(db, normalized_email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    assigned_job = get_first_job_for_email(db, normalized_email)
    if not assigned_job:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is not assigned to any job"
        )

    user_create.role = UserRole.MEMBER
    return create_user(db, user_create)

@router.post("/verify-member-email", response_model=dict)
def verify_member_email(user_base: UserBase, db: Session = Depends(get_db)):
    normalized_email = user_base.email.strip().lower()
    existing_user = get_user_by_email(db, normalized_email)
    assigned_job = get_first_job_for_email(db, normalized_email)
    if not assigned_job:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is not assigned to any job"
        )
    return {"email": normalized_email, "exists": bool(existing_user)}

# Admin registration
@router.post("/register-admin", response_model=User)
def register_admin(admin_create: AdminCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = get_user_by_email(db, admin_create.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create admin user
    from ...schemas import UserCreate
    user_create = UserCreate(
        email=admin_create.email,
        password=admin_create.password,
        role=UserRole.ADMIN
    )
    db_user = create_user(db, user_create)
    return db_user