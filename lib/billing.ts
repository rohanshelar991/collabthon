export type BillingPlanId = 'starter' | 'pro' | 'enterprise';

export const billingPlans: Array<{
  id: BillingPlanId;
  name: string;
  badge: string;
  monthlyLabel: string;
  description: string;
  highlights: string[];
  recommended?: boolean;
}> = [
  {
    id: 'starter',
    name: 'Starter',
    badge: 'Solo builders',
    monthlyLabel: '$19/mo',
    description: 'Best for students and small teams testing the platform with live collaboration and core workspace tooling.',
    highlights: ['1 active workspace', 'Realtime chat and notifications', 'Basic project analytics']
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Most popular',
    monthlyLabel: '$49/mo',
    description: 'Designed for client teams and serious student studios managing multiple briefs, sprints, and delivery cycles.',
    highlights: ['Unlimited workspaces', 'Kanban + sprint board', 'Advanced admin and analytics'],
    recommended: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'Scale + governance',
    monthlyLabel: '$149/mo',
    description: 'For organizations that need moderation controls, audit history, advanced billing support, and automation coverage.',
    highlights: ['Priority support', 'Governance audit trail', 'Dedicated billing + automation hooks']
  }
];

export const stripePlanEnvMap: Record<BillingPlanId, string> = {
  starter: 'NEXT_PUBLIC_STRIPE_PRICE_STARTER',
  pro: 'NEXT_PUBLIC_STRIPE_PRICE_PRO',
  enterprise: 'NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE'
};

export function resolveStripePriceId(planId: BillingPlanId) {
  return process.env[stripePlanEnvMap[planId]] || '';
}
