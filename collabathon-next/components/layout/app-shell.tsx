'use client';

import Link from 'next/link';
import { type Route } from 'next';
import { usePathname } from 'next/navigation';
import { MessageCircle, Shield, Sparkles, UserCircle2, Briefcase, Home, Bell, UserCog } from 'lucide-react';
import { ThemeToggleButton } from './theme-provider';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const nav = [
  { href: '/dashboard' as Route, label: 'Overview', icon: Home },
  { href: '/profile' as Route, label: 'Profile', icon: UserCog },
  { href: '/students' as Route, label: 'Students', icon: UserCircle2 },
  { href: '/projects' as Route, label: 'Projects', icon: Briefcase },
  { href: '/messages' as Route, label: 'Messages', icon: MessageCircle },
  { href: '/admin' as Route, label: 'Admin', icon: Shield }
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState(() => auth.currentUser);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', user.uid), where('read', '==', false));
    const unsub = onSnapshot(q, (snap) => setNotificationCount(snap.size));
    return () => unsub();
  }, [user]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white/80 p-6 backdrop-blur dark:bg-slate-900 dark:border-slate-800 md:block">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <Sparkles className="text-brand-500" size={20} /> Collabathon
          </div>
          <ThemeToggleButton />
        </div>
        <nav className="mt-8 flex flex-col gap-1 text-sm">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 transition ${
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={18} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-8 text-xs text-slate-500 dark:text-slate-400">
          Logged in as<br />
          <span className="font-medium text-slate-700 dark:text-slate-200">{user?.email ?? 'Guest'}</span>
          {user && (
            <button
              onClick={() => signOut(auth)}
              className="mt-3 inline-flex text-xs text-red-500 hover:underline"
            >
              Sign out
            </button>
          )}
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white p-2 shadow-sm dark:bg-slate-900">
              <div className="relative">
                <Bell size={16} className="text-brand-500" />
                {notificationCount > 0 && (
                  <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                    {notificationCount}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Welcome back</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{user?.email ?? 'Guest'}</p>
            </div>
          </div>
          <ThemeToggleButton />
        </header>
        {children}
      </main>
    </div>
  );
}
