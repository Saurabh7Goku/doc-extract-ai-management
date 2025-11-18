from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...crud import get_user_by_email
from ...schemas import User
from ...dependencies import get_db, get_current_user_from_token

router = APIRouter()

@router.get("/me", response_model=User)
def read_users_me(current_user: User = Depends(get_current_user_from_token)):
    return current_user