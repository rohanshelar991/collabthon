'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { applyToProject, createProject, getProjectById, getUserRecord } from '@/lib/firestore';
import { pushToast } from '@/components/ui/toaster';
import type { Application, Project } from '@/types';
import type { UserRole } from '@/lib/roles';

export function ProjectComposer({
  onProjectCreated
}: {
  onProjectCreated?: (project: Project) => void;
}) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getUserRecord(uid)
      .then((user) => setRole(user?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      pushToast('Please sign in first.');
      return;
    }

    if (role !== 'client') {
      pushToast('Only clients can create projects.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const requiredSkills = String(formData.get('skills') || '')
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
    const budget = Number(formData.get('budget') || 0) || undefined;
    const deadline = String(formData.get('deadline') || '').trim() || undefined;
    const priority = (String(formData.get('priority') || 'growth') || 'growth') as Project['priority'];

    if (!title || !description || requiredSkills.length === 0) {
      pushToast('Add a title, description, and at least one required skill.');
      return;
    }

    setLoading(true);
    try {
      const projectId = await createProject({
        title,
        description,
        requiredSkills,
        clientId: user.uid,
        budget,
        deadline,
        priority
      });

      const createdProject =
        (await getProjectById(projectId)) ||
        ({
          id: projectId,
          title,
          description,
          requiredSkills,
          clientId: user.uid,
          budget,
          deadline,
          priority,
          status: 'open'
        } satisfies Project);

      onProjectCreated?.(createdProject);
      formRef.current?.reset();
      pushToast('Project created successfully.');
    } catch (error: any) {
      pushToast(error?.message || 'Unable to create project.');
    } finally {
      setLoading(false);
    }
  }

  if (role !== 'client') {
    return (
      <div className="rail-card border-dashed p-5 text-sm text-slate-500 dark:text-slate-300">
        Sign in as a client to open a live brief, define the skill stack, and start hiring student
        teams in real time.
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="data-kicker">Launch a brief</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            Open a premium project listing
          </h2>
        </div>
        <div className="stat-orb h-12 w-12 rounded-[18px]">
          <Wand2 size={18} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Project title</label>
        <input
          name="title"
          required
          className="field-shell mt-1 w-full"
          placeholder="AI budgeting assistant for student teams"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">What needs to be shipped?</label>
        <textarea
          name="description"
          required
          rows={5}
          className="field-shell mt-1 w-full"
          placeholder="Explain the target outcome, product shape, and collaboration expectations."
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Required skills</label>
        <input
          name="skills"
          required
          className="field-shell mt-1 w-full"
          placeholder="react, firebase, product design"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Budget</label>
          <input
            name="budget"
            type="number"
            min="0"
            className="field-shell mt-1 w-full"
            placeholder="2500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Deadline</label>
          <input
            name="deadline"
            type="date"
            className="field-shell mt-1 w-full"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Priority</label>
          <select
            name="priority"
            defaultValue="growth"
            className="field-shell mt-1 w-full"
          >
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="flagship">Flagship</option>
          </select>
        </div>
      </div>

      <div className="rail-card p-4 text-sm text-slate-500 dark:text-slate-300">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <Sparkles size={16} />
          Industry-ready listing checklist
        </div>
        <p className="mt-2">
          Great briefs set a crisp outcome, skill stack, budget expectation, and deadline signal.
        </p>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Publishing...' : 'Publish project'}
      </button>
    </form>
  );
}

export function ApplyButton({
  projectId,
  applicationStatus,
  onApplied
}: {
  projectId: string;
  applicationStatus?: Application['status'];
  onApplied?: () => void;
}) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getUserRecord(uid)
      .then((user) => setRole(user?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  if (role !== 'student') return null;

  const buttonLabel =
    applicationStatus === 'accepted'
      ? 'Accepted'
      : applicationStatus === 'pending'
        ? 'Application sent'
        : applicationStatus === 'rejected'
          ? 'Reapply'
          : 'Apply now';

  const isLocked = applicationStatus === 'accepted' || applicationStatus === 'pending';

  return (
    <div className="w-full max-w-sm">
      <button
        className="btn-primary w-full"
        disabled={loading || isLocked}
        onClick={() => {
          if (isLocked) return;
          setExpanded((current) => !current);
        }}
      >
        {loading ? 'Submitting...' : buttonLabel}
      </button>

      {expanded ? (
        <div className="command-surface mt-3 p-4">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Add a quick note
          </label>
          <textarea
            rows={4}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Share why you're a strong fit, what you've built, or how soon you can start."
            className="field-shell mt-2 w-full"
          />
          <div className="mt-3 flex gap-2">
            <button
              className="btn-primary flex-1"
              disabled={loading}
              onClick={async () => {
                const user = auth.currentUser;
                if (!user) {
                  pushToast('Please sign in first.');
                  return;
                }

                setLoading(true);
                try {
                  await applyToProject(projectId, user.uid, note || 'Interested in contributing.');
                  setExpanded(false);
                  setNote('');
                  onApplied?.();
                  pushToast('Application submitted.');
                } catch (error: any) {
                  pushToast(error?.message || 'Unable to apply.');
                } finally {
                  setLoading(false);
                }
              }}
            >
              Send application
            </button>
            <button
              type="button"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
              onClick={() => setExpanded(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
