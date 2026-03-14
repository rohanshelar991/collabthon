# Firestore Collections

- `users` (uid, email, role, displayName, photoURL, createdAt)
- `students` (userId, name, email, college, experienceLevel, bio, skills[], available, photoURL, createdAt, updatedAt)
- `clients` (userId, companyName, contactEmail, description, website, createdAt, updatedAt)
- `projects` (clientId, title, description, requiredSkills[], budget, deadline, status, createdAt)
- `applications` (projectId, studentId, message, status, createdAt)
- `teams` (projectId, memberIds[], createdAt)
- `messages` (fromId, toId, text, createdAt)
- `reviews` (fromId, toId, rating, comment, createdAt)
- `notifications` (userId, type, content, read, createdAt)

## Realtime features
- Messages queried by `participants array-contains` + `createdAt asc` to stream conversations.
- Notifications queried by `userId` + `read == false` for badge counts.

## Suggested Indexes
- `students`: `skills array-contains` + `available` compound index for filtering.
- `projects`: `status` + `createdAt desc`.
- `messages`: `participants array-contains` + `createdAt asc` for conversations.

## Security Notes
- Roles stored on `users/{uid}.role` and also injected into auth token via custom claims for rule checks.
- Students/clients can only modify their own documents.
- Messages readable only by sender/recipient.
- Notifications readable only by the target `userId`.
