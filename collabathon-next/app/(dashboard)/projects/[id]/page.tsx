'use client';

import Link from 'next/link';
import { type Route } from 'next';
import { useParams } from 'next/navigation';
import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CalendarClock,
  Download,
  FileUp,
  FolderKanban,
  MessageSquareText,
  Radar,
  Sparkles,
  Trash2,
  UsersRound,
  Wallet
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { ApplyButton } from '../project-actions';
import { pushToast } from '@/components/ui/toaster';
import { auth } from '@/lib/firebase';
import {
  addProjectComment,
  addProjectAttachment,
  acceptApplication,
  deleteProjectAttachment,
  deleteProjectComment,
  getClientProfile,
  getProjectById,
  getTeamById,
  getUserRecord,
  listApplications,
  listProjectAttachments,
  listProjectActivity,
  listProjectComments,
  listWatchlistItems,
  rejectApplication,
  toggleWatchlistItem,
  updateProjectStatus
} from '@/lib/firestore';
import { deleteStorageFile, uploadProjectAttachment } from '@/lib/storage';
import type { UserRole } from '@/lib/roles';
import type {
  Application,
  AuditLog,
  ClientProfile,
  Project,
  ProjectAttachment,
  ProjectComment,
  Team,
  UserRecord
} from '@/types';

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

function formatBytes(sizeBytes?: number) {
  if (!sizeBytes) return 'Unknown size';
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [userId, setUserId] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [clientRecord, setClientRecord] = useState<UserRecord | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [myApplication, setMyApplication] = useState<Application | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null)), []);

  async function loadPage(activeUserId = userId) {
    if (!params?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [loadedProject, viewerRecord] = await Promise.all([
        getProjectById(params.id),
        activeUserId ? getUserRecord(activeUserId) : Promise.resolve(null)
      ]);

      setRole(viewerRecord?.role ?? null);
      setProject(loadedProject);

      if (!loadedProject) {
        setClientProfile(null);
        setClientRecord(null);
        setApplications([]);
        setAttachments([]);
        setComments([]);
        setActivity([]);
        setMyApplication(null);
        setTeam(null);
        setSaved(false);
        return;
      }

      const isOwner = !!activeUserId && loadedProject.clientId === activeUserId;
      const canSeeApplicantLane = viewerRecord?.role === 'admin' || isOwner;

      const [
        profile,
        ownerRecord,
        teamRecord,
        savedItems,
        projectApplications,
        myApplications,
        projectAttachments,
        projectComments,
        projectActivity
      ] =
        await Promise.all([
          getClientProfile(loadedProject.clientId),
          getUserRecord(loadedProject.clientId),
          loadedProject.teamId ? getTeamById(loadedProject.teamId) : Promise.resolve(null),
          activeUserId ? listWatchlistItems(activeUserId, 'project') : Promise.resolve([]),
          canSeeApplicantLane ? listApplications({ projectId: loadedProject.id }) : Promise.resolve([]),
          activeUserId && !canSeeApplicantLane
            ? listApplications({ studentId: activeUserId })
            : Promise.resolve([]),
          listProjectAttachments(loadedProject.id),
          listProjectComments(loadedProject.id),
          listProjectActivity(loadedProject.id)
        ]);

      setClientProfile(profile);
      setClientRecord(ownerRecord);
      setTeam(teamRecord);
      setSaved(savedItems.some((item) => item.targetId === loadedProject.id));
      setApplications(projectApplications);
      setAttachments(projectAttachments);
      setComments(projectComments);
      setActivity(projectActivity);
      setMyApplication(myApplications.find((application) => application.projectId === loadedProject.id) || null);
    } catch (error: any) {
      pushToast(error?.message || 'Unable to load project.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [params?.id, userId]);

  const stats = useMemo(() => {
    if (!project) return [];
    return [
      { label: 'Status', value: project.status, icon: Sparkles },
      { label: 'Applicants', value: String(applications.length), icon: UsersRound },
      { label: 'Budget', value: project.budget ? `$${project.budget}` : 'Flexible', icon: Wallet },
      { label: 'Deadline', value: project.deadline || 'Open ended', icon: CalendarClock }
    ];
  }, [applications.length, project]);

  const canModerateContent = role === 'admin';

  async function handleToggleSaved() {
    if (!project) return;
    if (!userId) {
      pushToast('Sign in to save briefs to your radar.');
      return;
    }

    setWorkingId('save');
    try {
      const result = await toggleWatchlistItem(userId, {
        targetType: 'project',
        targetId: project.id,
        title: project.title,
        subtitle: project.deadline ? `Deadline ${project.deadline}` : 'Saved project signal',
        href: `/projects/${project.id}`
      });
      setSaved(result.saved);
      pushToast(
        result.saved
          ? `${project.title} added to your saved radar.`
          : `${project.title} removed from your saved radar.`
      );
    } catch (error: any) {
      pushToast(error?.message || 'Unable to update saved radar.');
    } finally {
      setWorkingId(null);
    }
  }

  async function handleAddComment() {
    if (!project || !userId) {
      pushToast('Sign in to comment on project activity.');
      return;
    }

    if (!commentDraft.trim()) {
      pushToast('Write a comment before posting.');
      return;
    }

    setWorkingId('comment');
    try {
      await addProjectComment(project.id, userId, { text: commentDraft.trim() });
      setCommentDraft('');
      await loadPage();
      pushToast('Comment posted to the project feed.');
    } catch (error: any) {
      pushToast(error?.message || 'Unable to post comment.');
    } finally {
      setWorkingId(null);
    }
  }

  async function handleAttachmentUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !project || !userId) {
      if (!userId) pushToast('Sign in to attach files to this brief.');
      return;
    }

    setUploadingAttachment(true);
    try {
      const uploaded = await uploadProjectAttachment(file, project.id, userId);
      await addProjectAttachment(project.id, userId, uploaded);
      await loadPage();
      pushToast('Attachment uploaded to the project brief.');
    } catch (error: any) {
      pushToast(error?.message || 'Unable to upload attachment.');
    } finally {
      setUploadingAttachment(false);
    }
  }

  async function handleDeleteAttachment(attachment: ProjectAttachment) {
    if (!userId) {
      pushToast('Sign in first.');
      return;
    }

    setWorkingId(`attachment:${attachment.id}`);
    try {
      await Promise.allSettled([
        deleteStorageFile(attachment.storagePath),
        deleteProjectAttachment(attachment.id, userId)
      ]);
      await loadPage();
      pushToast('Attachment removed.');
    } catch (error: any) {
      pushToast(error?.message || 'Unable to remove attachment.');
    } finally {
      setWorkingId(null);
    }
  }

  async function handleDeleteComment(comment: ProjectComment) {
    if (!userId) {
      pushToast('Sign in first.');
      return;
    }

    setWorkingId(`comment-delete:${comment.id}`);
    try {
      await deleteProjectComment(comment.id, userId);
      await loadPage();
      pushToast('Comment removed.');
    } catch (error: any) {
      pushToast(error?.message || 'Unable to remove comment.');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <AppShell>
      {loading ? (
        <div className="card p-6 text-sm text-slate-500 dark:text-slate-300">Loading project...</div>
      ) : !project ? (
        <div className="card p-6 text-sm text-slate-500 dark:text-slate-300">Project not found.</div>
      ) : (
        <div className="space-y-6">
          <Link
            href={'/projects' as Route}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200"
          >
            <ArrowLeft size={16} />
            Back to project board
          </Link>

          <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
            <section className="hero-panel p-5 sm:p-7 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge capitalize ${statusTone(project.status)}`}>
                      {project.status}
                    </span>
                    {project.priority ? (
                      <span className="badge capitalize">{project.priority}</span>
                    ) : null}
                    <span className="glass-chip border-white/10 bg-white/10 text-white">
                      <Radar size={14} />
                      Premium brief
                    </span>
                  </div>
                  <h1 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                    {project.title}
                  </h1>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                    {project.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleToggleSaved()}
                  disabled={workingId === 'save'}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    saved
                      ? 'bg-white text-slate-950 shadow-[0_18px_40px_rgba(255,255,255,0.18)]'
                      : 'border border-white/10 bg-white/10 text-slate-100 hover:bg-white/15'
                  }`}
                >
                  {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  {workingId === 'save' ? 'Saving...' : saved ? 'Saved to radar' : 'Save brief'}
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {project.requiredSkills.map((skill) => (
                  <span key={skill} className="badge">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            {stat.label}
                          </p>
                          <p className="mt-2 text-lg font-semibold capitalize text-white">
                            {stat.value}
                          </p>
                        </div>
                        <Icon size={18} className="text-white/80" />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {team ? (
                  <Link href={'/workspace' as Route} className="btn-primary">
                    <FolderKanban size={16} />
                    Open workspace
                  </Link>
                ) : null}
                {clientRecord ? (
                  <Link
                    href={`/messages?to=${project.clientId}&name=${encodeURIComponent(
                      clientProfile?.companyName || clientRecord.displayName || clientRecord.email
                    )}`}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    <MessageSquareText size={16} className="mr-2 inline-flex" />
                    Message client
                  </Link>
                ) : null}
              </div>
            </section>

            <section className="grid gap-4">
              <div className="spotlight-card p-6">
                <div className="relative z-[1]">
                  <p className="data-kicker">Client context</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    {clientProfile?.companyName || clientRecord?.displayName || 'Client profile'}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">
                    {clientProfile?.description ||
                      'This client is using Collabathon to recruit a focused student team for execution.'}
                  </p>
                  <div className="mt-4 grid gap-3">
                    <div className="metric-frame">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Contact
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                        {clientProfile?.contactEmail || clientRecord?.email || 'No email provided'}
                      </p>
                    </div>
                    <div className="metric-frame">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Project type
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                        {clientProfile?.projectType || 'Technical delivery'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="command-surface">
                <p className="data-kicker">Execution signal</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                  What this brief needs next
                </h2>
                <div className="mt-5 grid gap-3">
                  <div className="metric-frame">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Best fit
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                      Builders who can move quickly across {project.requiredSkills.slice(0, 3).join(', ')}.
                    </p>
                  </div>
                  <div className="metric-frame">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Current state
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                      {team
                        ? 'This brief already has a live workspace and active team lane.'
                        : 'This brief is still in recruiting mode and ready for strong applicants.'}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
            <section className="spotlight-card p-6">
              <div className="relative z-[1]">
                <p className="data-kicker">Brief blueprint</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                  Delivery snapshot
                </h2>
                <div className="mt-5 grid gap-4">
                  {project.requiredSkills.map((skill, index) => (
                    <div key={skill}>
                      <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
                        <span>{skill}</span>
                        <span>{Math.max(66, 95 - index * 6)}%</span>
                      </div>
                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 via-sky-400 to-emerald-400"
                          style={{ width: `${Math.max(66, 95 - index * 6)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="command-surface">
              {(role === 'client' && userId === project.clientId) || role === 'admin' ? (
                <>
                  <p className="data-kicker">Applicant lane</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    Review and convert talent
                  </h2>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {(['open', 'in-progress', 'completed'] as Project['status'][]).map((status) => (
                      <button
                        key={status}
                        className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                          project.status === status
                            ? 'bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950'
                            : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200'
                        }`}
                        disabled={workingId === status}
                        onClick={async () => {
                          setWorkingId(status);
                          try {
                            await updateProjectStatus(project.id, status, userId || undefined);
                            setProject((current) => (current ? { ...current, status } : current));
                            await loadPage();
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

                  <div className="mt-5 grid gap-3">
                    {applications.length ? (
                      applications.map((application) => (
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
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              className="btn-primary"
                              disabled={workingId === application.id || application.status === 'accepted'}
                              onClick={async () => {
                                setWorkingId(application.id);
                                try {
                                  await acceptApplication(application.id);
                                  await loadPage();
                                  pushToast('Applicant accepted and workspace created.');
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
                                  await loadPage();
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
                    ) : (
                      <div className="rail-card border-dashed p-4 text-sm text-slate-500 dark:text-slate-300">
                        No applicants yet. Strong briefs usually start filling once the right stack is visible.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="data-kicker">Apply with signal</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    Make a stronger first impression
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Lead with the outcome you can own, how quickly you can start, and what similar work
                    you have already shipped.
                  </p>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="metric-frame">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Suggested opener
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                        “I can own the front-end build, Firebase integration, and first milestone delivery.”
                      </p>
                    </div>
                    <div className="metric-frame">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Your status
                      </p>
                      <p className="mt-2 text-sm font-semibold capitalize text-slate-900 dark:text-white">
                        {myApplication?.status || 'Not applied'}
                      </p>
                    </div>
                  </div>

                  {myApplication ? (
                    <div className="mt-5 rail-card p-4 text-sm text-slate-500 dark:text-slate-300">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        Your note
                      </p>
                      <p className="mt-2">
                        {myApplication.message || 'You have already applied to this brief.'}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                    <ApplyButton
                      projectId={project.id}
                      applicationStatus={myApplication?.status}
                      onApplied={() => void loadPage()}
                    />
                    <Link href={'/watchlist' as Route} className="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100">
                      Open saved radar
                    </Link>
                  </div>
                </>
              )}
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.96fr,1.04fr]">
            <section className="spotlight-card p-6">
              <div className="relative z-[1]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="data-kicker">Project comments</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                      Collaboration thread
                    </h2>
                  </div>
                  <span className="control-pill">{comments.length} notes</span>
                </div>

                <div className="mt-5 grid gap-3">
                  <div className="rail-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                          Attachment deck
                        </p>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                          Keep contracts, briefs, decks, and delivery assets attached to the live brief.
                        </p>
                      </div>
                      <label className="btn-primary cursor-pointer">
                        <FileUp size={16} />
                        {uploadingAttachment ? 'Uploading...' : 'Attach file'}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(event) => void handleAttachmentUpload(event)}
                          disabled={uploadingAttachment}
                        />
                      </label>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {attachments.length ? (
                        attachments.map((attachment) => {
                          const canDeleteAttachment =
                            canModerateContent || (userId != null && attachment.userId === userId);

                          return (
                            <div key={attachment.id} className="rail-card border-dashed p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                      {attachment.fileName}
                                    </p>
                                    {attachment.uploaderRole ? (
                                      <span className="badge capitalize">{attachment.uploaderRole}</span>
                                    ) : null}
                                  </div>
                                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                    {attachment.uploaderName} · {formatBytes(attachment.sizeBytes)}
                                    {attachment.fileType ? ` · ${attachment.fileType}` : ''}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <a
                                    href={attachment.downloadURL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:text-slate-200"
                                  >
                                    <Download size={14} className="mr-2 inline-flex" />
                                    Download
                                  </a>
                                  {canDeleteAttachment ? (
                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteAttachment(attachment)}
                                      disabled={workingId === `attachment:${attachment.id}`}
                                      className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                                    >
                                      <Trash2 size={14} className="mr-2 inline-flex" />
                                      {workingId === `attachment:${attachment.id}` ? 'Removing...' : 'Remove'}
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rail-card border-dashed p-4 text-sm text-slate-500 dark:text-slate-300">
                          No files attached yet. Add the project brief, scope notes, or delivery assets here so the full team stays aligned.
                        </div>
                      )}
                    </div>
                  </div>

                  {comments.length ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="rail-card p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {comment.authorName}
                              </p>
                              {comment.authorRole ? (
                                <span className="badge capitalize">{comment.authorRole}</span>
                              ) : null}
                            </div>
                          </div>
                          {canModerateContent || (userId != null && comment.userId === userId) ? (
                            <button
                              type="button"
                              onClick={() => void handleDeleteComment(comment)}
                              disabled={workingId === `comment-delete:${comment.id}`}
                              className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                            >
                              <Trash2 size={14} className="mr-2 inline-flex" />
                              {workingId === `comment-delete:${comment.id}` ? 'Removing...' : 'Remove'}
                            </button>
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">
                          {comment.text}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rail-card border-dashed p-4 text-sm text-slate-500 dark:text-slate-300">
                      No comments yet. Start the thread with scope notes, questions, or delivery details.
                    </div>
                  )}
                </div>

                <div className="mt-5 command-surface p-5">
                  <p className="data-kicker">Add context</p>
                  <textarea
                    rows={4}
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder="Share scope changes, hiring notes, blockers, or delivery context..."
                    className="field-shell mt-3 w-full"
                  />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void handleAddComment()}
                      disabled={workingId === 'comment'}
                      className="btn-primary"
                    >
                      {workingId === 'comment' ? 'Posting...' : 'Post comment'}
                    </button>
                    <Link
                      href={`/messages?to=${project.clientId}&name=${encodeURIComponent(
                        clientProfile?.companyName || clientRecord?.displayName || clientRecord?.email || 'Client'
                      )}` as Route}
                      className="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                    >
                      Continue in chat
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section className="command-surface">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="data-kicker">Activity feed</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    Live project timeline
                  </h2>
                </div>
                <span className="control-pill">{activity.length} events</span>
              </div>

              <div className="mt-5 grid gap-3">
                {activity.length ? (
                  activity.map((entry) => (
                    <div key={entry.id} className="rail-card p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="badge">{entry.action}</span>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {entry.actorDisplayName || 'Collabathon system'}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">
                        {entry.summary}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rail-card border-dashed p-4 text-sm text-slate-500 dark:text-slate-300">
                    Activity will appear here as applications, status changes, comments, and workspace events land.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}
