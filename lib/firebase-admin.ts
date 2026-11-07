import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getOptionalEnv, getRequiredEnv, isProd } from '@/lib/env';

const projectId =
  getOptionalEnv('FIREBASE_ADMIN_PROJECT_ID') ||
  getOptionalEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
const clientEmail = getOptionalEnv('FIREBASE_ADMIN_CLIENT_EMAIL');
const privateKey = getOptionalEnv('FIREBASE_ADMIN_PRIVATE_KEY')?.replace(/\\n/g, '\n');

if (isProd() && (!projectId || !clientEmail || !privateKey)) {
  throw new Error(
    'Firebase Admin credentials are required in production. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.'
  );
}

const adminApp = getApps()[0]
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: projectId || getRequiredEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
        clientEmail: clientEmail || getRequiredEnv('FIREBASE_ADMIN_CLIENT_EMAIL'),
        privateKey: privateKey || getRequiredEnv('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n')
      }),
      storageBucket: getRequiredEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET')
    });

export const adminDb = getFirestore(adminApp);
