from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Project settings
    PROJECT_NAME: str = "Collabthon API"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database settings
    DATABASE_URL: str = "mysql+pymysql://root:Rohan%401234@localhost/collabthon_db"
    
    # JWT settings
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000"
    ]
    
    # Google services settings
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_RECAPTCHA_SECRET: str = ""
    GOOGLE_ANALYTICS_ID: str = ""
    GOOGLE_MAPS_API_KEY: str = ""
    GOOGLE_TRANSLATE_API_KEY: str = ""
    
    # CORS settings
    ALLOW_ORIGIN_REGEX: str = ""
    
    # Google services settings
    GOOGLE_ANALYTICS_ID: str = ""
    GOOGLE_MAPS_API_KEY: str = ""
    GOOGLE_TRANSLATE_API_KEY: str = ""
    
    # Stripe settings
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PROFESSIONAL_PRICE_ID: str = ""
    STRIPE_ENTERPRISE_PRICE_ID: str = ""
    
    # Redis settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_URL: str = "redis://localhost:6379"
    
    # Celery settings
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    # Email settings (for notifications)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    
    # Payment gateway settings
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()