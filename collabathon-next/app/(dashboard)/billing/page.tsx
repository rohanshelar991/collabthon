'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { AppShell } from '@/components/layout/app-shell';
import { CheckoutButton, BillingPortalButton } from '@/components/ui/checkout-button';
import { auth } from '@/lib/firebase';
import { getSubscriptionRecord, getUserRecord } from '@/lib/firestore';
import { billingPlans } from '@/lib/billing';
import { pushToast } from '@/components/ui/toaster';
import type { SubscriptionRecord } from '@/types';
import type { UserRole } from '@/lib/roles';

export default function BillingPage() {
  const [userId, setUserId] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null)), []);

  useEffect(() => {
    const checkout =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('checkout')
        : null;
    if (checkout === 'success') pushToast('Subscription flow completed. Billing status will update shortly.');
    if (checkout === 'cancel') pushToast('Checkout was canceled.');
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    Promise.all([getUserRecord(userId), getSubscriptionRecord(userId)])
      .then(([userRecord, subscriptionRecord]) => {
        if (cancelled) return;
        setRole(userRecord?.role ?? null);
        setSubscription(subscriptionRecord);
      })
      .catch((error: any) => {
        if (!cancelled) pushToast(error?.message || 'Unable to load billing state.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const activePlan = useMemo(
    () => billingPlans.find((plan) => plan.id === subscription?.planId) || null,
    [subscription?.planId]
  );

  return (
    <AppShell>
      <section className="mesh-panel p-5 sm:p-7 text-white">
        <div className="relative z-[1] flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="data-kicker text-cyan-200">Revenue + billing ops</p>
            <h1 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              Monetize the platform with proper subscriptions, customer controls, and Stripe-backed lifecycle sync.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              This billing layer is built for real plans, checkout sessions, a billing portal, and webhook-driven subscription records in Firestore.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:min-w-[320px] sm:grid-cols-2 lg:min-w-[520px] lg:grid-cols-3 xl:min-w-[420px] xl:grid-cols-1">
            {[
              { label: 'Role', value: loading ? '...' : role || 'member', icon: ShieldCheck },
              { label: 'Plan', value: loading ? '...' : activePlan?.name || 'No active plan', icon: WalletCards },
              { label: 'Status', value: loading ? '...' : subscription?.status || 'inactive', icon: CreditCard }
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{metric.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-white capitalize">{metric.value}</p>
                    </div>
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                      <Icon size={18} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr,1.08fr]">
        <section className="command-surface p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="data-kicker">Current billing state</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                Subscription controls
              </h2>
            </div>
            <div className="stat-orb h-12 w-12 rounded-[18px]">
              <Sparkles size={18} />
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rail-card p-4 text-sm text-slate-600 dark:text-slate-300">
              {subscription ? (
                <>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {activePlan?.name || subscription.planId} is {subscription.status}.
                  </p>
                  <p className="mt-2">
                    Renewal window: {subscription.currentPeriodEnd || 'Will sync after webhook delivery'}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-900 dark:text-white">No active subscription yet.</p>
                  <p className="mt-2">Pick a plan below to activate Stripe checkout and unlock premium platform features.</p>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <BillingPortalButton className="btn-primary" />
              <span className="glass-chip">
                <CheckCircle2 size={14} />
                Webhook sync writes back to Firestore
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="insight-card">
                <div className="relative z-[1]">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Billing trust
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    Stripe + portal ready
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    Checkout, customer portal, and subscription lifecycle sync are wired for a real monetization layer.
                  </p>
                </div>
              </div>
              <div className="insight-card">
                <div className="relative z-[1]">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Renewal view
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    {subscription?.currentPeriodEnd || 'Awaiting first invoice'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    Once Stripe webhooks land, this panel stays synced with Firestore automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {billingPlans.map((plan) => (
            <div key={plan.id} className={`${plan.recommended ? 'spotlight-card' : 'plan-card'} p-6`}>
              <div className="relative z-[1] flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="data-kicker">{plan.badge}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{plan.name}</h2>
                  </div>
                  {plan.recommended ? <span className="glass-chip">Recommended</span> : null}
                </div>
                <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{plan.monthlyLabel}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{plan.description}</p>
                <div className="mt-4 score-meter">
                  <span
                    style={{
                      width:
                        plan.id === 'starter'
                          ? '42%'
                          : plan.id === 'pro'
                            ? '74%'
                            : '100%'
                    }}
                  />
                </div>
                <div className="mt-5 grid gap-3">
                  {plan.highlights.map((highlight) => (
                    <div key={highlight} className="signal-pill">
                      <CheckCircle2 size={14} />
                      {highlight}
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <CheckoutButton
                    planId={plan.id}
                    label={subscription?.planId === plan.id ? 'Switch or renew plan' : `Choose ${plan.name}`}
                    className="btn-primary w-full"
                  />
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
