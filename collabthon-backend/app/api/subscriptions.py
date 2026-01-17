from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app import schemas, models
from app.database import get_db
from app.core.deps import get_current_user, get_current_admin_user

router = APIRouter()

# Plan configurations
PLAN_CONFIGS = {
    "free": {
        "name": "Free",
        "price": 0,
        "features": ["Basic profile", "5 project listings", "Limited search"],
        "project_limit": 5,
        "duration_days": 30
    },
    "professional": {
        "name": "Professional",
        "price": 2999,  # ₹2999 per month
        "features": ["Enhanced profile", "Unlimited projects", "Advanced search", "Priority support"],
        "project_limit": None,  # Unlimited
        "duration_days": 30
    },
    "enterprise": {
        "name": "Enterprise",
        "price": 7999,  # ₹7999 per month
        "features": ["All Professional features", "Team collaboration", "Custom integrations", "24/7 support"],
        "project_limit": None,  # Unlimited
        "duration_days": 30
    }
}

@router.get("/plans", response_model=List[dict])
async def get_subscription_plans():
    """Get all available subscription plans"""
    plans = []
    for plan_key, config in PLAN_CONFIGS.items():
        plans.append({
            "plan": plan_key,
            "name": config["name"],
            "price": config["price"],
            "features": config["features"],
            "project_limit": config["project_limit"]
        })
    return plans

@router.get("/my", response_model=schemas.SubscriptionResponse)
async def get_my_subscription(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's subscription"""
    subscription = db.query(models.Subscription).filter(
        models.Subscription.user_id == current_user.id
    ).first()
    
    if not subscription:
        # Create free subscription if none exists
        subscription = models.Subscription(
            user_id=current_user.id,
            plan="free",
            is_active=True,
            started_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=30)
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
    
    return subscription

@router.post("/subscribe/{plan}", response_model=schemas.SubscriptionResponse)
async def subscribe_to_plan(
    plan: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Subscribe to a plan"""
    if plan not in PLAN_CONFIGS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan"
        )
    
    # Check if user already has an active subscription
    existing_subscription = db.query(models.Subscription).filter(
        models.Subscription.user_id == current_user.id,
        models.Subscription.is_active == True
    ).first()
    
    if existing_subscription and existing_subscription.plan == plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already subscribed to this plan"
        )
    
    # Calculate expiration date
    duration_days = PLAN_CONFIGS[plan]["duration_days"]
    expires_at = datetime.utcnow() + timedelta(days=duration_days)
    
    if existing_subscription:
        # Update existing subscription
        existing_subscription.plan = plan
        existing_subscription.is_active = True
        existing_subscription.started_at = datetime.utcnow()
        existing_subscription.expires_at = expires_at
        existing_subscription.updated_at = datetime.utcnow()
        subscription = existing_subscription
    else:
        # Create new subscription
        subscription = models.Subscription(
            user_id=current_user.id,
            plan=plan,
            is_active=True,
            started_at=datetime.utcnow(),
            expires_at=expires_at
        )
        db.add(subscription)
    
    db.commit()
    db.refresh(subscription)
    
    return subscription

@router.post("/cancel", response_model=schemas.SubscriptionResponse)
async def cancel_subscription(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel current subscription (downgrade to free)"""
    subscription = db.query(models.Subscription).filter(
        models.Subscription.user_id == current_user.id,
        models.Subscription.is_active == True
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    if subscription.plan == "free":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already on free plan"
        )
    
    # Downgrade to free plan
    subscription.plan = "free"
    subscription.is_active = True
    subscription.started_at = datetime.utcnow()
    subscription.expires_at = datetime.utcnow() + timedelta(days=30)
    subscription.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(subscription)
    
    return subscription

@router.get("/check/{user_id}/{feature}", response_model=dict)
async def check_feature_access(
    user_id: int,
    feature: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if user has access to a specific feature"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    subscription = db.query(models.Subscription).filter(
        models.Subscription.user_id == user_id,
        models.Subscription.is_active == True
    ).first()
    
    if not subscription:
        subscription = models.Subscription(
            user_id=user_id,
            plan="free",
            is_active=True
        )
    
    # Check feature access based on plan
    has_access = False
    if feature == "unlimited_projects":
        has_access = subscription.plan in ["professional", "enterprise"]
    elif feature == "advanced_search":
        has_access = subscription.plan in ["professional", "enterprise"]
    elif feature == "priority_support":
        has_access = subscription.plan in ["professional", "enterprise"]
    elif feature == "team_collaboration":
        has_access = subscription.plan == "enterprise"
    
    return {
        "user_id": user_id,
        "plan": subscription.plan,
        "feature": feature,
        "has_access": has_access
    }

@router.get("/admin/stats", response_model=dict)
async def get_subscription_stats(
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get subscription statistics (admin only)"""
    total_subscriptions = db.query(models.Subscription).count()
    active_subscriptions = db.query(models.Subscription).filter(
        models.Subscription.is_active == True
    ).count()
    
    free_count = db.query(models.Subscription).filter(
        models.Subscription.plan == "free",
        models.Subscription.is_active == True
    ).count()
    
    professional_count = db.query(models.Subscription).filter(
        models.Subscription.plan == "professional",
        models.Subscription.is_active == True
    ).count()
    
    enterprise_count = db.query(models.Subscription).filter(
        models.Subscription.plan == "enterprise",
        models.Subscription.is_active == True
    ).count()
    
    return {
        "total_subscriptions": total_subscriptions,
        "active_subscriptions": active_subscriptions,
        "free": free_count,
        "professional": professional_count,
        "enterprise": enterprise_count
    }