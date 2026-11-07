'use client';

import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { pushToast } from '@/components/ui/toaster';
import type { BillingPlanId } from '@/lib/billing';

export function CheckoutButton({
  priceId,
  planId = 'pro',
  label = 'Start Subscription',
  className = 'btn-primary'
}: {
  priceId?: string;
  planId?: BillingPlanId;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  const startCheckout = async () => {
    if (!publishableKey) {
      pushToast('Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable checkout.');
      return;
    }

    setLoading(true);

    try {
      const stripe = await loadStripe(publishableKey);
      const user = auth.currentUser;
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          planId,
          userId: user?.uid,
          userEmail: user?.email,
          successUrl: `${window.location.origin}/billing?checkout=success`,
          cancelUrl: `${window.location.origin}/billing?checkout=cancel`
        })
      });

      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        throw new Error(data.error || 'Could not start checkout');
      }

      if (data.url && stripe) {
        window.location.href = data.url;
        return;
      }

      throw new Error('Stripe checkout link was not returned.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not start checkout';
      pushToast(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={startCheckout} className={className} disabled={loading}>
      {loading ? 'Starting...' : label}
    </button>
  );
}

export function BillingPortalButton({ className = 'btn-primary' }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    const user = auth.currentUser;
    if (!user) {
      pushToast('Please sign in first.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          returnUrl: `${window.location.origin}/billing`
        })
      });

      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};
      if (!response.ok) throw new Error(data.error || 'Could not open billing portal.');
      if (!data.url) throw new Error('Billing portal link was not returned.');
      window.location.href = data.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not open billing portal.';
      pushToast(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={openPortal} className={className} disabled={loading}>
      {loading ? 'Opening...' : 'Manage billing'}
    </button>
  );
}
