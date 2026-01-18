from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional
from app import schemas, models
from app.database import get_db
from app.core.deps import get_current_user
from app.utils.payment_service import payment_service
from app.models import Subscription, SubscriptionPlan
from datetime import datetime

router = APIRouter()


@router.post("/create-checkout-session")
async def create_checkout_session(
    plan: SubscriptionPlan,
    success_url: str,
    cancel_url: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a Stripe checkout session for subscription upgrade
    """
    if not payment_service.stripe_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment gateway not configured"
        )
    
    try:
        # Check if user already has an active subscription
        existing_sub = db.query(Subscription).filter(
            Subscription.user_id == current_user.id
        ).first()
        
        if existing_sub and existing_sub.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has an active subscription"
            )
        
        # Create checkout session
        session_data = payment_service.create_checkout_session(
            user_id=current_user.id,
            plan=plan,
            success_url=success_url,
            cancel_url=cancel_url
        )
        
        if not session_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create checkout session"
            )
        
        return session_data
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Checkout session creation failed: {str(e)}"
        )


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle Stripe webhook events
    """
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    if not sig_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing stripe-signature header"
        )
    
    try:
        event_data = payment_service.handle_webhook(
            payload.decode('utf-8'),
            sig_header,
            getattr(schemas.settings, 'STRIPE_WEBHOOK_SECRET', '')
        )
        
        if not event_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Webhook handling failed"
            )
        
        # Process different event types
        event_type = event_data['event_type']
        event_data_obj = event_data['data']
        
        if event_type == 'checkout.session.completed':
            # User completed checkout, create/update subscription
            user_id = event_data_obj.get('metadata', {}).get('user_id')
            plan = event_data_obj.get('metadata', {}).get('plan')
            
            if user_id and plan:
                # Create or update subscription
                subscription = db.query(Subscription).filter(
                    Subscription.user_id == user_id
                ).first()
                
                if not subscription:
                    subscription = Subscription(
                        user_id=user_id,
                        plan=plan,
                        stripe_customer_id=event_data_obj.get('customer'),
                        stripe_subscription_id=event_data_obj.get('subscription'),
                        is_active=True,
                        started_at=datetime.utcnow(),
                        expires_at=None  # Will be managed by Stripe
                    )
                    db.add(subscription)
                else:
                    subscription.plan = plan
                    subscription.stripe_subscription_id = event_data_obj.get('subscription')
                    subscription.is_active = True
                    subscription.started_at = datetime.utcnow()
                
                db.commit()
        
        elif event_type == 'customer.subscription.deleted':
            # Subscription was cancelled
            subscription_id = event_data_obj.get('id')
            subscription = db.query(Subscription).filter(
                Subscription.stripe_subscription_id == subscription_id
            ).first()
            
            if subscription:
                subscription.is_active = False
                db.commit()
        
        return {"success": True}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Webhook error: {str(e)}"
        )


@router.post("/upgrade-subscription")
async def upgrade_subscription(
    plan: SubscriptionPlan,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upgrade user subscription to a new plan
    """
    if not payment_service.stripe_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment gateway not configured"
        )
    
    try:
        # Get current subscription
        current_sub = db.query(Subscription).filter(
            Subscription.user_id == current_user.id
        ).first()
        
        if not current_sub or not current_sub.stripe_subscription_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active subscription found"
            )
        
        # Update subscription to new plan
        price_mapping = {
            SubscriptionPlan.PROFESSIONAL: getattr(schemas.settings, 'STRIPE_PROFESSIONAL_PRICE_ID', ''),
            SubscriptionPlan.ENTERPRISE: getattr(schemas.settings, 'STRIPE_ENTERPRISE_PRICE_ID', '')
        }
        
        new_price_id = price_mapping.get(plan)
        if not new_price_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No price configured for plan: {plan}"
            )
        
        result = payment_service.update_subscription(
            current_sub.stripe_subscription_id,
            new_price_id
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update subscription"
            )
        
        # Update local subscription record
        current_sub.plan = plan.value
        current_sub.updated_at = datetime.utcnow()
        db.commit()
        
        return {"success": True, "subscription": result}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Subscription upgrade failed: {str(e)}"
        )


@router.post("/cancel-subscription")
async def cancel_subscription(
    at_period_end: bool = True,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel user subscription
    """
    if not payment_service.stripe_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment gateway not configured"
        )
    
    try:
        # Get current subscription
        current_sub = db.query(Subscription).filter(
            Subscription.user_id == current_user.id
        ).first()
        
        if not current_sub or not current_sub.stripe_subscription_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active subscription found"
            )
        
        # Cancel subscription in Stripe
        success = payment_service.cancel_subscription(
            current_sub.stripe_subscription_id,
            at_period_end
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to cancel subscription in payment processor"
            )
        
        # Update local subscription record
        current_sub.is_active = False
        current_sub.updated_at = datetime.utcnow()
        db.commit()
        
        return {"success": True}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Subscription cancellation failed: {str(e)}"
        )


@router.get("/subscription-status")
async def get_subscription_status(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user subscription status
    """
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).first()
    
    if not subscription:
        return {
            "plan": SubscriptionPlan.FREE,
            "is_active": False,
            "expires_at": None
        }
    
    return {
        "plan": subscription.plan,
        "is_active": subscription.is_active,
        "started_at": subscription.started_at,
        "expires_at": subscription.expires_at,
        "stripe_subscription_id": subscription.stripe_subscription_id
    }