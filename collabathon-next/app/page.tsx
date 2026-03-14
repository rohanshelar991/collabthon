import Link from 'next/link';
import { ArrowRight, Users, ShieldCheck, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
              <Sparkles size={16} className="text-amber-300" />
              Collabathon · Firebase + Next.js
            </div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Find the perfect student team for your next hackathon or project.
            </h1>
            <p className="text-lg text-slate-300">
              Collabathon lets students showcase skills, clients post projects, and everyone collaborates with realtime chat, applications, and AI-powered teammate recommendations.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/sign-up" className="btn-primary">
                Get started <ArrowRight size={16} />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-white/40"
              >
                View dashboard
              </Link>
            </div>
          </div>
          <div className="grid w-full max-w-lg grid-cols-2 gap-4 rounded-3xl bg-white/5 p-6 shadow-2xl shadow-brand-500/20 backdrop-blur">
            {[{ label: 'Students', value: '12k+', icon: Users }, { label: 'Projects', value: '1.8k', icon: ArrowRight }, { label: 'Teams Built', value: '4.2k', icon: Sparkles }, { label: 'Secure', value: 'Role-based', icon: ShieldCheck }].map(
              ({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl bg-white/5 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    {label}
                    <Icon size={16} />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
