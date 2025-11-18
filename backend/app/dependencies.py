from sqlalchemy.orm import Session
from .core.database import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Import auth functions to re-export them
from .auth import get_current_user_from_token, require_admin