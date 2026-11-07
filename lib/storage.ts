'use client';

import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadProfilePhoto(file: File, uid: string) {
  const storageRef = ref(storage, `profiles/${uid}/${file.name}`);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type
  });
  return getDownloadURL(snapshot.ref);
}

function normalizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}

export async function uploadProjectAttachment(file: File, projectId: string, uid: string) {
  const storagePath = `project-attachments/${projectId}/${uid}/${Date.now()}-${normalizeFileName(file.name)}`;
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type
  });
  const downloadURL = await getDownloadURL(snapshot.ref);

  return {
    downloadURL,
    storagePath,
    fileName: file.name,
    fileType: file.type,
    sizeBytes: file.size
  };
}

export async function deleteStorageFile(storagePath: string) {
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
}
