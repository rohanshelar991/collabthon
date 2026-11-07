'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
}

const TOAST_LIFETIME_MS = 4200;

export function Toaster() {
  const [queue, setQueue] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const toast = (event as CustomEvent<Toast>).detail;
      setQueue((current) => [...current, toast]);
      window.setTimeout(() => {
        setQueue((current) => current.filter((item) => item.id !== toast.id));
      }, TOAST_LIFETIME_MS);
    };

    window.addEventListener('collab-toast', handler);
    return () => window.removeEventListener('collab-toast', handler);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0">
      {queue.map((toast) => (
        <div
          key={toast.id}
          className="spotlight-card glow-panel rounded-[28px] px-4 py-4 text-slate-900 dark:text-white"
        >
          <div className="flex items-start gap-3">
            <div className="orb-badge h-10 w-10 rounded-2xl">
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-600 dark:text-cyan-200">
                <Sparkles size={12} />
                Collabathon
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setQueue((current) => current.filter((item) => item.id !== toast.id))}
              className="rounded-full border border-slate-200/80 p-1 text-slate-500 transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function pushToast(message: string) {
  const event = new CustomEvent('collab-toast', {
    detail: { id: crypto.randomUUID(), message }
  });
  window.dispatchEvent(event);
}
