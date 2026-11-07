import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Wand2,
  Workflow
} from 'lucide-react';

const entries = [
  {
    href: '/student/signup',
    title: 'Student Signup',
    description: 'Create a skill-rich profile, surface your strengths, and get discovered faster.',
    icon: GraduationCap,
    accent: 'from-sky-500 to-cyan-400'
  },
  {
    href: '/client/signup',
    title: 'Client Signup',
    description: 'Set up your workspace, define project types, and start staffing delivery teams.',
    icon: Briefcase,
    accent: 'from-emerald-500 to-teal-400'
  }
] as const;

const outcomes = [
  'Students get structured profiles that power teammate recommendations.',
  'Clients publish better briefs with clearer role and budget signals.',
  'The whole marketplace stays cleaner because onboarding is role-specific from day one.'
];

const launchCards = [
  {
    title: 'Student account',
    detail: 'Creates a discovery-ready profile that powers recommendations, applications, and messaging.'
  },
  {
    title: 'Client account',
    detail: 'Seeds a company profile that can publish projects, review applicants, and create teams.'
  },
  {
    title: 'Admin control',
    detail: 'Stays internal so governance and moderation never get mixed into public signup flows.'
  }
] as const;

const onboardingConsole = [
  'Student signup seeds a profile document used by discovery, applications, and recommendations.',
  'Client signup seeds a company record used by briefs, applicants, and workspace formation.',
  'Admin creation stays internal so governance remains protected from public onboarding.'
] as const;

const onboardingSignals = [
  {
    label: 'Profile seeding',
    value: 'Live',
    detail: 'Student and client onboarding creates role-shaped records instead of generic placeholder accounts.'
  },
  {
    label: 'Trust posture',
    value: 'Protected',
    detail: 'Admin creation stays off the public surface so moderation access is never mixed into general signup.'
  },
  {
    label: 'Launch quality',
    value: 'Structured',
    detail: 'Each role gets a cleaner runway into dashboards, projects, messaging, and workspace tools.'
  }
] as const;

const onboardingDeck = [
  {
    href: '/student/signup',
    title: 'Student setup',
    detail: 'Seed a discoverable profile with skills, experience, availability, and collaboration signal.',
    icon: GraduationCap
  },
  {
    href: '/client/signup',
    title: 'Client setup',
    detail: 'Create the company lane that can publish work, review applicants, and launch teams.',
    icon: Workflow
  },
  {
    href: '/sign-in',
    title: 'Return to login',
    detail: 'Already created an account? Jump back into the correct role portal with one click.',
    icon: ShieldCheck
  }
] as const;

export default function SignUpPage() {
  return (
    <div className="premium-stage grid min-h-screen place-items-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-6xl space-y-6">
        <section className="hero-panel p-5 text-white sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.08fr,0.92fr]">
            <div>
              <p className="data-kicker text-cyan-200">Collabathon onboarding</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Open the right account and step into a much more intentional workflow.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Instead of generic onboarding, every path now feels tailored: students build
                discovery-ready profiles while clients shape a serious project pipeline from day one.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="glass-chip bg-white/10 text-white border-white/10">
                  <Sparkles size={14} />
                  Profile-led discovery
                </span>
                <span className="glass-chip bg-white/10 text-white border-white/10">
                  <Wand2 size={14} />
                  Premium account setup
                </span>
              </div>
            </div>

            <div className="grid gap-3 rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              {outcomes.map((outcome) => (
                <div
                  key={outcome}
                  className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-slate-200"
                >
                  {outcome}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ops-ticker sm:grid-cols-2 xl:grid-cols-3">
          {onboardingSignals.map((item) => (
            <div key={item.label} className="ops-ticker-item">
              <div className="relative z-[1]">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
                  {item.value}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="grid gap-4 md:grid-cols-2">
            {entries.map(({ href, title, description, icon: Icon, accent }) => (
              <Link key={href} href={href} className="portal-card group block">
                <div
                  className={`inline-flex rounded-[22px] bg-gradient-to-r ${accent} p-3.5 text-white shadow-[0_18px_35px_rgba(14,165,233,0.24)]`}
                >
                  <Icon size={24} />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">
                  {description}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                  Continue <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>

          <div className="landing-band">
            <p className="data-kicker">Already inside the system?</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              Use the existing role portals
            </h2>
            <div className="mt-4 grid gap-3">
              <Link
                href="/sign-in"
                className="rounded-[24px] border border-slate-200/80 bg-white/70 px-4 py-4 text-sm font-semibold text-slate-800 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
              >
                Open login selection
              </Link>
              <p className="rounded-[20px] border border-dashed border-slate-300/80 px-4 py-3.5 text-sm leading-6 text-slate-500 dark:border-slate-700 dark:text-slate-300">
                Admin onboarding stays internal for security, so only student and client creation
                paths are exposed publicly.
              </p>
            </div>
          </div>
        </div>

        <section className="spotlight-card p-5">
          <div className="relative z-[1]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="data-kicker">Onboarding architecture</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                  Every account is seeded for the lane it needs to own.
                </h2>
              </div>
              <span className="glass-chip">Firestore-backed setup</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {launchCards.map((card) => (
                <div key={card.title} className="insight-card">
                  <div className="relative z-[1]">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      {card.title}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {card.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {onboardingDeck.map(({ href, title, detail, icon: Icon }) => (
            <Link key={href} href={href} className="control-pod group">
              <div className="relative z-[1]">
                <div className="flex items-start justify-between gap-3">
                  <span className="control-pill">Onboarding route</span>
                  <div className="stat-orb h-11 w-11 rounded-[18px]">
                    <Icon size={18} />
                  </div>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {detail}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-cyan-300">
                  Open route <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="premium-terminal p-5 text-white">
          <div className="relative z-[1]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-[11px] uppercase tracking-[0.24em] text-slate-300">
                Onboarding console
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {onboardingConsole.map((line) => (
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
