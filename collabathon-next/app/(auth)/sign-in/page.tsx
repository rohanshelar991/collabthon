import Link from 'next/link';
import { ArrowRight, Briefcase, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';

const entries = [
  {
    href: '/student/login',
    title: 'Student Login',
    description: 'Jump into teammate discovery, applications, and realtime project collaboration.',
    icon: GraduationCap,
    accent: 'from-sky-500 to-cyan-400'
  },
  {
    href: '/client/login',
    title: 'Client Login',
    description: 'Run briefs, review applicants, and manage delivery from one workspace.',
    icon: Briefcase,
    accent: 'from-emerald-500 to-teal-400'
  }
] as const;

const features = [
  'Separate role lanes keep the product sharper and safer.',
  'Realtime messaging, applications, and notifications stay role-aware.',
  'Admin access remains isolated behind its own protected portal.'
];

const controlCards = [
  {
    title: 'Student lane',
    detail: 'Discovery-first access for teammate matching, applications, and execution.'
  },
  {
    title: 'Client lane',
    detail: 'An operations-shaped workspace for briefs, applicants, and delivery flow.'
  },
  {
    title: 'Admin lane',
    detail: 'Protected moderation and audit visibility without leaking into public portals.'
  }
] as const;

const accessConsole = [
  'Student accounts are routed into teammate discovery, projects, and chat.',
  'Client accounts are routed into briefs, applicants, and workspace delivery.',
  'Admin accounts stay isolated behind the protected moderation lane.'
] as const;

export default function SignInPage() {
  return (
    <div className="grid min-h-screen place-items-center px-6 py-12">
      <div className="w-full max-w-6xl space-y-8">
        <section className="hero-panel p-7 text-white">
          <div className="grid gap-8 lg:grid-cols-[1.08fr,0.92fr]">
            <div>
              <p className="data-kicker text-cyan-200">Collabathon access</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-6xl">
                Pick the right portal and enter a cleaner, role-shaped workflow.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                Students move fast, clients stay operational, and admins stay protected. The UI now
                makes that separation feel deliberate instead of merely functional.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="glass-chip bg-white/10 text-white border-white/10">
                  <Sparkles size={14} />
                  Realtime collaboration
                </span>
                <span className="glass-chip bg-white/10 text-white border-white/10">
                  <ShieldCheck size={14} />
                  Protected role access
                </span>
              </div>
            </div>

            <div className="grid gap-3 rounded-[30px] border border-white/10 bg-white/10 p-5 backdrop-blur-md">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200"
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="grid gap-5 md:grid-cols-2">
            {entries.map(({ href, title, description, icon: Icon, accent }) => (
              <Link key={href} href={href} className="portal-card group block">
                <div
                  className={`inline-flex rounded-[22px] bg-gradient-to-r ${accent} p-3.5 text-white shadow-[0_18px_35px_rgba(14,165,233,0.24)]`}
                >
                  <Icon size={24} />
                </div>
                <h2 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">
                  {description}
                </p>
                <div className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                  Continue <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>

          <div className="landing-band">
            <p className="data-kicker">Need another route?</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              Navigate the rest of the entry stack
            </h2>
            <div className="mt-5 grid gap-3">
              <Link
                href="/sign-up"
                className="rounded-[24px] border border-slate-200/80 bg-white/70 px-4 py-4 text-sm font-semibold text-slate-800 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
              >
                Create a new student or client account
              </Link>
              <Link
                href="/admin-login"
                className="rounded-[24px] border border-slate-200/80 bg-white/70 px-4 py-4 text-sm font-semibold text-slate-800 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
              >
                Open the separate admin login
              </Link>
            </div>
          </div>
        </div>

        <section className="aura-card p-6">
          <div className="relative z-[1]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="data-kicker">Access architecture</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                  Three portals, three tones, one connected workspace.
                </h2>
              </div>
              <span className="glass-chip">Ultra-premium entry stack</span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {controlCards.map((card) => (
                <div key={card.title} className="insight-card">
                  <div className="relative z-[1]">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      {card.title}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {card.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="premium-terminal p-6 text-white">
          <div className="relative z-[1]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-[11px] uppercase tracking-[0.24em] text-slate-300">
                Access console
              </span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {accessConsole.map((line) => (
                <div key={line} className="signal-console">
                  <p className="text-sm leading-7 text-slate-200">{line}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
