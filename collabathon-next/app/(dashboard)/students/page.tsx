import { AppShell } from @/components/layout/app-shell;
import { listStudents } from @/lib/firestore;
import { recommendTeammates } from @/lib/matching;
import { Suspense } from react;
import Link from next/link;

export default function StudentsPage({
  searchParams
}: {
  searchParams: { skill?: string; available?: string; experience?: string; college?: string };
}) {
  const skill = searchParams.skill || ;
  const availableOnly = searchParams.available === true;
  const experience = searchParams.experience || ;
  const college = searchParams.college || ;

  return (
    <AppShell>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Student Directory</h1>
          <p className="text-sm text-slate-500">Browse by skills, experience, college, and availability.</p>
        </div>
        <form className="flex flex-wrap items-center gap-2 text-sm">
          <input
            name="skill"
            placeholder="Skill (e.g. react)"
            defaultValue={skill}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700"
          />
          <input
            name="college"
            placeholder="College"
            defaultValue={college}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700"
          />
          <select
            name="experience"
            defaultValue={experience}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700"
          >
            <option value="">Any level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <input type="checkbox" name="available" value="true" defaultChecked={availableOnly} className="rounded" /> Available only
          </label>
          <button type="submit" className="btn-primary">Filter</button>
        </form>
      </div>
      <Suspense fallback={<div className="card p-4">Loading students…</div>}>
        <StudentsList skill={skill} availableOnly={availableOnly} experience={experience} college={college} />
      </Suspense>
    </AppShell>
  );
}

async function StudentsList({
  skill,
  availableOnly,
  experience,
  college
}: {
  skill?: string;
  availableOnly?: boolean;
  experience?: string;
  college?: string;
}) {
  const students = await listStudents(skill, availableOnly);
  const filtered = students.filter((s) => {
    const okExp = experience ? s.experienceLevel === experience : true;
    const okCollege = college ? s.college?.toLowerCase().includes(college.toLowerCase()) : true;
    return okExp && okCollege;
  });
  const recommendations = recommendTeammates(filtered, skill ? [skill] : [nextjs, tailwind], 12);

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
              <p className="text-xs text-slate-500">{s.college ?? Student}</p>
            </div>
            <span className={`badge ${s.available ? bg-green-100
