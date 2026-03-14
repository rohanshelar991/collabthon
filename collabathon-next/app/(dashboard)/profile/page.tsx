'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { auth } from '@/lib/firebase';
import { getProfile, upsertStudentProfile } from '@/lib/firestore';
import { uploadProfilePhoto } from '@/lib/storage';
import { pushToast } from '@/components/ui/toaster';
import type { StudentProfile } from '@/types';

const defaultProfile: Partial<StudentProfile> = {
  name: '',
  bio: '',
  college: '',
  experienceLevel: 'beginner',
  skills: [],
  available: true
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Partial<StudentProfile>>(defaultProfile);
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getProfile(uid).then((p) => {
      if (p) setProfile(p);
    });
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) {
      pushToast('You must be signed in');
      return;
    }
    setLoading(true);
    try {
      const form = e.currentTarget as any;
      const skills = (form.skills.value as string)
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
      await upsertStudentProfile(user.uid, {
        ...profile,
        name: form.name.value,
        bio: form.bio.value,
        college: form.college.value,
        experienceLevel: form.experienceLevel.value,
        skills,
        available: form.available.checked,
        email: user.email || ''
      } as any);
      pushToast('Profile saved');
    } catch (err: any) {
      pushToast(err?.message || 'Unable to save');
    } finally {
      setLoading(false);
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setLoading(true);
    try {
      const url = await uploadProfilePhoto(file, user.uid);
      setProfile((p) => ({ ...p, photoURL: url }));
      await upsertStudentProfile(user.uid, {
        ...profile,
        photoURL: url
      } as any);
      pushToast('Photo updated');
    } catch (err: any) {
      pushToast(err?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Your Profile</h1>
          <p className="text-sm text-slate-500">Edit student info and upload a profile photo.</p>
        </div>
        <form onSubmit={handleSave} className="card space-y-4 p-6">
          <div className="flex items-center gap-4">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-600">No photo</div>
            )}
            <label className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
              Upload photo
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-slate-600">Name</label>
              <input name="name" defaultValue={profile.name} required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" />
            </div>
            <div>
              <label className="text-sm text-slate-600">College</label>
              <input name="college" defaultValue={profile.college} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600">Bio</label>
            <textarea name="bio" defaultValue={profile.bio} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-slate-600">Experience level</label>
              <select
                name="experienceLevel"
                defaultValue={profile.experienceLevel}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-600">Skills (comma separated)</label>
              <input
                name="skills"
                defaultValue={profile.skills?.join(', ')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input type="checkbox" name="available" defaultChecked={profile.available} className="rounded" /> Available for teaming
          </label>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
