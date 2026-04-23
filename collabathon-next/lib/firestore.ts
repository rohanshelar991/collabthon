import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Application,
  AuditLog,
  ClientProfile,
  Message,
  Notification,
  Project,
  ProjectAttachment,
  ProjectComment,
  Review,
  SearchSubscription,
  Sprint,
  StudentProfile,
  SubscriptionRecord,
  Team,
  TeamTask,
  UserRecord,
  WatchlistItem
} from '@/types';

const FIRESTORE_TIMEOUT_MS = 8000;

type ProjectFilters = {
  clientId?: string;
  status?: Project['status'] | 'all';
  includeHidden?: boolean;
};

type ApplicationFilters = {
  projectId?: string;
  studentId?: string;
  status?: Application['status'] | 'all';
};

type NotificationInput = Omit<Notification, 'id' | 'read' | 'createdAt' | 'readAt'> & {
  read?: boolean;
};

type SearchSubscriptionInput = Omit<
  SearchSubscription,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

type ProjectCommentInput = Omit<
  ProjectComment,
  'id' | 'projectId' | 'userId' | 'authorName' | 'authorRole' | 'createdAt' | 'updatedAt'
>;

type ProjectAttachmentInput = Omit<
  ProjectAttachment,
  'id' | 'projectId' | 'userId' | 'uploaderName' | 'uploaderRole' | 'createdAt' | 'updatedAt'
>;

type TeamFilters = {
  memberId?: string;
  clientId?: string;
  projectId?: string;
};

type AuditLogInput = Omit<AuditLog, 'id' | 'createdAt'>;

async function withFirestoreTimeout<T>(promise: Promise<T>, label: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out. Check Firestore connectivity.`)), FIRESTORE_TIMEOUT_MS);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function toMillis(value: unknown) {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }

  if (value && typeof value === 'object' && 'seconds' in value && typeof (value as { seconds: number }).seconds === 'number') {
    return (value as { seconds: number }).seconds * 1000;
  }

  return 0;
}

function byNewest<T extends { createdAt?: unknown }>(items: T[]) {
  return [...items].sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));
}

async function setDocWithTimestamps(ref: ReturnType<typeof doc>, data: Record<string, unknown>, label: string) {
  const snap = await withFirestoreTimeout(getDoc(ref), `Checking ${label}`);
  await withFirestoreTimeout(
    setDoc(
      ref,
      {
        ...data,
        updatedAt: serverTimestamp(),
        ...(snap.exists() ? {} : { createdAt: serverTimestamp() })
      },
      { merge: true }
    ),
    label
  );
}

async function syncUserRecord(
  userId: string,
  payload: Pick<UserRecord, 'email' | 'displayName'> & { photoURL?: string; role: UserRecord['role'] }
) {
  const ref = doc(db, 'users', userId);
  const existing = await withFirestoreTimeout(getDoc(ref), 'Loading account record');
  await setDocWithTimestamps(
    ref,
    {
      email: payload.email,
      displayName: payload.displayName || payload.email,
      photoURL: payload.photoURL || '',
      role: payload.role,
      accountStatus: existing.exists()
        ? ((existing.data().accountStatus as UserRecord['accountStatus']) || 'active')
        : 'active'
    },
    'Syncing account record'
  );
}

export async function upsertStudentProfile(userId: string, data: Omit<StudentProfile, 'id' | 'userId'>) {
  const ref = doc(db, 'students', userId);
  await setDocWithTimestamps(
    ref,
    {
      ...data,
      userId,
      skills: data.skills || [],
      available: data.available ?? true
    },
    'Saving student profile'
  );

  await syncUserRecord(userId, {
    email: data.email,
    displayName: data.name,
    photoURL: data.photoURL,
    role: 'student'
  });

  return ref.id;
}

export async function upsertClientProfile(userId: string, data: Omit<ClientProfile, 'id' | 'userId'>) {
  const ref = doc(db, 'clients', userId);
  await setDocWithTimestamps(
    ref,
    {
      ...data,
      userId
    },
    'Saving client profile'
  );

  await syncUserRecord(userId, {
    email: data.contactEmail,
    displayName: data.companyName,
    role: 'client'
  });

  return ref.id;
}

export async function listStudents(skill?: string, availableOnly = false) {
  const clauses = [] as Parameters<typeof query>[1][];
  if (skill) clauses.push(where('skills', 'array-contains', skill));
  if (availableOnly) clauses.push(where('available', '==', true));
  const studentQuery = clauses.length ? query(collection(db, 'students'), ...clauses) : query(collection(db, 'students'));
  const [snap, userRecords] = await Promise.all([
    withFirestoreTimeout(getDocs(studentQuery), 'Loading students'),
    listUserRecords().catch(() => [])
  ]);
  const suspendedIds = new Set(
    userRecords
      .filter((userRecord) => userRecord.accountStatus === 'suspended')
      .map((userRecord) => userRecord.id)
  );

  return byNewest(
    snap.docs
      .filter((studentDoc) => !suspendedIds.has(studentDoc.id))
      .map((studentDoc) => ({
        id: studentDoc.id,
        ...(studentDoc.data() as Omit<StudentProfile, 'id'>)
      }))
  );
}

export async function listProjects(filters: ProjectFilters = {}) {
  const clauses = [] as Parameters<typeof query>[1][];
  if (filters.clientId) clauses.push(where('clientId', '==', filters.clientId));
  const projectQuery = clauses.length ? query(collection(db, 'projects'), ...clauses) : query(collection(db, 'projects'));
  const snap = await withFirestoreTimeout(getDocs(projectQuery), 'Loading projects');

  const projects = snap.docs.map((projectDoc) => ({
    id: projectDoc.id,
    ...(projectDoc.data() as Omit<Project, 'id'>)
  }));

  const visibleProjects = filters.includeHidden
    ? projects
    : projects.filter((project) => project.moderationStatus !== 'hidden');

  return byNewest(
    filters.status && filters.status !== 'all'
      ? visibleProjects.filter((project) => project.status === filters.status)
      : visibleProjects
  );
}

export async function getProjectById(projectId: string) {
  const ref = doc(db, 'projects', projectId);
  const snap = await withFirestoreTimeout(getDoc(ref), 'Loading project');
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Project, 'id'>) };
}

export async function createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
  const ref = await withFirestoreTimeout(
    addDoc(collection(db, 'projects'), {
      ...data,
      requiredSkills: data.requiredSkills || [],
      priority: data.priority || 'growth',
      moderationStatus: data.moderationStatus || 'approved',
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }),
    'Creating project'
  );

  await Promise.allSettled([
    createAuditLog({
      actorId: data.clientId,
      targetType: 'project',
      targetId: ref.id,
      action: 'project.created',
      summary: `${data.title} was created and published to the marketplace.`,
      metadata: {
        priority: data.priority || 'growth',
        requiredSkills: data.requiredSkills || [],
        budget: data.budget || null
      }
    }),
    createProjectActivity(ref.id, {
      actorId: data.clientId,
      targetType: 'project',
      targetId: ref.id,
      action: 'project.created',
      summary: `${data.title} was created and published to the marketplace.`,
      metadata: {
        priority: data.priority || 'growth',
        requiredSkills: data.requiredSkills || [],
        budget: data.budget || null
      }
    })
  ]);

  return ref.id;
}

export async function updateProjectStatus(projectId: string, status: Project['status'], actorId?: string) {
  await withFirestoreTimeout(
    updateDoc(doc(db, 'projects', projectId), {
      status,
      updatedAt: serverTimestamp()
    }),
    'Updating project status'
  );

  const project = await getProjectById(projectId);
  const eventActorId = actorId || project?.clientId;
  await Promise.allSettled([
    createAuditLog({
      actorId: eventActorId,
      targetType: 'project',
      targetId: projectId,
      action: 'project.status_changed',
      summary: `${project?.title || projectId} moved to ${status}.`,
      metadata: { status }
    }),
    createProjectActivity(projectId, {
      actorId: eventActorId,
      targetType: 'project',
      targetId: projectId,
      action: 'project.status_changed',
      summary: `${project?.title || projectId} moved to ${status}.`,
      metadata: { status }
    })
  ]);
}

export async function listApplications(filters: ApplicationFilters = {}) {
  const clauses = [] as Parameters<typeof query>[1][];
  if (filters.projectId) clauses.push(where('projectId', '==', filters.projectId));
  else if (filters.studentId) clauses.push(where('studentId', '==', filters.studentId));

  const appQuery = clauses.length ? query(collection(db, 'applications'), ...clauses) : query(collection(db, 'applications'));
  const snap = await withFirestoreTimeout(getDocs(appQuery), 'Loading applications');

  const applications = snap.docs.map((applicationDoc) => ({
    id: applicationDoc.id,
    ...(applicationDoc.data() as Omit<Application, 'id'>)
  }));

  return byNewest(
    filters.status && filters.status !== 'all'
      ? applications.filter((application) => application.status === filters.status)
      : applications
  );
}

export async function applyToProject(projectId: string, studentId: string, message?: string) {
  const project = await getProjectById(projectId);
  const student = await getProfile(studentId);
  const ref = doc(db, 'applications', `${projectId}_${studentId}`);

  await setDocWithTimestamps(
    ref,
    {
      projectId,
      studentId,
      message: message || '',
      status: 'pending',
      studentName: student?.name || '',
      studentEmail: student?.email || ''
    },
    'Submitting application'
  );

  if (project?.clientId) {
    await Promise.allSettled([
      createNotification({
        userId: project.clientId,
        actorId: studentId,
        projectId,
        applicationId: ref.id,
        type: 'application',
        content: `${student?.name || 'A student'} applied to ${project.title}.`
      }),
      createAuditLog({
        actorId: studentId,
        targetType: 'project',
        targetId: projectId,
        action: 'application.submitted',
        summary: `${student?.name || 'A student'} applied to ${project?.title || 'a project'}.`,
        metadata: { applicationId: ref.id, studentId }
      }),
      createProjectActivity(projectId, {
        actorId: studentId,
        targetType: 'project',
        targetId: projectId,
        action: 'application.submitted',
        summary: `${student?.name || 'A student'} applied to ${project?.title || 'a project'}.`,
        metadata: { applicationId: ref.id, studentId }
      })
    ]);
  }

  return ref.id;
}

export async function updateApplicationStatus(applicationId: string, status: Application['status']) {
  const ref = doc(db, 'applications', applicationId);
  await withFirestoreTimeout(
    updateDoc(ref, {
      status,
      updatedAt: serverTimestamp()
    }),
    'Updating application status'
  );

  const snap = await withFirestoreTimeout(getDoc(ref), 'Reloading application');
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Application, 'id'>) } as Application) : null;
}

export async function createTeam(projectId: string, memberIds: string[]) {
  const project = await getProjectById(projectId);
  const ref = doc(db, 'teams', projectId);
  await setDocWithTimestamps(
    ref,
    {
      projectId,
      memberIds,
      clientId: project?.clientId || '',
      workspaceName: project?.title ? `${project.title} Workspace` : 'Team Workspace',
      status: 'active'
    },
    'Creating team'
  );

  await Promise.allSettled([
    updateProjectStatus(projectId, 'in-progress'),
    withFirestoreTimeout(
      updateDoc(doc(db, 'projects', projectId), {
        teamId: ref.id,
        updatedAt: serverTimestamp()
      }),
      'Linking team to project'
    )
  ]);

  await Promise.allSettled([
    createSprint(ref.id, {
      title: 'Sprint 1',
      goal: project?.title ? `Deliver the first milestone for ${project.title}` : 'Deliver the first milestone',
      status: 'active',
      velocityTarget: 12,
      startDate: new Date().toISOString().slice(0, 10)
    }),
    createTeamTask(ref.id, {
      title: 'Kickoff and scope alignment',
      description: 'Define shared scope, success criteria, and delivery checkpoints.',
      status: 'todo',
      priority: 'high',
      assigneeIds: memberIds,
      labels: ['kickoff', 'delivery'],
      storyPoints: 3
    })
  ]);

  await Promise.allSettled([
    createAuditLog({
      actorId: project?.clientId,
      targetType: 'project',
      targetId: projectId,
      action: 'team.created',
      summary: `A live workspace was created for ${project?.title || 'this project'}.`,
      metadata: { teamId: ref.id, memberIds }
    }),
    createProjectActivity(projectId, {
      actorId: project?.clientId,
      targetType: 'project',
      targetId: projectId,
      action: 'team.created',
      summary: `A live workspace was created for ${project?.title || 'this project'}.`,
      metadata: { teamId: ref.id, memberIds }
    })
  ]);

  return ref.id;
}

export async function acceptApplication(applicationId: string) {
  const application = await updateApplicationStatus(applicationId, 'accepted');
  if (!application) return null;

  const teamId = await createTeam(application.projectId, [application.studentId]);
  const project = await getProjectById(application.projectId);

  await Promise.allSettled([
    createNotification({
      userId: application.studentId,
      actorId: project?.clientId,
      projectId: application.projectId,
      applicationId: application.id,
      type: 'team',
      content: `You were accepted for ${project?.title || 'a project'}. Your team workspace is now live.`
    }),
    createAuditLog({
      actorId: project?.clientId,
      targetType: 'project',
      targetId: application.projectId,
      action: 'application.accepted',
      summary: `${application.studentName || application.studentId} was accepted for ${project?.title || 'a project'}.`,
      metadata: { applicationId: application.id, teamId }
    }),
    createProjectActivity(application.projectId, {
      actorId: project?.clientId,
      targetType: 'project',
      targetId: application.projectId,
      action: 'application.accepted',
      summary: `${application.studentName || application.studentId} was accepted for ${project?.title || 'a project'}.`,
      metadata: { applicationId: application.id, teamId }
    })
  ]);

  return { application, teamId };
}

export async function rejectApplication(applicationId: string) {
  const application = await updateApplicationStatus(applicationId, 'rejected');
  if (!application) return null;

  const project = await getProjectById(application.projectId);
  await Promise.allSettled([
    createNotification({
      userId: application.studentId,
      actorId: project?.clientId,
      projectId: application.projectId,
      applicationId: application.id,
      type: 'application',
      content: `Your application for ${project?.title || 'a project'} was updated.`
    }),
    createAuditLog({
      actorId: project?.clientId,
      targetType: 'project',
      targetId: application.projectId,
      action: 'application.rejected',
      summary: `${application.studentName || application.studentId} was rejected for ${project?.title || 'a project'}.`,
      metadata: { applicationId: application.id }
    }),
    createProjectActivity(application.projectId, {
      actorId: project?.clientId,
      targetType: 'project',
      targetId: application.projectId,
      action: 'application.rejected',
      summary: `${application.studentName || application.studentId} was rejected for ${project?.title || 'a project'}.`,
      metadata: { applicationId: application.id }
    })
  ]);

  return application;
}

export async function listTeams(filters: TeamFilters = {}) {
  const snap = await withFirestoreTimeout(getDocs(collection(db, 'teams')), 'Loading teams');
  const teams = snap.docs.map((teamDoc) => ({
    id: teamDoc.id,
    ...(teamDoc.data() as Omit<Team, 'id'>)
  }));

  let filtered = teams;

  if (filters.memberId) {
    filtered = filtered.filter((team) => team.memberIds?.includes(filters.memberId!));
  }

  if (filters.projectId) {
    filtered = filtered.filter((team) => team.projectId === filters.projectId);
  }

  if (filters.clientId) {
    filtered = filtered.filter((team) => team.clientId === filters.clientId);
  }

  return byNewest(filtered);
}

export async function listTeamsForUser(userId: string) {
  return listTeams({ memberId: userId });
}

export async function getTeamById(teamId: string) {
  const ref = doc(db, 'teams', teamId);
  const snap = await withFirestoreTimeout(getDoc(ref), 'Loading team');
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Team, 'id'>) };
}

export async function listTeamSprints(teamId: string) {
  const sprintQuery = query(collection(db, 'sprints'), where('teamId', '==', teamId));
  const snap = await withFirestoreTimeout(getDocs(sprintQuery), 'Loading sprints');
  return byNewest(
    snap.docs.map((sprintDoc) => ({
      id: sprintDoc.id,
      ...(sprintDoc.data() as Omit<Sprint, 'id'>)
    }))
  );
}

export async function createSprint(
  teamId: string,
  data: Omit<Sprint, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>,
  actorId?: string
) {
  const ref = await withFirestoreTimeout(
    addDoc(collection(db, 'sprints'), {
      ...data,
      teamId,
      createdBy: actorId || data.createdBy || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    } satisfies Partial<Sprint>),
    'Creating sprint'
  );

  await Promise.allSettled([
    createAuditLog({
      actorId,
      targetType: 'team',
      targetId: teamId,
      action: 'sprint.created',
      summary: `${data.title} was created for team ${teamId}.`,
      metadata: { sprintId: ref.id, status: data.status }
    })
  ]);

  return ref.id;
}

export async function updateSprintStatus(sprintId: string, status: Sprint['status'], actorId?: string) {
  await withFirestoreTimeout(
    updateDoc(doc(db, 'sprints', sprintId), {
      status,
      updatedAt: serverTimestamp()
    }),
    'Updating sprint'
  );

  await Promise.allSettled([
    createAuditLog({
      actorId,
      targetType: 'team',
      targetId: sprintId,
      action: 'sprint.status_changed',
      summary: `Sprint ${sprintId} moved to ${status}.`,
      metadata: { status }
    })
  ]);
}

export async function listTeamTasks(teamId: string) {
  const taskQuery = query(collection(db, 'teamTasks'), where('teamId', '==', teamId));
  const snap = await withFirestoreTimeout(getDocs(taskQuery), 'Loading team tasks');
  return byNewest(
    snap.docs.map((taskDoc) => ({
      id: taskDoc.id,
      ...(taskDoc.data() as Omit<TeamTask, 'id'>)
    }))
  );
}

export async function createTeamTask(
  teamId: string,
  data: Omit<TeamTask, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>,
  actorId?: string
) {
  const ref = await withFirestoreTimeout(
    addDoc(collection(db, 'teamTasks'), {
      ...data,
      teamId,
      createdBy: actorId || data.createdBy || '',
      assigneeIds: data.assigneeIds || [],
      labels: data.labels || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    } satisfies Partial<TeamTask>),
    'Creating team task'
  );

  await Promise.allSettled([
    createAuditLog({
      actorId,
      targetType: 'task',
      targetId: ref.id,
      action: 'task.created',
      summary: `${data.title} was added to workspace ${teamId}.`,
      metadata: { teamId, priority: data.priority, sprintId: data.sprintId || null }
    })
  ]);

  return ref.id;
}

export async function updateTeamTask(
  taskId: string,
  updates: Partial<
    Pick<
      TeamTask,
      'status' | 'priority' | 'assigneeIds' | 'labels' | 'dueDate' | 'sprintId' | 'storyPoints' | 'title' | 'description'
    >
  >,
  actorId?: string
) {
  await withFirestoreTimeout(
    updateDoc(doc(db, 'teamTasks', taskId), {
      ...updates,
      updatedAt: serverTimestamp()
    }),
    'Updating team task'
  );

  await Promise.allSettled([
    createAuditLog({
      actorId,
      targetType: 'task',
      targetId: taskId,
      action: 'task.updated',
      summary: `Task ${taskId} was updated.`,
      metadata: updates as Record<string, unknown>
    })
  ]);
}

export async function sendMessage(fromId: string, toId: string, text: string) {
  const ref = await withFirestoreTimeout(
    addDoc(collection(db, 'messages'), {
      fromId,
      toId,
      participants: [fromId, toId],
      text,
      read: false,
      createdAt: serverTimestamp()
    } satisfies Partial<Message>),
    'Sending message'
  );

  const sender = await getUserRecord(fromId);
  await Promise.allSettled([
    createNotification({
      userId: toId,
      actorId: fromId,
      type: 'message',
      content: `New message from ${sender?.displayName || sender?.email || 'a collaborator'}.`
    })
  ]);

  return ref.id;
}

export async function addReview(fromId: string, toId: string, rating: number, comment?: string) {
  const ref = await withFirestoreTimeout(
    addDoc(collection(db, 'reviews'), {
      fromId,
      toId,
      rating,
      comment,
      createdAt: serverTimestamp()
    } satisfies Partial<Review>),
    'Saving review'
  );

  await Promise.allSettled([
    createNotification({
      userId: toId,
      actorId: fromId,
      type: 'review',
      content: 'You received a new review.'
    })
  ]);

  return ref.id;
}

export async function listReviewsForUser(userId: string) {
  const reviewQuery = query(collection(db, 'reviews'), where('toId', '==', userId));
  const snap = await withFirestoreTimeout(getDocs(reviewQuery), 'Loading reviews');
  return byNewest(snap.docs.map((reviewDoc) => ({ id: reviewDoc.id, ...(reviewDoc.data() as Omit<Review, 'id'>) })));
}

export async function createNotification(input: NotificationInput) {
  const ref = await withFirestoreTimeout(
    addDoc(collection(db, 'notifications'), {
      ...input,
      read: input.read ?? false,
      createdAt: serverTimestamp(),
      readAt: null
    }),
    'Creating notification'
  );
  return ref.id;
}

export async function listNotifications(userId: string) {
  const notificationQuery = query(collection(db, 'notifications'), where('userId', '==', userId));
  const snap = await withFirestoreTimeout(getDocs(notificationQuery), 'Loading notifications');
  return byNewest(
    snap.docs.map((notificationDoc) => ({
      id: notificationDoc.id,
      ...(notificationDoc.data() as Omit<Notification, 'id'>)
    }))
  );
}

export async function markNotificationRead(notificationId: string) {
  await withFirestoreTimeout(
    updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: serverTimestamp()
    }),
    'Updating notification'
  );
}

export async function markAllNotificationsRead(userId: string) {
  const notifications = await listNotifications(userId);
  const unread = notifications.filter((notification) => !notification.read);
  if (!unread.length) return;

  const batch = writeBatch(db);
  unread.forEach((notification) => {
    batch.update(doc(db, 'notifications', notification.id), {
      read: true,
      readAt: serverTimestamp()
    });
  });
  await withFirestoreTimeout(batch.commit(), 'Marking notifications as read');
}

function watchlistDocId(userId: string, targetType: WatchlistItem['targetType'], targetId: string) {
  return `${userId}_${targetType}_${targetId}`;
}

export async function listWatchlistItems(
  userId: string,
  targetType?: WatchlistItem['targetType']
) {
  const watchlistQuery = query(collection(db, 'watchlists'), where('userId', '==', userId));
  const snap = await withFirestoreTimeout(getDocs(watchlistQuery), 'Loading saved radar');
  const items = byNewest(
    snap.docs.map((watchDoc) => ({
      id: watchDoc.id,
      ...(watchDoc.data() as Omit<WatchlistItem, 'id'>)
    }))
  );

  return targetType ? items.filter((item) => item.targetType === targetType) : items;
}

export async function toggleWatchlistItem(
  userId: string,
  item: Omit<WatchlistItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
) {
  const ref = doc(db, 'watchlists', watchlistDocId(userId, item.targetType, item.targetId));
  const snap = await withFirestoreTimeout(getDoc(ref), 'Checking saved radar');

  if (snap.exists()) {
    await withFirestoreTimeout(deleteDoc(ref), 'Removing saved radar');
    return { saved: false, id: ref.id };
  }

  await setDocWithTimestamps(
    ref,
    {
      userId,
      targetType: item.targetType,
      targetId: item.targetId,
      title: item.title,
      subtitle: item.subtitle || '',
      href: item.href
    },
    'Saving to radar'
  );

  return { saved: true, id: ref.id };
}

export async function listSearchSubscriptions(
  userId: string,
  targetType?: SearchSubscription['targetType']
) {
  const subscriptionQuery = query(
    collection(db, 'searchSubscriptions'),
    where('userId', '==', userId)
  );
  const snap = await withFirestoreTimeout(getDocs(subscriptionQuery), 'Loading saved search alerts');
  const items = byNewest(
    snap.docs.map((subscriptionDoc) => ({
      id: subscriptionDoc.id,
      ...(subscriptionDoc.data() as Omit<SearchSubscription, 'id'>)
    }))
  );

  return targetType ? items.filter((item) => item.targetType === targetType) : items;
}

export async function createSearchSubscription(userId: string, input: SearchSubscriptionInput) {
  const ref = await withFirestoreTimeout(
    addDoc(collection(db, 'searchSubscriptions'), {
      ...input,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    } satisfies Partial<SearchSubscription>),
    'Saving search alert'
  );

  await Promise.allSettled([
    createNotification({
      userId,
      actorId: userId,
      type: 'system',
      content: `${input.title} was saved to your live search alerts.`
    })
  ]);

  return ref.id;
}

export async function deleteSearchSubscription(subscriptionId: string) {
  await withFirestoreTimeout(
    deleteDoc(doc(db, 'searchSubscriptions', subscriptionId)),
    'Deleting search alert'
  );
}

export async function listProjectComments(projectId: string) {
  const commentQuery = query(collection(db, 'projectComments'), where('projectId', '==', projectId));
  const snap = await withFirestoreTimeout(getDocs(commentQuery), 'Loading project comments');
  return byNewest(
    snap.docs.map((commentDoc) => ({
      id: commentDoc.id,
      ...(commentDoc.data() as Omit<ProjectComment, 'id'>)
    }))
  );
}

export async function addProjectComment(projectId: string, userId: string, input: ProjectCommentInput) {
  const [author, project] = await Promise.all([getUserRecord(userId), getProjectById(projectId)]);
  const ref = await withFirestoreTimeout(
    addDoc(collection(db, 'projectComments'), {
      projectId,
      userId,
      text: input.text,
      authorName: author?.displayName || author?.email || 'Collabathon user',
      authorRole: author?.role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    } satisfies Partial<ProjectComment>),
    'Posting project comment'
  );

  await Promise.allSettled([
    createAuditLog({
      actorId: userId,
      targetType: 'project',
      targetId: projectId,
      action: 'comment.added',
      summary: `${author?.displayName || author?.email || 'A collaborator'} commented on ${project?.title || 'a project'}.`,
      metadata: { commentId: ref.id }
    }),
    createProjectActivity(projectId, {
      actorId: userId,
      targetType: 'project',
      targetId: projectId,
      action: 'comment.added',
      summary: `${author?.displayName || author?.email || 'A collaborator'} commented on ${project?.title || 'a project'}.`,
      metadata: { commentId: ref.id }
    }),
    project?.clientId && project.clientId !== userId
      ? createNotification({
          userId: project.clientId,
          actorId: userId,
          projectId,
          type: 'message',
          content: `${author?.displayName || author?.email || 'A collaborator'} added a comment to ${project.title}.`
        })
      : Promise.resolve()
  ]);

  return ref.id;
}

export async function deleteProjectComment(commentId: string, actorId?: string) {
  const ref = doc(db, 'projectComments', commentId);
  const snap = await withFirestoreTimeout(getDoc(ref), 'Loading project comment');
  if (!snap.exists()) return null;

  const comment = { id: snap.id, ...(snap.data() as Omit<ProjectComment, 'id'>) };
  const project = await getProjectById(comment.projectId);
  await withFirestoreTimeout(deleteDoc(ref), 'Removing project comment');

  await Promise.allSettled([
    createAuditLog({
      actorId,
      targetType: 'project',
      targetId: comment.projectId,
      action: 'comment.deleted',
      summary: `A comment on ${project?.title || 'a project'} was removed.`,
      metadata: { commentId, removedAuthor: comment.authorName }
    }),
    createProjectActivity(comment.projectId, {
      actorId,
      targetType: 'project',
      targetId: comment.projectId,
      action: 'comment.deleted',
      summary: `A comment on ${project?.title || 'a project'} was removed.`,
      metadata: { commentId, removedAuthor: comment.authorName }
    })
  ]);

  return comment;
}

export async function listRecentProjectComments(limit = 24) {
  const snap = await withFirestoreTimeout(getDocs(collection(db, 'projectComments')), 'Loading recent project comments');
  return byNewest(
    snap.docs.map((commentDoc) => ({
      id: commentDoc.id,
      ...(commentDoc.data() as Omit<ProjectComment, 'id'>)
    }))
  ).slice(0, limit);
}

export async function listProjectAttachments(projectId: string) {
  const attachmentQuery = query(collection(db, 'projectAttachments'), where('projectId', '==', projectId));
  const snap = await withFirestoreTimeout(getDocs(attachmentQuery), 'Loading project attachments');
  return byNewest(
    snap.docs.map((attachmentDoc) => ({
      id: attachmentDoc.id,
      ...(attachmentDoc.data() as Omit<ProjectAttachment, 'id'>)
    }))
  );
}

export async function addProjectAttachment(
  projectId: string,
  userId: string,
  input: ProjectAttachmentInput
) {
  const [uploader, project] = await Promise.all([getUserRecord(userId), getProjectById(projectId)]);
  const ref = await withFirestoreTimeout(
    addDoc(collection(db, 'projectAttachments'), {
      projectId,
      userId,
      uploaderName: uploader?.displayName || uploader?.email || 'Collabathon user',
      uploaderRole: uploader?.role,
      fileName: input.fileName,
      fileType: input.fileType || '',
      sizeBytes: input.sizeBytes || 0,
      downloadURL: input.downloadURL,
      storagePath: input.storagePath,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    } satisfies Partial<ProjectAttachment>),
    'Saving project attachment'
  );

  await Promise.allSettled([
    createAuditLog({
      actorId: userId,
      targetType: 'project',
      targetId: projectId,
      action: 'attachment.added',
      summary: `${input.fileName} was attached to ${project?.title || 'a project'}.`,
      metadata: { attachmentId: ref.id, storagePath: input.storagePath }
    }),
    createProjectActivity(projectId, {
      actorId: userId,
      targetType: 'project',
      targetId: projectId,
      action: 'attachment.added',
      summary: `${input.fileName} was attached to ${project?.title || 'a project'}.`,
      metadata: { attachmentId: ref.id, storagePath: input.storagePath }
    })
  ]);

  return ref.id;
}

export async function deleteProjectAttachment(attachmentId: string, actorId?: string) {
  const ref = doc(db, 'projectAttachments', attachmentId);
  const snap = await withFirestoreTimeout(getDoc(ref), 'Loading project attachment');
  if (!snap.exists()) return null;

  const attachment = { id: snap.id, ...(snap.data() as Omit<ProjectAttachment, 'id'>) };
  const project = await getProjectById(attachment.projectId);
  await withFirestoreTimeout(deleteDoc(ref), 'Removing project attachment');

  await Promise.allSettled([
    createAuditLog({
      actorId,
      targetType: 'project',
      targetId: attachment.projectId,
      action: 'attachment.deleted',
      summary: `${attachment.fileName} was removed from ${project?.title || 'a project'}.`,
      metadata: { attachmentId, storagePath: attachment.storagePath }
    }),
    createProjectActivity(attachment.projectId, {
      actorId,
      targetType: 'project',
      targetId: attachment.projectId,
      action: 'attachment.deleted',
      summary: `${attachment.fileName} was removed from ${project?.title || 'a project'}.`,
      metadata: { attachmentId, storagePath: attachment.storagePath }
    })
  ]);

  return attachment;
}

export async function listProjectActivity(projectId: string, limit = 18) {
  const activityQuery = query(collection(db, 'projectActivities'), where('projectId', '==', projectId));
  const snap = await withFirestoreTimeout(getDocs(activityQuery), 'Loading project activity');
  return byNewest(
    snap.docs.map((logDoc) => ({ id: logDoc.id, ...(logDoc.data() as Omit<AuditLog, 'id'>) }))
  ).slice(0, limit);
}

export async function getProfile(userId: string) {
  const ref = doc(db, 'students', userId);
  const snap = await withFirestoreTimeout(getDoc(ref), 'Loading student profile');
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<StudentProfile, 'id'>) };
}

export async function getClientProfile(userId: string) {
  const ref = doc(db, 'clients', userId);
  const snap = await withFirestoreTimeout(getDoc(ref), 'Loading client profile');
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<ClientProfile, 'id'>) };
}

export async function getStudentById(studentId: string) {
  return getProfile(studentId);
}

export async function listUserRecords(): Promise<UserRecord[]> {
  const snap = await withFirestoreTimeout(getDocs(collection(db, 'users')), 'Loading users');
  return byNewest(snap.docs.map((userDoc) => ({ id: userDoc.id, ...(userDoc.data() as Omit<UserRecord, 'id'>) })));
}

export async function getUserRecord(userId: string) {
  const ref = doc(db, 'users', userId);
  const snap = await withFirestoreTimeout(getDoc(ref), 'Loading user account');
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<UserRecord, 'id'>) };
}

export async function createAuditLog(input: AuditLogInput) {
  const actorDisplayName = input.actorId ? (await getUserRecord(input.actorId))?.displayName : undefined;
  const ref = await withFirestoreTimeout(
    addDoc(collection(db, 'auditLogs'), {
      ...input,
      actorDisplayName: input.actorDisplayName || actorDisplayName || '',
      createdAt: serverTimestamp()
    }),
    'Writing audit log'
  );
  return ref.id;
}

export async function createProjectActivity(projectId: string, input: AuditLogInput) {
  const actorDisplayName = input.actorId ? (await getUserRecord(input.actorId))?.displayName : undefined;
  const ref = await withFirestoreTimeout(
    addDoc(collection(db, 'projectActivities'), {
      ...input,
      projectId,
      actorDisplayName: input.actorDisplayName || actorDisplayName || '',
      createdAt: serverTimestamp()
    }),
    'Writing project activity'
  );
  return ref.id;
}

export async function listAuditLogs(limit = 24) {
  const snap = await withFirestoreTimeout(getDocs(collection(db, 'auditLogs')), 'Loading audit logs');
  return byNewest(
    snap.docs.map((logDoc) => ({ id: logDoc.id, ...(logDoc.data() as Omit<AuditLog, 'id'>) }))
  ).slice(0, limit);
}

export async function updateUserAccountStatus(
  userId: string,
  accountStatus: UserRecord['accountStatus'],
  actorId?: string,
  note?: string
) {
  await withFirestoreTimeout(
    updateDoc(doc(db, 'users', userId), {
      accountStatus: accountStatus || 'active',
      updatedAt: serverTimestamp()
    }),
    'Updating user status'
  );

  const userRecord = await getUserRecord(userId);
  await Promise.allSettled([
    createAuditLog({
      actorId,
      targetType: 'user',
      targetId: userId,
      action: 'user.status_changed',
      summary: `${userRecord?.displayName || userRecord?.email || userId} is now ${accountStatus || 'active'}.`,
      metadata: { accountStatus, note: note || null }
    }),
    createNotification({
      userId,
      actorId,
      type: 'system',
      content: `Your Collabathon account status is now ${accountStatus || 'active'}.`
    })
  ]);
}

export async function updateProjectModerationStatus(
  projectId: string,
  moderationStatus: Project['moderationStatus'],
  actorId?: string,
  note?: string
) {
  await withFirestoreTimeout(
    updateDoc(doc(db, 'projects', projectId), {
      moderationStatus: moderationStatus || 'approved',
      updatedAt: serverTimestamp()
    }),
    'Updating project moderation'
  );

  const project = await getProjectById(projectId);
  await Promise.allSettled([
    createAuditLog({
      actorId,
      targetType: 'project',
      targetId: projectId,
      action: 'project.moderation_changed',
      summary: `${project?.title || projectId} is now ${moderationStatus || 'approved'}.`,
      metadata: { moderationStatus, note: note || null }
    }),
    project?.clientId
      ? createNotification({
          userId: project.clientId,
          actorId,
          projectId,
          type: 'system',
          content: `${project.title} was reviewed and marked ${moderationStatus || 'approved'}.`
        })
      : Promise.resolve()
  ]);
}

export async function getSubscriptionRecord(userId: string) {
  const ref = doc(db, 'subscriptions', userId);
  const snap = await withFirestoreTimeout(getDoc(ref), 'Loading subscription');
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<SubscriptionRecord, 'id'>) };
}

export async function listMessageContacts() {
  const [users, studentsSnap, clientsSnap] = await Promise.all([
    listUserRecords(),
    withFirestoreTimeout(getDocs(collection(db, 'students')), 'Loading student contacts'),
    withFirestoreTimeout(getDocs(collection(db, 'clients')), 'Loading client contacts')
  ]);

  const contactMap = new Map<string, { id: string; name: string; email?: string; role?: string }>();

  users.forEach((user) => {
    if (user.accountStatus === 'suspended') return;
    contactMap.set(user.id, {
      id: user.id,
      name: user.displayName || user.email,
      email: user.email,
      role: user.role
    });
  });

  studentsSnap.docs.forEach((studentDoc) => {
    const student = studentDoc.data() as StudentProfile;
    contactMap.set(studentDoc.id, {
      id: studentDoc.id,
      name: student.name,
      email: student.email,
      role: 'student'
    });
  });

  clientsSnap.docs.forEach((clientDoc) => {
    const client = clientDoc.data() as ClientProfile;
    contactMap.set(clientDoc.id, {
      id: clientDoc.id,
      name: client.companyName,
      email: client.contactEmail,
      role: 'client'
    });
  });

  return Array.from(contactMap.values()).sort((left, right) => left.name.localeCompare(right.name));
}
