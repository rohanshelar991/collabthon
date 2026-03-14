'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { registerWithEmail, googleLogin } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { pushToast } from '@/components/ui/toaster';
import { UserRole } from '@/lib/roles';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await registerWithEmail(email, password, role, { displayName: name });
      router.push('/dashboard');
    } catch (err: any) {
      pushToast(err?.message || 'Unable to sign up');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12 dark:bg-slate-950">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-card dark:bg-slate-900">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">Collabathon</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
          <p className="text-sm text-slate-500">Choose a role to tailor your experience.</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm text-slate-600">Full name</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white dark:bg-slate-800 dark:border-slate-700"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
          <div className="md:col-span-2">
            <p className="text-sm text-slate-600">Pick your role</p>
            <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                { key: 'student', title: 'Student', desc: 'Showcase skills & find teammates' },
                { key: 'client', title: 'Client', desc: 'Post projects & hire teams' },
                { key: 'admin', title: 'Admin', desc: 'Moderate content (restricted)' }
              ].map((item) => (
                <label
                  key={item.key}
                  className={`cursor-pointer rounded-xl border p-4 text-left shadow-sm transition hover:border-brand-200 dark:border-slate-800 dark:hover:border-brand-500/50 ${
                    role === item.key ? 'border-brand-400 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 bg-white dark:bg-slate-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={item.key}
                    className="hidden"
                    checked={role === item.key}
                    onChange={() => setRole(item.key as UserRole)}
                  />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </label>
              ))}
            </div>
          </div>
          <button className="btn-primary md:col-span-2" disabled={loading} type="submit">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <button
            onClick={() => googleLogin(role).then(() => router.push('/dashboard')).catch((e) => pushToast(e.message))}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 dark:border-slate-800 dark:text-white"
          >
            Continue with Google
          </button>
          <p className="text-sm text-slate-500">
            Already have an account? <Link className="text-brand-600" href="/sign-in">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
