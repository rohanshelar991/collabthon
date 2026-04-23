const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

async function writeAuditLog({ actorId, actorDisplayName, targetType, targetId, action, summary, metadata }) {
  return db.collection('auditLogs').add({
    actorId: actorId || 'system',
    actorDisplayName: actorDisplayName || 'Automation',
    targetType,
    targetId,
    action,
    summary,
    metadata: metadata || {},
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function notifyUser(userId, content, actorId, type = 'system', extra = {}) {
  if (!userId) return null;
  return db.collection('notifications').add({
    userId,
    actorId: actorId || 'system',
    type,
    content,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...extra
  });
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function includesToken(values = [], token = '') {
  const normalizedToken = normalize(token);
  if (!normalizedToken) return true;
  return values.some((value) => normalize(value).includes(normalizedToken));
}

function hasMeaningfulChange(before = {}, after = {}, fields = []) {
  return fields.some((field) => JSON.stringify(before[field] ?? null) !== JSON.stringify(after[field] ?? null));
}

function matchesStudentSubscription(subscription, student) {
  const filters = subscription.filters || {};
  const skill = filters.skill || subscription.query || '';
  const college = filters.college || '';
  const experience = filters.experience || '';
  const availableOnly = filters.availableOnly === true || filters.availableOnly === 'true';

  return (
    includesToken(student.skills || [], skill) &&
    (!normalize(college) || normalize(student.college).includes(normalize(college))) &&
    (!normalize(experience) || normalize(student.experienceLevel) === normalize(experience)) &&
    (!availableOnly || Boolean(student.available))
  );
}

function matchesProjectSubscription(subscription, project) {
  const filters = subscription.filters || {};
  const status = filters.status || '';
  const queryText = filters.query || subscription.query || '';
  const haystack = [project.title, project.description, ...(project.requiredSkills || [])].join(' ');

  return (
    project.moderationStatus !== 'hidden' &&
    (!normalize(status) || normalize(status) === 'all' || normalize(project.status) === normalize(status)) &&
    (!normalize(queryText) || normalize(haystack).includes(normalize(queryText)))
  );
}

async function upsertSearchNotification(notificationId, payload) {
  await db.collection('notifications').doc(notificationId).set({
    ...payload,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

// Set custom claims based on Firestore role doc on user creation
exports.setUserRole = functions.auth.user().onCreate(async (user) => {
  const userDoc = await db.collection('users').doc(user.uid).get();
  const role = userDoc.exists ? userDoc.data().role : 'student';
  await admin.auth().setCustomUserClaims(user.uid, { role });
  await notifyUser(user.uid, `Welcome to Collabathon! Role set to ${role}.`, 'system', 'system');
});

// HTTP callable to refresh claims manually if role changes
exports.refreshRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  const uid = context.auth.uid;
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) throw new functions.https.HttpsError('not-found', 'User not found');
  const role = userDoc.data().role || 'student';
  await admin.auth().setCustomUserClaims(uid, { role });
  return { role };
});

exports.seedWorkspaceOnTeamCreate = functions.firestore
  .document('teams/{teamId}')
  .onCreate(async (snap, context) => {
    const team = snap.data();
    const teamId = context.params.teamId;
    const existingSprints = await db
      .collection('sprints')
      .where('teamId', '==', teamId)
      .limit(1)
      .get();

    if (existingSprints.empty) {
      await db.collection('sprints').add({
        teamId,
        title: 'Sprint 1',
        goal: `Launch the first milestone for ${team.workspaceName || 'this workspace'}.`,
        status: 'active',
        velocityTarget: 12,
        createdBy: 'automation',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await writeAuditLog({
      actorId: 'automation',
      actorDisplayName: 'Workspace Automation',
      targetType: 'team',
      targetId: teamId,
      action: 'workspace.seeded',
      summary: `Workspace automation seeded artifacts for team ${teamId}.`,
      metadata: { projectId: team.projectId }
    });
  });

exports.logApplicationLifecycle = functions.firestore
  .document('applications/{applicationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status === after.status) return null;

    await writeAuditLog({
      actorId: after.studentId,
      actorDisplayName: after.studentName || 'Applicant',
      targetType: 'project',
      targetId: after.projectId,
      action: 'application.status_changed',
      summary: `Application ${context.params.applicationId} moved to ${after.status}.`,
      metadata: {
        from: before.status,
        to: after.status,
        studentId: after.studentId
      }
    });

    return null;
  });

exports.notifyTaskAssignees = functions.firestore
  .document('teamTasks/{taskId}')
  .onWrite(async (change, context) => {
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;

    if (!after) return null;

    const previousAssignees = new Set(before?.assigneeIds || []);
    const nextAssignees = new Set(after.assigneeIds || []);
    const newAssignees = [...nextAssignees].filter((id) => !previousAssignees.has(id));

    await writeAuditLog({
      actorId: after.createdBy || 'automation',
      actorDisplayName: 'Task Automation',
      targetType: 'task',
      targetId: context.params.taskId,
      action: change.before.exists ? 'task.synced' : 'task.created',
      summary: `Task ${after.title} is now in ${after.status}.`,
      metadata: {
        teamId: after.teamId,
        status: after.status,
        priority: after.priority
      }
    });

    await Promise.all(
      newAssignees.map((userId) =>
        notifyUser(
          userId,
          `You were assigned to task: ${after.title}.`,
          after.createdBy || 'automation',
          'team',
          { projectId: after.teamId }
        )
      )
    );

    return null;
  });

exports.syncSubscriptionNotifications = functions.firestore
  .document('subscriptions/{userId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null;

    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.data();

    if (before && before.status === after.status && before.planId === after.planId) {
      return null;
    }

    await writeAuditLog({
      actorId: 'stripe',
      actorDisplayName: 'Stripe Sync',
      targetType: 'subscription',
      targetId: context.params.userId,
      action: 'subscription.updated',
      summary: `Subscription is now ${after.status} on ${after.planId}.`,
      metadata: {
        status: after.status,
        planId: after.planId,
        subscriptionId: after.subscriptionId || null
      }
    });

    await notifyUser(
      context.params.userId,
      `Your subscription is now ${after.status} on the ${after.planId} plan.`,
      'stripe',
      'system'
    );

    return null;
  });

exports.notifyStudentSearchSubscribers = functions.firestore
  .document('students/{studentId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null;

    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.data();
    const studentId = context.params.studentId;

    if (
      before &&
      !hasMeaningfulChange(before, after, ['name', 'college', 'experienceLevel', 'skills', 'available'])
    ) {
      return null;
    }

    const subscriptionsSnap = await db
      .collection('searchSubscriptions')
      .where('targetType', '==', 'student')
      .get();

    const matches = subscriptionsSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((subscription) => subscription.userId && subscription.userId !== studentId)
      .filter((subscription) => matchesStudentSubscription(subscription, after));

    if (!matches.length) return null;

    await Promise.all(
      matches.map((subscription) =>
        upsertSearchNotification(`search_student_${subscription.id}_${studentId}`, {
          userId: subscription.userId,
          actorId: studentId,
          type: 'system',
          content: `${after.name || 'A student'} now matches your saved talent alert "${subscription.title || 'Talent alert'}".`,
          targetId: studentId,
          targetType: 'student',
          href: `/students/${studentId}`,
          searchSubscriptionId: subscription.id
        })
      )
    );

    await writeAuditLog({
      actorId: 'automation',
      actorDisplayName: 'Search Automation',
      targetType: 'system',
      targetId: studentId,
      action: 'search_alert.student_match',
      summary: `${after.name || 'A student'} matched ${matches.length} saved talent alert${matches.length === 1 ? '' : 's'}.`,
      metadata: {
        studentId,
        matchCount: matches.length,
        subscriptionIds: matches.map((subscription) => subscription.id)
      }
    });

    return null;
  });

exports.notifyProjectSearchSubscribers = functions.firestore
  .document('projects/{projectId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null;

    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.data();
    const projectId = context.params.projectId;

    if (
      before &&
      !hasMeaningfulChange(before, after, ['title', 'description', 'requiredSkills', 'status', 'moderationStatus'])
    ) {
      return null;
    }

    if (after.moderationStatus === 'hidden') return null;

    const subscriptionsSnap = await db
      .collection('searchSubscriptions')
      .where('targetType', '==', 'project')
      .get();

    const matches = subscriptionsSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((subscription) => subscription.userId && subscription.userId !== after.clientId)
      .filter((subscription) => matchesProjectSubscription(subscription, after));

    if (!matches.length) return null;

    await Promise.all(
      matches.map((subscription) =>
        upsertSearchNotification(`search_project_${subscription.id}_${projectId}`, {
          userId: subscription.userId,
          actorId: after.clientId || 'system',
          projectId,
          type: 'system',
          content: `${after.title || 'A project'} now matches your saved project alert "${subscription.title || 'Project alert'}".`,
          targetId: projectId,
          targetType: 'project',
          href: `/projects/${projectId}`,
          searchSubscriptionId: subscription.id
        })
      )
    );

    await writeAuditLog({
      actorId: 'automation',
      actorDisplayName: 'Search Automation',
      targetType: 'system',
      targetId: projectId,
      action: 'search_alert.project_match',
      summary: `${after.title || 'A project'} matched ${matches.length} saved project alert${matches.length === 1 ? '' : 's'}.`,
      metadata: {
        projectId,
        matchCount: matches.length,
        subscriptionIds: matches.map((subscription) => subscription.id)
      }
    });

    return null;
  });
