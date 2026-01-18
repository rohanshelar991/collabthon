from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import schemas, models
from app.database import get_db
from app.core.deps import get_current_user
from datetime import datetime


router = APIRouter()


@router.get("/", response_model=List[schemas.NotificationResponse])
async def get_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's notifications"""
    query = db.query(models.Notification).filter(
        models.Notification.recipient_id == current_user.id
    ).order_by(models.Notification.created_at.desc())
    
    if unread_only:
        query = query.filter(models.Notification.is_read == False)
    
    notifications = query.offset(skip).limit(limit).all()
    return notifications


@router.get("/{notification_id}", response_model=schemas.NotificationResponse)
async def get_notification(
    notification_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific notification"""
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.recipient_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return notification


@router.put("/{notification_id}/mark-read")
async def mark_notification_read(
    notification_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark notification as read"""
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.recipient_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    db.refresh(notification)
    
    return {"success": True}


@router.put("/mark-all-read")
async def mark_all_notifications_read(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    db.query(models.Notification).filter(
        models.Notification.recipient_id == current_user.id,
        models.Notification.is_read == False
    ).update({
        models.Notification.is_read: True,
        models.Notification.read_at: datetime.utcnow()
    })
    
    db.commit()
    
    return {"success": True}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete notification"""
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.recipient_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_active = False  # Soft delete
    db.commit()
    
    return {"success": True}


@router.delete("/clear-all")
async def clear_all_notifications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear all notifications"""
    db.query(models.Notification).filter(
        models.Notification.recipient_id == current_user.id
    ).update({
        models.Notification.is_active: False
    })
    
    db.commit()
    
    return {"success": True}


@router.get("/unread-count")
async def get_unread_count(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    count = db.query(models.Notification).filter(
        models.Notification.recipient_id == current_user.id,
        models.Notification.is_read == False,
        models.Notification.is_active == True
    ).count()
    
    return {"unread_count": count}