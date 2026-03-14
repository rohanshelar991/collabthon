import { AppShell } from '@/components/layout/app-shell';
import { listStudents } from '@/lib/firestore';
import { recommendTeammates } from '@/lib/matching';
import { Suspense } from 'react';
import Link from 'next/link';

export default function StudentsPage({ searchParams }: { searchParams: { skill?: string; available?: string } }) {
  const skill = searchParams.skill || '';
  const availableOnly = searchParams.available === 'true';

  return (
    <AppShell>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Student Directory</h1>
          <p className="text-sm text-slate-500">Browse by skills and availability.</p>
        </div>
        <form className="flex flex-wrap items-center gap-2 text-sm">
          <input
            name="skill"
            placeholder="Filter by skill (e.g. react)"
            defaultValue={skill}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700"
          />
          <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <input type="checkbox" name="available" value="true" defaultChecked={availableOnly} className="rounded" /> Available only
          </label>
          <button type="submit" className="btn-primary">Filter</button>
        </form>
      </div>
      <Suspense fallback={<div className="card p-4">Loading students…</div>}>
        <StudentsList skill={skill} availableOnly={availableOnly} />
      </Suspense>
    </AppShell>
  );
}

async function StudentsList({ skill, availableOnly }: { skill?: string; availableOnly?: boolean }) {
  const students = await listStudents(skill, availableOnly);
  const recommendations = recommendTeammates(students, skill ? [skill] : ['nextjs', 'tailwind'], 12);

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      {recommendations.map((s) => (
        <Link
          key={s.id}
          href={`/students/${s.id}`}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.name}</p>
              <p className="text-xs text-slate-500">{s.college ?? 'Student'}</p>
            </div>
            <span className={`badge ${s.available ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200' : ''}`}>
              {s.available ? 'Available' : 'Busy'}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500 line-clamp-2">{s.bio}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {s.skills.map((skill) => (
              <span key={skill} className="badge">{skill}</span>
            ))}
          </div>
        </Link>
      ))}
    </div>
  );
}
