# Deployment Guide

This guide covers the production deployment path for the Collabathon Next.js app, Firebase rules/functions, and Stripe billing.

## 1. App Deployment Target

Recommended split:
- Vercel for the Next.js app
- Firebase for Auth, Firestore, Storage, and Cloud Functions

## 2. Before Deploying

Make sure these are ready:
- Firebase project exists: `collabthon`
- Firebase Auth providers enabled: Email/Password, Google
- Firestore database created
- Firebase Storage enabled
- Stripe products and prices created
- Admin user exists in `users/{uid}` with `role = admin`

## 3. Environment Variables

Add all values from:
- `/Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/.env.example`

Critical production variables:
- `NEXT_PUBLIC_FIREBASE_*`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_STRIPE_PRICE_STARTER`
- `NEXT_PUBLIC_STRIPE_PRICE_PRO`
- `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE`
- `STRIPE_WEBHOOK_SECRET`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

### Firebase Admin private key format
On Vercel, paste the private key with newline escapes preserved:
- `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n`

## 4. Deploy the Next.js App to Vercel

From the repo root:
```bash
cd /Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next
npm install
npm run build
```

Then:
- import the project into Vercel
- add env vars
- deploy

## 5. Deploy Firebase Rules and Indexes

```bash
cd /Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next
firebase login
firebase use collabthon
firebase deploy --only firestore:rules,firestore:indexes
```

If Storage is enabled:
```bash
firebase deploy --only storage
```

## 6. Deploy Cloud Functions

```bash
cd /Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next/functions
npm install
firebase deploy --only functions
```

## 7. Configure Stripe Webhooks

Production endpoint:
- `https://YOUR_DOMAIN/api/stripe/webhook`

Listen for:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy the signing secret into:
- `STRIPE_WEBHOOK_SECRET`

## 8. Local Stripe Testing

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Optional test events:
```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

## 9. Post-Deploy Verification

### Authentication
- student login works
- client login works
- admin login works
- Google sign-in works for student/client

### Firestore + app flows
- student profile saves
- client profile saves
- project can be created
- student can apply
- client can accept application
- team workspace appears
- task creation works
- notifications appear
- admin moderation updates persist
- audit log entries appear in `/admin`

### Billing
- checkout creates Stripe session
- webhook writes `subscriptions/{uid}`
- billing page shows plan/status
- billing portal opens

## 10. Repo Push Prep

Before pushing:
```bash
cd /Users/rohanmahendrashelar/Desktop/collab/collabthon/collabathon-next
git status --short
npm run build
```

Recommended:
- keep `.env.local` out of git
- rotate any secrets that were ever pasted into chat
- verify `README.md` and docs are current

If git auth is configured, push your branch with:
```bash
git push -u origin YOUR_BRANCH_NAME
```
