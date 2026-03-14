# Collabathon (Next.js + Firebase)

Modern full-stack platform for student teaming and client projects built with Next.js 16 (App Router), React 19, Tailwind CSS, Firebase (Auth, Firestore, Storage), plus Google APIs (OAuth, reCAPTCHA, Maps, Vision, Translate, GA4) and Stripe checkout.

## Quick Start
1) Install dependencies (Node.js 20+):
```bash
npm install
npm run dev
```
2) Copy `.env.example` to `.env.local` and set:
   - Firebase web config (`NEXT_PUBLIC_FIREBASE_*`)
   - Google: `GOOGLE_OAUTH_CLIENT_ID/SECRET`, `NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY` + `GOOGLE_RECAPTCHA_SECRET`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `GOOGLE_VISION_API_KEY`, `GOOGLE_TRANSLATE_API_KEY`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
   - Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, optional `STRIPE_WEBHOOK_SECRET`
   - Email: `SENDGRID_API_KEY` (and `SENDGRID_LIST_ID` if desired)
3) Deploy with Vercel or Firebase Hosting after `npm run build`.

## Key Paths
- `app/` — App Router routes (landing, auth, dashboard, students, projects, messages, admin)
- `app/(dashboard)/profile` — profile editor + Storage photo upload
- `app/(dashboard)/dashboard` — dashboard cards + Stripe checkout CTA
- `app/(dashboard)/students` — filters by skill/availability/experience/college
- `app/api/recaptcha`, `app/api/vision`, `app/api/translate`, `app/api/stripe/checkout`, `app/api/email/subscribe` — Google/Stripe/SendGrid hooks
- `lib/firebase.ts` — Firebase init + exports
- `lib/firestore.ts` — Data access helpers (students, clients, projects, applications, teams, messages, reviews)
- `lib/matching.ts` — Basic AI-style matching (Jaccard skill overlap)
- `lib/storage.ts` — Profile photo upload helpers (Firebase Storage)
- `lib/ga.ts` — GA4 loader
- `components/ui/map.tsx` — Google Maps mini-map
- `components/ui/recaptcha.tsx` — Invisible reCAPTCHA widget
- `firestore.rules` — Role-based security rules
- `docs/firestore-schema.md` — Schema outline & indexes
- `functions/` — Cloud Functions to set custom user claims (`setUserRole`) and `refreshRole` callable

## Roles
- `student` — create/edit own student profile, apply to projects, chat
- `client` — post projects, review applications, create teams
- `admin` — moderate users/projects (basic view provided)

## Running with emulator
```bash
firebase emulators:start --import=./seed --export-on-exit
```
Update `lib/firebase.ts` to point to emulator when `FIRESTORE_EMULATOR_HOST` is set.

## Deploy
- Vercel: add env vars, set `NEXT_PUBLIC_FIREBASE_*`, run `npm run build`
- Firebase Hosting: `firebase init hosting` in this folder and deploy the Next.js output using `next export` or `firebase hosting:channel:deploy`
- Cloud Functions: inside `functions/`, run `npm install` then `firebase deploy --only functions`

## Feature map vs environment
- Auth: Firebase Email/Password + Google OAuth (`GOOGLE_OAUTH_CLIENT_ID/SECRET`).
- Bot protection: reCAPTCHA invisible widget (`NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY`, `GOOGLE_RECAPTCHA_SECRET`).
- Storage: Firebase Storage (profile photos).
- Vision labels: `app/api/vision` (needs `GOOGLE_VISION_API_KEY`).
- Translate: `app/api/translate` (needs `GOOGLE_TRANSLATE_API_KEY`).
- Maps mini-map on profile: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- Analytics: GA4 (`NEXT_PUBLIC_GA4_MEASUREMENT_ID`) + Firestore `analytics` collection via `lib/analytics.ts`.
- Payments: Stripe checkout session via `/api/stripe/checkout` (needs `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
- Email marketing: SendGrid contact upsert via `/api/email/subscribe` (needs `SENDGRID_API_KEY`, optional `SENDGRID_LIST_ID`).
