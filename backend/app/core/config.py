from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    redis_url: str
    gemini_api_key: str
    secret_key: str
    admin_secret_key: str  # Secret key for admin registration
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    upload_dir: str = "./uploads"
    tesseract_path: str = r"C:\Program Files\Tesseract-OCR"

    class Config:
        env_file = ".env"

settings = Settings()