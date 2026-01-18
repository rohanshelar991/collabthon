"""Payment Gateway Integration for Collabthon Platform"""

import stripe
from typing import Dict, Optional
from app.core.config import settings
from app.models import User, Subscription, SubscriptionPlan
from app.database import get_db
from sqlalchemy.orm import Session
import logging

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

logger = logging.getLogger(__name__)


class PaymentService:
    def __init__(self):
        self.stripe_enabled = bool(settings.STRIPE_SECRET_KEY)
    
    def create_customer(self, user: User, email: str = None, name: str = None) -> Optional[str]:
        """Create a customer in Stripe"""
        if not self.stripe_enabled:
            logger.warning("Stripe is not configured")
            return None
        
        try:
            customer = stripe.Customer.create(
                email=email or user.email,
                name=name or user.username,
                metadata={
                    'user_id': user.id,
                    'username': user.username
                }
            )
            return customer.id
        except Exception as e:
            logger.error(f"Error creating Stripe customer: {e}")
            return None
    
    def create_checkout_session(self, user_id: int, plan: SubscriptionPlan, success_url: str, cancel_url: str) -> Optional[Dict]:
        """Create a checkout session for subscription"""
        if not self.stripe_enabled:
            logger.warning("Stripe is not configured")
            return None
        
        try:
            # Define prices for each plan (these would be configured in Stripe Dashboard)
            price_mapping = {
                SubscriptionPlan.FREE: None,  # Free plan doesn't need payment
                SubscriptionPlan.PROFESSIONAL: getattr(settings, 'STRIPE_PROFESSIONAL_PRICE_ID', ''),
                SubscriptionPlan.ENTERPRISE: getattr(settings, 'STRIPE_ENTERPRISE_PRICE_ID', '')
            }
            
            price_id = price_mapping.get(plan)
            if not price_id:
                raise ValueError(f"No price configured for plan: {plan}")
            
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    'user_id': user_id,
                    'plan': plan.value
                }
            )
            
            return {
                'id': session.id,
                'url': session.url,
                'customer_id': session.customer
            }
        except Exception as e:
            logger.error(f"Error creating checkout session: {e}")
            return None
    
    def create_payment_intent(self, amount: float, currency: str = 'usd', description: str = '') -> Optional[Dict]:
        """Create a payment intent for one-time payments"""
        if not self.stripe_enabled:
            logger.warning("Stripe is not configured")
            return None
        
        try:
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency=currency,
                description=description,
                automatic_payment_methods={'enabled': True},
            )
            
            return {
                'id': intent.id,
                'client_secret': intent.client_secret
            }
        except Exception as e:
            logger.error(f"Error creating payment intent: {e}")
            return None
    
    def get_subscription(self, subscription_id: str) -> Optional[Dict]:
        """Get subscription details from Stripe"""
        if not self.stripe_enabled:
            logger.warning("Stripe is not configured")
            return None
        
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return {
                'id': subscription.id,
                'status': subscription.status,
                'current_period_start': subscription.current_period_start,
                'current_period_end': subscription.current_period_end,
                'cancel_at_period_end': subscription.cancel_at_period_end
            }
        except Exception as e:
            logger.error(f"Error retrieving subscription: {e}")
            return None
    
    def cancel_subscription(self, subscription_id: str, at_period_end: bool = True) -> bool:
        """Cancel a subscription"""
        if not self.stripe_enabled:
            logger.warning("Stripe is not configured")
            return False
        
        try:
            if at_period_end:
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                subscription = stripe.Subscription.delete(subscription_id)
            
            return True
        except Exception as e:
            logger.error(f"Error cancelling subscription: {e}")
            return False
    
    def update_subscription(self, subscription_id: str, new_price_id: str) -> Optional[Dict]:
        """Update a subscription to a new plan"""
        if not self.stripe_enabled:
            logger.warning("Stripe is not configured")
            return None
        
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                items=[{
                    'id': subscription_id,  # This is the subscription item ID
                    'price': new_price_id,
                }]
            )
            
            return {
                'id': subscription.id,
                'status': subscription.status
            }
        except Exception as e:
            logger.error(f"Error updating subscription: {e}")
            return None
    
    def handle_webhook(self, payload: str, sig_header: str, webhook_secret: str) -> Optional[Dict]:
        """Handle Stripe webhook events"""
        if not self.stripe_enabled:
            logger.warning("Stripe is not configured")
            return None
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
            
            return {
                'event_type': event.type,
                'data': event.data.object
            }
        except Exception as e:
            logger.error(f"Error handling webhook: {e}")
            return None


# Global instance
payment_service = PaymentService()