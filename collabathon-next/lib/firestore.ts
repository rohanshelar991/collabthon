import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  addDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { StudentProfile, ClientProfile, Project, Application, Team, Message, Review } from '@/types';

export async function upsertStudentProfile(userId: string, data: Omit<StudentProfile, 'id' | 'userId'>) {
  const ref = doc(db, 'students', userId);
  await setDoc(ref, { ...data, userId, updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true });
  return ref;
}

export async function upsertClientProfile(userId: string, data: Omit<ClientProfile, 'id' | 'userId'>) {
  const ref = doc(db, 'clients', userId);
  await setDoc(ref, { ...data, userId, updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true });
  return ref;
}

export async function listStudents(skill?: string, availableOnly = false) {
  const base = collection(db, 'students');
  const clauses = [] as any[];
  if (skill) clauses.push(where('skills', 'array-contains', skill));
  if (availableOnly) clauses.push(where('available', '==', true));
  const q = clauses.length ? query(base, ...clauses, orderBy('createdAt', 'desc')) : query(base, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Omit<StudentProfile, 'id'>;
    return { id: d.id, ...data };
  });
}

export async function listProjects() {
  const snap = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => {
    const data = d.data() as Omit<Project, 'id'>;
    return { id: d.id, ...data };
  });
}

export async function createProject(data: Omit<Project, 'id' | 'createdAt' | 'status'>) {
  const ref = await addDoc(collection(db, 'projects'), {
    ...data,
    status: 'open',
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function applyToProject(projectId: string, studentId: string, message?: string) {
  const ref = await addDoc(collection(db, 'applications'), {
    projectId,
    studentId,
    message,
    status: 'pending',
    createdAt: serverTimestamp()
  } satisfies Partial<Application>);
  return ref.id;
}

export async function createTeam(projectId: string, memberIds: string[]) {
  const ref = await addDoc(collection(db, 'teams'), {
    projectId,
    memberIds,
    createdAt: serverTimestamp()
  } satisfies Partial<Team>);
  return ref.id;
}

export async function sendMessage(fromId: string, toId: string, text: string) {
  const ref = await addDoc(collection(db, 'messages'), {
    fromId,
    toId,
    participants: [fromId, toId],
    text,
    createdAt: serverTimestamp()
  } satisfies Partial<Message>);
  return ref.id;
}

export async function addReview(fromId: string, toId: string, rating: number, comment?: string) {
  const ref = await addDoc(collection(db, 'reviews'), {
    fromId,
    toId,
    rating,
    comment,
    createdAt: serverTimestamp()
  } satisfies Partial<Review>);
  return ref.id;
}

export async function getProfile(userId: string) {
  const ref = doc(db, 'students', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<StudentProfile, 'id'>;
  return { id: snap.id, ...data };
}
