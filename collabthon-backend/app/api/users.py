from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app import schemas, models
from app.database import get_db
from app.core.deps import get_current_user, get_current_admin_user
from app.core.config import settings

router = APIRouter()

@router.get("/", response_model=List[schemas.UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = Query(100, le=100),
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=schemas.UserResponse)
async def get_user(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific user by ID"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is trying to delete their own account or is admin
    if user.id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this user"
        )
    
    db.delete(user)
    db.commit()
    return

@router.get("/search/{query}", response_model=List[schemas.UserResponse])
async def search_users(
    query: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search users by username or email"""
    users = db.query(models.User).filter(
        (models.User.username.contains(query)) | 
        (models.User.email.contains(query))
    ).limit(20).all()
    return users

@router.post("/bulk", response_model=List[schemas.UserResponse])
async def create_multiple_users(
    users: List[schemas.UserCreate],
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create multiple users (admin only)"""
    created_users = []
    
    for user_data in users:
        # Check if user already exists
        existing_user = db.query(models.User).filter(
            (models.User.email == user_data.email) | 
            (models.User.username == user_data.username)
        ).first()
        
        if existing_user:
            continue
            
        # Create new user
        from app.core.security import get_password_hash
        hashed_password = get_password_hash(user_data.password)
        db_user = models.User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password
        )
        
        db.add(db_user)
        db.flush()  # Get the ID without committing
        created_users.append(db_user)
    
    db.commit()
    
    # Refresh to get complete objects
    for user in created_users:
        db.refresh(user)
    
    return created_users

@router.get("/me/profile", response_model=schemas.ProfileResponse)
async def get_my_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile"""
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile

@router.post("/me/profile", response_model=schemas.ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_my_profile(
    profile: schemas.ProfileCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create current user's profile"""
    # Check if profile already exists
    existing_profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists"
        )
    
    # Create profile
    db_profile = models.Profile(**profile.dict(), user_id=current_user.id)
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    
    return db_profile

@router.put("/me/profile", response_model=schemas.ProfileResponse)
async def update_my_profile(
    profile_update: schemas.ProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Update profile fields
    update_data = profile_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    db.commit()
    db.refresh(profile)
    
    return profile

@router.get("/stats", response_model=dict)
async def get_user_stats(
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get user statistics (admin only)"""
    total_users = db.query(models.User).count()
    active_users = db.query(models.User).filter(models.User.is_active == True).count()
    verified_users = db.query(models.User).filter(models.User.is_verified == True).count()
    student_users = db.query(models.User).filter(models.User.role == "student").count()
    admin_users = db.query(models.User).filter(models.User.role == "admin").count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "verified_users": verified_users,
        "student_users": student_users,
        "admin_users": admin_users
    }