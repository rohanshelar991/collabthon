import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { resolveStripePriceId, type BillingPlanId } from '@/lib/billing';
import { getAppBaseUrl } from '@/lib/env';

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
    const appBaseUrl = getAppBaseUrl();
    const { priceId, planId, successUrl, cancelUrl, mode = 'subscription', userId, userEmail } =
      await request.json();

    const resolvedPlanId = (planId || 'pro') as BillingPlanId;
    const resolvedPriceId = priceId || resolveStripePriceId(resolvedPlanId);

    if (!resolvedPriceId) {
      return NextResponse.json(
        { error: `Missing Stripe price ID for ${resolvedPlanId}.` },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      success_url: successUrl || `${appBaseUrl}/billing?checkout=success`,
      cancel_url: cancelUrl || `${appBaseUrl}/billing?checkout=cancel`,
      automatic_tax: { enabled: true },
      allow_promotion_codes: true,
      customer_email: userEmail || undefined,
      client_reference_id: userId || undefined,
      metadata: {
        planId: resolvedPlanId,
        userId: userId || ''
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe checkout failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
