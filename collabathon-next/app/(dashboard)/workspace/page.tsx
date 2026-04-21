'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarRange,
  FolderKanban,
  Layers3,
  Plus,
  Rocket,
  Sparkles,
  Target,
  UsersRound
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { AppShell } from '@/components/layout/app-shell';
import { auth } from '@/lib/firebase';
import {
  createSprint,
  createTeamTask,
  getProjectById,
  getUserRecord,
  listTeamSprints,
  listTeams,
  listTeamsForUser,
  listTeamTasks,
  updateSprintStatus,
  updateTeamTask
} from '@/lib/firestore';
import { pushToast } from '@/components/ui/toaster';
import type { Project, Sprint, Team, TeamTask } from '@/types';
import type { UserRole } from '@/lib/roles';

const taskColumns: Array<{ key: TeamTask['status']; label: string }> = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' }
];

const sprintStatusOptions: Sprint['status'][] = ['planned', 'active', 'completed'];

export default function WorkspacePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamProjects, setTeamProjects] = useState<Record<string, Project | null>>({});
  const [activeTeamId, setActiveTeamId] = useState('');
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTask, setSavingTask] = useState(false);
  const [savingSprint, setSavingSprint] = useState(false);
  const [workingTaskId, setWorkingTaskId] = useState<string | null>(null);
  const [workingSprintId, setWorkingSprintId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo' as TeamTask['status'],
    priority: 'medium' as TeamTask['priority'],
    storyPoints: '3',
    dueDate: '',
    labels: ''
  });
  const [newSprint, setNewSprint] = useState({
    title: '',
    goal: '',
    status: 'planned' as Sprint['status'],
    startDate: '',
    endDate: '',
    velocityTarget: '12'
  });

  useEffect(() => onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null)), []);

  useEffect(() => {
    if (!userId) {
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

        const loadedTeams =
          userRecord?.role === 'admin'
            ? await listTeams()
            : userRecord?.role === 'client'
              ? await listTeams({ clientId: userId })
              : await listTeamsForUser(userId);

        if (cancelled) return;
        setTeams(loadedTeams);

        const projects = await Promise.all(
          loadedTeams.map(async (team) => [team.id, await getProjectById(team.projectId)] as const)
        );
        if (cancelled) return;
        setTeamProjects(Object.fromEntries(projects));

        const requestedTeam =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('team')
            : null;
        const nextTeamId = requestedTeam && loadedTeams.some((team) => team.id === requestedTeam)
          ? requestedTeam
          : loadedTeams[0]?.id || '';
        setActiveTeamId(nextTeamId);
      } catch (error: any) {
        if (!cancelled) pushToast(error?.message || 'Unable to load workspace.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!activeTeamId) {
      setTasks([]);
      setSprints([]);
      return;
    }

    let cancelled = false;
    Promise.all([listTeamTasks(activeTeamId), listTeamSprints(activeTeamId)])
      .then(([loadedTasks, loadedSprints]) => {
        if (cancelled) return;
        setTasks(loadedTasks);
        setSprints(loadedSprints);
      })
      .catch((error: any) => {
        if (!cancelled) pushToast(error?.message || 'Unable to load team workspace.');
      });

    return () => {
      cancelled = true;
    };
  }, [activeTeamId]);

  const selectedTeam = teams.find((team) => team.id === activeTeamId) || null;
  const selectedProject = selectedTeam ? teamProjects[selectedTeam.id] : null;
  const activeSprint = sprints.find((sprint) => sprint.status === 'active') || sprints[0] || null;

  const groupedTasks = useMemo(() => {
    return taskColumns.map((column) => ({
      ...column,
      tasks: tasks.filter((task) => task.status === column.key)
    }));
  }, [tasks]);

  const taskMetrics = useMemo(
    () => ({
      total: tasks.length,
      done: tasks.filter((task) => task.status === 'done').length,
      inFlight: tasks.filter((task) => ['todo', 'in-progress', 'review'].includes(task.status)).length,
      sprintCount: sprints.length
    }),
    [sprints.length, tasks]
  );

  function updateTeamSelection(teamId: string) {
    setActiveTeamId(teamId);
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    params.set('team', teamId);
    router.replace(`/workspace?${params.toString()}`);
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTeamId || !userId) return;

    if (!newTask.title.trim()) {
      pushToast('Add a task title first.');
      return;
    }

    setSavingTask(true);
    try {
      await createTeamTask(
        activeTeamId,
        {
          title: newTask.title.trim(),
          description: newTask.description.trim(),
          status: newTask.status,
          priority: newTask.priority,
          storyPoints: Number(newTask.storyPoints) || undefined,
          dueDate: newTask.dueDate || undefined,
          labels: newTask.labels
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          sprintId: activeSprint?.id,
          assigneeIds: [userId]
        },
        userId
      );
      const refreshedTasks = await listTeamTasks(activeTeamId);
      setTasks(refreshedTasks);
      setNewTask({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        storyPoints: '3',
        dueDate: '',
        labels: ''
      });
      pushToast('Task added to the workspace.');
    } catch (error: any) {
      pushToast(error?.message || 'Unable to create task.');
    } finally {
      setSavingTask(false);
    }
  }

  async function handleCreateSprint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTeamId || !userId) return;

    if (!newSprint.title.trim()) {
      pushToast('Add a sprint title first.');
      return;
    }

    setSavingSprint(true);
    try {
      await createSprint(
        activeTeamId,
        {
          title: newSprint.title.trim(),
          goal: newSprint.goal.trim(),
          status: newSprint.status,
          startDate: newSprint.startDate || undefined,
          endDate: newSprint.endDate || undefined,
          velocityTarget: Number(newSprint.velocityTarget) || undefined,
          createdBy: userId
        },
        userId
      );
      const refreshedSprints = await listTeamSprints(activeTeamId);
      setSprints(refreshedSprints);
      setNewSprint({
        title: '',
        goal: '',
        status: 'planned',
        startDate: '',
        endDate: '',
        velocityTarget: '12'
      });
      pushToast('Sprint created.');
    } catch (error: any) {
      pushToast(error?.message || 'Unable to create sprint.');
    } finally {
      setSavingSprint(false);
    }
  }

  async function moveTask(task: TeamTask, direction: -1 | 1) {
    const currentIndex = taskColumns.findIndex((column) => column.key === task.status);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= taskColumns.length || !userId) return;

    setWorkingTaskId(task.id);
    try {
      await updateTeamTask(task.id, { status: taskColumns[nextIndex].key }, userId);
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, status: taskColumns[nextIndex].key } : item
        )
      );
    } catch (error: any) {
      pushToast(error?.message || 'Unable to move task.');
    } finally {
      setWorkingTaskId(null);
    }
  }

  async function changeSprintStatus(sprint: Sprint, status: Sprint['status']) {
    if (!userId) return;
    setWorkingSprintId(sprint.id);
    try {
      await updateSprintStatus(sprint.id, status, userId);
      const refreshedSprints = await listTeamSprints(activeTeamId);
      setSprints(refreshedSprints);
    } catch (error: any) {
      pushToast(error?.message || 'Unable to update sprint.');
    } finally {
      setWorkingSprintId(null);
    }
  }

  return (
    <AppShell>
      <section className="mesh-panel p-5 sm:p-7 text-white">
        <div className="relative z-[1] flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="data-kicker text-cyan-200">Team workspace</p>
            <h1 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              Run delivery like a real product team with sprints, board movement, and shared execution context.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              This workspace turns accepted applications into an actual execution surface: team selection, sprint setup, task flow, and delivery visibility.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:min-w-[320px] sm:grid-cols-2 lg:min-w-[620px] lg:grid-cols-4 xl:min-w-[520px] xl:grid-cols-2">
            {[
              { label: 'Teams', value: teams.length, icon: UsersRound },
              { label: 'Tasks', value: taskMetrics.total, icon: FolderKanban },
              { label: 'In flight', value: taskMetrics.inFlight, icon: Rocket },
              { label: 'Sprints', value: taskMetrics.sprintCount, icon: CalendarRange }
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-3">
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.84fr,1.16fr]">
        <section className="command-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="data-kicker">Workspace roster</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                Select a live team
              </h2>
            </div>
            <div className="stat-orb h-12 w-12 rounded-[18px]">
              <Layers3 size={18} />
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {teams.length === 0 ? (
              <div className="rail-card border-dashed p-5 text-sm text-slate-500 dark:text-slate-300">
                No team workspaces yet. Accept an application from the project board to seed a workspace automatically.
              </div>
            ) : (
              teams.map((team) => {
                const active = team.id === activeTeamId;
                const project = teamProjects[team.id];
                return (
                  <button
                    key={team.id}
                    onClick={() => updateTeamSelection(team.id)}
                    className={`${active ? 'spotlight-card' : 'rail-card'} p-4 text-left transition hover:-translate-y-0.5`}
                  >
                    <div className="relative z-[1] flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {team.workspaceName || project?.title || 'Team Workspace'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {project?.title || team.projectId}
                        </p>
                      </div>
                      <span className="badge capitalize">{team.status || 'active'}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="aura-card p-6">
          <div className="relative z-[1]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
              <div>
                <p className="data-kicker">Active workspace</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                  {selectedTeam?.workspaceName || selectedProject?.title || 'Choose a team'}
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  {selectedProject?.description || 'Select a workspace to load sprint and task controls.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeSprint ? <span className="glass-chip">Active sprint: {activeSprint.title}</span> : null}
                {selectedProject?.priority ? <span className="glass-chip capitalize">{selectedProject.priority}</span> : null}
                {selectedTeam?.status ? <span className="glass-chip capitalize">{selectedTeam.status}</span> : null}
              </div>
            </div>

            {selectedTeam ? (
              <>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="insight-card">
                    <div className="relative z-[1]">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        Members
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                        {selectedTeam.memberIds.length}
                      </p>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                        Students and stakeholders in the active workspace.
                      </p>
                    </div>
                  </div>
                  <div className="insight-card">
                    <div className="relative z-[1]">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        Done
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                        {taskMetrics.done}
                      </p>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                        Tasks already shipped through the board.
                      </p>
                    </div>
                  </div>
                  <div className="insight-card">
                    <div className="relative z-[1]">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        In flight
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                        {taskMetrics.inFlight}
                      </p>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                        Tasks moving across active delivery lanes.
                      </p>
                    </div>
                  </div>
                  <div className="insight-card">
                    <div className="relative z-[1]">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        Sprint pulse
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                        {activeSprint?.velocityTarget || 12}
                      </p>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                        Target points for the currently emphasized sprint.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <form onSubmit={handleCreateSprint} className="command-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="data-kicker">Sprint ops</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Create sprint</h3>
                      </div>
                      <Plus size={18} className="text-brand-500" />
                    </div>
                    <div className="mt-4 grid gap-3">
                      <input className="field-shell w-full" placeholder="Sprint title" value={newSprint.title} onChange={(event) => setNewSprint((current) => ({ ...current, title: event.target.value }))} />
                      <textarea className="field-shell w-full" rows={3} placeholder="Sprint goal" value={newSprint.goal} onChange={(event) => setNewSprint((current) => ({ ...current, goal: event.target.value }))} />
                      <div className="grid gap-3 md:grid-cols-2">
                        <input className="field-shell w-full" type="date" value={newSprint.startDate} onChange={(event) => setNewSprint((current) => ({ ...current, startDate: event.target.value }))} />
                        <input className="field-shell w-full" type="date" value={newSprint.endDate} onChange={(event) => setNewSprint((current) => ({ ...current, endDate: event.target.value }))} />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <select className="field-shell w-full" value={newSprint.status} onChange={(event) => setNewSprint((current) => ({ ...current, status: event.target.value as Sprint['status'] }))}>
                          {sprintStatusOptions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <input className="field-shell w-full" type="number" min="1" value={newSprint.velocityTarget} onChange={(event) => setNewSprint((current) => ({ ...current, velocityTarget: event.target.value }))} placeholder="Velocity target" />
                      </div>
                      <button type="submit" className="btn-primary w-full" disabled={savingSprint}>
                        {savingSprint ? 'Creating sprint...' : 'Create sprint'}
                      </button>
                    </div>
                  </form>

                  <form onSubmit={handleCreateTask} className="command-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="data-kicker">Execution lane</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Add task</h3>
                      </div>
                      <Target size={18} className="text-brand-500" />
                    </div>
                    <div className="mt-4 grid gap-3">
                      <input className="field-shell w-full" placeholder="Task title" value={newTask.title} onChange={(event) => setNewTask((current) => ({ ...current, title: event.target.value }))} />
                      <textarea className="field-shell w-full" rows={3} placeholder="Task details" value={newTask.description} onChange={(event) => setNewTask((current) => ({ ...current, description: event.target.value }))} />
                      <div className="grid gap-3 md:grid-cols-2">
                        <select className="field-shell w-full" value={newTask.status} onChange={(event) => setNewTask((current) => ({ ...current, status: event.target.value as TeamTask['status'] }))}>
                          {taskColumns.map((column) => (
                            <option key={column.key} value={column.key}>{column.label}</option>
                          ))}
                        </select>
                        <select className="field-shell w-full" value={newTask.priority} onChange={(event) => setNewTask((current) => ({ ...current, priority: event.target.value as TeamTask['priority'] }))}>
                          {['low', 'medium', 'high', 'critical'].map((priority) => (
                            <option key={priority} value={priority}>{priority}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input className="field-shell w-full" type="number" min="1" value={newTask.storyPoints} onChange={(event) => setNewTask((current) => ({ ...current, storyPoints: event.target.value }))} placeholder="Story points" />
                        <input className="field-shell w-full" type="date" value={newTask.dueDate} onChange={(event) => setNewTask((current) => ({ ...current, dueDate: event.target.value }))} />
                      </div>
                      <input className="field-shell w-full" placeholder="Labels (comma separated)" value={newTask.labels} onChange={(event) => setNewTask((current) => ({ ...current, labels: event.target.value }))} />
                      <button type="submit" className="btn-primary w-full" disabled={savingTask}>
                        {savingTask ? 'Adding task...' : 'Add task'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-[0.88fr,1.12fr]">
                  <section className="spotlight-card p-5">
                    <div className="relative z-[1] flex items-center justify-between gap-3">
                      <div>
                        <p className="data-kicker">Sprint board</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Current sprints</h3>
                      </div>
                      <span className="glass-chip">{sprints.length} total</span>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {sprints.length === 0 ? (
                        <div className="rail-card border-dashed p-5 text-sm text-slate-500 dark:text-slate-300">No sprints yet. Create the first sprint to shape delivery.</div>
                      ) : (
                        sprints.map((sprint) => (
                          <div key={sprint.id} className="timeline-card pl-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{sprint.title}</p>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{sprint.goal || 'No sprint goal set yet.'}</p>
                              </div>
                              <span className="badge capitalize">{sprint.status}</span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {sprintStatusOptions.map((status) => (
                                <button key={status} type="button" disabled={workingSprintId === sprint.id || sprint.status === status} onClick={() => void changeSprintStatus(sprint, status)} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${sprint.status === status ? 'bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950' : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200'}`}>
                                  {status}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="command-surface p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="data-kicker">Kanban board</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Task flow</h3>
                      </div>
                      <span className="glass-chip">{taskMetrics.done}/{taskMetrics.total} done</span>
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-5">
                      {groupedTasks.map((column) => (
                        <div key={column.key} className="kanban-lane space-y-3">
                          <div className="rounded-[22px] border border-slate-200/80 bg-white/70 p-3 text-center dark:border-slate-800 dark:bg-slate-950/60">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{column.label}</p>
                            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{column.tasks.length}</p>
                          </div>
                          <div className="space-y-3">
                            {column.tasks.length === 0 ? (
                              <div className="rail-card border-dashed p-4 text-xs text-slate-500 dark:text-slate-300">No tasks</div>
                            ) : (
                              column.tasks.map((task) => (
                                <div key={task.id} className="kanban-ticket">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="badge capitalize">{task.priority}</span>
                                    {task.storyPoints ? <span className="glass-chip">{task.storyPoints} pts</span> : null}
                                  </div>
                                  <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{task.title}</p>
                                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">{task.description || 'No task details yet.'}</p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {(task.labels || []).map((label) => (
                                      <span key={label} className="signal-pill">{label}</span>
                                    ))}
                                  </div>
                                  <div className="mt-4 score-meter">
                                    <span
                                      style={{
                                        width:
                                          task.status === 'done'
                                            ? '100%'
                                            : task.status === 'review'
                                              ? '84%'
                                              : task.status === 'in-progress'
                                                ? '62%'
                                                : task.status === 'todo'
                                                  ? '38%'
                                                  : '18%'
                                      }}
                                    />
                                  </div>
                                  <div className="mt-4 flex items-center justify-between gap-2">
                                    <button type="button" onClick={() => void moveTask(task, -1)} disabled={workingTaskId === task.id || column.key === 'backlog'} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200">Back</button>
                                    <button type="button" onClick={() => void moveTask(task, 1)} disabled={workingTaskId === task.id || column.key === 'done'} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200">Forward</button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </>
            ) : (
              <div className="mt-5 rail-card border-dashed p-6 text-sm text-slate-500 dark:text-slate-300">
                No workspace selected yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
