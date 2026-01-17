from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import schemas, models
from app.database import get_db
from app.core.deps import get_current_admin_user
from app.core.config import settings

router = APIRouter()

@router.get("/stats", response_model=schemas.AdminStats)
async def get_admin_stats(
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get platform statistics"""
    total_users = db.query(models.User).count()
    active_users = db.query(models.User).filter(models.User.is_active == True).count()
    total_projects = db.query(models.Project).count()
    active_projects = db.query(models.Project).filter(models.Project.status == "open").count()
    total_collaborations = db.query(models.CollaborationRequest).count()
    pending_collaborations = db.query(models.CollaborationRequest).filter(
        models.CollaborationRequest.status == "pending"
    ).count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_projects": total_projects,
        "active_projects": active_projects,
        "total_collaborations": total_collaborations,
        "pending_collaborations": pending_collaborations
    }

@router.get("/users", response_model=List[schemas.UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Toggle user active status"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    
    return {"success": True, "user": {"id": user.id, "is_active": user.is_active}}

@router.put("/users/{user_id}/toggle-verified")
async def toggle_user_verified(
    user_id: int,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Toggle user verified status"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_verified = not user.is_verified
    db.commit()
    db.refresh(user)
    
    return {"success": True, "user": {"id": user.id, "is_verified": user.is_verified}}

@router.get("/projects", response_model=List[schemas.ProjectResponse])
async def get_all_projects(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all projects (admin only)"""
    query = db.query(models.Project)
    
    if status_filter:
        query = query.filter(models.Project.status == status_filter)
    
    projects = query.offset(skip).limit(limit).all()
    return projects

@router.put("/projects/{project_id}/update-status")
async def update_project_status(
    project_id: int,
    status_update: schemas.ProjectStatusUpdate,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update project status"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.status = status_update.status
    db.commit()
    db.refresh(project)
    
    return {"success": True, "project": {"id": project.id, "status": project.status}}

@router.get("/collaborations", response_model=List[schemas.CollaborationResponse])
async def get_all_collaborations(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all collaboration requests (admin only)"""
    query = db.query(models.CollaborationRequest)
    
    if status_filter:
        query = query.filter(models.CollaborationRequest.status == status_filter)
    
    collaborations = query.offset(skip).limit(limit).all()
    return collaborations

@router.delete("/collaborations/{collaboration_id}")
async def delete_collaboration(
    collaboration_id: int,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a collaboration request"""
    collaboration = db.query(models.CollaborationRequest).filter(
        models.CollaborationRequest.id == collaboration_id
    ).first()
    
    if not collaboration:
        raise HTTPException(status_code=404, detail="Collaboration request not found")
    
    db.delete(collaboration)
    db.commit()
    
    return {"success": True}

# Include admin router in main app