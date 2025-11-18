import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, engine
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"  # In-memory for tests
engine_test = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

client = TestClient(app)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)

def test_create_user():
    user_data = {"email": "test@example.com", "password": "testpass"}
    response = client.post("/api/v1/auth/register-member", json=user_data)
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"

def test_login():
    # First create user
    client.post("/api/v1/auth/register-member", json={"email": "login@example.com", "password": "pass"})
    response = client.post("/api/v1/auth/login", data={"username": "login@example.com", "password": "pass"})
    assert response.status_code == 200
    assert "access_token" in response.json()