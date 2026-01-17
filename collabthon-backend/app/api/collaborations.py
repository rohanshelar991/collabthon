from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app import schemas, models
from app.database import get_db
from app.core.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=schemas.CollaborationResponse, status_code=status.HTTP_201_CREATED)
async def create_collaboration_request(
    request: schemas.CollaborationCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new collaboration request"""
    # Check if receiver exists and is active
    receiver = db.query(models.User).filter(
        models.User.id == request.receiver_id,
        models.User.is_active == True
    ).first()
    
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found or inactive"
        )
    
    # Check if project exists and belongs to current user (if provided)
    if request.project_id:
        project = db.query(models.Project).filter(
            models.Project.id == request.project_id,
            models.Project.owner_id == current_user.id
        ).first()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found or not authorized"
            )
    
    # Check if request already exists
    existing_request = db.query(models.CollaborationRequest).filter(
        models.CollaborationRequest.sender_id == current_user.id,
        models.CollaborationRequest.receiver_id == request.receiver_id,
        models.CollaborationRequest.project_id == request.project_id,
        models.CollaborationRequest.status == "pending"
    ).first()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Collaboration request already exists"
        )
    
    # Create collaboration request
    db_request = models.CollaborationRequest(
        **request.dict(),
        sender_id=current_user.id
    )
    
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    return db_request

@router.get("/sent", response_model=List[schemas.CollaborationResponse])
async def get_sent_requests(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = Query(50, le=100),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get collaboration requests sent by current user"""
    query = db.query(models.CollaborationRequest).filter(
        models.CollaborationRequest.sender_id == current_user.id
    )
    
    if status:
        query = query.filter(models.CollaborationRequest.status == status)
    
    requests = query.order_by(models.CollaborationRequest.created_at.desc()).offset(skip).limit(limit).all()
    return requests

@router.get("/received", response_model=List[schemas.CollaborationResponse])
async def get_received_requests(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = Query(50, le=100),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get collaboration requests received by current user"""
    query = db.query(models.CollaborationRequest).filter(
        models.CollaborationRequest.receiver_id == current_user.id
    )
    
    if status:
        query = query.filter(models.CollaborationRequest.status == status)
    
    requests = query.order_by(models.CollaborationRequest.created_at.desc()).offset(skip).limit(limit).all()
    return requests

@router.get("/{request_id}", response_model=schemas.CollaborationResponse)
async def get_collaboration_request(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific collaboration request"""
    request = db.query(models.CollaborationRequest).filter(
        models.CollaborationRequest.id == request_id
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaboration request not found"
        )
    
    # Check if user is sender or receiver
    if request.sender_id != current_user.id and request.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this request"
        )
    
    return request

@router.put("/{request_id}/accept", response_model=schemas.CollaborationResponse)
async def accept_collaboration_request(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept collaboration request"""
    request = db.query(models.CollaborationRequest).filter(
        models.CollaborationRequest.id == request_id,
        models.CollaborationRequest.receiver_id == current_user.id,
        models.CollaborationRequest.status == "pending"
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending collaboration request not found"
        )
    
    request.status = "accepted"
    request.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(request)
    
    return request

@router.put("/{request_id}/reject", response_model=schemas.CollaborationResponse)
async def reject_collaboration_request(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reject collaboration request"""
    request = db.query(models.CollaborationRequest).filter(
        models.CollaborationRequest.id == request_id,
        models.CollaborationRequest.receiver_id == current_user.id,
        models.CollaborationRequest.status == "pending"
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending collaboration request not found"
        )
    
    request.status = "rejected"
    request.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(request)
    
    return request

@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_collaboration_request(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel collaboration request (sender only)"""
    request = db.query(models.CollaborationRequest).filter(
        models.CollaborationRequest.id == request_id,
        models.CollaborationRequest.sender_id == current_user.id,
        models.CollaborationRequest.status == "pending"
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending collaboration request not found or not authorized"
        )
    
    db.delete(request)
    db.commit()
    return

@router.get("/stats", response_model=dict)
async def get_collaboration_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get collaboration statistics for current user"""
    sent_total = db.query(models.CollaborationRequest).filter(
        models.CollaborationRequest.sender_id == current_user.id
    ).count()
    
    received_total = db.query(models.CollaborationRequest).filter(
        models.CollaborationRequest.receiver_id == current_user.id
    ).count()
    
    pending_sent = db.query(models.CollaborationRequest).filter(
        models.CollaborationRequest.sender_id == current_user.id,
        models.CollaborationRequest.status == "pending"
    ).count()
    
    pending_received = db.query(models.CollaborationRequest).filter(
        models.CollaborationRequest.receiver_id == current_user.id,
        models.CollaborationRequest.status == "pending"
    ).count()
    
    accepted = db.query(models.CollaborationRequest).filter(
        (models.CollaborationRequest.sender_id == current_user.id) |
        (models.CollaborationRequest.receiver_id == current_user.id),
        models.CollaborationRequest.status == "accepted"
    ).count()
    
    return {
        "sent_total": sent_total,
        "received_total": received_total,
        "pending_sent": pending_sent,
        "pending_received": pending_received,
        "accepted": accepted
    }