import Link from 'next/link';
import { ArrowRight, Users, ShieldCheck, Sparkles, Wand2, Globe2, MessageCircle } from 'lucide-react';

const stats = [
  { label: 'Students', value: '12k+', icon: Users },
  { label: 'Projects', value: '1.8k', icon: ArrowRight },
  { label: 'Teams built', value: '4.2k', icon: Sparkles },
  { label: 'Secure', value: 'Role-based', icon: ShieldCheck }
];

const pillars = [
  { title: 'AI-assisted matching', desc: 'Jaccard skill overlap plus availability signals.', icon: Wand2 },
  { title: 'Realtime collab', desc: 'Chat, notifications, and applications on Firestore.', icon: MessageCircle },
  { title: 'Global-ready', desc: 'GA4, translations, maps & reCAPTCHA baked in.', icon: Globe2 }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 py-16 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">
            Collabathon · Firebase + Next.js
          </span>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Build, match, and launch elite student teams for hackathons and client work.
          </h1>
          <p className="text-lg text-slate-300">
            Show off skills, discover teammates, secure clients, and ship faster with realtime chat, AI-powered recommendations, and Stripe-ready monetization.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-up" className="btn-primary">
              Get started <ArrowRight size={16} />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/60"
            >
              Peek dashboard
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {pillars.map(({ title, desc, icon: Icon }) => (
              <div key={title} className="rounded-2xl bg-white/5 p-4 shadow-[0_15px_30px_rgba(0,0,0,0.25)] backdrop-blur">
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <Icon size={18} />
                </div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-slate-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full max-w-lg rounded-[28px] bg-white/5 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.4)] backdrop-blur">
          <div className="grid grid-cols-2 gap-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-xs text-slate-200">
                  {label}
                  <Icon size={16} />
                </div>
                <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-r from-brand-500/30 via-cyan-500/25 to-emerald-400/20 p-5 text-sm text-white">
            <p className="font-semibold">Compliance & perf</p>
            <p className="text-slate-100/80">WCAG-conscious design, GA4 + reCAPTCHA, Maps, Vision, Translate, Stripe checkout ready.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
