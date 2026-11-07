'use client';

import Link from 'next/link';
import { type Route } from 'next';
import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { AppShell } from '@/components/layout/app-shell';
import { pushToast } from '@/components/ui/toaster';
import { auth, db } from '@/lib/firebase';
import { getErrorMessage } from '@/lib/errors';
import {
  deleteSearchSubscription,
  getUserRecord,
  listProjects,
  listSearchSubscriptions,
  listStudents,
  listWatchlistItems
} from '@/lib/firestore';
import type { UserRole } from '@/lib/roles';
import type { SearchSubscription, StudentProfile, Project, WatchlistItem } from '@/types';
import { ArrowRight, BellPlus, BriefcaseBusiness, Compass, Radar, Sparkles, Trash2, UsersRound } from 'lucide-react';

export default function WatchlistPage() {
  const [userId, setUserId] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SearchSubscription[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null)), []);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setStudents([]);
      setProjects([]);
      setRole(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const [userRecord, savedItems, loadedStudents, loadedProjects] = await Promise.all([
          getUserRecord(userId),
          listWatchlistItems(userId),
          listStudents(),
          listProjects()
        ]);

        if (cancelled) return;
        setRole(userRecord?.role ?? null);
        setItems(savedItems);
        setStudents(loadedStudents);
        setProjects(loadedProjects);
      } catch (error: unknown) {
        if (!cancelled) pushToast(getErrorMessage(error, 'Unable to load your saved radar.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setSubscriptions([]);
      return;
    }

    const subscriptionQuery = query(
      collection(db, 'searchSubscriptions'),
      where('userId', '==', userId)
    );
    const unsubscribe = onSnapshot(
      subscriptionQuery,
      async () => {
        try {
          const nextSubscriptions = await listSearchSubscriptions(userId);
          setSubscriptions(nextSubscriptions);
        } catch (error: unknown) {
          pushToast(getErrorMessage(error, 'Unable to refresh search alerts.'));
        }
      },
      () => pushToast('Live search subscriptions disconnected. Refresh to retry.')
    );

    return () => unsubscribe();
  }, [userId]);

  const studentItems = useMemo(
    () => items.filter((item) => item.targetType === 'student'),
    [items]
  );
  const projectItems = useMemo(
    () => items.filter((item) => item.targetType === 'project'),
    [items]
  );

  const metrics = [
    { label: 'Saved signals', value: items.length, icon: Radar },
    { label: 'Talent watch', value: studentItems.length, icon: UsersRound },
    { label: 'Brief watch', value: projectItems.length, icon: BriefcaseBusiness },
    { label: 'Live alerts', value: subscriptions.length, icon: BellPlus }
  ];

  function getMatchCount(subscription: SearchSubscription) {
    if (subscription.targetType === 'student') {
      return students.filter((student) => {
        const matchesSkill = subscription.filters?.skill
          ? student.skills.includes(String(subscription.filters.skill))
          : true;
        const matchesCollege = subscription.filters?.college
          ? student.college?.toLowerCase().includes(String(subscription.filters.college).toLowerCase())
          : true;
        const matchesExperience = subscription.filters?.experience
          ? student.experienceLevel === subscription.filters.experience
          : true;
        const matchesAvailable = subscription.filters?.availableOnly
          ? student.available
          : true;
        return matchesSkill && matchesCollege && matchesExperience && matchesAvailable;
      }).length;
    }

    return projects.filter((project) => {
      const normalizedQuery = String(subscription.filters?.query || subscription.query || '')
        .trim()
        .toLowerCase();
      const matchesStatus = subscription.filters?.status
        ? project.status === subscription.filters.status
        : true;
      const matchesQuery = normalizedQuery
        ? [project.title, project.description, project.requiredSkills.join(' ')]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
        : true;
      return matchesStatus && matchesQuery;
    }).length;
  }

  async function handleDeleteSubscription(subscriptionId: string) {
    setRemovingId(subscriptionId);
    try {
      await deleteSearchSubscription(subscriptionId);
      pushToast('Search alert removed.');
    } catch (error: unknown) {
      pushToast(getErrorMessage(error, 'Unable to remove search alert.'));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <AppShell>
      <section className="hero-panel p-5 sm:p-7 text-white">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="data-kicker text-cyan-200">Saved radar</p>
            <h1 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              Keep your highest-signal people and briefs in one premium command lane.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Save standout teammates, hot briefs, and the opportunities you want to revisit fast.
              {role === 'client'
                ? ' Use this as your shortlist before you staff the next team.'
                : role === 'admin'
                  ? ' Use this to monitor the strongest marketplace signals without losing context.'
                  : ' Use this as your personal shortlist before you jump back into chat, applications, or workspace delivery.'}
            </p>
          </div>

          <div className="grid w-full gap-3 md:min-w-[260px]">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="hero-metric-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                        {metric.label}
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-white">
                        {loading ? '...' : metric.value}
                      </p>
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

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="spotlight-card p-6">
          <div className="relative z-[1] flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="data-kicker">Talent shortlist</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                Saved student radar
              </h2>
            </div>
            <Link href={'/students' as Route} className="btn-primary">
              Scout more talent
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {loading ? (
              <div className="rail-card p-4 text-sm text-slate-500 dark:text-slate-300">
                Loading saved students...
              </div>
            ) : studentItems.length ? (
              studentItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href as Route}
                  className="rail-card group p-4 transition hover:-translate-y-0.5 hover:border-brand-300/70 hover:shadow-[0_18px_40px_rgba(14,165,233,0.12)] dark:hover:border-brand-500/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                        {item.subtitle || 'Saved teammate signal'}
                      </p>
                    </div>
                    <span className="stat-orb h-11 w-11 rounded-2xl">
                      <Compass size={16} />
                    </span>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-300">
                    Open student profile
                    <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="rail-card border-dashed p-5 text-sm text-slate-500 dark:text-slate-300">
                You have not saved any student profiles yet. Visit the student directory and save the strongest fits to build a real shortlist.
              </div>
            )}
          </div>
        </section>

        <section className="command-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="data-kicker">Opportunity shortlist</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                Saved project radar
              </h2>
            </div>
            <Link href={'/projects' as Route} className="btn-primary">
              Open project board
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {loading ? (
              <div className="rail-card p-4 text-sm text-slate-500 dark:text-slate-300">
                Loading saved projects...
              </div>
            ) : projectItems.length ? (
              projectItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href as Route}
                  className="rail-card group p-4 transition hover:-translate-y-0.5 hover:border-brand-300/70 hover:shadow-[0_18px_40px_rgba(14,165,233,0.12)] dark:hover:border-brand-500/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                        {item.subtitle || 'Saved project signal'}
                      </p>
                    </div>
                    <span className="stat-orb h-11 w-11 rounded-2xl">
                      <Sparkles size={16} />
                    </span>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-300">
                    Return to project board
                    <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="rail-card border-dashed p-5 text-sm text-slate-500 dark:text-slate-300">
                No saved project briefs yet. Save standout opportunities from the project board to keep your next move close.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 command-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="data-kicker">Realtime subscriptions</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              Saved search alerts
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-300">
              These search subscriptions stay live in Firestore and update in this radar view without a refresh.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={'/students' as Route} className="btn-primary">
              Create student alert
            </Link>
            <Link
              href={'/projects' as Route}
              className="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
            >
              Create project alert
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {subscriptions.length ? (
            subscriptions.map((subscription) => (
              <div key={subscription.id} className="rail-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge capitalize">{subscription.targetType}</span>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {subscription.title}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                      {subscription.description || 'Saved search alert'}
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-600 dark:text-brand-300">
                      {getMatchCount(subscription)} live match{getMatchCount(subscription) === 1 ? '' : 'es'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteSubscription(subscription.id)}
                    disabled={removingId === subscription.id}
                    className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-rose-300 hover:text-rose-500 dark:border-slate-700 dark:text-slate-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href={subscription.href as Route} className="btn-primary">
                    Open alert
                  </Link>
                  <span className="control-pill">Realtime subscribed</span>
                </div>
              </div>
            ))
          ) : (
            <div className="rail-card border-dashed p-5 text-sm text-slate-500 dark:text-slate-300 lg:col-span-2">
              No saved search alerts yet. Save a student or project search from the directory/board and it will appear here live.
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
