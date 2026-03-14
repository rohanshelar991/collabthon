# Collabathon (Next.js + Firebase)

Modern full-stack platform for student teaming and client projects built with Next.js 16 (App Router), React 19, Tailwind CSS, and Firebase (Auth, Firestore, Storage).

## Quick Start
1) Install dependencies (Node.js 20+):
```bash
npm install
npm run dev
```
2) Copy `.env.example` to `.env.local` and set your Firebase web config (public) plus any optional AI keys.
3) Deploy with Vercel or Firebase Hosting after `npm run build`.

## Key Paths
- `app/` — App Router routes (landing, auth, dashboard, students, projects, messages, admin)
- `app/(dashboard)/profile` — profile editor + Storage photo upload
- `lib/firebase.ts` — Firebase init + exports
- `lib/firestore.ts` — Data access helpers (students, clients, projects, applications, teams, messages, reviews)
- `lib/matching.ts` — Basic AI-style matching (Jaccard skill overlap)
- `lib/storage.ts` — Profile photo upload helpers (Firebase Storage)
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
