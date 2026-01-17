from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import json
from app import schemas, models
from app.database import get_db
from app.core.security import create_access_token, create_refresh_token
from app.core.deps import get_current_user
from app.utils.google_services import google_services
from app.core.config import settings

router = APIRouter()

@router.post("/google-login")
async def google_login(request: Request, db: Session = Depends(get_db)):
    """
    Authenticate user with Google OAuth token
    """
    try:
        body = await request.json()
        google_token = body.get("token")
        
        if not google_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google token is required"
            )
        
        # Verify Google token
        user_info = google_services.verify_google_token(google_token)
        
        # Check if user exists
        user = db.query(models.User).filter(models.User.email == user_info["email"]).first()
        
        if not user:
            # Create new user
            user = models.User(
                email=user_info["email"],
                username=user_info["email"].split("@")[0],
                hashed_password="",  # No password for Google auth
                is_verified=True,
                is_google_account=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create tokens
        access_token = create_access_token(data={"sub": user.email})
        refresh_token = create_refresh_token(data={"sub": user.email})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "is_verified": user.is_verified
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )

@router.post("/verify-recaptcha")
async def verify_recaptcha_endpoint(request: Request):
    """
    Verify reCAPTCHA token
    """
    try:
        body = await request.json()
        recaptcha_token = body.get("token")
        
        if not recaptcha_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="reCAPTCHA token is required"
            )
        
        is_valid = google_services.verify_recaptcha(recaptcha_token)
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid reCAPTCHA token"
            )
        
        return {"success": True}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"reCAPTCHA verification failed: {str(e)}"
        )

# Update the main auth.py to include these endpoints