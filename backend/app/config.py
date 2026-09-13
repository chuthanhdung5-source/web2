from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    DATABASE_URL: str = "sqlite:///./webhocho.db"

    GCS_BUCKET_NAME: str = "webhocho-checkin-photos"
    GCS_PROJECT_ID: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    GCS_CREDENTIALS_JSON: str = ""

    FRONTEND_URL: str = "http://localhost:5173"

    # Period salary
    PERIOD_SALARY: int = 35000  # VNĐ per period

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
