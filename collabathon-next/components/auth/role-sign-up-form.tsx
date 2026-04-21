'use client';

import Link from 'next/link';
import { type Route } from 'next';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  GraduationCap,
  Layers3,
  Sparkles,
  Wand2
} from 'lucide-react';
import { googleLogin, registerWithEmail } from '@/lib/auth';
import { pushToast } from '@/components/ui/toaster';
import { UserRole, readableRole } from '@/lib/roles';
import { clientProjectTypes, studentSkillOptions } from '@/lib/auth-options';
import { upsertClientProfile, upsertStudentProfile } from '@/lib/firestore';
import type { ClientProfile, StudentProfile } from '@/types';

const roleAccent: Record<Exclude<UserRole, 'admin'>, string> = {
  student: 'from-sky-500 to-cyan-400',
  client: 'from-emerald-500 to-teal-400'
};

const roleDetails: Record<
  Exclude<UserRole, 'admin'>,
  { title: string; body: string; icon: typeof GraduationCap; highlights: string[] }
> = {
  student: {
    title: 'Build a profile that gets shortlisted faster.',
    body: 'Show your stack, experience, and collaboration style so great teams and client briefs can find you early.',
    icon: GraduationCap,
    highlights: [
      'Skill-based teammate discovery and recommendation signals.',
      'Realtime project applications, messages, and notifications.',
      'A cleaner profile runway for hackathons and freelance work.'
    ]
  },
  client: {
    title: 'Open a company lane designed for actual delivery.',
    body: 'Position your company, define what you need built, and start attracting student teams with better fit and context.',
    icon: BriefcaseBusiness,
    highlights: [
      'Project briefs, applicant review, and team formation in one flow.',
      'Separate role lane keeps operational tools focused and clean.',
      'A premium front door for clients who want serious student talent.'
    ]
  }
};

const redirectByRole: Record<Exclude<UserRole, 'admin'>, Route> = {
  student: '/dashboard/user',
  client: '/dashboard/client'
};

export function RoleSignUpForm({ role }: { role: Exclude<UserRole, 'admin'> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [skills, setSkills] = useState<string[]>([]);
  const [projectType, setProjectType] = useState<string>(clientProjectTypes[0]);

  const title = useMemo(() => `${readableRole(role)} Signup`, [role]);
  const roleMeta = roleDetails[role];
  const RoleIcon = roleMeta.icon;

  function toggleSkill(skill: string) {
    setSkills((current) =>
      current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]
    );
  }

  async function syncRoleProfile(uid: string, displayName: string, incomingEmail: string) {
    if (role === 'student') {
      const profile: Omit<StudentProfile, 'id' | 'userId'> = {
        name: fullName || displayName,
        email: incomingEmail,
        bio: '',
        college: '',
        experienceLevel: experienceLevel as StudentProfile['experienceLevel'],
        skills,
        available: true,
        photoURL: ''
      };
      await upsertStudentProfile(uid, profile);
      return;
    }

    const profile: Omit<ClientProfile, 'id' | 'userId'> = {
      companyName: companyName || displayName,
      contactEmail: incomingEmail,
      description: '',
      website: '',
      projectType
    };
    await upsertClientProfile(uid, profile);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (role === 'student' && skills.length === 0) {
      pushToast('Please choose at least one skill.');
      return;
    }

    if (password.length < 6) {
      pushToast('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const displayName = role === 'student' ? fullName : companyName;
      const result = await registerWithEmail(email, password, role, { displayName });
      await syncRoleProfile(result.user.uid, displayName, email);

      if (result.warning) pushToast(result.warning);
      router.push(redirectByRole[role]);
    } catch (err: any) {
      pushToast(err?.message || `Unable to sign up as ${readableRole(role).toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="auth-stage w-full max-w-6xl p-4 md:p-6">
        <div className="relative z-[1] grid gap-6 lg:grid-cols-[0.94fr,1.06fr]">
          <section className="hero-panel flex flex-col justify-between p-5 text-white sm:p-7">
            <div>
              <div
                className={`inline-flex rounded-full bg-gradient-to-r ${roleAccent[role]} px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_18px_35px_rgba(14,165,233,0.22)]`}
              >
                {readableRole(role)}
              </div>
              <h1 className="mt-5 text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">{roleMeta.body}</p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <RoleIcon size={20} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Role runway</p>
                    <p className="mt-1 text-lg font-semibold text-white">{roleMeta.title}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {roleMeta.highlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200"
                  >
                    {highlight}
                  </div>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="hero-metric-card">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Setup layer</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {role === 'student' ? 'Discovery-ready profile' : 'Brief-ready company lane'}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    We seed the right profile document so the rest of the product can stay role-aware.
                  </p>
                </div>
                <div className="hero-metric-card">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-300">After signup</p>
                  <p className="mt-2 text-xl font-semibold text-white">Realtime workspace access</p>
                  <p className="mt-2 text-sm text-slate-300">
                    Your profile, notifications, and role-based dashboard are ready immediately after onboarding.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="command-surface p-5 sm:p-6 md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="data-kicker">Create access</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
                  Set up your workspace identity
                </h2>
              </div>
              <div className="orb-badge">
                <Wand2 size={18} />
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="insight-card">
                <div className="relative z-[1]">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Account</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">Role-seeded</p>
                </div>
              </div>
              <div className="insight-card">
                <div className="relative z-[1]">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Data layer</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">Firestore-backed</p>
                </div>
              </div>
              <div className="insight-card">
                <div className="relative z-[1]">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Output</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">Workspace ready</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {role === 'student' ? (
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Full name
                  </label>
                  <input
                    className="field-shell mt-1 w-full"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Aarav Mehta"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Company name
                  </label>
                  <input
                    className="field-shell mt-1 w-full"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="FinPilot Labs"
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    className="field-shell mt-1 w-full"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Password
                  </label>
                  <input
                    className="field-shell mt-1 w-full"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>

              {role === 'student' ? (
                <div className="grid gap-4 md:grid-cols-[0.86fr,1.14fr]">
                  <div className="aura-card p-5">
                    <div className="relative z-[1]">
                      <p className="data-kicker">Experience</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                        Position your level
                      </h3>
                      <select
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value)}
                        className="field-shell mt-4 w-full"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                      <div className="mt-4 rail-card p-4 text-sm text-slate-600 dark:text-slate-300">
                        Teams use this to understand whether you are ramping up, shipping steadily,
                        or ready to lead implementation.
                      </div>
                    </div>
                  </div>

                  <div className="spotlight-card p-5">
                    <div className="relative z-[1]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="data-kicker">Skill stack</p>
                          <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                            Pick your strongest tools
                          </h3>
                        </div>
                        <span className="glass-chip">{skills.length} selected</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {studentSkillOptions.map((skill) => {
                          const active = skills.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => toggleSkill(skill)}
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                                active
                                  ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-200'
                                  : 'border-slate-200/80 bg-white/70 text-slate-700 hover:border-brand-200 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-200'
                              }`}
                            >
                              {active ? <Check size={14} /> : <Layers3 size={14} />}
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="spotlight-card p-5">
                  <div className="relative z-[1] flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="data-kicker">Primary engagement</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                        What kind of work are you hiring for?
                      </h3>
                    </div>
                    <span className="glass-chip">Client setup</span>
                  </div>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="field-shell mt-4 w-full"
                  >
                    {clientProjectTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <div className="mt-4 signal-grid sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Best for
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                        MVPs, hackathon sponsorship, student contract work, and technical prototypes.
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Outcome
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                        Better applicant fit and faster shortlisting once your brief goes live.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button className="btn-primary w-full" disabled={loading} type="submit">
                {loading
                  ? `Creating ${readableRole(role).toLowerCase()} account...`
                  : `Create ${readableRole(role)} account`}
              </button>
            </form>

            <button
              onClick={() =>
                googleLogin(role)
                  .then(async (result) => {
                    const nextName =
                      role === 'student'
                        ? result.user.displayName || 'New student'
                        : result.user.displayName || 'New client';

                    if (role === 'student') {
                      const profile: Omit<StudentProfile, 'id' | 'userId'> = {
                        name: nextName,
                        email: result.user.email || '',
                        bio: '',
                        college: '',
                        experienceLevel: 'beginner',
                        skills: [],
                        available: true,
                        photoURL: result.user.photoURL || ''
                      };
                      await upsertStudentProfile(result.user.uid, profile);
                    } else {
                      const profile: Omit<ClientProfile, 'id' | 'userId'> = {
                        companyName: nextName,
                        contactEmail: result.user.email || '',
                        description: '',
                        website: '',
                        projectType
                      };
                      await upsertClientProfile(result.user.uid, profile);
                    }

                    if (result.warning) pushToast(result.warning);
                    router.push(redirectByRole[role]);
                  })
                  .catch((e) => pushToast(e.message))
              }
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/60 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900/70 dark:text-white"
            >
              <Sparkles size={16} />
              Continue with Google
            </button>

            <div className="mt-6 flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-300">
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="studio-chip">
                  <Sparkles size={14} />
                  Role-shaped onboarding
                </span>
                <span className="studio-chip">
                  <Wand2 size={14} />
                  Premium entry flow
                </span>
              </div>
              <p>
                Already have an account?{' '}
                <Link className="font-semibold text-brand-600" href={`/${role}/login`}>
                  Sign in
                </Link>
              </p>
              <Link
                className="inline-flex items-center gap-2 font-semibold text-brand-600"
                href="/sign-up"
              >
                Back to role selection
                <ArrowRight size={14} />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
