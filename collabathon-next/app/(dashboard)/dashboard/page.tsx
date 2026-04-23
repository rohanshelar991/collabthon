'use client';

import Link from 'next/link';
import { type Route } from 'next';
import { useEffect, useMemo, useState } from 'react';
import {
  BellRing,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Compass,
  MoveRight,
  Radar,
  Sparkles,
  UsersRound
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { AppShell } from '@/components/layout/app-shell';
import { CheckoutButton } from '@/components/ui/checkout-button';
import { auth } from '@/lib/firebase';
import {
  getProfile,
  getUserRecord,
  listApplications,
  listNotifications,
  listProjects,
  listStudents,
  listWatchlistItems,
  listTeamsForUser
} from '@/lib/firestore';
import { recommendTeammates } from '@/lib/matching';
import { pushToast } from '@/components/ui/toaster';
import type { Application, Notification, Project, StudentProfile, WatchlistItem } from '@/types';
import type { UserRole } from '@/lib/roles';

function priorityTone(priority?: Project['priority']) {
  switch (priority) {
    case 'flagship':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
    case 'starter':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
    default:
      return 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200';
  }
}

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [teams, setTeams] = useState<Array<{ id: string }>>([]);
  const [myProfile, setMyProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null)), []);

  useEffect(() => {
    if (!userId) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const userRecord = await getUserRecord(userId);
        if (cancelled) return;
        setRole(userRecord?.role ?? null);

        const [loadedStudents, loadedNotifications, savedItems] = await Promise.all([
          listStudents(),
          listNotifications(userId),
          listWatchlistItems(userId)
        ]);

        if (cancelled) return;
        setStudents(loadedStudents);
        setNotifications(loadedNotifications);
        setWatchlist(savedItems);

        if (userRecord?.role === 'client') {
          const clientProjects = await listProjects({ clientId: userId });
          const projectApplications = await Promise.all(
            clientProjects.map((project) => listApplications({ projectId: project.id }))
          );

          if (cancelled) return;
          setProjects(clientProjects);
          setApplications(projectApplications.flat());
          setTeams(
            clientProjects
              .filter((project) => project.teamId)
              .map((project) => ({ id: project.teamId! }))
          );
          setMyProfile(null);
          return;
        }

        if (userRecord?.role === 'admin') {
          const [allProjects, allApplications] = await Promise.all([
            listProjects(),
            listApplications()
          ]);

          if (cancelled) return;
          setProjects(allProjects);
          setApplications(allApplications);
          setTeams([]);
          setMyProfile(null);
          return;
        }

        const [studentProjects, myApplications, myTeams, profile] = await Promise.all([
          listProjects(),
          listApplications({ studentId: userId }),
          listTeamsForUser(userId),
          getProfile(userId)
        ]);

        if (cancelled) return;
        setProjects(studentProjects);
        setApplications(myApplications);
        setTeams(myTeams.map((team) => ({ id: team.id })));
        setMyProfile(profile);
      } catch (error: any) {
        if (!cancelled) pushToast(error?.message || 'Unable to load your dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const recommendations = useMemo(() => {
    const desiredSkills = myProfile?.skills?.length ? myProfile.skills : ['react', 'firebase', 'product'];
    return recommendTeammates(
      students.filter((student) => student.id !== userId),
      desiredSkills,
      4
    );
  }, [myProfile?.skills, students, userId]);
  const savedStudents = useMemo(
    () => watchlist.filter((item) => item.targetType === 'student').slice(0, 3),
    [watchlist]
  );
  const savedProjects = useMemo(
    () => watchlist.filter((item) => item.targetType === 'project').slice(0, 3),
    [watchlist]
  );

  const visibleProjects =
    role === 'client' ? projects : projects.filter((project) => project.status !== 'completed');
  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const pendingApplications = applications.filter((application) => application.status === 'pending');

  const statCards = useMemo(() => {
    if (role === 'client') {
      return [
        { label: 'Live briefs', value: projects.length, icon: BriefcaseBusiness },
        { label: 'Pending applicants', value: pendingApplications.length, icon: UsersRound },
        { label: 'Active teams', value: teams.length, icon: Sparkles },
        { label: 'Unread alerts', value: unreadNotifications.length, icon: BellRing }
      ];
    }

    if (role === 'admin') {
      return [
        { label: 'Platform projects', value: projects.length, icon: BriefcaseBusiness },
        { label: 'Applications', value: applications.length, icon: UsersRound },
        { label: 'Talent pool', value: students.length, icon: Sparkles },
        { label: 'Unread alerts', value: unreadNotifications.length, icon: BellRing }
      ];
    }

    return [
      {
        label: 'Open opportunities',
        value: visibleProjects.filter((project) => project.status === 'open').length,
        icon: BriefcaseBusiness
      },
      { label: 'My applications', value: applications.length, icon: Compass },
      { label: 'Active teams', value: teams.length, icon: UsersRound },
      { label: 'Unread alerts', value: unreadNotifications.length, icon: BellRing }
    ];
  }, [
    applications.length,
    pendingApplications.length,
    projects.length,
    role,
    students.length,
    teams.length,
    unreadNotifications.length,
    visibleProjects
  ]);

  const heroCopy =
    role === 'client'
      ? {
          kicker: 'Client command center',
          title: 'Turn briefs into staffed, fast-moving student teams.',
          body: 'Review project demand, monitor applicants, and keep delivery velocity high from a single control surface.',
          lane: 'Delivery orchestration',
          primaryHref: '/projects',
          primaryLabel: 'Manage live briefs',
          secondaryHref: '/students',
          secondaryLabel: 'Scout student talent'
        }
      : role === 'admin'
        ? {
            kicker: 'Admin mission control',
            title: 'See platform health, usage pressure, and project quality in realtime.',
            body: 'Keep the marketplace trustworthy with stronger visibility across users, projects, and collaboration activity.',
            lane: 'Trust and governance',
            primaryHref: '/admin',
            primaryLabel: 'Open admin suite',
            secondaryHref: '/notifications',
            secondaryLabel: 'Review alerts'
          }
        : {
            kicker: 'Student launch deck',
            title: 'Find your next build squad and ship standout work faster.',
            body: 'We highlight the best-fit teammates, live briefs, and signals that matter so you can move with momentum.',
            lane: 'Talent acceleration',
            primaryHref: '/students',
            primaryLabel: 'Discover teammates',
            secondaryHref: '/projects',
            secondaryLabel: 'Browse projects'
          };

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <section className="hero-panel p-5 sm:p-7 text-white">
          <div className="grid gap-6 lg:grid-cols-[1.06fr,0.94fr]">
            <div>
              <p className="data-kicker text-cyan-200">{heroCopy.kicker}</p>
              <h1 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                {heroCopy.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{heroCopy.body}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={heroCopy.primaryHref as Route} className="btn-primary">
                  {heroCopy.primaryLabel}
                </Link>
                <Link
                  href={heroCopy.secondaryHref as Route}
                  className="rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {heroCopy.secondaryLabel}
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="glass-chip border-white/10 bg-white/10 text-white">
                  {heroCopy.lane}
                </span>
                <span className="glass-chip border-white/10 bg-white/10 text-white">
                  {unreadNotifications.length} unread alerts
                </span>
                <span className="glass-chip border-white/10 bg-white/10 text-white">
                  {teams.length} live team spaces
                </span>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="hero-metric-card">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Mission stack</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Priority queue</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {role === 'client' ? pendingApplications.length : visibleProjects.length}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      {role === 'client'
                        ? 'Applicants waiting on a decision.'
                        : 'Live opportunities worth attention.'}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Momentum</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {Math.max(62, Math.min(96, (applications.length || notifications.length || 1) * 7))}%
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      Based on applications, alerts, and active workspace flow.
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Fast lane</p>
                    <Link
                      href="/workspace"
                      className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-white"
                    >
                      Open execution board
                      <MoveRight size={16} />
                    </Link>
                    <p className="mt-2 text-sm text-slate-300">
                      Jump straight into sprints, task flow, and team delivery.
                    </p>
                  </div>
                </div>
              </div>
              <div className="hero-metric-card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Premium controls</p>
                    <p className="mt-2 text-xl font-semibold text-white">Workspace upgrade</p>
                  </div>
                  <ChartNoAxesCombined size={18} />
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  Unlock premium collaboration tooling, sharper analytics, and advanced delivery operations from the same workspace.
                </p>
                <div className="mt-4">
                  <CheckoutButton className="btn-primary w-full" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="insight-card">
              <div className="relative z-[1] flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                    {loading ? '...' : card.value}
                  </p>
                </div>
                <div className="stat-orb h-12 w-12 rounded-[18px]">
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="spotlight-card p-6">
          <div className="relative z-[1] flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="data-kicker">Workspace execution</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                Sprint board and team ops
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-300">
                Accepted applications can now graduate into a shared team workspace with sprint planning,
                task flow, and a proper Kanban surface.
              </p>
            </div>
            <Link href="/workspace" className="btn-primary">
              Open workspace
            </Link>
          </div>
        </section>

        <section className="command-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="data-kicker">Revenue engine</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                Billing and subscription control
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-300">
                Stripe checkout, portal access, and webhook-synced subscription records are now wired
                in as a real monetization layer.
              </p>
            </div>
            <Link href="/billing" className="btn-primary">
              Open billing
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr,1fr,0.9fr]">
        <section className="aura-card p-6 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="data-kicker">Priority board</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {role === 'client'
                  ? 'Your active portfolio'
                  : role === 'admin'
                    ? 'Platform opportunity flow'
                    : 'High-signal opportunities'}
              </h2>
            </div>
            <Link
              href={role === 'admin' ? '/admin' : '/projects'}
              className="text-sm font-semibold text-brand-600"
            >
              Open full workspace
            </Link>
          </div>
          <div className="mt-5 grid gap-4">
            {loading ? (
              <div className="rail-card p-5 text-sm text-slate-500 dark:text-slate-300">
                Loading your board...
              </div>
            ) : visibleProjects.slice(0, 4).map((project) => (
              <div key={project.id} className="rail-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge capitalize ${priorityTone(project.priority)}`}>
                        {project.priority || 'growth'}
                      </span>
                      <span className="badge capitalize">{project.status}</span>
                    </div>
                    <Link
                      href={`/projects/${project.id}` as Route}
                      className="mt-3 inline-flex text-lg font-semibold text-slate-900 transition hover:text-brand-600 dark:text-white dark:hover:text-brand-300"
                    >
                      {project.title}
                    </Link>
                    <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-300">
                      {project.description}
                    </p>
                  </div>
                  <div className="text-right text-sm text-slate-500 dark:text-slate-300">
                    <p>{project.budget ? `Budget $${project.budget}` : 'Budget flexible'}</p>
                    <p className="mt-1">
                      {project.deadline ? `Deadline ${project.deadline}` : 'No deadline set'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.requiredSkills.map((skill) => (
                    <span key={skill} className="badge">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-4 score-meter">
                  <span style={{ width: `${Math.max(42, 96 - project.requiredSkills.length * 6)}%` }} />
                </div>
                <div className="mt-4 flex justify-end">
                  <Link
                    href={`/projects/${project.id}` as Route}
                    className="text-sm font-semibold text-brand-600 transition hover:text-brand-500 dark:text-brand-300"
                  >
                    Open brief
                  </Link>
                </div>
              </div>
            ))}
            {!loading && visibleProjects.length === 0 ? (
              <div className="rail-card border-dashed p-6 text-sm text-slate-500 dark:text-slate-300">
                No live items yet. Once the workspace is active, this board will become your
                main decision surface.
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6">
          <div className="spotlight-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="data-kicker">Recommended</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                  Teammate radar
                </h2>
              </div>
              <Sparkles size={18} className="text-brand-500" />
            </div>
            <div className="mt-4 grid gap-3">
              {recommendations.slice(0, 3).map((student) => (
                <Link key={student.id} href={`/students/${student.id}`} className="rail-card p-4 transition hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{student.name}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                        {student.college || 'Student collaborator'}
                      </p>
                    </div>
                    <span className="badge">{student.available ? 'Available' : 'Busy'}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {student.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="badge">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 score-meter">
                    <span style={{ width: `${Math.max(54, 92 - student.skills.length * 4)}%` }} />
                  </div>
                </Link>
              ))}
              {!loading && recommendations.length === 0 ? (
                <div className="rail-card border-dashed p-4 text-sm text-slate-500 dark:text-slate-300">
                  Build your profile to unlock teammate recommendations.
                </div>
              ) : null}
            </div>
          </div>

          <div className="spotlight-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="data-kicker">Saved radar</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                  High-signal shortlist
                </h2>
              </div>
              <Radar size={18} className="text-brand-500" />
            </div>
            <div className="mt-4 grid gap-3">
              {savedStudents.length === 0 && savedProjects.length === 0 && !loading ? (
                <div className="rail-card border-dashed p-4 text-sm text-slate-500 dark:text-slate-300">
                  Save standout students and briefs to keep your next move close.
                </div>
              ) : null}

              {[...savedStudents, ...savedProjects].map((item) => (
                <Link
                  key={item.id}
                  href={item.href as Route}
                  className="rail-card p-4 transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="badge capitalize">{item.targetType}</span>
                        <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      </div>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                        {item.subtitle || 'Saved radar signal'}
                      </p>
                    </div>
                    <MoveRight size={16} className="text-slate-400" />
                  </div>
                </Link>
              ))}

              <Link href="/watchlist" className="btn-primary justify-center">
                Open saved radar
              </Link>
            </div>
          </div>

          <div className="command-surface p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="data-kicker">Live alerts</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                  Recent signals
                </h2>
              </div>
              <BellRing size={18} className="text-brand-500" />
            </div>
            <div className="mt-4 grid gap-3">
              {notifications.slice(0, 4).map((notification) => (
                <Link key={notification.id} href="/notifications" className="rail-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="badge capitalize">{notification.type}</span>
                    {!notification.read ? (
                      <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                        Unread
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-100">
                    {notification.content}
                  </p>
                </Link>
              ))}
              {!loading && notifications.length === 0 ? (
                <div className="rail-card border-dashed p-4 text-sm text-slate-500 dark:text-slate-300">
                  No alerts yet. Once applications and messages start flowing, they will show up
                  here.
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
