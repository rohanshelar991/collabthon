'use client';

import Link from 'next/link';
import { type Route } from 'next';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BriefcaseBusiness,
  Compass,
  GraduationCap,
  Orbit,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { emailLogin, forgotPassword, googleLogin } from '@/lib/auth';
import { getUserRecord } from '@/lib/firestore';
import { pushToast } from '@/components/ui/toaster';
import { UserRole, readableRole } from '@/lib/roles';

const roleAccent: Record<UserRole, string> = {
  student: 'from-sky-500 to-cyan-400',
  client: 'from-emerald-500 to-teal-400',
  admin: 'from-amber-500 to-orange-400'
};

const roleDescription: Record<UserRole, string> = {
  student: 'Sign in to find hackathon teammates, projects, and collaboration requests.',
  client: 'Sign in to post project briefs, review teams, and manage applications.',
  admin: 'Sign in to moderate users, projects, and platform activity from one place.'
};

const roleSignals: Record<UserRole, string[]> = {
  student: [
    'Realtime teammate discovery and project applications.',
    'Live notifications and conversations tied to your profile.',
    'A cleaner launchpad for hackathons and freelance work.'
  ],
  client: [
    'One control room for briefs, applicants, and delivery updates.',
    'Role-shaped access so clients see operations, not noise.',
    'Faster hiring loops with stronger candidate context.'
  ],
  admin: [
    'Protected moderation lane with platform visibility.',
    'Role-aware dashboards and live marketplace oversight.',
    'Cleaner separation between public and internal surfaces.'
  ]
};

const roleMetric: Record<UserRole, { label: string; value: string; icon: typeof Sparkles }> = {
  student: { label: 'Team readiness', value: 'Live matching', icon: GraduationCap },
  client: { label: 'Hiring flow', value: 'Realtime briefs', icon: BriefcaseBusiness },
  admin: { label: 'Access level', value: 'Protected lane', icon: ShieldCheck }
};

const redirectByRole: Record<UserRole, Route> = {
  student: '/dashboard/user',
  client: '/dashboard/client',
  admin: '/dashboard/admin'
};

export function RoleSignInForm({ role }: { role: UserRole }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => `${readableRole(role)} Login`, [role]);
  const MetricIcon = roleMetric[role].icon;

  async function routeAfterLogin(userId: string) {
    const userRecord = await getUserRecord(userId).catch(() => null);
    const detectedRole = userRecord?.role;

    if (!detectedRole) {
      pushToast('Signed in, but your role record is incomplete. Opening the shared dashboard.');
      router.push('/dashboard');
      return;
    }

    if (detectedRole !== role) {
      pushToast(
        `This account belongs to the ${readableRole(detectedRole).toLowerCase()} lane. Redirecting you there.`
      );
    }

    router.push(redirectByRole[detectedRole]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await emailLogin(email, password, rememberMe);
      await routeAfterLogin(result.user.uid);
    } catch (error: any) {
      pushToast(error?.message || `Unable to sign in as ${readableRole(role).toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="auth-stage w-full max-w-6xl p-4 md:p-6">
        <div className="relative z-[1] grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
          <section className="hero-panel flex flex-col justify-between p-5 text-white sm:p-7">
            <div>
              <div
                className={`inline-flex rounded-full bg-gradient-to-r ${roleAccent[role]} px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_18px_35px_rgba(14,165,233,0.22)]`}
              >
                {readableRole(role)}
              </div>
              <h1 className="mt-5 text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                {roleDescription[role]}
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-[26px] border border-white/10 bg-white/10 p-5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <MetricIcon size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                      {roleMetric[role].label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {roleMetric[role].value}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3">
                {roleSignals[role].map((signal) => (
                  <div
                    key={signal}
                    className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200"
                  >
                    {signal}
                  </div>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="hero-metric-card">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Entry protocol</p>
                  <p className="mt-2 text-xl font-semibold text-white">Role-true routing</p>
                  <p className="mt-2 text-sm text-slate-300">
                    We check the actual account lane after sign-in and route to the correct workspace.
                  </p>
                </div>
                <div className="hero-metric-card">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Surface tone</p>
                  <p className="mt-2 text-xl font-semibold text-white">High-signal access</p>
                  <p className="mt-2 text-sm text-slate-300">
                    Students, clients, and admins get cleaner, role-shaped entry flows.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="command-surface p-5 sm:p-6 md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="data-kicker">Secure access</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
                  Enter your workspace
                </h2>
              </div>
              <div className="orb-badge">
                <Sparkles size={18} />
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="insight-card">
                <div className="relative z-[1]">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Security</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">Firebase-backed auth</p>
                </div>
              </div>
              <div className="insight-card">
                <div className="relative z-[1]">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Routing</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">Role-aware redirect</p>
                </div>
              </div>
              <div className="insight-card">
                <div className="relative z-[1]">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Flow</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">Realtime workspace access</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Email</label>
                <input
                  className="field-shell mt-1 w-full"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Password</label>
                <input
                  className="field-shell mt-1 w-full"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="rounded"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="font-semibold text-brand-600"
                  onClick={async () => {
                    if (!email) {
                      pushToast('Enter your email first to reset the password.');
                      return;
                    }
                    try {
                      await forgotPassword(email);
                      pushToast('Password reset email sent.');
                    } catch (error: any) {
                      pushToast(error?.message || 'Unable to send password reset email.');
                    }
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <button className="btn-primary w-full" disabled={loading} type="submit">
                {loading ? `Signing in ${readableRole(role).toLowerCase()}...` : `Sign in as ${readableRole(role)}`}
              </button>
            </form>

            {role !== 'admin' && (
              <button
                onClick={() =>
                  googleLogin()
                    .then(async (result) => {
                      if (result.warning) pushToast(result.warning);
                      await routeAfterLogin(result.user.uid);
                    })
                    .catch((error) => pushToast(error.message))
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/60 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900/70 dark:text-white"
              >
                Continue with Google
              </button>
            )}

            <div className="mt-6 flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-300">
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="studio-chip">
                  <Compass size={14} />
                  Role-aware onboarding
                </span>
                <span className="studio-chip">
                  <Orbit size={14} />
                  Live Firebase session
                </span>
              </div>
              {role !== 'admin' ? (
                <p>
                  No account?{' '}
                  <Link className="font-semibold text-brand-600" href={`/${role}/signup`}>
                    Create one
                  </Link>
                </p>
              ) : (
                <p>Admin accounts are provisioned internally for security.</p>
              )}
              <Link
                className="inline-flex items-center gap-2 font-semibold text-brand-600"
                href={role === 'admin' ? '/admin-login' : '/sign-in'}
              >
                {role === 'admin' ? 'Refresh admin login' : 'Back to role selection'}
                <ArrowRight size={14} />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
