# Collabathon

Collabathon is a premium full-stack collaboration platform for students, clients, and admins. It combines role-shaped authentication, talent discovery, project publishing, realtime messaging, team workspaces, billing, moderation, and audit automation into one Firebase-backed product.

## Stack

- Frontend: Next.js 16 App Router, React 19, Tailwind CSS
- Backend: Firebase Authentication, Firestore, Storage, Cloud Functions
- Billing: Stripe Checkout, Billing Portal, Webhooks
- Security: Firestore rules, role-aware routing, Firebase Admin writes for server/webhook flows
- Analytics + add-ons: GA4, reCAPTCHA, SendGrid, Google Maps/Vision/Translate scaffolding

## Product Surface

### Core user lanes
- Student lane: profile builder, teammate discovery, project applications, realtime chat, notifications
- Client lane: company profile, project briefs, applicant review, team creation, workspace execution
- Admin lane: platform moderation, account review, project moderation, audit trail, marketplace health

### Advanced layers
- Team workspace: sprints, Kanban board, task flow, workspace metrics
- Billing: subscription plans, Stripe Checkout, customer portal, Firestore subscription sync
- Trust + governance: audit logs, moderation actions, Cloud Functions automation

## Main Routes

### Public
- `/` landing page
- `/sign-in` role portal chooser
- `/sign-up` role signup chooser
- `/student/login`
- `/student/signup`
- `/client/login`
- `/client/signup`
- `/admin-login`

### App
- `/dashboard`
- `/dashboard/user`
- `/dashboard/client`
- `/dashboard/admin`
- `/profile`
- `/students`
- `/students/[id]`
- `/projects`
- `/workspace`
- `/messages`
- `/notifications`
- `/billing`
- `/admin`

### API routes
- `/api/stripe/checkout`
- `/api/stripe/portal`
- `/api/stripe/webhook`
- `/api/recaptcha`
- `/api/email/subscribe`
- `/api/translate`
- `/api/vision`

## Key Files

- `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/app/` app routes
- `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/components/layout/app-shell.tsx` role-aware shell and navigation
- `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/components/auth/role-sign-in-form.tsx` role login UI and routing
- `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/components/auth/role-sign-up-form.tsx` role signup UI and profile seeding
- `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/lib/firestore.ts` Firestore data layer
- `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/lib/firebase.ts` client Firebase bootstrap
- `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/lib/firebase-admin.ts` Firebase Admin bootstrap for server/webhook writes
- `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/lib/billing.ts` plan metadata and Stripe price resolution
- `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/firestore.rules` production rules
- `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/firestore.indexes.json` Firestore indexes
- `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/storage.rules` Storage rules
- `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/functions/index.js` Cloud Functions automations

## Local Setup

### 1. Install dependencies
```bash
cd /Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next
npm install
```

### 2. Create env file
```bash
cp .env.example .env.local
```

### 3. Run dev server
```bash
npm run dev
```

### 4. Production build
```bash
npm run build
```

The build is configured to use webpack because this machine currently falls back to WASM when the native SWC binary is unavailable.

## Environment Variables

See `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/.env.example` for the full list.

### Firebase web config
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### Stripe
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_STRIPE_PRICE_STARTER`
- `NEXT_PUBLIC_STRIPE_PRICE_PRO`
- `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE`
- `STRIPE_WEBHOOK_SECRET`

### Firebase Admin for webhook/server writes
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

### Google + platform integrations
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
- `NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY`
- `GOOGLE_RECAPTCHA_SECRET`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `GOOGLE_VISION_API_KEY`
- `GOOGLE_TRANSLATE_API_KEY`
- `SENDGRID_API_KEY`
- `SENDGRID_LIST_ID`
- `EMAIL_FROM`

## Firebase Setup Checklist

### Authentication
Enable in Firebase Console:
- Email/Password
- Google

### Firestore
- Create the Firestore database
- Deploy rules:
```bash
firebase deploy --only firestore:rules
```
- Deploy indexes if needed:
```bash
firebase deploy --only firestore:indexes
```

### Storage
- Enable Firebase Storage in the console
- Deploy rules:
```bash
firebase deploy --only storage
```

### Cloud Functions
From `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/functions`:
```bash
npm install
firebase deploy --only functions
```

## Stripe Setup

### Create products and prices
Create three recurring Stripe prices and copy the IDs into:
- `NEXT_PUBLIC_STRIPE_PRICE_STARTER`
- `NEXT_PUBLIC_STRIPE_PRICE_PRO`
- `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE`

### Local webhook testing
With the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Copy the webhook secret into `STRIPE_WEBHOOK_SECRET`.

### Production webhook
Create a Stripe webhook pointing to:
- `https://YOUR_DOMAIN/api/stripe/webhook`

Subscribe to:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Cloud Functions Included

Defined in `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/functions/index.js`:
- `setUserRole` callable
- `refreshRole` callable
- `seedWorkspaceOnTeamCreate`
- `logApplicationLifecycle`
- `notifyTaskAssignees`
- `syncSubscriptionNotifications`

These functions seed workspace assets, write audit logs, and create system notifications around important lifecycle events.

## Firestore Collections

Primary collections used by the app:
- `users`
- `students`
- `clients`
- `projects`
- `applications`
- `teams`
- `sprints`
- `teamTasks`
- `messages`
- `reviews`
- `notifications`
- `subscriptions`
- `auditLogs`

See `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/docs/firestore-schema.md` for the full schema and index notes.

## Security Model

- Role is stored in `users/{uid}.role`
- Account safety state is stored in `users/{uid}.accountStatus`
- Firestore rules gate access by role, account status, ownership, and team membership
- Hidden projects are readable only by admins or the owning client
- Subscription records are writable only by trusted server/admin paths
- Audit logs are readable by admins only

## Deployment

### Vercel
- Import the repo into Vercel
- Add all env vars from `.env.example`
- Ensure Firebase Admin env vars are present for billing webhooks
- Deploy normally using the Next.js preset

### Firebase
If you want Firebase-managed rules/functions deployment:
```bash
firebase login
firebase use collabthon
firebase deploy --only firestore:rules,firestore:indexes,storage,functions
```

### Recommended production flow
1. Deploy the Next app to Vercel
2. Deploy Firestore rules/indexes and Storage rules with Firebase CLI
3. Deploy Cloud Functions
4. Add the production Stripe webhook
5. Verify checkout, billing portal, workspace creation, moderation actions, and notifications

## Production Checklist

- Firebase Auth providers enabled
- Firestore created and rules deployed
- Storage enabled and rules deployed
- Admin user exists in `users/{uid}` with `role = admin`
- Stripe products + prices created
- Stripe webhook configured
- Firebase Admin env vars added to Vercel
- Cloud Functions deployed
- `npm run build` passes

## Notes

- The app includes some Google integration scaffolding that can be enabled incrementally as keys are added.
- The repo still shows a non-blocking `baseline-browser-mapping` warning during builds. Updating it is safe:
```bash
npm i baseline-browser-mapping@latest -D
```
- If the native SWC package is missing on this machine, the configured webpack build path still succeeds.
