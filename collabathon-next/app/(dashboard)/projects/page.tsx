'use client';

import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Layers3, Sparkles, UsersRound } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { AppShell } from '@/components/layout/app-shell';
import { auth } from '@/lib/firebase';
import {
  acceptApplication,
  getUserRecord,
  listApplications,
  listProjects,
  rejectApplication,
  updateProjectStatus
} from '@/lib/firestore';
import { ApplyButton, ProjectComposer } from './project-actions';
import { pushToast } from '@/components/ui/toaster';
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

export default function ProjectsPage() {
  const [userId, setUserId] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null)), []);

  async function loadPageData(activeUserId = userId) {
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
    } catch (error: any) {
      pushToast(error?.message || 'Unable to load projects.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPageData();
  }, [userId]);

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

  const metrics =
    role === 'client'
      ? [
          { label: 'Open briefs', value: projects.filter((project) => project.status === 'open').length, icon: BriefcaseBusiness },
          { label: 'Pending applicants', value: applications.filter((application) => application.status === 'pending').length, icon: UsersRound },
          { label: 'Active deliveries', value: projects.filter((project) => project.status === 'in-progress').length, icon: Layers3 }
        ]
      : [
          { label: 'Open roles', value: projects.filter((project) => project.status === 'open').length, icon: BriefcaseBusiness },
          { label: 'My applications', value: applications.length, icon: Sparkles },
          { label: 'Accepted', value: applications.filter((application) => application.status === 'accepted').length, icon: UsersRound }
        ];

  return (
    <AppShell>
      <section className="hero-panel p-7 text-white">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="data-kicker text-cyan-200">
              {role === 'client' ? 'Client portfolio board' : 'Talent marketplace'}
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-5xl">
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
          <div className="grid min-w-[260px] gap-3">
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
            <ProjectComposer onProjectCreated={(project) => setProjects((current) => [project, ...current])} />
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
            </div>
          )}
        </section>

        <section className="grid gap-4">
          {loading ? (
            <div className="rail-card p-5 text-sm text-slate-500 dark:text-slate-300">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="rail-card p-6 text-sm text-slate-500 dark:text-slate-300">
              No projects yet. Start by creating a brief or checking back once the marketplace is
              populated.
            </div>
          ) : (
            projects.map((project) => {
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
                                  await updateProjectStatus(project.id, status);
                                  setProjects((current) =>
                                    current.map((item) =>
                                      item.id === project.id ? { ...item, status } : item
                                    )
                                  );
                                  pushToast('Project status updated.');
                                } catch (error: any) {
                                  pushToast(error?.message || 'Unable to update project.');
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
                                      } catch (error: any) {
                                        pushToast(error?.message || 'Unable to accept applicant.');
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
                                      } catch (error: any) {
                                        pushToast(error?.message || 'Unable to update applicant.');
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
