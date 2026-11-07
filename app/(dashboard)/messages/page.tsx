'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessagesClient } from './messages-client';

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[50vh] place-items-center">
          <div className="aura-card p-6 text-sm text-slate-500 dark:text-slate-300">
            Loading messages...
          </div>
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}

function MessagesPageContent() {
  const searchParams = useSearchParams();

  return (
    <MessagesClient
      initialToId={searchParams.get('to') || undefined}
      initialName={searchParams.get('name') || undefined}
    />
  );
}
