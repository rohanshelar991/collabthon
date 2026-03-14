import { AppShell } from '@/components/layout/app-shell';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default async function AdminPage() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const projectsSnap = await getDocs(collection(db, 'projects'));

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Users</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-200">
            {usersSnap.docs.map((d) => {
              const data = d.data() as any;
              return (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                  <div>
                    <p className="font-semibold">{data.email}</p>
                    <p className="text-xs text-slate-500">{data.role}</p>
                  </div>
                  <span className="badge">{d.id}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Projects</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-200">
            {projectsSnap.docs.map((d) => {
              const data = d.data() as any;
              return (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                  <div>
                    <p className="font-semibold">{data.title}</p>
                    <p className="text-xs text-slate-500">{data.status}</p>
                  </div>
                  <span className="badge">{data.requiredSkills?.join(', ')}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
