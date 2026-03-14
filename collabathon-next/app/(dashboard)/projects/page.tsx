import { AppShell } from '@/components/layout/app-shell';
import { createProject, listProjects } from '@/lib/firestore';
import { Suspense } from 'react';
import { revalidatePath } from 'next/cache';

export default function ProjectsPage() {
  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Projects</h1>
          <p className="text-sm text-slate-500">Post projects or apply as a student.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <ProjectForm />
        </div>
        <div className="lg:col-span-2">
          <Suspense fallback={<div className="card p-4">Loading projects…</div>}>
            <ProjectsList />
          </Suspense>
        </div>
      </div>
    </AppShell>
  );
}

function ProjectForm() {
  async function create(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const skills = (formData.get('skills') as string).split(',').map((s) => s.trim()).filter(Boolean);
    await createProject({ title, description, requiredSkills: skills, clientId: 'demo-client' });
    revalidatePath('/projects');
  }

  return (
    <form action={create} className="space-y-4">
      <div>
        <label className="text-sm text-slate-600">Title</label>
        <input name="title" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" />
      </div>
      <div>
        <label className="text-sm text-slate-600">Description</label>
        <textarea name="description" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" />
      </div>
      <div>
        <label className="text-sm text-slate-600">Required skills (comma separated)</label>
        <input name="skills" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" />
      </div>
      <button type="submit" className="btn-primary w-full">Post project</button>
    </form>
  );
}

async function ProjectsList() {
  const projects = await listProjects();
  return (
    <div className="grid gap-4">
      {projects.map((p) => (
        <div key={p.id} className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.title}</p>
              <p className="text-xs text-slate-500">{p.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.requiredSkills.map((skill) => (
                  <span key={skill} className="badge">{skill}</span>
                ))}
              </div>
            </div>
            <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">{p.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
