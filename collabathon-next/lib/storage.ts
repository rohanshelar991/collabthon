'use client';

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadProfilePhoto(file: File, uid: string) {
  const storageRef = ref(storage, `profiles/${uid}/${file.name}`);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type
  });
  return getDownloadURL(snapshot.ref);
}
