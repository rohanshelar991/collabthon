'use client';

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  Activity,
  BriefcaseBusiness,
  Flag,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserRound,
  UsersRound
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { auth } from '@/lib/firebase';
import {
  listApplications,
  listAuditLogs,
  listProjects,
  listStudents,
  listUserRecords,
  updateProjectModerationStatus,
  updateUserAccountStatus
} from '@/lib/firestore';
import { pushToast } from '@/components/ui/toaster';
import type { Application, AuditLog, Project, StudentProfile, UserRecord } from '@/types';

export default function AdminPage() {
  const [actorId, setActorId] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingKey, setWorkingKey] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, (user) => setActorId(user?.uid ?? null)), []);

  async function loadAdminData() {
    const [loadedUsers, loadedProjects, loadedStudents, loadedApplications, loadedAuditLogs] =
      await Promise.all([
        listUserRecords(),
        listProjects({ includeHidden: true }),
        listStudents(),
        listApplications(),
        listAuditLogs(18)
      ]);

    setUsers(loadedUsers);
    setProjects(loadedProjects);
    setStudents(loadedStudents);
    setApplications(loadedApplications);
    setAuditLogs(loadedAuditLogs);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    loadAdminData()
      .catch((error: any) => {
        if (!cancelled) pushToast(error?.message || 'Unable to load admin data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const skillDemand = useMemo(() => {
    const demand = new Map<string, number>();
    projects.forEach((project) => {
      project.requiredSkills.forEach((skill) => {
        demand.set(skill, (demand.get(skill) || 0) + 1);
      });
    });

    const maxCount = Math.max(1, ...Array.from(demand.values()));

    return Array.from(demand.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([skill, count]) => ({
        skill,
        count,
        width: `${Math.round((count / maxCount) * 100)}%`
      }));
  }, [projects]);

  const roleBreakdown = useMemo(
    () => ({
      students: users.filter((user) => user.role === 'student').length,
      clients: users.filter((user) => user.role === 'client').length,
      admins: users.filter((user) => user.role === 'admin').length
    }),
    [users]
  );

  const statusBreakdown = useMemo(
    () => ({
      open: projects.filter((project) => project.status === 'open').length,
      inProgress: projects.filter((project) => project.status === 'in-progress').length,
      completed: projects.filter((project) => project.status === 'completed').length,
      flagged: projects.filter((project) => project.moderationStatus === 'flagged').length,
      hidden: projects.filter((project) => project.moderationStatus === 'hidden').length
    }),
    [projects]
  );

  const availabilityBreakdown = useMemo(
    () => ({
      available: students.filter((student) => student.available).length,
      busy: students.filter((student) => !student.available).length
    }),
    [students]
  );

  const governanceSignals = useMemo(
    () => [
      {
        label: 'Risk index',
        value: `${Math.round(((statusBreakdown.flagged + statusBreakdown.hidden) / Math.max(projects.length, 1)) * 100)}%`,
        detail: 'Share of briefs currently needing intervention, visibility changes, or extra review.'
      },
      {
        label: 'Review load',
        value: `${users.filter((user) => (user.accountStatus || 'active') === 'review').length}`,
        detail: 'Accounts currently paused in review before the marketplace grants full operating access.'
      },
      {
        label: 'Supply motion',
        value: `${availabilityBreakdown.available}/${students.length || 0}`,
        detail: 'Students currently marked available versus the full talent pool in the system.'
      }
    ],
    [availabilityBreakdown.available, projects.length, statusBreakdown.flagged, statusBreakdown.hidden, students.length, users]
  );

  async function moderateUser(userId: string, accountStatus: UserRecord['accountStatus']) {
    if (!actorId || !accountStatus) return;
    setWorkingKey(`user:${userId}`);
    try {
      await updateUserAccountStatus(userId, accountStatus, actorId);
      await loadAdminData();
      pushToast('User moderation status updated.');
    } catch (error: any) {
      pushToast(error?.message || 'Unable to update user moderation state.');
    } finally {
      setWorkingKey(null);
    }
  }

  async function moderateProject(
    projectId: string,
    moderationStatus: Project['moderationStatus']
  ) {
    if (!actorId || !moderationStatus) return;
    setWorkingKey(`project:${projectId}`);
    try {
      await updateProjectModerationStatus(projectId, moderationStatus, actorId);
      await loadAdminData();
      pushToast('Project moderation updated.');
    } catch (error: any) {
      pushToast(error?.message || 'Unable to update project moderation state.');
    } finally {
      setWorkingKey(null);
    }
  }

  return (
    <AppShell>
      <section className="mesh-panel p-5 sm:p-7 text-white">
        <div className="relative z-[1] flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="data-kicker text-cyan-200">Admin mission control</p>
            <h1 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              Moderate supply, demand, trust, and platform execution from one live control room.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              This surface now includes moderation actions, audit history, and delivery health so the platform can be operated like an actual product, not just observed.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:min-w-[320px] sm:grid-cols-2 lg:min-w-[520px] lg:grid-cols-3 xl:min-w-[420px] xl:grid-cols-1">
            {[
              { label: 'Users', value: users.length, icon: UsersRound },
              { label: 'Projects', value: projects.length, icon: BriefcaseBusiness },
              { label: 'Applications', value: applications.length, icon: Sparkles }
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="hero-metric-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{metric.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-white">{loading ? '...' : metric.value}</p>
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

      {loading ? (
        <div className="mt-6 card p-6 text-sm text-slate-500">Loading admin workspace...</div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
          <section className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="insight-card">
                <div className="relative z-[1]">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Flag pressure
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                    {statusBreakdown.flagged}
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    Projects currently waiting on a moderation decision.
                  </p>
                </div>
              </div>
              <div className="insight-card">
                <div className="relative z-[1]">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Account review
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                    {users.filter((user) => (user.accountStatus || 'active') === 'review').length}
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    Accounts parked in review before full access.
                  </p>
                </div>
              </div>
              <div className="insight-card">
                <div className="relative z-[1]">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Audit activity
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                    {auditLogs.length}
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    Logged moderation and automation events in view.
                  </p>
                </div>
              </div>
            </div>

            <div className="premium-terminal p-6 text-white">
              <div className="relative z-[1]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">Governance feed</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Live trust and moderation pulse</h2>
                  </div>
                  <span className="glass-chip border-white/10 bg-white/10 text-white">Ops-grade signal stack</span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {governanceSignals.map((item) => (
                    <div key={item.label} className="signal-console">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">{item.label}</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-200">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="spotlight-card p-6">
              <div className="relative z-[1] flex items-center justify-between gap-3">
                <div>
                  <p className="data-kicker">Role mix</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Platform composition</h2>
                </div>
                <div className="stat-orb h-12 w-12 rounded-[18px]">
                  <Shield size={18} />
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {[
                  { label: 'Students', value: roleBreakdown.students, accent: 'Student supply' },
                  { label: 'Clients', value: roleBreakdown.clients, accent: 'Demand side' },
                  { label: 'Admins', value: roleBreakdown.admins, accent: 'Control layer' }
                ].map((card) => (
                  <div key={card.label} className="rail-card p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{card.accent}</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{card.value}</p>
                    <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">{card.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="aura-card p-6">
              <div className="relative z-[1] flex items-center justify-between gap-3">
                <div>
                  <p className="data-kicker">Demand heatmap</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Most requested skills</h2>
                </div>
                <div className="stat-orb h-12 w-12 rounded-[18px]">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="mt-5 grid gap-4">
                {skillDemand.length === 0 ? (
                  <div className="rail-card p-5 text-sm text-slate-500 dark:text-slate-300">No project demand yet.</div>
                ) : (
                  skillDemand.map((item) => (
                    <div key={item.skill} className="rail-card p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.skill}</span>
                        <span className="badge">{item.count} briefs</span>
                      </div>
                      <div className="score-meter mt-3"><span style={{ width: item.width }} /></div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="command-surface p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="data-kicker">Audit trail</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Recent moderation + automation events</h2>
                </div>
                <div className="stat-orb h-12 w-12 rounded-[18px]">
                  <Flag size={18} />
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {auditLogs.length === 0 ? (
                  <div className="rail-card border-dashed p-4 text-sm text-slate-500 dark:text-slate-300">No audit events yet.</div>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="timeline-card pl-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{log.summary}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{log.action} · {log.actorDisplayName || log.actorId || 'system'}</p>
                        </div>
                        <span className="badge capitalize">{log.targetType}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-6">
            <div className="command-deck p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="data-kicker">Activity state</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Marketplace health</h2>
                </div>
                <div className="stat-orb h-12 w-12 rounded-[18px]">
                  <Activity size={18} />
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {[
                  { label: 'Open briefs', value: statusBreakdown.open },
                  { label: 'In progress', value: statusBreakdown.inProgress },
                  { label: 'Completed', value: statusBreakdown.completed },
                  { label: 'Flagged briefs', value: statusBreakdown.flagged },
                  { label: 'Hidden briefs', value: statusBreakdown.hidden },
                  { label: 'Available students', value: availabilityBreakdown.available },
                  { label: 'Busy students', value: availabilityBreakdown.busy }
                ].map((item) => (
                  <div key={item.label} className="rail-card flex items-center justify-between p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                        <span className="glass-chip">{item.value}</span>
                      </div>
                      <div className="mt-3 score-meter">
                        <span style={{ width: `${Math.max(18, Math.min(100, item.value * 16))}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="spotlight-card p-6">
              <div className="relative z-[1] flex items-center justify-between gap-3">
                <div>
                  <p className="data-kicker">User moderation</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Account watchlist</h2>
                </div>
                <div className="stat-orb h-12 w-12 rounded-[18px]">
                  <ShieldAlert size={18} />
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {users.slice(0, 6).map((user) => (
                  <div key={user.id} className="rail-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{user.displayName || user.email}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="badge capitalize">{user.role}</span>
                        <span className="badge capitalize">{user.accountStatus || 'active'}</span>
                      </div>
                    </div>
                    <div className="mt-3 score-meter">
                      <span
                        style={{
                          width:
                            (user.accountStatus || 'active') === 'active'
                              ? '100%'
                              : (user.accountStatus || 'active') === 'review'
                                ? '58%'
                                : '22%'
                        }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(['active', 'review', 'suspended'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={workingKey === `user:${user.id}` || (user.accountStatus || 'active') === status}
                          onClick={() => void moderateUser(user.id, status)}
                          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${(user.accountStatus || 'active') === status ? 'bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950' : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="command-surface p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="data-kicker">Project moderation</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Live briefs</h2>
                </div>
                <div className="stat-orb h-12 w-12 rounded-[18px]">
                  <UserRound size={18} />
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="rail-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{project.title}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{project.requiredSkills.join(', ')}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="badge capitalize">{project.status}</span>
                        <span className="badge capitalize">{project.moderationStatus || 'approved'}</span>
                      </div>
                    </div>
                    <div className="mt-3 score-meter">
                      <span
                        style={{
                          width:
                            (project.moderationStatus || 'approved') === 'approved'
                              ? '100%'
                              : (project.moderationStatus || 'approved') === 'flagged'
                                ? '52%'
                                : '18%'
                        }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(['approved', 'flagged', 'hidden'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={workingKey === `project:${project.id}` || (project.moderationStatus || 'approved') === status}
                          onClick={() => void moderateProject(project.id, status)}
                          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${(project.moderationStatus || 'approved') === status ? 'bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950' : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
