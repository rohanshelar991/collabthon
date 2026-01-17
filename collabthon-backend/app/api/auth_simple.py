from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app import schemas, models
from app.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, verify_token
from app.core.deps import get_current_user
from app.api.auth.google import router as google_router
from app.core.config import settings

print("=== AUTH MODULE LOADING ===")

router = APIRouter()
print("Router created:", router)

@router.get("/test")
async def test_route():
    return {"message": "Auth router working!"}

print("=== AUTH MODULE LOADED SUCCESSFULLY ===")