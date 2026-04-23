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
  location?: { lat: number; lng: number; label?: string };
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

export interface ClientProfile {
  id: string;
  userId: string;
  companyName: string;
  contactEmail: string;
  projectType?: string;
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
  priority?: 'starter' | 'growth' | 'flagship';
  moderationStatus?: 'approved' | 'flagged' | 'hidden';
  teamId?: string;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

export interface Application {
  id: string;
  projectId: string;
  studentId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  studentName?: string;
  studentEmail?: string;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

export interface Team {
  id: string;
  projectId: string;
  memberIds: string[];
  clientId?: string;
  workspaceName?: string;
  status?: 'forming' | 'active' | 'completed';
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

export interface Sprint {
  id: string;
  teamId: string;
  title: string;
  goal?: string;
  status: 'planned' | 'active' | 'completed';
  startDate?: string;
  endDate?: string;
  velocityTarget?: number;
  createdBy?: string;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

export interface TeamTask {
  id: string;
  teamId: string;
  sprintId?: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeIds?: string[];
  labels?: string[];
  storyPoints?: number;
  dueDate?: string;
  createdBy?: string;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  participants?: string[];
  text: string;
  read?: boolean;
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
  actorId?: string;
  projectId?: string;
  applicationId?: string;
  type: 'collaboration' | 'application' | 'message' | 'review' | 'team' | 'system';
  content: string;
  read: boolean;
  createdAt?: Timestamp | FieldValue;
  readAt?: Timestamp | FieldValue;
}

export interface UserRecord {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
  accountStatus?: 'active' | 'review' | 'suspended';
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  customerId?: string;
  subscriptionId?: string;
  priceId?: string;
  planId: 'starter' | 'pro' | 'enterprise';
  status:
    | 'inactive'
    | 'trialing'
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'incomplete'
    | 'paused';
  seats?: number;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

export interface AuditLog {
  id: string;
  projectId?: string;
  actorId?: string;
  actorDisplayName?: string;
  targetType: 'user' | 'project' | 'task' | 'team' | 'subscription' | 'system';
  targetId: string;
  action: string;
  summary: string;
  metadata?: Record<string, unknown>;
  createdAt?: Timestamp | FieldValue;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  targetType: 'student' | 'project';
  targetId: string;
  title: string;
  subtitle?: string;
  href: string;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

export interface SearchSubscription {
  id: string;
  userId: string;
  targetType: 'student' | 'project';
  title: string;
  description?: string;
  href: string;
  query?: string;
  filters?: Record<string, string | boolean | number | null | undefined>;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  userId: string;
  authorName: string;
  authorRole?: UserRole;
  text: string;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
