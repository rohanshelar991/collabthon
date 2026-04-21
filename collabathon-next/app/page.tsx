import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  BriefcaseBusiness,
  Globe2,
  MapPinned,
  MessageSquareMore,
  ShieldCheck,
  Sparkles,
  Stars,
  UsersRound,
  Workflow
} from 'lucide-react';

const headlineStats = [
  { label: 'Students activated', value: '12k+', icon: UsersRound },
  { label: 'Client briefs', value: '1.8k', icon: BriefcaseBusiness },
  { label: 'Messages routed', value: '220k', icon: MessageSquareMore },
  { label: 'Protected roles', value: '3 lanes', icon: ShieldCheck }
] as const;

const capabilityBands = [
  {
    title: 'Student talent lane',
    copy: 'Profiles, skills, teammate matching, project applications, and realtime collaboration in one polished command center.',
    icon: UsersRound
  },
  {
    title: 'Client delivery lane',
    copy: 'Clients move from brief creation to applicant review and team formation without leaving the operating surface.',
    icon: Workflow
  },
  {
    title: 'Admin mission lane',
    copy: 'Platform oversight, moderation visibility, demand signals, and usage intelligence stay isolated and secure.',
    icon: ShieldCheck
  }
] as const;

const featureMatrix = [
  {
    title: 'AI-assisted teammate radar',
    detail: 'Skill overlap, availability, and project fit give students a faster path to strong teams.',
    icon: Sparkles
  },
  {
    title: 'Realtime project ops',
    detail: 'Applications, messages, notifications, and project status all stay synced through Firestore listeners.',
    icon: BellRing
  },
  {
    title: 'Google + analytics runway',
    detail: 'OAuth, reCAPTCHA, Maps, GA4, and deploy-ready infra give the product a serious production base.',
    icon: Globe2
  },
  {
    title: 'Location-aware collaboration',
    detail: 'Profiles can reflect college, availability, and geography so teams can coordinate smarter.',
    icon: MapPinned
  }
] as const;

const steps = [
  {
    label: '01',
    title: 'Create a role-shaped identity',
    copy: 'Students, clients, and admins each enter through a dedicated lane with their own workflows and protections.'
  },
  {
    label: '02',
    title: 'Discover fit instantly',
    copy: 'Students surface the right teammates and clients identify the right applicants through cleaner signal-first UI.'
  },
  {
    label: '03',
    title: 'Move from interest to execution',
    copy: 'Chat, applications, notifications, and team formation keep the whole marketplace moving without context switching.'
  }
] as const;

const operatingLayers = [
  {
    title: 'Identity layer',
    detail: 'Students, clients, and admins each enter through a separate branded portal with role-aware routing.'
  },
  {
    title: 'Execution layer',
    detail: 'Projects, applications, workspace boards, messages, and notifications all stay connected in one flow.'
  },
  {
    title: 'Revenue + trust layer',
    detail: 'Stripe billing, audit logs, moderation controls, and admin analytics turn the product into a real platform.'
  }
] as const;

const signalTicker = [
  {
    label: 'Control posture',
    value: 'Audit-ready',
    detail: 'Role-aware auth, admin isolation, and activity logs keep the platform governable.'
  },
  {
    label: 'Execution mode',
    value: 'Realtime',
    detail: 'Projects, conversations, workspaces, and notifications stay synced without context loss.'
  },
  {
    label: 'Monetization',
    value: 'Stripe-wired',
    detail: 'Billing surfaces, subscription flows, and webhook scaffolding are already part of the stack.'
  },
  {
    label: 'Delivery feel',
    value: 'Premium',
    detail: 'The UI behaves like a polished command center rather than a generic hackathon directory.'
  }
] as const;

const entryLanes = [
  {
    href: '/student/login',
    title: 'Enter the student lane',
    detail: 'Open teammate discovery, applications, recommendations, and execution boards.',
    icon: UsersRound
  },
  {
    href: '/client/login',
    title: 'Enter the client lane',
    detail: 'Publish briefs, manage applicant pipelines, and staff delivery teams quickly.',
    icon: Workflow
  },
  {
    href: '/admin-login',
    title: 'Enter the admin lane',
    detail: 'Operate moderation, audit visibility, and platform trust from the protected control room.',
    icon: ShieldCheck
  }
] as const;

export default function Home() {
  return (
    <div className="premium-stage min-h-screen px-4 py-8 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
          <div className="mesh-panel p-5 text-white sm:p-9">
            <div className="relative z-[1] max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="glass-chip border-white/10 bg-white/10 text-white">
                  <Stars size={14} />
                  Collabathon platform
                </span>
                <span className="glass-chip border-white/10 bg-white/10 text-white">
                  <BadgeCheck size={14} />
                  Student teams + client workspaces
                </span>
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.02] text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                A sharper operating system for student teams, client briefs, and ambitious builds.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Collabathon blends talent discovery, project execution, messaging, admin oversight,
                and premium product design into a single platform that feels less like a school
                portal and more like a serious startup workspace.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/sign-up" className="btn-primary">
                  Launch your account
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/14"
                >
                  Explore role portals
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {headlineStats.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-300">
                      <span>{label}</span>
                      <Icon size={16} />
                    </div>
                    <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="aura-card p-6">
              <div className="relative z-[1]">
                <p className="data-kicker">Live product surface</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                  Built for velocity, not brochureware.
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  From the first signup to the final handoff, the UI stays high-signal, role-aware,
                  and ready for actual marketplace operations.
                </p>
                <div className="signal-grid mt-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                      Teammate discovery
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                      Skill radar, profile depth, and availability-first matching.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                      Project delivery
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                      Applicant pipelines, team creation, and live status movement for briefs.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                      Platform trust
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                      Admin visibility, notifications, ratings, and role-aware access patterns.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="command-deck">
              <div className="relative z-[1]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="data-kicker">Why it feels different</p>
                    <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                      A real command surface for collaboration.
                    </h2>
                  </div>
                  <span className="glass-chip">Premium control stack</span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {capabilityBands.map(({ title, copy, icon: Icon }) => (
                    <div key={title} className="rail-card p-5">
                      <div className="stat-orb h-12 w-12 rounded-[18px]">
                        <Icon size={18} />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {copy}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="premium-terminal mt-5 text-white">
                  <div className="relative z-[1]">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <span className="ml-2 text-[11px] uppercase tracking-[0.24em] text-slate-300">
                        Platform signal console
                      </span>
                    </div>
                    <div className="mt-5 grid gap-3">
                      <div className="signal-console">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">Discovery status</p>
                        <p className="mt-2 text-sm text-slate-200">
                          Student profiles, skills, and availability feed the teammate radar in realtime.
                        </p>
                      </div>
                      <div className="signal-console">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">Delivery status</p>
                        <p className="mt-2 text-sm text-slate-200">
                          Applications can graduate into teams, sprints, Kanban boards, and audited workflows.
                        </p>
                      </div>
                      <div className="signal-console">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">Business status</p>
                        <p className="mt-2 text-sm text-slate-200">
                          Billing, moderation, and automation keep the product monetizable and governable.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ops-ticker sm:grid-cols-2 xl:grid-cols-4">
          {signalTicker.map((item) => (
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

        <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
          <div className="spotlight-card p-7">
            <div className="relative z-[1]">
              <p className="data-kicker">How the product moves</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                Three clean steps from identity to execution.
              </h2>
              <div className="mt-6 grid gap-4">
                {steps.map((step) => (
                  <div key={step.label} className="rail-card p-5">
                    <div className="flex items-start gap-4">
                      <div className="stat-orb h-12 w-12 rounded-[18px] text-sm font-semibold">
                        {step.label}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {step.copy}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {featureMatrix.map(({ title, detail, icon: Icon }) => (
              <div key={title} className="portal-card p-6">
                <div className="stat-orb h-12 w-12 rounded-[18px]">
                  <Icon size={18} />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="aura-card p-7">
          <div className="relative z-[1]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="data-kicker">Platform stack</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                  The product now behaves like an operating system, not just a listing site.
                </h2>
              </div>
              <span className="glass-chip">Industry-grade lanes</span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {operatingLayers.map((layer) => (
                <div key={layer.title} className="insight-card">
                  <div className="relative z-[1]">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      {layer.title}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {layer.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entryLanes.map(({ href, title, detail, icon: Icon }) => (
            <Link key={href} href={href} className="control-pod group">
              <div className="relative z-[1]">
                <div className="flex items-start justify-between gap-3">
                  <span className="control-pill">Role launch pad</span>
                  <div className="stat-orb h-11 w-11 rounded-[18px]">
                    <Icon size={18} />
                  </div>
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {detail}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-cyan-300">
                  Open lane <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="hero-panel p-5 text-white sm:p-8">
          <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="data-kicker text-cyan-200">Ready to enter the workspace?</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Start with the right role and turn student energy into real collaboration momentum.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Student, client, and admin lanes are already separated, themed, and connected to a
                Firestore-backed full-stack product surface.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/sign-up" className="btn-primary">
                Create account
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/14"
              >
                Open dashboard preview
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
