'use client';

import { useEffect, useState } from 'react';

interface Toast {
  id: string;
  message: string;
}

// Minimal placeholder toaster; swap with your preferred toast lib (e.g., sonner or radix) at runtime
export function Toaster() {
  const [queue, setQueue] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (event: CustomEvent<Toast>) => setQueue((q) => [...q, event.detail]);
    window.addEventListener('collab-toast' as any, handler as any);
    return () => window.removeEventListener('collab-toast' as any, handler as any);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
      {queue.map((toast) => (
        <div
          key={toast.id}
          className="rounded-xl bg-slate-900 text-white px-4 py-3 shadow-lg shadow-slate-900/40"
        >
          {toast.message}
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
