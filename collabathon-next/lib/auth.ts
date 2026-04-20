'use client';

import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { UserRole } from './roles';

type AuthResult = {
  user: User;
  warning?: string;
};

const PROFILE_WRITE_TIMEOUT_MS = 8000;

async function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs = PROFILE_WRITE_TIMEOUT_MS) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out. Please check Firebase setup.`)), timeoutMs);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function toMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function registerWithEmail(
  email: string,
  password: string,
  role: UserRole,
  profile: { displayName?: string; photoURL?: string }
) : Promise<AuthResult> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const warnings: string[] = [];

  if (profile.displayName || profile.photoURL) {
    try {
      await withTimeout(updateProfile(cred.user, profile), 'Updating your profile');
    } catch (error) {
      warnings.push(`Account created, but profile details could not be saved yet: ${toMessage(error, 'Unknown error')}`);
    }
  }

  try {
    await withTimeout(
      setDoc(doc(db, 'users', cred.user.uid), {
        email,
        role,
        displayName: profile.displayName || '',
        photoURL: profile.photoURL || '',
        createdAt: serverTimestamp()
      }),
      'Saving your account'
    );
  } catch (error) {
    warnings.push(`Account created, but setup is incomplete: ${toMessage(error, 'Unknown Firestore error')}`);
  }

  return {
    user: cred.user,
    warning: warnings.length ? warnings.join(' ') : undefined
  };
}

export async function emailLogin(email: string, password: string, rememberMe = true) {
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
  return signInWithEmailAndPassword(auth, email, password);
}

export async function googleLogin(role?: UserRole): Promise<AuthResult> {
  const cred = await signInWithPopup(auth, googleProvider);
  let warning: string | undefined;

  if (role) {
    try {
      await withTimeout(
        setDoc(
          doc(db, 'users', cred.user.uid),
          {
            email: cred.user.email,
            role,
            displayName: cred.user.displayName,
            photoURL: cred.user.photoURL,
            createdAt: serverTimestamp()
          },
          { merge: true }
        ),
        'Saving your Google account'
      );
    } catch (error) {
      warning = `Google sign-in worked, but profile sync is incomplete: ${toMessage(error, 'Unknown Firestore error')}`;
    }
  }

  return { user: cred.user, warning };
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export async function forgotPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}
