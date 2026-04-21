'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  Crown,
  Globe2,
  MapPin,
  Rocket,
  Star,
  UserRoundPen
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { AppShell } from '@/components/layout/app-shell';
import { auth } from '@/lib/firebase';
import {
  getClientProfile,
  getProfile,
  getUserRecord,
  listProjects,
  listReviewsForUser,
  upsertClientProfile,
  upsertStudentProfile
} from '@/lib/firestore';
import { uploadProfilePhoto } from '@/lib/storage';
import { pushToast } from '@/components/ui/toaster';
import type { ClientProfile, StudentProfile } from '@/types';
import type { UserRole } from '@/lib/roles';

const defaultStudentProfile: Partial<StudentProfile> = {
  name: '',
  bio: '',
  college: '',
  experienceLevel: 'beginner',
  skills: [],
  available: true,
  photoURL: ''
};

const defaultClientProfile: Partial<ClientProfile> = {
  companyName: '',
  contactEmail: '',
  projectType: 'Product MVP',
  description: '',
  website: ''
};

function initialsFor(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function experienceLabel(level?: StudentProfile['experienceLevel']) {
  switch (level) {
    case 'advanced':
      return 'Advanced';
    case 'intermediate':
      return 'Intermediate';
    default:
      return 'Beginner';
  }
}

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [studentProfile, setStudentProfile] = useState<Partial<StudentProfile>>(defaultStudentProfile);
  const [clientProfile, setClientProfile] = useState<Partial<ClientProfile>>(defaultClientProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null)), []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const userRecord = await getUserRecord(userId);
        if (cancelled) return;
        setRole(userRecord?.role ?? null);

        if (userRecord?.role === 'client') {
          const [profile, projects] = await Promise.all([
            getClientProfile(userId),
            listProjects({ clientId: userId })
          ]);

          if (cancelled) return;
          setClientProfile(profile || { ...defaultClientProfile, contactEmail: userRecord.email });
          setProjectCount(projects.length);
          setReviewCount(0);
          return;
        }

        if (userRecord?.role === 'admin') {
          const allProjects = await listProjects();
          if (cancelled) return;
          setProjectCount(allProjects.length);
          setReviewCount(0);
          return;
        }

        const [profile, reviews] = await Promise.all([getProfile(userId), listReviewsForUser(userId)]);

        if (cancelled) return;
        setStudentProfile(
          profile || {
            ...defaultStudentProfile,
            email: auth.currentUser?.email || ''
          }
        );
        setReviewCount(reviews.length);
        setProjectCount(0);
      } catch (error: any) {
        if (!cancelled) pushToast(error?.message || 'Unable to load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const studentCompletion = useMemo(() => {
    const checks = [
      !!studentProfile.name,
      !!studentProfile.bio,
      !!studentProfile.college,
      !!studentProfile.skills?.length,
      !!studentProfile.photoURL
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [studentProfile]);

  const clientCompletion = useMemo(() => {
    const checks = [
      !!clientProfile.companyName,
      !!clientProfile.contactEmail,
      !!clientProfile.description,
      !!clientProfile.projectType,
      !!clientProfile.website
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [clientProfile]);

  const studentSignals = [
    { label: 'Name', done: !!studentProfile.name },
    { label: 'Bio', done: !!studentProfile.bio },
    { label: 'College', done: !!studentProfile.college },
    { label: 'Skills', done: !!studentProfile.skills?.length },
    { label: 'Photo', done: !!studentProfile.photoURL }
  ];

  const clientSignals = [
    { label: 'Company', done: !!clientProfile.companyName },
    { label: 'Email', done: !!clientProfile.contactEmail },
    { label: 'Description', done: !!clientProfile.description },
    { label: 'Project type', done: !!clientProfile.projectType },
    { label: 'Website', done: !!clientProfile.website }
  ];

  async function handleStudentSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !auth.currentUser) return;

    setSaving(true);
    try {
      await upsertStudentProfile(userId, {
        name: studentProfile.name || '',
        email: auth.currentUser.email || studentProfile.email || '',
        bio: studentProfile.bio || '',
        college: studentProfile.college || '',
        experienceLevel: (studentProfile.experienceLevel ||
          'beginner') as StudentProfile['experienceLevel'],
        skills: (studentProfile.skills || []).filter(Boolean),
        photoURL: studentProfile.photoURL || '',
        available: studentProfile.available ?? true,
        location: studentProfile.location
      });
      pushToast('Student profile saved.');
    } catch (error: any) {
      pushToast(error?.message || 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleClientSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !auth.currentUser) return;

    setSaving(true);
    try {
      await upsertClientProfile(userId, {
        companyName: clientProfile.companyName || '',
        contactEmail: clientProfile.contactEmail || auth.currentUser.email || '',
        description: clientProfile.description || '',
        website: clientProfile.website || '',
        projectType: clientProfile.projectType || 'Product MVP'
      });
      pushToast('Client profile saved.');
    } catch (error: any) {
      pushToast(error?.message || 'Unable to save company profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    setSaving(true);
    try {
      const url = await uploadProfilePhoto(file, userId);
      setStudentProfile((current) => ({ ...current, photoURL: url }));
      await upsertStudentProfile(userId, {
        name: studentProfile.name || '',
        email: auth.currentUser?.email || studentProfile.email || '',
        bio: studentProfile.bio || '',
        college: studentProfile.college || '',
        experienceLevel: (studentProfile.experienceLevel ||
          'beginner') as StudentProfile['experienceLevel'],
        skills: studentProfile.skills || [],
        photoURL: url,
        available: studentProfile.available ?? true,
        location: studentProfile.location
      });
      pushToast('Profile photo updated.');
    } catch (error: any) {
      pushToast(error?.message || 'Upload failed.');
    } finally {
      setSaving(false);
    }
  }

  const studentName = studentProfile.name || auth.currentUser?.displayName || 'Student profile';
  const clientName = clientProfile.companyName || 'Client profile';

  return (
    <AppShell>
      <section className="mesh-panel p-5 sm:p-7 text-white">
        <div className="relative z-[1] grid gap-6 xl:grid-cols-[1fr,0.82fr]">
          <div className="max-w-3xl">
            <p className="data-kicker text-cyan-200">
              {role === 'client'
                ? 'Company identity'
                : role === 'admin'
                  ? 'Admin identity'
                  : 'Talent identity'}
            </p>
            <h1 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              {role === 'client'
                ? 'Shape the client presence students trust before they apply.'
                : role === 'admin'
                  ? 'Keep the control surface polished, trusted, and role-true.'
                  : 'Build a profile that makes the right teammates find you first.'}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              {role === 'client'
                ? 'Clear company positioning and project context improve applicant quality immediately.'
                : role === 'admin'
                  ? 'Your admin account is tied to Firestore-backed role data so UI and backend permissions can stay aligned.'
                  : 'Profiles drive teammate recommendations, application confidence, and stronger client trust.'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
            {[
              {
                label: 'Role',
                value: loading ? '...' : role || 'member',
                icon: role === 'client' ? Rocket : role === 'admin' ? Crown : UserRoundPen
              },
              {
                label: role === 'admin' ? 'Visible projects' : 'Completion',
                value:
                  role === 'client'
                    ? `${clientCompletion}%`
                    : role === 'admin'
                      ? String(projectCount)
                      : `${studentCompletion}%`,
                icon: Star
              },
              {
                label: role === 'client' ? 'Live briefs' : role === 'admin' ? 'Admin state' : 'Reviews',
                value: role === 'client' ? String(projectCount) : role === 'admin' ? 'Verified' : String(reviewCount),
                icon: role === 'client' ? Globe2 : MapPin
              }
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className="hero-metric-card"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                        {metric.label}
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-white">{metric.value}</p>
                    </div>
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                      <Icon size={18} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {role === 'client' ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[0.78fr,1.22fr]">
          <section className="spotlight-card p-6">
            <div className="relative z-[1]">
              <div className="profile-orbit flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-950 text-2xl font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
                {initialsFor(clientName)}
              </div>
              <p className="data-kicker mt-5">Client snapshot</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {clientName}
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                {clientProfile.contactEmail || auth.currentUser?.email || 'No contact email yet'}
              </p>

              <div className="mt-5">
                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-300">
                  <span>Profile strength</span>
                  <span>{clientCompletion}%</span>
                </div>
                <div className="score-meter mt-2">
                  <span style={{ width: `${clientCompletion}%` }} />
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {clientSignals.map((signal) => (
                  <div key={signal.label} className="rail-card flex items-center justify-between p-4">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {signal.label}
                    </span>
                    <span className={`badge ${signal.done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200' : ''}`}>
                      {signal.done ? 'Ready' : 'Missing'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3">
                <div className="insight-card">
                  <div className="relative z-[1]">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Brief strength
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                      {clientProfile.projectType || 'Define your main project type'}
                    </p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                      Sharper positioning improves applicant quality and team fit immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <form onSubmit={handleClientSave} className="command-surface space-y-5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="data-kicker">Client profile</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                  Company positioning
                </h2>
              </div>
              <span className="glass-chip">{clientCompletion}% complete</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Company name
                </label>
                <input
                  value={clientProfile.companyName || ''}
                  onChange={(event) =>
                    setClientProfile((current) => ({ ...current, companyName: event.target.value }))
                  }
                  className="field-shell mt-1 w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Contact email
                </label>
                <input
                  type="email"
                  value={clientProfile.contactEmail || ''}
                  onChange={(event) =>
                    setClientProfile((current) => ({ ...current, contactEmail: event.target.value }))
                  }
                  className="field-shell mt-1 w-full"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Project type
                </label>
                <input
                  value={clientProfile.projectType || ''}
                  onChange={(event) =>
                    setClientProfile((current) => ({ ...current, projectType: event.target.value }))
                  }
                  className="field-shell mt-1 w-full"
                  placeholder="Product MVP"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Website
                </label>
                <input
                  value={clientProfile.website || ''}
                  onChange={(event) =>
                    setClientProfile((current) => ({ ...current, website: event.target.value }))
                  }
                  className="field-shell mt-1 w-full"
                  placeholder="https://"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Description
              </label>
              <textarea
                rows={6}
                value={clientProfile.description || ''}
                onChange={(event) =>
                  setClientProfile((current) => ({ ...current, description: event.target.value }))
                }
                className="field-shell mt-1 w-full"
                placeholder="Describe what your team builds, how students can contribute, and what a strong collaboration looks like."
              />
            </div>

            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
              {saving ? 'Saving...' : 'Save company profile'}
            </button>
          </form>
        </div>
      ) : role === 'admin' ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr,1.2fr]">
          <section className="spotlight-card p-6">
            <div className="relative z-[1]">
              <div className="profile-orbit flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-950 text-2xl font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
                AD
              </div>
              <p className="data-kicker mt-5">Admin account</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                Verified control surface
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">
                Your admin experience now maps to the live `users/{'{uid}'}.role` record, which is the
                first step toward keeping UI access and backend rules in sync.
              </p>
            </div>
          </section>
          <section className="command-surface p-6">
            <p className="data-kicker">Status checks</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              Admin readiness
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                'Role-aware routing is active in the app shell.',
                'Firestore user role records can now power admin-specific visibility.',
                'This account sees platform-wide dashboards rather than student/client lanes.'
              ].map((item) => (
                <div key={item} className="rail-card p-4 text-sm text-slate-600 dark:text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[0.78fr,1.22fr]">
          <section className="spotlight-card p-6">
            <div className="relative z-[1]">
              {studentProfile.photoURL ? (
                <img
                  src={studentProfile.photoURL}
                  alt="Profile"
                  className="h-24 w-24 rounded-[30px] object-cover ring-4 ring-white/60"
                />
              ) : (
                <div className="profile-orbit flex h-24 w-24 items-center justify-center rounded-[30px] bg-slate-950 text-2xl font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
                  {initialsFor(studentName)}
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="glass-chip">{experienceLabel(studentProfile.experienceLevel)}</span>
                <span
                  className={`glass-chip ${
                    studentProfile.available
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                      : ''
                  }`}
                >
                  {studentProfile.available ? 'Available' : 'Busy'}
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
                {studentName}
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                {studentProfile.college || auth.currentUser?.email || 'Add your college and contact details'}
              </p>

              <div className="mt-5">
                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-300">
                  <span>Profile strength</span>
                  <span>{studentCompletion}%</span>
                </div>
                <div className="score-meter mt-2">
                  <span style={{ width: `${studentCompletion}%` }} />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {(studentProfile.skills || []).length ? (
                  (studentProfile.skills || []).map((skill) => (
                    <span key={skill} className="badge">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="badge">Add skills to improve matching</span>
                )}
              </div>

            <div className="mt-5 grid gap-3">
              {studentSignals.map((signal) => (
                <div key={signal.label} className="rail-card flex items-center justify-between p-4">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {signal.label}
                    </span>
                    <span
                      className={`badge ${
                        signal.done
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                          : ''
                      }`}
                    >
                      {signal.done ? 'Ready' : 'Missing'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3">
                <div className="insight-card">
                  <div className="relative z-[1]">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Match signal
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                      {(studentProfile.skills || []).length
                        ? `${(studentProfile.skills || []).length} skills powering discovery`
                        : 'Add skills to unlock stronger recommendations'}
                    </p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                      Complete profiles get surfaced faster in teammate and client discovery flows.
                    </p>
                  </div>
                </div>
              </div>

              <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
                <Camera size={16} />
                Upload photo
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
          </section>

          <form onSubmit={handleStudentSave} className="command-surface space-y-5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="data-kicker">Student profile</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                  Talent identity
                </h2>
              </div>
              <span className="glass-chip">{studentCompletion}% complete</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Name
                </label>
                <input
                  value={studentProfile.name || ''}
                  onChange={(event) =>
                    setStudentProfile((current) => ({ ...current, name: event.target.value }))
                  }
                  className="field-shell mt-1 w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  College
                </label>
                <input
                  value={studentProfile.college || ''}
                  onChange={(event) =>
                    setStudentProfile((current) => ({ ...current, college: event.target.value }))
                  }
                  className="field-shell mt-1 w-full"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Experience level
                </label>
                <select
                  value={studentProfile.experienceLevel || 'beginner'}
                  onChange={(event) =>
                    setStudentProfile((current) => ({
                      ...current,
                      experienceLevel: event.target.value as StudentProfile['experienceLevel']
                    }))
                  }
                  className="field-shell mt-1 w-full"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Skills
                </label>
                <input
                  value={(studentProfile.skills || []).join(', ')}
                  onChange={(event) =>
                    setStudentProfile((current) => ({
                      ...current,
                      skills: event.target.value
                        .split(',')
                        .map((skill) => skill.trim())
                        .filter(Boolean)
                    }))
                  }
                  className="field-shell mt-1 w-full"
                  placeholder="react, firebase, product design"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Bio
              </label>
              <textarea
                rows={6}
                value={studentProfile.bio || ''}
                onChange={(event) =>
                  setStudentProfile((current) => ({ ...current, bio: event.target.value }))
                }
                className="field-shell mt-1 w-full"
                placeholder="Summarize what you build best, how you collaborate, and what kinds of projects energize you."
              />
            </div>

            <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={studentProfile.available ?? true}
                onChange={(event) =>
                  setStudentProfile((current) => ({ ...current, available: event.target.checked }))
                }
                className="rounded"
              />
              Available for teaming right now
            </label>

            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
              {saving ? 'Saving...' : 'Save student profile'}
            </button>
          </form>
        </div>
      )}
    </AppShell>
  );
}
