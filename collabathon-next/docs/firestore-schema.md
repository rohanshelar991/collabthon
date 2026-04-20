# Firestore Schema

This file documents the live Firestore shape used by the Collabathon Next.js app.

## Collections

### `users`
Document ID: Firebase Auth `uid`

Fields:
- `email: string`
- `displayName: string`
- `photoURL: string`
- `role: 'student' | 'client' | 'admin'`
- `accountStatus: 'active' | 'review' | 'suspended'`
- `createdAt`
- `updatedAt`

Purpose:
- source of truth for role-based routing
- source of truth for moderation/account status
- read by Firestore rules for access checks

### `students`
Document ID: `uid`

Fields:
- `userId: string`
- `name: string`
- `email: string`
- `bio: string`
- `college: string`
- `experienceLevel: 'beginner' | 'intermediate' | 'advanced'`
- `skills: string[]`
- `available: boolean`
- `photoURL: string`
- `location?: string`
- `createdAt`
- `updatedAt`

### `clients`
Document ID: `uid`

Fields:
- `userId: string`
- `companyName: string`
- `contactEmail: string`
- `description: string`
- `website: string`
- `projectType: string`
- `createdAt`
- `updatedAt`

### `projects`
Document ID: auto-id

Fields:
- `clientId: string`
- `title: string`
- `description: string`
- `requiredSkills: string[]`
- `budget?: number`
- `deadline?: string`
- `priority?: 'starter' | 'growth' | 'flagship'`
- `status: 'open' | 'in-progress' | 'completed'`
- `moderationStatus?: 'approved' | 'flagged' | 'hidden'`
- `teamId?: string`
- `createdAt`
- `updatedAt`

Notes:
- hidden projects are filtered from non-admin marketplace views
- clients and admins can still review hidden records directly

### `applications`
Document ID: auto-id

Fields:
- `projectId: string`
- `studentId: string`
- `studentName?: string`
- `studentEmail?: string`
- `message: string`
- `status: 'pending' | 'accepted' | 'rejected'`
- `createdAt`
- `updatedAt`

### `teams`
Document ID: auto-id

Fields:
- `projectId: string`
- `clientId?: string`
- `memberIds: string[]`
- `workspaceName?: string`
- `status?: string`
- `createdAt`
- `updatedAt`

Notes:
- team creation is the bridge between accepted applications and the workspace board
- team membership is used in rules for `teams`, `sprints`, `teamTasks`, and messages related to team execution

### `sprints`
Document ID: auto-id

Fields:
- `teamId: string`
- `title: string`
- `goal: string`
- `status: 'planned' | 'active' | 'completed'`
- `startDate?: string`
- `endDate?: string`
- `velocityTarget?: number`
- `createdBy?: string`
- `createdAt`
- `updatedAt`

### `teamTasks`
Document ID: auto-id

Fields:
- `teamId: string`
- `sprintId?: string`
- `title: string`
- `description: string`
- `status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done'`
- `priority: 'low' | 'medium' | 'high' | 'critical'`
- `storyPoints?: number`
- `dueDate?: string`
- `labels?: string[]`
- `assigneeIds?: string[]`
- `createdAt`
- `updatedAt`

### `messages`
Document ID: auto-id

Fields:
- `fromId: string`
- `toId: string`
- `text: string`
- `participants: string[]`
- `createdAt`

Notes:
- `participants` is used for realtime thread queries

### `reviews`
Document ID: auto-id

Fields:
- `fromId: string`
- `toId: string`
- `rating: number`
- `comment: string`
- `projectId?: string`
- `createdAt`

### `notifications`
Document ID: auto-id

Fields:
- `userId: string`
- `type: 'application' | 'message' | 'team' | 'review' | 'collaboration' | 'system'`
- `content: string`
- `read: boolean`
- `readAt?`
- `createdAt`

### `subscriptions`
Document ID: user `uid`

Fields:
- `userId: string`
- `customerId?: string`
- `subscriptionId?: string`
- `priceId?: string`
- `planId?: string`
- `status?: string`
- `seats?: number`
- `currentPeriodEnd?: string | null`
- `cancelAtPeriodEnd?: boolean`
- `createdAt`
- `updatedAt`

Notes:
- written from server/webhook flows using Firebase Admin
- read by the billing page and billing portal route

### `auditLogs`
Document ID: auto-id

Fields:
- `action: string`
- `summary: string`
- `actorId?: string`
- `actorDisplayName?: string`
- `targetType: 'user' | 'project' | 'team' | 'application' | 'task' | 'subscription' | string`
- `targetId: string`
- `metadata?: object`
- `createdAt`

Notes:
- moderation changes and Cloud Functions automations append audit events here
- admin UI surfaces recent entries directly

## Realtime Queries

### Messages
Used by `/messages`
- `where('participants', 'array-contains', userId)`
- `orderBy('createdAt', 'asc')`

### Notifications
Used by shell badge and `/notifications`
- `where('userId', '==', userId)`
- `where('read', '==', false)` for unread badge

## Recommended Indexes

Common indexes already represented in the project config or likely needed:

### `messages`
- `participants` array-contains
- `createdAt` ascending

### `students`
- `skills` array-contains
- `createdAt` descending

### `students`
- `available` ascending
- `createdAt` descending

### `projects`
- `clientId` ascending
- `createdAt` descending

If Firestore throws an index error in the console, use the generated link or update `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/firestore.indexes.json`.

## Security Notes

Rules live in:
- `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/firestore.rules`

Current security model:
- role comes from `users/{uid}.role`
- moderation state comes from `users/{uid}.accountStatus`
- active account checks gate writes to most user-driven collections
- team membership gates workspace collections
- admin-only access protects `auditLogs`
- owner/admin access protects `subscriptions`

## Cloud Functions Interaction

Functions in `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/functions/index.js` write to:
- `auditLogs`
- `notifications`
- `sprints`
- `subscriptions`

This is what ties automation, moderation history, and billing lifecycle sync together.
