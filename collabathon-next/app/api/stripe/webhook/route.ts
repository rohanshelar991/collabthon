import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: '2026-02-25.clover' })
  : null;

function timestampToIso(timestamp?: number | null) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : undefined;
}

async function writeSubscriptionFromStripe(subscription: Stripe.Subscription, fallbackUserId?: string) {
  const userId = (subscription.metadata?.userId || fallbackUserId || '').trim();
  if (!userId) return;

  await adminDb.collection('subscriptions').doc(userId).set(
    {
      userId,
      customerId:
        typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
      subscriptionId: subscription.id,
      priceId: subscription.items.data[0]?.price.id || '',
      planId: (subscription.metadata?.planId || 'pro').trim(),
      status: subscription.status,
      seats: subscription.items.data[0]?.quantity || 1,
      currentPeriodEnd: timestampToIso(subscription.items.data[0]?.current_period_end || null),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    { merge: true }
  );

  await adminDb.collection('auditLogs').add({
    actorId: 'stripe',
    actorDisplayName: 'Stripe Webhook',
    targetType: 'subscription',
    targetId: userId,
    action: 'subscription.synced',
    summary: `Stripe subscription synced with status ${subscription.status}.`,
    metadata: {
      subscriptionId: subscription.id,
      planId: subscription.metadata?.planId || 'pro'
    },
    createdAt: new Date().toISOString()
  });
}

export async function POST(request: Request) {
  if (!stripe || !webhookSecret) {
    return new Response('Stripe webhook not configured.', { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header.', { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid webhook signature.';
    return new Response(message, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
          await writeSubscriptionFromStripe(subscription, session.client_reference_id || undefined);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await writeSubscriptionFromStripe(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed.';
    return new Response(message, { status: 500 });
  }

  return new Response('ok', { status: 200 });
}
