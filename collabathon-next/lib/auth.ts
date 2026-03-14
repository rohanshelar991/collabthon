'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { UserRole } from './roles';

export async function registerWithEmail(
  email: string,
  password: string,
  role: UserRole,
  profile: { displayName?: string; photoURL?: string }
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (profile.displayName || profile.photoURL) {
    await updateProfile(cred.user, profile);
  }
  await setDoc(doc(db, 'users', cred.user.uid), {
    email,
    role,
    displayName: profile.displayName || '',
    photoURL: profile.photoURL || '',
    createdAt: serverTimestamp()
  });
  return cred.user;
}

export async function emailLogin(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function googleLogin(role?: UserRole) {
  const cred = await signInWithPopup(auth, googleProvider);
  if (role) {
    await setDoc(
      doc(db, 'users', cred.user.uid),
      {
        email: cred.user.email,
        role,
        displayName: cred.user.displayName,
        photoURL: cred.user.photoURL,
        createdAt: serverTimestamp()
      },
      { merge: true }
    );
  }
  return cred.user;
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}
