import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: '2026-02-25.clover' })
  : null;

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY missing' }, { status: 500 });
  }

  try {
    const { userId, returnUrl } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID.' }, { status: 400 });
    }

    const subscriptionSnap = await adminDb.collection('subscriptions').doc(userId).get();
    const customerId = subscriptionSnap.exists ? subscriptionSnap.data()?.customerId : null;

    if (!customerId) {
      return NextResponse.json({ error: 'No Stripe customer found for this user.' }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || 'http://localhost:3000/billing'
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not open billing portal.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
