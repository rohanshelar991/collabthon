from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime, timedelta
from app import schemas, models
from app.database import get_db
from app.core.deps import get_current_user, get_current_admin_user

router = APIRouter()

@router.get("/", response_model=schemas.PaginatedResponse)
async def get_projects(
    skip: int = 0,
    limit: int = Query(20, le=100),
    status: Optional[str] = None,
    skill: Optional[str] = None,
    min_budget: Optional[float] = None,
    max_budget: Optional[float] = None,
    remote_only: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all open projects with filtering options"""
    query = db.query(models.Project).filter(models.Project.status == "open")
    
    # Apply filters
    if status:
        query = query.filter(models.Project.status == status)
    if skill:
        query = query.filter(models.Project.required_skills.contains(json.dumps([skill])))
    if min_budget:
        query = query.filter(models.Project.budget_min >= min_budget)
    if max_budget:
        query = query.filter(models.Project.budget_max <= max_budget)
    if remote_only is not None:
        query = query.filter(models.Project.is_remote == remote_only)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    projects = query.order_by(models.Project.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "items": projects,
        "total": total,
        "page": skip // limit + 1,
        "size": limit,
        "pages": (total + limit - 1) // limit
    }

@router.post("/", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: schemas.ProjectCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new project"""
    # Set expiration date (30 days from now)
    expires_at = datetime.utcnow() + timedelta(days=30)
    
    db_project = models.Project(
        **project.dict(),
        owner_id=current_user.id,
        expires_at=expires_at
    )
    
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    return db_project

@router.get("/{project_id}", response_model=schemas.ProjectResponse)
async def get_project(
    project_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific project by ID"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project

@router.put("/{project_id}", response_model=schemas.ProjectResponse)
async def update_project(
    project_id: int,
    project_update: schemas.ProjectUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update project"""
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or not authorized"
        )
    
    # Update project fields
    update_data = project_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete project"""
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or not authorized"
        )
    
    db.delete(project)
    db.commit()
    return

@router.get("/search/{query}", response_model=List[schemas.ProjectResponse])
async def search_projects(
    query: str,
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db)
):
    """Search projects by title or description"""
    projects = db.query(models.Project).filter(
        models.Project.status == "open"
    ).filter(
        (models.Project.title.contains(query)) |
        (models.Project.description.contains(query))
    ).order_by(models.Project.created_at.desc()).limit(limit).all()
    
    return projects

@router.get("/my/projects", response_model=List[schemas.ProjectResponse])
async def get_my_projects(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's projects"""
    projects = db.query(models.Project).filter(
        models.Project.owner_id == current_user.id
    ).order_by(models.Project.created_at.desc()).all()
    
    return projects

@router.get("/stats", response_model=dict)
async def get_project_stats(db: Session = Depends(get_db)):
    """Get project statistics"""
    total_projects = db.query(models.Project).count()
    open_projects = db.query(models.Project).filter(models.Project.status == "open").count()
    in_progress_projects = db.query(models.Project).filter(models.Project.status == "in_progress").count()
    completed_projects = db.query(models.Project).filter(models.Project.status == "completed").count()
    
    # Get popular skills
    projects = db.query(models.Project).all()
    skill_count = {}
    for project in projects:
        if project.required_skills:
            skills = json.loads(project.required_skills)
            for skill in skills:
                skill_count[skill] = skill_count.get(skill, 0) + 1
    
    popular_skills = sorted(skill_count.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return {
        "total_projects": total_projects,
        "open_projects": open_projects,
        "in_progress_projects": in_progress_projects,
        "completed_projects": completed_projects,
        "popular_skills": [{"skill": skill, "count": count} for skill, count in popular_skills]
    }