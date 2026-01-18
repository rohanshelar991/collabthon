from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app import schemas, models
from app.database import get_db
from app.core.deps import get_current_user
from sqlalchemy import or_, and_, func
from datetime import datetime


router = APIRouter()


@router.get("/profiles", response_model=List[schemas.ProfileResponse])
async def search_profiles(
    query: str = Query(None, title="Search query", description="Search term for profiles"),
    skills: str = Query(None, title="Skills filter", description="Comma-separated list of required skills"),
    college: str = Query(None, title="College filter", description="Filter by specific college"),
    location: str = Query(None, title="Location filter", description="Filter by location"),
    min_year: int = Query(None, title="Minimum year", description="Filter by minimum year of study"),
    max_year: int = Query(None, title="Maximum year", description="Filter by maximum year of study"),
    skip: int = Query(0, ge=0, title="Skip", description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, title="Limit", description="Maximum number of records to return"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Advanced search for profiles with multiple filters"""
    query_obj = db.query(models.Profile)
    
    # Apply search query across multiple fields
    if query:
        query_obj = query_obj.filter(
            or_(
                models.Profile.first_name.ilike(f"%{query}%"),
                models.Profile.last_name.ilike(f"%{query}%"),
                models.Profile.college.ilike(f"%{query}%"),
                models.Profile.major.ilike(f"%{query}%"),
                models.Profile.bio.ilike(f"%{query}%")
            )
        )
    
    # Apply skills filter
    if skills:
        skill_list = [skill.strip() for skill in skills.split(",")]
        for skill in skill_list:
            query_obj = query_obj.filter(
                func.JSON_CONTAINS(models.Profile.skills, f'"{skill}"')
            )
    
    # Apply college filter
    if college:
        query_obj = query_obj.filter(
            models.Profile.college.ilike(f"%{college}%")
        )
    
    # Apply location filter (for now, assuming location is part of college or bio)
    if location:
        query_obj = query_obj.filter(
            or_(
                models.Profile.college.ilike(f"%{location}%"),
                models.Profile.bio.ilike(f"%{location}%")
            )
        )
    
    # Apply year filters
    if min_year:
        query_obj = query_obj.filter(models.Profile.year >= min_year)
    if max_year:
        query_obj = query_obj.filter(models.Profile.year <= max_year)
    
    # Only show public profiles
    query_obj = query_obj.filter(models.Profile.is_public == True)
    
    profiles = query_obj.offset(skip).limit(limit).all()
    return profiles


@router.get("/projects", response_model=List[schemas.ProjectResponse])
async def search_projects(
    query: str = Query(None, title="Search query", description="Search term for projects"),
    required_skills: str = Query(None, title="Required skills", description="Comma-separated list of required skills"),
    budget_min: float = Query(None, title="Minimum budget", description="Filter by minimum budget"),
    budget_max: float = Query(None, title="Maximum budget", description="Filter by maximum budget"),
    status: str = Query(None, title="Project status", description="Filter by project status"),
    is_remote: bool = Query(None, title="Remote projects", description="Filter by remote work availability"),
    skip: int = Query(0, ge=0, title="Skip", description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, title="Limit", description="Maximum number of records to return"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Advanced search for projects with multiple filters"""
    query_obj = db.query(models.Project)
    
    # Apply search query across multiple fields
    if query:
        query_obj = query_obj.filter(
            or_(
                models.Project.title.ilike(f"%{query}%"),
                models.Project.description.ilike(f"%{query}%")
            )
        )
    
    # Apply required skills filter
    if required_skills:
        skill_list = [skill.strip() for skill in required_skills.split(",")]
        for skill in skill_list:
            query_obj = query_obj.filter(
                func.JSON_CONTAINS(models.Project.required_skills, f'"{skill}"')
            )
    
    # Apply budget filters
    if budget_min:
        query_obj = query_obj.filter(models.Project.budget_min >= budget_min)
    if budget_max:
        query_obj = query_obj.filter(models.Project.budget_max <= budget_max)
    
    # Apply status filter
    if status:
        query_obj = query_obj.filter(models.Project.status == status.upper())
    
    # Apply remote filter
    if is_remote is not None:
        query_obj = query_obj.filter(models.Project.is_remote == is_remote)
    
    projects = query_obj.offset(skip).limit(limit).all()
    return projects


@router.get("/global", response_model=dict)
async def global_search(
    query: str = Query(..., title="Search query", description="Global search term"),
    profile_skip: int = Query(0, ge=0, title="Profile skip", description="Number of profile records to skip"),
    profile_limit: int = Query(10, ge=1, le=50, title="Profile limit", description="Maximum number of profile records to return"),
    project_skip: int = Query(0, ge=0, title="Project skip", description="Number of project records to skip"),
    project_limit: int = Query(10, ge=1, le=50, title="Project limit", description="Maximum number of project records to return"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Global search across profiles and projects"""
    # Search profiles
    profiles_query = db.query(models.Profile).filter(
        or_(
            models.Profile.first_name.ilike(f"%{query}%"),
            models.Profile.last_name.ilike(f"%{query}%"),
            models.Profile.college.ilike(f"%{query}%"),
            models.Profile.major.ilike(f"%{query}%"),
            models.Profile.bio.ilike(f"%{query}%")
        )
    ).filter(models.Profile.is_public == True).offset(profile_skip).limit(profile_limit)
    
    profiles = profiles_query.all()
    
    # Search projects
    projects_query = db.query(models.Project).filter(
        or_(
            models.Project.title.ilike(f"%{query}%"),
            models.Project.description.ilike(f"%{query}%")
        )
    ).offset(project_skip).limit(project_limit)
    
    projects = projects_query.all()
    
    return {
        "profiles": [schemas.ProfileResponse.from_orm(p) for p in profiles],
        "projects": [schemas.ProjectResponse.from_orm(p) for p in projects],
        "profile_count": len(profiles),
        "project_count": len(projects)
    }


@router.get("/autocomplete", response_model=List[str])
async def search_autocomplete(
    query: str = Query(..., min_length=2, title="Search query", description="Search term for autocomplete"),
    entity_type: str = Query("all", enum=["profiles", "projects", "all"], title="Entity type", description="Type of entity to search for"),
    limit: int = Query(10, ge=1, le=20, title="Limit", description="Maximum number of suggestions to return"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get autocomplete suggestions for search"""
    suggestions = set()  # Use set to avoid duplicates
    
    if entity_type in ["profiles", "all"]:
        # Get profile-related suggestions
        profile_results = db.query(
            models.Profile.first_name.label('name'),
            models.Profile.college,
            models.Profile.major
        ).filter(
            or_(
                models.Profile.first_name.ilike(f"%{query}%"),
                models.Profile.last_name.ilike(f"%{query}%"),
                models.Profile.college.ilike(f"%{query}%"),
                models.Profile.major.ilike(f"%{query}%")
            )
        ).filter(models.Profile.is_public == True).limit(limit).all()
        
        for result in profile_results:
            if result.name and query.lower() in result.name.lower():
                suggestions.add(result.name)
            if result.college and query.lower() in result.college.lower():
                suggestions.add(result.college)
            if result.major and query.lower() in result.major.lower():
                suggestions.add(result.major)
    
    if entity_type in ["projects", "all"]:
        # Get project-related suggestions
        project_results = db.query(
            models.Project.title.label('title'),
            models.Project.description
        ).filter(
            or_(
                models.Project.title.ilike(f"%{query}%"),
                models.Project.description.ilike(f"%{query}%")
            )
        ).limit(limit).all()
        
        for result in project_results:
            if result.title and query.lower() in result.title.lower():
                suggestions.add(result.title)
            if result.description and query.lower() in result.description[:100].lower():  # Check first 100 chars
                # Extract likely keywords from description
                desc_words = result.description[:100].lower().split()
                for word in desc_words:
                    if query.lower() in word and len(word) > 2:
                        suggestions.add(word.title())
    
    return list(suggestions)[:limit]