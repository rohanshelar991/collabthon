import { Timestamp, FieldValue } from 'firebase/firestore';
import { UserRole } from '@/lib/roles';

export interface StudentProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  bio?: string;
  college?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
  photoURL?: string;
  available: boolean;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

export interface ClientProfile {
  id: string;
  userId: string;
  companyName: string;
  contactEmail: string;
  description?: string;
  website?: string;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

export interface Project {
  id: string;
  clientId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  budget?: number;
  deadline?: string;
  status: 'open' | 'in-progress' | 'completed';
  createdAt?: Timestamp | FieldValue;
}

export interface Application {
  id: string;
  projectId: string;
  studentId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt?: Timestamp | FieldValue;
}

export interface Team {
  id: string;
  projectId: string;
  memberIds: string[];
  createdAt?: Timestamp | FieldValue;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  participants?: string[];
  text: string;
  createdAt?: Timestamp | FieldValue;
}

export interface Review {
  id: string;
  fromId: string;
  toId: string;
  rating: number;
  comment?: string;
  createdAt?: Timestamp | FieldValue;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'collaboration' | 'application' | 'message';
  content: string;
  read: boolean;
  createdAt?: Timestamp | FieldValue;
}

export interface UserRecord {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
  createdAt?: Timestamp | FieldValue;
}
