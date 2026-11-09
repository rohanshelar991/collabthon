'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Mail, Send } from 'lucide-react';

type FormState = 'idle' | 'sending' | 'sent' | 'error';

export function ContactForm() {
  const [state, setState] = useState<FormState>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('sending');
    setError('');

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          message: data.get('message')
        })
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || 'We could not send your message.');
      }

      form.reset();
      setState('sent');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'We could not send your message.');
      setState('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="command-surface w-full min-w-0 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="min-w-0 text-sm font-medium text-slate-700 dark:text-slate-200">
          Name
          <input name="name" required maxLength={120} className="field-shell mt-2 w-full min-w-0" placeholder="Your name" />
        </label>
        <label className="min-w-0 text-sm font-medium text-slate-700 dark:text-slate-200">
          Email
          <input name="email" required type="email" maxLength={254} className="field-shell mt-2 w-full min-w-0" placeholder="you@example.com" />
        </label>
      </div>
      <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">
        Message
        <textarea name="message" required maxLength={4000} rows={7} className="field-shell mt-2 min-h-40 w-full resize-y" placeholder="Tell us what you are building or how we can help." />
      </label>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex min-w-0 items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          <Mail size={15} className="mt-0.5 shrink-0" />
          Your message goes directly to the Collabathon team.
        </p>
        <button type="submit" disabled={state === 'sending'} className="btn-primary w-full shrink-0 sm:w-auto">
          <Send size={16} />
          {state === 'sending' ? 'Sending...' : 'Send message'}
        </button>
      </div>
      {state === 'sent' ? (
        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-300" role="status">
          <CheckCircle2 size={17} /> Message sent. We will get back to you soon.
        </p>
      ) : null}
      {state === 'error' ? (
        <p className="mt-4 text-sm font-medium text-rose-600 dark:text-rose-300" role="alert">{error}</p>
      ) : null}
    </form>
  );
}
