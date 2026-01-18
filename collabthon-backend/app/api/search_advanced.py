from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app import schemas, models
from app.database import get_db
from app.core.deps import get_current_user
from app.models.analytics import UserActivity, LocationTracking
from sqlalchemy import func, or_, and_
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/search/projects", response_model=schemas.PaginatedResponse)
async def search_projects(
    q: Optional[str] = None,
    skills: Optional[str] = None,
    min_budget: Optional[float] = None,
    max_budget: Optional[float] = None,
    location: Optional[str] = None,
    is_remote: Optional[bool] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    page: int = 1,
    size: int = 10,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Advanced search for projects with multiple filters
    """
    query = db.query(models.Project).join(models.User).filter(models.Project.status == "open")
    
    # Apply search term filter
    if q:
        query = query.filter(
            or_(
                models.Project.title.ilike(f"%{q}%"),
                models.Project.description.ilike(f"%{q}%"),
                models.User.username.ilike(f"%{q}%")
            )
        )
    
    # Apply skills filter
    if skills:
        skill_list = skills.split(",")
        for skill in skill_list:
            query = query.filter(models.Project.required_skills.contains(skill.strip()))
    
    # Apply budget filters
    if min_budget is not None:
        query = query.filter(models.Project.budget_min >= min_budget)
    if max_budget is not None:
        query = query.filter(models.Project.budget_max <= max_budget)
    
    # Apply location filter
    if location:
        # This would require location data in the project or user model
        # For now, we'll track this as a user activity
        pass
    
    # Apply remote filter
    if is_remote is not None:
        query = query.filter(models.Project.is_remote == is_remote)
    
    # Apply status filter
    if status:
        query = query.filter(models.Project.status == status)
    
    # Apply sorting
    if sort_by == "created_at":
        if sort_order == "asc":
            query = query.order_by(models.Project.created_at.asc())
        else:
            query = query.order_by(models.Project.created_at.desc())
    elif sort_by == "budget":
        if sort_order == "asc":
            query = query.order_by(models.Project.budget_min.asc())
        else:
            query = query.order_by(models.Project.budget_min.desc())
    
    # Calculate pagination
    total = query.count()
    offset = (page - 1) * size
    projects = query.offset(offset).limit(size).all()
    
    return {
        "items": projects,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size
    }


@router.get("/search/profiles", response_model=schemas.PaginatedResponse)
async def search_profiles(
    q: Optional[str] = None,
    skills: Optional[str] = None,
    college: Optional[str] = None,
    major: Optional[str] = None,
    year: Optional[int] = None,
    location: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    page: int = 1,
    size: int = 10,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Advanced search for profiles with multiple filters
    """
    query = db.query(models.Profile).join(models.User).filter(models.Profile.is_public == True)
    
    # Apply search term filter
    if q:
        query = query.filter(
            or_(
                models.Profile.first_name.ilike(f"%{q}%"),
                models.Profile.last_name.ilike(f"%{q}%"),
                models.Profile.college.ilike(f"%{q}%"),
                models.Profile.major.ilike(f"%{q}%"),
                models.User.username.ilike(f"%{q}%")
            )
        )
    
    # Apply skills filter
    if skills:
        skill_list = skills.split(",")
        for skill in skill_list:
            query = query.filter(models.Profile.skills.contains(skill.strip()))
    
    # Apply college filter
    if college:
        query = query.filter(models.Profile.college.ilike(f"%{college}%"))
    
    # Apply major filter
    if major:
        query = query.filter(models.Profile.major.ilike(f"%{major}%"))
    
    # Apply year filter
    if year:
        query = query.filter(models.Profile.year == year)
    
    # Apply location filter (would need location data in profile)
    if location:
        # Track this search activity
        activity = UserActivity(
            user_id=current_user.id,
            activity_type="search",
            page_url="/search/profiles",
            metadata={
                "search_term": q,
                "location": location,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        db.add(activity)
        db.commit()
    
    # Apply sorting
    if sort_by == "created_at":
        if sort_order == "asc":
            query = query.order_by(models.Profile.created_at.asc())
        else:
            query = query.order_by(models.Profile.created_at.desc())
    elif sort_by == "name":
        if sort_order == "asc":
            query = query.order_by(models.Profile.first_name.asc())
        else:
            query = query.order_by(models.Profile.first_name.desc())
    
    # Calculate pagination
    total = query.count()
    offset = (page - 1) * size
    profiles = query.offset(offset).limit(size).all()
    
    return {
        "items": profiles,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size
    }


@router.get("/trending-skills")
async def get_trending_skills(
    days: int = 30,
    limit: int = 10,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get trending skills based on recent project postings
    """
    # Calculate the date threshold
    threshold_date = datetime.utcnow() - timedelta(days=days)
    
    # Query projects posted within the date range
    recent_projects = db.query(models.Project).filter(
        models.Project.created_at >= threshold_date
    ).all()
    
    # Count skill occurrences
    skill_counts = {}
    for project in recent_projects:
        if project.required_skills:
            # Assuming required_skills is stored as JSON string
            import json
            try:
                skills = json.loads(project.required_skills) if isinstance(project.required_skills, str) else project.required_skills
                for skill in skills:
                    skill_counts[skill] = skill_counts.get(skill, 0) + 1
            except:
                # If parsing fails, try treating it as a simple string
                if isinstance(project.required_skills, str):
                    skill_counts[project.required_skills] = skill_counts.get(project.required_skills, 0) + 1
    
    # Sort by count and return top skills
    sorted_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
    
    return [{"skill": skill, "count": count} for skill, count in sorted_skills]


@router.get("/recommendations/projects")
async def get_project_recommendations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized project recommendations based on user profile
    """
    # Get user profile
    user_profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    # Parse user skills
    user_skills = []
    if user_profile.skills:
        import json
        try:
            user_skills = json.loads(user_profile.skills) if isinstance(user_profile.skills, str) else user_profile.skills
        except:
            if isinstance(user_profile.skills, str):
                user_skills = [user_profile.skills]
    
    # Find projects that match user skills
    matching_projects = []
    
    if user_skills:
        # Look for projects that require at least one of the user's skills
        for skill in user_skills:
            projects = db.query(models.Project).filter(
                models.Project.status == "open",
                models.Project.required_skills.contains(skill)
            ).limit(5).all()
            matching_projects.extend(projects)
    
    # If no skill matches, get recent projects
    if not matching_projects:
        matching_projects = db.query(models.Project).filter(
            models.Project.status == "open"
        ).order_by(models.Project.created_at.desc()).limit(10).all()
    
    # Remove duplicates while preserving order
    seen_ids = set()
    unique_projects = []
    for project in matching_projects:
        if project.id not in seen_ids:
            unique_projects.append(project)
            seen_ids.add(project.id)
    
    return unique_projects[:10]  # Return top 10 recommendations


@router.get("/recommendations/profiles")
async def get_profile_recommendations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized profile recommendations based on user's projects
    """
    # Get user's projects
    user_projects = db.query(models.Project).filter(models.Project.owner_id == current_user.id).all()
    
    required_skills = set()
    for project in user_projects:
        if project.required_skills:
            import json
            try:
                skills = json.loads(project.required_skills) if isinstance(project.required_skills, str) else project.required_skills
                required_skills.update(skills)
            except:
                if isinstance(project.required_skills, str):
                    required_skills.add(project.required_skills)
    
    # Find profiles that have matching skills
    matching_profiles = []
    
    if required_skills:
        for skill in required_skills:
            profiles = db.query(models.Profile).join(models.User).filter(
                models.Profile.is_public == True,
                models.Profile.skills.contains(skill)
            ).limit(3).all()
            matching_profiles.extend(profiles)
    
    # If no skill matches, get recently active profiles
    if not matching_profiles:
        matching_profiles = db.query(models.Profile).join(models.User).filter(
            models.Profile.is_public == True
        ).order_by(models.Profile.updated_at.desc()).limit(10).all()
    
    # Remove duplicates while preserving order
    seen_ids = set()
    unique_profiles = []
    for profile in matching_profiles:
        if profile.id not in seen_ids:
            unique_profiles.append(profile)
            seen_ids.add(profile.id)
    
    return unique_profiles[:10]  # Return top 10 recommendations