import { AppShell } from @/components/layout/app-shell;
import { listProjects, listStudents } from @/lib/firestore;
import { recommendTeammates } from @/lib/matching;
import { Suspense } from react;
import Link from next/link;
import { CheckoutButton } from @/components/ui/checkout-button;

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-3">
        <Suspense fallback={<div className="card p-4">Loading projects…</div>}>
          <ProjectsPanel />
        </Suspense>
        <Suspense fallback={<div className="card p-4">Loading recommendations…</div>}>
          <RecommendationsPanel />
        </Suspense>
        <div className="card flex flex-col gap-3 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Pro</p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Unlock premium analytics</h3>
          <p className="text-sm text-slate-500">Stripe checkout placeholder with tax + webhooks ready.</p>
          <CheckoutButton />
        </div>
      </div>
    </AppShell>
  );
}

async function ProjectsPanel() {
  const projects = await listProjects();
  return (
    <div className="card p-5 lg:col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Open Projects</h2>
        <Link href="/projects" className="text-sm font-semibold text-brand-600">
          View all
        </Link>
      </div>
      <div className="mt-4 space-y-3">
        {projects.slice(0, 4).map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.title}</p>
            <p className="text-xs text-slate-500">{p.description}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.requiredSkills.map((skill) => (
                <span key={skill} className="badge">{skill}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function RecommendationsPanel() {
  const students = await listStudents();
  const recs = recommendTeammates(students, [react, firebase, ui], 4);
  return (
    <div className="card p-5 lg:col-span-1">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recommended Teammates</h2>
        <Link href="/students" className="text-sm font-semibold text-brand-600">
          View all
        </Link>
      </div>
      <div className="mt-4 grid gap-3">
        {recs.map((s) => (
          <div key={s.id} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.name}</p>
            <p className="text-xs text-slate-500">{s.college ?? Student}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {s.skills.slice(0, 4).map((skill) => (
                <span key={skill} className="badge">{skill}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
