import Link from 'next/link';
import { ArrowLeft, ArrowRight, MessageSquareText, ShieldCheck, Sparkles } from 'lucide-react';
import { ContactForm } from '@/components/contact/contact-form';

export default function ContactPage() {
  return (
    <main className="premium-stage min-h-screen px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[0.82fr,1.18fr]">
        <section className="mesh-panel min-w-0 p-5 text-white sm:p-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition hover:text-white">
            <ArrowLeft size={16} /> Back to Collabathon
          </Link>
          <div className="mt-16 max-w-xl sm:mt-24">
            <span className="glass-chip border-white/10 bg-white/10 text-white"><Sparkles size={14} /> Contact the team</span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">Let&apos;s move your next build forward.</h1>
            <p className="mt-5 text-base leading-7 text-slate-300">Ask about student teams, client delivery, partnerships, or anything you want to make real on Collabathon.</p>
          </div>
          <div className="mt-12 grid gap-3 sm:mt-20 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4"><MessageSquareText className="text-cyan-200" size={20} /><p className="mt-3 text-sm font-semibold text-white">Human replies</p><p className="mt-1 text-sm leading-6 text-slate-300">Every message lands with the team, not a dead inbox.</p></div>
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4"><ShieldCheck className="text-emerald-200" size={20} /><p className="mt-3 text-sm font-semibold text-white">Safe by default</p><p className="mt-1 text-sm leading-6 text-slate-300">We use your email only to reply to this conversation.</p></div>
          </div>
        </section>
        <section className="aura-card min-w-0 p-4 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="data-kicker">Open a conversation</p><h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">Tell us what you need.</h2></div>
            <span className="glass-chip"><ArrowRight size={14} /> Response-ready</span>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">Share a little context and the best email to reach you. The send button now reports clear validation, delivery, and success states.</p>
          <div className="mt-6"><ContactForm /></div>
        </section>
      </div>
    </main>
  );
}
