'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BriefcaseBusiness, MessageSquareText, Sparkles, Star } from 'lucide-react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { getStudentById } from '@/lib/firestore';
import { pushToast } from '@/components/ui/toaster';
import type { StudentProfile } from '@/types';

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
      return 'Advanced builder';
    case 'intermediate':
      return 'Intermediate builder';
    default:
      return 'Early-stage builder';
  }
}

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;

    getStudentById(params.id)
      .then((loadedStudent) => setStudent(loadedStudent))
      .catch((error: any) => pushToast(error?.message || 'Unable to load student profile.'))
      .finally(() => setLoading(false));
  }, [params?.id]);

  const collaborationSignals = useMemo(() => {
    if (!student) return [];
    return [
      { label: 'Availability', value: student.available ? 'Open to collaborate' : 'Currently busy', icon: Sparkles },
      { label: 'Experience', value: experienceLabel(student.experienceLevel), icon: Star },
      { label: 'Stack depth', value: `${student.skills.length} listed skills`, icon: BriefcaseBusiness }
    ];
  }, [student]);

  return (
    <AppShell>
      {loading ? (
        <div className="card p-6 text-sm text-slate-500">Loading student profile...</div>
      ) : !student ? (
        <div className="card p-6 text-sm text-slate-500">Student profile not found.</div>
      ) : (
        <div className="space-y-6">
          <Link
            href="/students"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200"
          >
            <ArrowLeft size={16} />
            Back to directory
          </Link>

          <div className="grid gap-6 xl:grid-cols-[1.12fr,0.88fr]">
            <section className="hero-panel p-7 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-5">
                  {student.photoURL ? (
                    <img
                      src={student.photoURL}
                      alt={student.name}
                      className="h-24 w-24 rounded-[28px] object-cover shadow-[0_26px_60px_rgba(15,23,42,0.32)]"
                    />
                  ) : (
                    <div className="orb-badge h-24 w-24 rounded-[28px] text-2xl font-bold">
                      {initialsFor(student.name)}
                    </div>
                  )}
                  <div>
                    <p className="data-kicker text-cyan-200">Student profile</p>
                    <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-5xl">
                      {student.name}
                    </h1>
                    <p className="mt-3 text-sm text-slate-300">
                      {student.college || 'Independent student builder'}
                    </p>
                  </div>
                </div>

                <span
                  className={`badge ${
                    student.available
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {student.available ? 'Available now' : 'Currently busy'}
                </span>
              </div>

              <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-300">
                {student.bio || 'No bio added yet, but this builder is active on the platform.'}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {student.skills.map((skill) => (
                  <span key={skill} className="badge">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                  href={`/messages?to=${student.id}&name=${encodeURIComponent(student.name)}`}
                  className="btn-primary"
                >
                  <MessageSquareText size={16} />
                  Message {student.name.split(' ')[0]}
                </Link>
                <div className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-200">
                  Chat ID: <span className="font-semibold text-white">{student.id}</span>
                </div>
              </div>
            </section>

            <section className="grid gap-4">
              {collaborationSignals.map((signal) => {
                const Icon = signal.icon;
                return (
                  <div key={signal.label} className="spotlight-card p-5">
                    <div className="relative z-[1] flex items-center gap-4">
                      <div className="orb-badge">
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                          {signal.label}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                          {signal.value}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="command-surface">
                <p className="data-kicker">Why this profile stands out</p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  <li>- Clear specialization across {student.skills.slice(0, 3).join(', ') || 'core stack areas'}.</li>
                  <li>- {student.available ? 'Currently available for quick team formation.' : 'Likely better suited for scheduled collaboration.'}</li>
                  <li>- Stronger fit for hackathons, client work, and rapid prototyping teams.</li>
                </ul>
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
            <section className="spotlight-card p-6">
              <div className="relative z-[1]">
                <p className="data-kicker">Skill map</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                  Collaboration strengths
                </h2>
                <div className="mt-5 grid gap-4">
                  {student.skills.slice(0, 6).map((skill, index) => (
                    <div key={skill}>
                      <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
                        <span>{skill}</span>
                        <span>{Math.max(68, 96 - index * 5)}%</span>
                      </div>
                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 via-sky-400 to-emerald-400"
                          style={{ width: `${Math.max(68, 96 - index * 5)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="command-surface">
              <p className="data-kicker">Next move</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                Start a serious collaboration thread
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Reach out with your project scope, preferred timeline, and what role you need this
                builder to own. Clear asks convert faster than generic intros.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="metric-frame">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Suggested ask
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                    “We need someone to own the frontend build and polish the product flow in the
                    next 7 days.”
                  </p>
                </div>
                <div className="metric-frame">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Best use case
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                    Hackathon sprint, MVP delivery, portfolio-grade launch, or client prototype.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/messages?to=${student.id}&name=${encodeURIComponent(student.name)}`}
                  className="btn-primary"
                >
                  Open conversation
                </Link>
                <Link
                  href="/projects"
                  className="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                >
                  View live projects
                </Link>
              </div>
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}
