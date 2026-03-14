import { AppShell } from '@/components/layout/app-shell';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';

interface Props {
  params: { id: string };
}

export default async function StudentDetailPage({ params }: Props) {
  const ref = doc(db, 'students', params.id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return notFound();
  const student = { id: snap.id, ...snap.data() } as any;

  return (
    <AppShell>
      <div className="card p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Student</p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{student.name}</h1>
            <p className="text-sm text-slate-500">{student.college}</p>
          </div>
          <span className={`badge ${student.available ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200' : ''}`}>
            {student.available ? 'Available' : 'Busy'}
          </span>
        </div>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{student.bio}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {student.skills?.map((skill: string) => (
            <span key={skill} className="badge">{skill}</span>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
