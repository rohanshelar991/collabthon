from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from app import schemas, models
from app.database import get_db
from app.core.deps import get_current_user, get_current_admin_user

router = APIRouter()

@router.get("/", response_model=schemas.PaginatedResponse)
async def get_profiles(
    skip: int = 0,
    limit: int = Query(20, le=100),
    college: Optional[str] = None,
    major: Optional[str] = None,
    year: Optional[int] = None,
    skill: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all public profiles with filtering options"""
    query = db.query(models.Profile).filter(models.Profile.is_public == True)
    
    # Apply filters
    if college:
        query = query.filter(models.Profile.college.contains(college))
    if major:
        query = query.filter(models.Profile.major.contains(major))
    if year:
        query = query.filter(models.Profile.year == year)
    if skill:
        query = query.filter(models.Profile.skills.contains(json.dumps([skill])))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    profiles = query.offset(skip).limit(limit).all()
    
    return {
        "items": profiles,
        "total": total,
        "page": skip // limit + 1,
        "size": limit,
        "pages": (total + limit - 1) // limit
    }

@router.get("/{profile_id}", response_model=schemas.ProfileResponse)
async def get_profile(
    profile_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific profile by ID"""
    profile = db.query(models.Profile).filter(models.Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Check if profile is public or belongs to current user
    if not profile.is_public and profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to private profile"
        )
    
    return profile

@router.get("/user/{user_id}", response_model=schemas.ProfileResponse)
async def get_profile_by_user(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get profile by user ID"""
    profile = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Check if profile is public or belongs to current user
    if not profile.is_public and profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to private profile"
        )
    
    return profile

@router.get("/search/{query}", response_model=List[schemas.ProfileResponse])
async def search_profiles(
    query: str,
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db)
):
    """Search profiles by name, college, major, or skills"""
    profiles = db.query(models.Profile).filter(
        models.Profile.is_public == True
    ).filter(
        (models.Profile.first_name.contains(query)) |
        (models.Profile.last_name.contains(query)) |
        (models.Profile.college.contains(query)) |
        (models.Profile.major.contains(query)) |
        (models.Profile.bio.contains(query))
    ).limit(limit).all()
    
    return profiles

@router.get("/skills/popular", response_model=List[dict])
async def get_popular_skills(db: Session = Depends(get_db)):
    """Get popular skills across all profiles"""
    from sqlalchemy import func
    import json
    
    # This is a simplified approach - in production, you'd want to use JSON functions
    profiles = db.query(models.Profile).filter(models.Profile.is_public == True).all()
    
    skill_count = {}
    for profile in profiles:
        if profile.skills:
            skills = json.loads(profile.skills)
            for skill in skills:
                skill_count[skill] = skill_count.get(skill, 0) + 1
    
    # Sort by count and return top 20
    sorted_skills = sorted(skill_count.items(), key=lambda x: x[1], reverse=True)[:20]
    
    return [{"skill": skill, "count": count} for skill, count in sorted_skills]

@router.get("/colleges", response_model=List[str])
async def get_colleges(db: Session = Depends(get_db)):
    """Get list of all colleges"""
    colleges = db.query(models.Profile.college).filter(
        models.Profile.is_public == True
    ).distinct().order_by(models.Profile.college).all()
    
    return [college[0] for college in colleges if college[0]]

@router.get("/majors", response_model=List[str])
async def get_majors(db: Session = Depends(get_db)):
    """Get list of all majors"""
    majors = db.query(models.Profile.major).filter(
        models.Profile.is_public == True
    ).distinct().order_by(models.Profile.major).all()
    
    return [major[0] for major in majors if major[0]]