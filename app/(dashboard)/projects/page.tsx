'use client';

import Link from 'next/link';
import { type Route } from 'next';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  BellPlus,
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  Layers3,
  Radar,
  Sparkles,
  UsersRound
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { AppShell } from '@/components/layout/app-shell';
import { auth } from '@/lib/firebase';
import {
  acceptApplication,
  createSearchSubscription,
  getUserRecord,
  listApplications,
  listProjects,
  listWatchlistItems,
  rejectApplication,
  toggleWatchlistItem,
  updateProjectStatus
} from '@/lib/firestore';
import { ApplyButton, ProjectComposer } from './project-actions';
import { pushToast } from '@/components/ui/toaster';
import { getErrorMessage } from '@/lib/errors';
import type { Application, Project } from '@/types';
import type { UserRole } from '@/lib/roles';

function statusTone(status: Project['status']) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
    case 'in-progress':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
    default:
      return 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200';
  }
}

function ProjectsPageClient() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [queryText, setQueryText] = useState(searchParams.get('query') ?? '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? 'all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [savingSearch, setSavingSearch] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null)), []);

  useEffect(() => {
    const nextQuery = searchParams.get('query') ?? '';
    const nextStatus = searchParams.get('status') ?? 'all';
    setQueryText((current) => (current === nextQuery ? current : nextQuery));
    setStatusFilter((current) => (current === nextStatus ? current : nextStatus));
  }, [searchParams]);

  useEffect(() => {
    if (!userId) {
      setSavedProjectIds([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const items = await listWatchlistItems(userId, 'project');
        if (!cancelled) setSavedProjectIds(items.map((item) => item.targetId));
      } catch (error: unknown) {
        if (!cancelled) pushToast(getErrorMessage(error, 'Unable to load saved briefs.'));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const loadPageData = useCallback(async (activeUserId = userId) => {
    if (!activeUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userRecord = await getUserRecord(activeUserId);
      const nextRole = userRecord?.role ?? null;
      setRole(nextRole);

      if (nextRole === 'client') {
        const clientProjects = await listProjects({ clientId: activeUserId });
        const groupedApplications = await Promise.all(
          clientProjects.map((project) => listApplications({ projectId: project.id }))
        );
        setProjects(clientProjects);
        setApplications(groupedApplications.flat());
        return;
      }

      if (nextRole === 'admin') {
        const [allProjects, allApplications] = await Promise.all([
          listProjects(),
          listApplications()
        ]);
        setProjects(allProjects);
        setApplications(allApplications);
        return;
      }

      const [allProjects, myApplications] = await Promise.all([
        listProjects(),
        listApplications({ studentId: activeUserId })
      ]);

      setProjects(allProjects);
      setApplications(myApplications);
    } catch (error: unknown) {
      pushToast(getErrorMessage(error, 'Unable to load projects.'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  const applicationMap = useMemo(
    () =>
      applications.reduce<Record<string, Application[]>>((acc, application) => {
        if (!acc[application.projectId]) acc[application.projectId] = [];
        acc[application.projectId].push(application);
        return acc;
      }, {}),
    [applications]
  );

  const myApplicationByProject = useMemo(
    () =>
      applications.reduce<Record<string, Application>>((acc, application) => {
        acc[application.projectId] = application;
        return acc;
      }, {}),
    [applications]
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesStatus = statusFilter === 'all' ? true : project.status === statusFilter;
      const normalizedQuery = queryText.trim().toLowerCase();
      const matchesQuery = normalizedQuery
        ? [project.title, project.description, project.requiredSkills.join(' ')]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
        : true;
      return matchesStatus && matchesQuery;
    });
  }, [projects, queryText, statusFilter]);

  const metrics =
    role === 'client'
      ? [
          { label: 'Open briefs', value: projects.filter((project) => project.status === 'open').length, icon: BriefcaseBusiness },
          { label: 'Pending applicants', value: applications.filter((application) => application.status === 'pending').length, icon: UsersRound },
          { label: 'Active deliveries', value: projects.filter((project) => project.status === 'in-progress').length, icon: Layers3 },
          { label: 'Saved radar', value: savedProjectIds.length, icon: Radar }
        ]
      : [
          { label: 'Open roles', value: projects.filter((project) => project.status === 'open').length, icon: BriefcaseBusiness },
          { label: 'My applications', value: applications.length, icon: Sparkles },
          { label: 'Accepted', value: applications.filter((application) => application.status === 'accepted').length, icon: UsersRound },
          { label: 'Saved radar', value: savedProjectIds.length, icon: Radar }
        ];

  async function handleToggleSaved(project: Project) {
    if (!userId) {
      pushToast('Sign in to save briefs to your radar.');
      return;
    }

    setWorkingId(`save-${project.id}`);
    try {
      const result = await toggleWatchlistItem(userId, {
        targetType: 'project',
        targetId: project.id,
        title: project.title,
        subtitle: project.deadline ? `Deadline ${project.deadline}` : 'Saved project signal',
        href: `/projects/${project.id}`
      });

      setSavedProjectIds((current) =>
        result.saved
          ? Array.from(new Set([...current, project.id]))
          : current.filter((entry) => entry !== project.id)
      );
      pushToast(
        result.saved
          ? `${project.title} added to your saved radar.`
          : `${project.title} removed from your saved radar.`
      );
    } catch (error: unknown) {
      pushToast(getErrorMessage(error, 'Unable to update saved radar.'));
    } finally {
      setWorkingId(null);
    }
  }

  async function handleSaveSearch() {
    if (!userId) {
      pushToast('Sign in to save search alerts.');
      return;
    }

    if (!queryText.trim() && statusFilter === 'all') {
      pushToast('Add a query or status filter before saving a search alert.');
      return;
    }

    setSavingSearch(true);
    try {
      const params = new URLSearchParams();
      if (queryText.trim()) params.set('query', queryText.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);

      await createSearchSubscription(userId, {
        targetType: 'project',
        title:
          queryText.trim() && statusFilter !== 'all'
            ? `${statusFilter} briefs · ${queryText.trim()}`
            : queryText.trim()
              ? `Project search · ${queryText.trim()}`
              : `${statusFilter} briefs`,
        description: 'Saved project board alert',
        href: `/projects?${params.toString()}`,
        query: queryText.trim(),
        filters: {
          query: queryText.trim() || null,
          status: statusFilter
        }
      });

      pushToast('Project search alert saved to your radar.');
    } catch (error: unknown) {
      pushToast(getErrorMessage(error, 'Unable to save search alert.'));
    } finally {
      setSavingSearch(false);
    }
  }

  return (
    <AppShell>
      <section className="hero-panel p-5 sm:p-7 text-white">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="data-kicker text-cyan-200">
              {role === 'client' ? 'Client portfolio board' : 'Talent marketplace'}
            </p>
            <h1 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              {role === 'client'
                ? 'Run briefs like a serious product studio.'
                : 'Discover projects with clearer fit, signal, and momentum.'}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              {role === 'client'
                ? 'Create premium listings, review applicants, and move accepted students into active delivery without leaving the workspace.'
                : 'Apply with context, track your status, and spot the projects that match your stack best.'}
            </p>
          </div>
          <div className="grid w-full gap-3 md:min-w-[260px]">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="hero-metric-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{metric.label}</p>
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr,1.08fr]">
        <section className="aura-card p-6">
          {role === 'client' ? (
            <div className="grid gap-4">
              <ProjectComposer onProjectCreated={(project) => setProjects((current) => [project, ...current])} />
              <div className="rail-card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Saved radar
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Pin the briefs you want to revisit quickly from your command lane.
                  </p>
                </div>
                <Link href="/watchlist" className="btn-primary">
                  Open saved radar
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="data-kicker">Application status</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    Your pipeline
                  </h2>
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950">
                  <Sparkles size={18} />
                </div>
              </div>

              <div className="grid gap-3">
                {['pending', 'accepted', 'rejected'].map((status) => (
                  <div key={status} className="rail-card p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {status}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                      {applications.filter((application) => application.status === status).length}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rail-card border-dashed p-4 text-sm text-slate-500 dark:text-slate-300">
                Clients see applications in real time. Students can reapply after a rejection with a
                stronger note and updated portfolio story.
              </div>

              <div className="rail-card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Saved radar
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Keep standout briefs nearby so you can return without hunting through the board.
                  </p>
                </div>
                <Link href="/watchlist" className="btn-primary">
                  Open saved radar
                </Link>
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-4">
          <div className="command-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="data-kicker">Search ops</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                  Filter the live brief board
                </h2>
              </div>
              <Link href="/watchlist" className="control-pill">
                Open radar
              </Link>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr,0.8fr,auto]">
              <input
                value={queryText}
                onChange={(event) => setQueryText(event.target.value)}
                className="field-shell w-full"
                placeholder="Search title, brief details, or required skills"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="field-shell w-full"
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:text-slate-200"
                disabled={savingSearch}
                onClick={() => void handleSaveSearch()}
              >
                <span className="inline-flex items-center gap-2">
                  <BellPlus size={15} />
                  {savingSearch ? 'Saving alert...' : 'Save search alert'}
                </span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rail-card p-5 text-sm text-slate-500 dark:text-slate-300">Loading projects...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="rail-card p-6 text-sm text-slate-500 dark:text-slate-300">
              No projects match the current filters. Try widening your search or saving this setup as an alert for later.
            </div>
          ) : (
            filteredProjects.map((project) => {
              const projectApplications = applicationMap[project.id] || [];
              const myApplication = myApplicationByProject[project.id];

              return (
                <article key={project.id} className="spotlight-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`badge capitalize ${statusTone(project.status)}`}>
                          {project.status}
                        </span>
                        {project.priority ? (
                          <span className="badge capitalize">{project.priority}</span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleToggleSaved(project)}
                          disabled={workingId === `save-${project.id}`}
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${
                            savedProjectIds.includes(project.id)
                              ? 'bg-brand-500 text-white shadow-[0_12px_30px_rgba(14,165,233,0.28)]'
                              : 'border border-slate-200 bg-white/85 text-slate-700 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200'
                          }`}
                        >
                          {savedProjectIds.includes(project.id) ? (
                            <BookmarkCheck size={14} />
                          ) : (
                            <Bookmark size={14} />
                          )}
                          {workingId === `save-${project.id}`
                            ? 'Saving...'
                            : savedProjectIds.includes(project.id)
                              ? 'Saved'
                              : 'Save'}
                        </button>
                      </div>
                      <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
                        {project.title}
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">
                        {project.description}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-500 dark:text-slate-300">
                      <p>{project.budget ? `Budget $${project.budget}` : 'Budget flexible'}</p>
                      <p className="mt-1">
                        {project.deadline ? `Deadline ${project.deadline}` : 'No deadline set'}
                      </p>
                      <p className="mt-1">
                        {projectApplications.length} applicant{projectApplications.length === 1 ? '' : 's'}
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
                    <span
                      style={{
                        width:
                          project.status === 'completed'
                            ? '100%'
                            : project.status === 'in-progress'
                              ? '68%'
                              : '34%'
                      }}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href={`/projects/${project.id}` as Route} className="btn-primary">
                      Open brief
                    </Link>
                    <Link
                      href={'/watchlist' as Route}
                      className="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                    >
                      View saved radar
                    </Link>
                  </div>

                  {role === 'client' ? (
                    <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
                      <div className="rail-card p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                          Project controls
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(['open', 'in-progress', 'completed'] as Project['status'][]).map((status) => (
                            <button
                              key={status}
                              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                                project.status === status
                                  ? 'bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950'
                                  : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200'
                              }`}
                              disabled={workingId === project.id}
                              onClick={async () => {
                                setWorkingId(project.id);
                                try {
                                  await updateProjectStatus(project.id, status, userId || undefined);
                                  setProjects((current) =>
                                    current.map((item) =>
                                      item.id === project.id ? { ...item, status } : item
                                    )
                                  );
                                  pushToast('Project status updated.');
                                } catch (error: unknown) {
                                  pushToast(getErrorMessage(error, 'Unable to update project.'));
                                } finally {
                                  setWorkingId(null);
                                }
                              }}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rail-card p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                          Applicant lane
                        </p>
                        <div className="mt-3 grid gap-3">
                          {projectApplications.length === 0 ? (
                            <div className="rail-card border-dashed p-4 text-sm text-slate-500 dark:text-slate-300">
                              No applicants yet. Strong briefs tend to attract talent quickly.
                            </div>
                          ) : (
                            projectApplications.map((application) => (
                              <div key={application.id} className="rail-card p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                      {application.studentName || application.studentId}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {application.studentEmail || application.studentId}
                                    </p>
                                  </div>
                                  <span className="badge capitalize">{application.status}</span>
                                </div>
                                <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">
                                  {application.message || 'No intro note provided.'}
                                </p>
                                <div className="mt-3 flex gap-2">
                                  <button
                                    className="btn-primary"
                                    disabled={workingId === application.id || application.status === 'accepted'}
                                    onClick={async () => {
                                      setWorkingId(application.id);
                                      try {
                                        await acceptApplication(application.id);
                                        await loadPageData();
                                        pushToast('Applicant accepted and team created.');
                                      } catch (error: unknown) {
                                        pushToast(getErrorMessage(error, 'Unable to accept applicant.'));
                                      } finally {
                                        setWorkingId(null);
                                      }
                                    }}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
                                    disabled={workingId === application.id || application.status === 'rejected'}
                                    onClick={async () => {
                                      setWorkingId(application.id);
                                      try {
                                        await rejectApplication(application.id);
                                        await loadPageData();
                                        pushToast('Applicant updated.');
                                      } catch (error: unknown) {
                                        pushToast(getErrorMessage(error, 'Unable to update applicant.'));
                                      } finally {
                                        setWorkingId(null);
                                      }
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        {myApplication ? (
                          <div className="rail-card p-4 text-sm text-slate-500 dark:text-slate-300">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              Your status: <span className="capitalize">{myApplication.status}</span>
                            </p>
                            <p className="mt-2">
                              {myApplication.message || 'You have already applied to this project.'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 dark:text-slate-300">
                            No application yet. Add context about your fit and current availability.
                          </p>
                        )}
                      </div>
                      <ApplyButton
                        projectId={project.id}
                        applicationStatus={myApplication?.status}
                        onApplied={() => void loadPageData()}
                      />
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<AppShell><div className="card p-6 text-sm text-slate-500 dark:text-slate-300">Loading project board...</div></AppShell>}>
      <ProjectsPageClient />
    </Suspense>
  );
}
