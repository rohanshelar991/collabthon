'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  Bookmark,
  BookmarkCheck,
  BellPlus,
  Compass,
  Filter,
  Radar,
  Search,
  Sparkles,
  Star,
  UsersRound
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { auth } from '@/lib/firebase';
import {
  createSearchSubscription,
  listStudents,
  listWatchlistItems,
  toggleWatchlistItem
} from '@/lib/firestore';
import { recommendTeammates } from '@/lib/matching';
import { pushToast } from '@/components/ui/toaster';
import type { StudentProfile } from '@/types';

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

function initialsFor(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function StudentsPageClient() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [skill, setSkill] = useState(searchParams.get('skill') ?? '');
  const [college, setCollege] = useState(searchParams.get('college') ?? '');
  const [experience, setExperience] = useState(searchParams.get('experience') ?? '');
  const [availableOnly, setAvailableOnly] = useState(searchParams.get('available') === 'true');
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [savedStudentIds, setSavedStudentIds] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSearch, setSavingSearch] = useState(false);

  async function loadStudents(nextSkill = skill, nextAvailableOnly = availableOnly) {
    setLoading(true);
    try {
      const loadedStudents = await listStudents(nextSkill || undefined, nextAvailableOnly);
      setStudents(loadedStudents);
    } catch (error: any) {
      pushToast(error?.message || 'Unable to load students.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStudents();
  }, [availableOnly, skill]);

  useEffect(() => {
    const nextSkill = searchParams.get('skill') ?? '';
    const nextCollege = searchParams.get('college') ?? '';
    const nextExperience = searchParams.get('experience') ?? '';
    const nextAvailableOnly = searchParams.get('available') === 'true';

    setSkill((current) => (current === nextSkill ? current : nextSkill));
    setCollege((current) => (current === nextCollege ? current : nextCollege));
    setExperience((current) => (current === nextExperience ? current : nextExperience));
    setAvailableOnly((current) => (current === nextAvailableOnly ? current : nextAvailableOnly));
  }, [searchParams]);

  useEffect(() => onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null)), []);

  useEffect(() => {
    if (!userId) {
      setSavedStudentIds([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const items = await listWatchlistItems(userId, 'student');
        if (!cancelled) setSavedStudentIds(items.map((item) => item.targetId));
      } catch (error: any) {
        if (!cancelled) pushToast(error?.message || 'Unable to load saved radar.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const filtered = useMemo(() => {
    return students.filter((student) => {
      const matchesExperience = experience ? student.experienceLevel === experience : true;
      const matchesCollege = college
        ? student.college?.toLowerCase().includes(college.toLowerCase())
        : true;
      return matchesExperience && matchesCollege;
    });
  }, [college, experience, students]);

  const recommendations = useMemo(
    () => recommendTeammates(filtered, skill ? [skill] : ['nextjs', 'tailwind'], 12),
    [filtered, skill]
  );

  const topSkills = useMemo(() => {
    const counts = new Map<string, number>();
    students.forEach((student) => {
      student.skills.forEach((entry) => counts.set(entry, (counts.get(entry) || 0) + 1));
    });
    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6);
  }, [students]);

  const metrics = useMemo(
    () => [
      { label: 'Live talent', value: students.length, icon: UsersRound },
      {
        label: 'Available now',
        value: students.filter((student) => student.available).length,
        icon: Sparkles
      },
      {
        label: 'Advanced builders',
        value: students.filter((student) => student.experienceLevel === 'advanced').length,
        icon: Star
      },
      {
        label: 'Saved radar',
        value: savedStudentIds.length,
        icon: Radar
      }
    ],
    [savedStudentIds.length, students]
  );

  async function handleToggleSaved(student: StudentProfile) {
    if (!userId) {
      pushToast('Sign in to save talent to your radar.');
      return;
    }

    setSavingId(student.id);
    try {
      const result = await toggleWatchlistItem(userId, {
        targetType: 'student',
        targetId: student.id,
        title: student.name,
        subtitle:
          student.college ||
          `${experienceLabel(student.experienceLevel)} · ${student.skills.slice(0, 3).join(', ')}`,
        href: `/students/${student.id}`
      });

      setSavedStudentIds((current) =>
        result.saved
          ? Array.from(new Set([...current, student.id]))
          : current.filter((entry) => entry !== student.id)
      );
      pushToast(
        result.saved
          ? `${student.name} added to your saved radar.`
          : `${student.name} removed from your saved radar.`
      );
    } catch (error: any) {
      pushToast(error?.message || 'Unable to update saved radar.');
    } finally {
      setSavingId(null);
    }
  }

  const hasActiveSearch =
    Boolean(skill.trim()) ||
    Boolean(college.trim()) ||
    Boolean(experience.trim()) ||
    availableOnly;

  async function handleSaveSearch() {
    if (!userId) {
      pushToast('Sign in to save search alerts.');
      return;
    }

    if (!hasActiveSearch) {
      pushToast('Add at least one filter before saving a search alert.');
      return;
    }

    setSavingSearch(true);
    try {
      const params = new URLSearchParams();
      if (skill.trim()) params.set('skill', skill.trim());
      if (college.trim()) params.set('college', college.trim());
      if (experience.trim()) params.set('experience', experience.trim());
      if (availableOnly) params.set('available', 'true');

      const titleParts = [
        skill.trim() ? `${skill.trim()} talent` : '',
        college.trim() ? college.trim() : '',
        experience ? experienceLabel(experience as StudentProfile['experienceLevel']) : '',
        availableOnly ? 'available now' : ''
      ].filter(Boolean);

      await createSearchSubscription(userId, {
        targetType: 'student',
        title: titleParts.join(' · ') || 'Student talent search',
        description: 'Saved teammate discovery alert',
        href: `/students?${params.toString()}`,
        query: skill.trim(),
        filters: {
          skill: skill.trim() || null,
          college: college.trim() || null,
          experience: experience || null,
          availableOnly
        }
      });

      pushToast('Search alert saved to your radar.');
    } catch (error: any) {
      pushToast(error?.message || 'Unable to save search alert.');
    } finally {
      setSavingSearch(false);
    }
  }

  return (
    <AppShell>
      <section className="hero-panel p-5 sm:p-7 text-white">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="data-kicker text-cyan-200">Discovery engine</p>
            <h1 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              Find standout student operators with sharper signal and stronger fit.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              This directory now feels more like a premium talent radar: filter by stack, scan the
              highest-signal builders, and jump straight into collaboration.
            </p>
          </div>

          <div className="grid w-full gap-3 md:min-w-[260px]">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="hero-metric-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                        {metric.label}
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-white">
                        {loading ? '...' : metric.value}
                      </p>
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.88fr,1.12fr]">
        <section className="command-surface">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="data-kicker">Filters</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                Team search console
              </h2>
            </div>
            <div className="orb-badge">
              <Filter size={18} />
            </div>
          </div>

          <form
            className="mt-5 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void loadStudents(skill, availableOnly);
            }}
          >
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Skill
              </span>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <Search size={16} className="text-slate-400" />
                <input
                  placeholder="react, firebase, ui"
                  value={skill}
                  onChange={(event) => setSkill(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  College
                </span>
                <input
                  placeholder="MIT, VIT, COEP..."
                  value={college}
                  onChange={(event) => setCollege(event.target.value)}
                  className="field-shell w-full"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Experience
                </span>
                <select
                  value={experience}
                  onChange={(event) => setExperience(event.target.value)}
                  className="field-shell w-full"
                >
                  <option value="">Any level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
            </div>

            <label className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/65 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
              <span>Only show currently available teammates</span>
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(event) => setAvailableOnly(event.target.checked)}
                className="rounded"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn-primary">
                Filter talent
              </button>
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:text-slate-200"
                disabled={savingSearch}
                onClick={() => void handleSaveSearch()}
              >
                <span className="inline-flex items-center gap-2">
                  <BellPlus size={15} />
                  {savingSearch ? 'Saving alert...' : 'Save search alert'}
                </span>
              </button>
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
                onClick={() => {
                  setSkill('');
                  setCollege('');
                  setExperience('');
                  setAvailableOnly(false);
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        <section className="spotlight-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="data-kicker">Market pulse</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                Most common specialties
              </h2>
            </div>
            <div className="orb-badge">
              <Compass size={18} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {topSkills.length ? (
              topSkills.map(([entry, count]) => (
                <div key={entry} className="signal-pill">
                  {entry}
                  <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-white dark:bg-slate-100 dark:text-slate-950">
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300/80 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
                Skill demand will show up here once the directory is populated.
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200/80 bg-white/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/50">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Saved radar
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Keep standout teammates close so you can message or revisit them fast.
              </p>
            </div>
            <Link href="/watchlist" className="btn-primary">
              Open saved radar
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {loading ? (
          <div className="card p-5 text-sm text-slate-500">Loading students...</div>
        ) : (
          recommendations.map((student) => (
            <article key={student.id} className="profile-orbit spotlight-card p-5">
              <div className="relative z-[1] flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {student.photoURL ? (
                      <img
                        src={student.photoURL}
                        alt={student.name}
                        className="h-14 w-14 rounded-2xl object-cover shadow-[0_18px_34px_rgba(15,23,42,0.18)]"
                      />
                    ) : (
                      <div className="orb-badge h-14 w-14 rounded-2xl text-base font-bold">
                        {initialsFor(student.name)}
                      </div>
                    )}
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {student.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-300">
                        {student.college ?? 'Student collaborator'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`badge ${
                        student.available
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {student.available ? 'Available' : 'Busy'}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleToggleSaved(student)}
                      disabled={savingId === student.id}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${
                        savedStudentIds.includes(student.id)
                          ? 'bg-brand-500 text-white shadow-[0_12px_30px_rgba(14,165,233,0.28)]'
                          : 'border border-slate-200 bg-white/85 text-slate-700 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200'
                      }`}
                    >
                      {savedStudentIds.includes(student.id) ? (
                        <BookmarkCheck size={14} />
                      ) : (
                        <Bookmark size={14} />
                      )}
                      {savingId === student.id
                        ? 'Saving...'
                        : savedStudentIds.includes(student.id)
                          ? 'Saved'
                          : 'Save'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="metric-frame">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Experience
                    </p>
                    <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                      {experienceLabel(student.experienceLevel)}
                    </p>
                  </div>
                  <div className="metric-frame">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Skill stack
                    </p>
                    <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                      {student.skills.length} skills
                    </p>
                  </div>
                </div>

                <p className="line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {student.bio || 'No bio yet, but this builder is ready to be discovered.'}
                </p>

                <div className="flex flex-wrap gap-2">
                  {student.skills.slice(0, 5).map((studentSkill) => (
                    <span key={studentSkill} className="badge">
                      {studentSkill}
                    </span>
                  ))}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Link href={`/students/${student.id}`} className="btn-primary">
                    View profile
                  </Link>
                  <Link
                    href={`/messages?to=${student.id}&name=${encodeURIComponent(student.name)}`}
                    className="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                  >
                    Message now
                  </Link>
                </div>
              </div>
            </article>
          ))
        )}

        {!loading && recommendations.length === 0 && (
          <div className="spotlight-card p-6 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <Sparkles size={16} /> No matches yet
            </div>
            <p className="mt-3 leading-7">
              Try widening your filters, clearing the skill query, or switching availability mode to
              surface more candidates.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<AppShell><div className="card p-6 text-sm text-slate-500 dark:text-slate-300">Loading talent radar...</div></AppShell>}>
      <StudentsPageClient />
    </Suspense>
  );
}
