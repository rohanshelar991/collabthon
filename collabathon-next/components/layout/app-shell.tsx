'use client';

import Link from 'next/link';
import { type Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  Bell,
  Briefcase,
  ChevronRight,
  CreditCard,
  FolderKanban,
  Home,
  MessageCircle,
  Orbit,
  Radar,
  Shield,
  Sparkles,
  UserCircle2,
  UserCog
} from 'lucide-react';
import { ThemeToggleButton } from './theme-provider';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { logEvent } from '@/lib/analytics';
import { getUserRecord } from '@/lib/firestore';
import type { UserRole } from '@/lib/roles';

const nav = [
  { href: '/dashboard' as Route, label: 'Overview', icon: Home },
  { href: '/profile' as Route, label: 'Profile', icon: UserCog },
  { href: '/students' as Route, label: 'Students', icon: UserCircle2 },
  { href: '/projects' as Route, label: 'Projects', icon: Briefcase },
  { href: '/workspace' as Route, label: 'Workspace', icon: FolderKanban },
  { href: '/messages' as Route, label: 'Messages', icon: MessageCircle },
  { href: '/billing' as Route, label: 'Billing', icon: CreditCard },
  { href: '/notifications' as Route, label: 'Notifications', icon: Bell },
  { href: '/admin' as Route, label: 'Admin', icon: Shield }
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(() => auth.currentUser);
  const [notificationCount, setNotificationCount] = useState(0);
  const [role, setRole] = useState<UserRole | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const visibleNav = nav.filter((item) => (item.label === 'Admin' ? role === 'admin' : true));
  const mobileNav = visibleNav.filter((item) =>
    ['Overview', 'Projects', 'Workspace', 'Messages', 'Billing'].includes(item.label)
  );
  const workspacePulse = [
    {
      href: '/workspace' as Route,
      label: 'Execution',
      value: role === 'client' ? 'Pipeline live' : role === 'admin' ? 'System view' : 'Sprint ready',
      detail:
        role === 'client'
          ? 'Track briefs, teams, and delivery status.'
          : role === 'admin'
            ? 'Watch workspace health across the platform.'
            : 'Jump into active boards, tasks, and team momentum.'
    },
    {
      href: '/messages' as Route,
      label: 'Comms',
      value: notificationCount > 0 ? `${notificationCount} waiting` : 'Synced',
      detail: 'Conversations, alerts, and follow-ups stay connected in one lane.'
    },
    {
      href: '/billing' as Route,
      label: 'Growth',
      value: role === 'admin' ? 'Controls' : 'Plans live',
      detail:
        role === 'admin'
          ? 'Review monetization surfaces and subscription posture.'
          : 'Manage plans, checkout, and the platform growth stack.'
    }
  ];

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setRole(null);
        setAuthResolved(true);
        return;
      }
      try {
        const userRecord = await getUserRecord(u.uid);
        setRole(userRecord?.role ?? null);
      } catch {
        setRole(null);
      } finally {
        setAuthResolved(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!authResolved) return;

    if (!user && pathname !== '/' && !pathname.startsWith('/sign-') && !pathname.startsWith('/student/') && !pathname.startsWith('/client/') && pathname !== '/admin-login') {
      router.replace('/sign-in');
      return;
    }

    if (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/admin')) {
      if (role && role !== 'admin') router.replace('/dashboard');
    }

    if (pathname.startsWith('/dashboard/client') && role && role !== 'client') {
      router.replace('/dashboard');
    }

    if (pathname.startsWith('/dashboard/user') && role && role !== 'student') {
      router.replace('/dashboard');
    }
  }, [authResolved, pathname, role, router, user]);

  useEffect(() => {
    logEvent('page_view', { pathname });
  }, [pathname]);

  useEffect(() => {
    if (!user) {
      setNotificationCount(0);
      return;
    }
    const q = query(collection(db, 'notifications'), where('userId', '==', user.uid), where('read', '==', false));
    const unsub = onSnapshot(
      q,
      (snap) => setNotificationCount(snap.size),
      () => setNotificationCount(0)
    );
    return () => unsub();
  }, [user]);

  return (
    <div className="page-shell flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-white/30 bg-slate-950/90 p-5 text-white shadow-[20px_0_60px_rgba(2,6,23,0.32)] backdrop-blur-xl dark:border-slate-800/80 md:flex md:flex-col lg:w-72 lg:p-6">
        <div className="rounded-[30px] border border-white/10 bg-white/5 p-4 shadow-[0_25px_60px_rgba(2,6,23,0.32)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-lg font-bold text-white">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-sky-400 to-emerald-400 shadow-[0_16px_30px_rgba(14,165,233,0.32)]">
                <Sparkles size={20} />
              </span>
              <div>
                <p className="data-kicker text-cyan-200">Collabathon</p>
                <p className="text-sm font-medium text-slate-300">Team intelligence hub</p>
              </div>
            </div>
            <ThemeToggleButton />
          </div>
          <div className="mt-5 shell-ribbon">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Signed in</p>
            <p className="mt-2 break-all text-sm font-semibold text-white">{user?.email ?? 'Guest'}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="badge border-white/10 bg-white/10 text-slate-100">{role ? role.toUpperCase() : 'NO ROLE'}</span>
              <span className="text-xs text-slate-400">Role-aware workspace with live collaboration.</span>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="shell-ribbon">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Realtime</p>
                  <p className="mt-2 text-xl font-semibold text-white">{notificationCount}</p>
                  <p className="mt-1 text-xs text-slate-400">Unread alerts waiting</p>
                </div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Activity size={18} />
                </span>
              </div>
            </div>
            <div className="shell-ribbon">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Surface</p>
                  <p className="mt-2 text-xl font-semibold text-white capitalize">{role ?? 'guest'}</p>
                  <p className="mt-1 text-xs text-slate-400">Control lane active</p>
                </div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Radar size={18} />
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="glass-chip border-white/10 bg-white/10 text-slate-100">
              <Orbit size={14} />
              Workspace live
            </span>
            <span className="glass-chip border-white/10 bg-white/10 text-slate-100">
              <Bell size={14} />
              Alerts synced
            </span>
          </div>
        </div>
        <nav className="mt-8 flex flex-col gap-2 text-sm">
          {visibleNav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${
                  active
                    ? 'nav-link-active'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="flex-1">{item.label}</span>
                {item.label === 'Notifications' && notificationCount > 0 ? (
                  <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                    {notificationCount}
                  </span>
                ) : <ChevronRight size={14} className="text-slate-500" />}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 text-xs text-slate-300">
          <p className="data-kicker text-cyan-200">Workspace status</p>
          <p className="mt-2 leading-relaxed text-slate-300">
            Live projects, realtime chat, and role-based access are all centralized here.
          </p>
          <div className="my-4 premium-divider bg-white/10" />
          <div className="grid gap-3">
            <Link
              href="/workspace"
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-200 transition hover:bg-white/10"
            >
              <span>
                <span className="block text-[11px] uppercase tracking-[0.24em] text-slate-400">Execution</span>
                <span className="mt-1 block text-sm font-semibold text-white">Open workspace board</span>
              </span>
              <FolderKanban size={16} />
            </Link>
            <Link
              href="/billing"
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-200 transition hover:bg-white/10"
            >
              <span>
                <span className="block text-[11px] uppercase tracking-[0.24em] text-slate-400">Growth</span>
                <span className="mt-1 block text-sm font-semibold text-white">Review billing controls</span>
              </span>
              <CreditCard size={16} />
            </Link>
          </div>
          {user && (
            <button
              onClick={() => signOut(auth)}
              className="mt-4 inline-flex rounded-full border border-rose-400/30 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:border-rose-300/50 hover:bg-rose-400/10"
            >
              Sign out
            </button>
          )}
        </div>
      </aside>
      <main className="flex-1 p-3 pb-28 sm:p-6 sm:pb-28 lg:p-8 lg:pb-8">
        <header className="section-grid dashboard-shell mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <Link href="/notifications" className="rounded-2xl border border-white/50 bg-white/70 p-3 shadow-[0_16px_36px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900/80">
              <div className="relative text-brand-500">
                <Bell size={18} />
                {notificationCount > 0 && (
                  <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                    {notificationCount}
                  </span>
                )}
              </div>
            </Link>
            <div>
              <p className="data-kicker">Welcome back</p>
              <p className="break-all text-base font-semibold text-slate-900 dark:text-white sm:text-xl">{user?.email ?? 'Guest'}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {role ? <span className="glass-chip">{role.toUpperCase()}</span> : null}
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Build teams, ship work, and keep momentum high.
                </span>
              </div>
            </div>
          </div>
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
            <div className="hidden gap-3 lg:flex">
              <div className="header-status-card">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Alerts</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{notificationCount}</p>
              </div>
              <div className="header-status-card">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Lane</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 capitalize dark:text-white">{role ?? 'guest'}</p>
              </div>
            </div>
            <ThemeToggleButton />
          </div>
        </header>
        <section className="mb-8 hidden gap-3 lg:grid lg:grid-cols-3">
          {workspacePulse.map((item) => (
            <Link key={item.label} href={item.href} className="ops-ticker-item group">
              <div className="relative z-[1]">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">{item.value}</p>
                  <span className="control-pill">Open</span>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {item.detail}
                </p>
              </div>
            </Link>
          ))}
        </section>
        <div className="section-grid">{children}</div>
      </main>
      <nav className="dock-shell">
        <div className="flex items-center gap-1">
          {mobileNav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`dock-link ${
                  active
                    ? 'dock-link-active'
                    : 'text-slate-500 dark:text-slate-300'
                }`}
              >
                <div className="relative">
                  <Icon size={18} />
                  {item.label === 'Messages' && notificationCount > 0 ? (
                    <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                      {notificationCount}
                    </span>
                  ) : null}
                </div>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
