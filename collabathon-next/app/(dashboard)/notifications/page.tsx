'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BellRing, CheckCheck, Filter, MessageSquare, Rocket, ShieldCheck, Sparkles } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { AppShell } from '@/components/layout/app-shell';
import { auth } from '@/lib/firebase';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/firestore';
import { pushToast } from '@/components/ui/toaster';
import type { Notification } from '@/types';

const typeIcon = {
  application: Rocket,
  message: MessageSquare,
  team: Sparkles,
  review: ShieldCheck,
  collaboration: Sparkles,
  system: BellRing
} as const;

function formatTimestamp(value: Notification['createdAt']) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toLocaleString();
  }
  return 'Just now';
}

export default function NotificationsPage() {
  const [userId, setUserId] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null)), []);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    listNotifications(userId)
      .then((items) => {
        if (!cancelled) setNotifications(items);
      })
      .catch((error: any) => {
        if (!cancelled) pushToast(error?.message || 'Unable to load notifications.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const filteredNotifications = useMemo(
    () => (showUnreadOnly ? notifications.filter((notification) => !notification.read) : notifications),
    [notifications, showUnreadOnly]
  );

  async function handleMarkAllRead() {
    if (!userId || unreadCount === 0) return;

    setMarkingAll(true);
    try {
      await markAllNotificationsRead(userId);
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
      pushToast('All notifications marked as read.');
    } catch (error: any) {
      pushToast(error?.message || 'Unable to update notifications.');
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleMarkRead(notificationId: string) {
    try {
      await markNotificationRead(notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
    } catch (error: any) {
      pushToast(error?.message || 'Unable to update notification.');
    }
  }

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <section className="hero-panel p-7 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="data-kicker text-cyan-200">Realtime signal center</p>
              <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Stay on top of project movement, replies, and team decisions.
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300">
                Your inbox now behaves like a proper ops feed: unread counters, quick triage, and action-ready updates.
              </p>
            </div>
            <div className="grid min-w-[220px] gap-3 rounded-[28px] border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Unread</p>
                <p className="mt-2 text-3xl font-semibold text-white">{unreadCount}</p>
              </div>
              <button onClick={handleMarkAllRead} disabled={markingAll || unreadCount === 0} className="btn-primary w-full">
                {markingAll ? 'Updating...' : 'Mark all as read'}
              </button>
            </div>
          </div>
        </section>

        <section className="aura-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="data-kicker">Filters</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Inbox controls</h2>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/70">
              <Filter size={18} className="text-brand-500" />
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            <label className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/60 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/60">
              <span className="font-medium text-slate-700 dark:text-slate-200">Show unread only</span>
              <input type="checkbox" checked={showUnreadOnly} onChange={(event) => setShowUnreadOnly(event.target.checked)} className="rounded" />
            </label>
            <div className="rounded-2xl border border-dashed border-slate-300/80 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
              Notifications are generated from applications, chat, reviews, and team actions.
            </div>
            <Link href="/projects" className="rounded-2xl border border-slate-200/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-800 dark:text-slate-200">
              Jump to project board
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="insight-card">
              <div className="relative z-[1]">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Triage
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                  {showUnreadOnly ? 'Focused mode' : 'Full stream'}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  Toggle unread-only mode when you need to clear urgent signals fast.
                </p>
              </div>
            </div>
            <div className="insight-card">
              <div className="relative z-[1]">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Queue health
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                  {filteredNotifications.length} visible
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  Your feed now acts like an ops queue instead of a passive alert list.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-6 aura-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="data-kicker">Your feed</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Notifications</h2>
          </div>
          <div className="badge">{filteredNotifications.length} items</div>
        </div>

        <div className="mt-6 grid gap-4">
          {loading ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white/60 p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300/80 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
              No notifications yet. Once your projects start moving, updates will land here automatically.
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = typeIcon[notification.type] || BellRing;
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    if (!notification.read) handleMarkRead(notification.id);
                  }}
                  className={`group flex flex-col gap-4 rounded-[28px] border px-5 py-5 text-left transition md:flex-row md:items-start md:justify-between ${
                    notification.read
                      ? 'border-slate-200/80 bg-white/60 dark:border-slate-800 dark:bg-slate-900/60'
                      : 'border-brand-200 bg-brand-50/70 shadow-[0_20px_45px_rgba(14,165,233,0.14)] dark:border-brand-500/30 dark:bg-brand-500/10'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="mt-1 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_18px_34px_rgba(15,23,42,0.26)] dark:bg-slate-100 dark:text-slate-950">
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge capitalize">{notification.type}</span>
                        {!notification.read ? <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">New</span> : null}
                      </div>
                      <p className="mt-3 text-base font-semibold text-slate-900 dark:text-white">{notification.content}</p>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{formatTimestamp(notification.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-center">
                    {!notification.read ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                        <CheckCheck size={14} /> Tap to mark read
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Already reviewed</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>
    </AppShell>
  );
}
