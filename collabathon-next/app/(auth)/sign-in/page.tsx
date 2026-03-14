'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { emailLogin, googleLogin } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { pushToast } from '@/components/ui/toaster';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await emailLogin(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      pushToast(err?.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-card dark:bg-slate-900">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">Collabathon</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
          <p className="text-sm text-slate-500">Sign in to find teammates or hire student teams.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-600">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white dark:bg-slate-800 dark:border-slate-700"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Password</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white dark:bg-slate-800 dark:border-slate-700"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn-primary w-full" disabled={loading} type="submit">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <button
          onClick={() => googleLogin().then(() => router.push('/dashboard')).catch((e) => pushToast(e.message))}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 dark:border-slate-800 dark:text-white"
        >
          Continue with Google
        </button>
        <p className="text-center text-sm text-slate-500">
          No account? <Link className="text-brand-600" href="/sign-up">Create one</Link>
        </p>
      </div>
    </div>
  );
}
