'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { pushToast } from '@/components/ui/toaster';

interface ChatMessage {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  createdAt?: { seconds: number };
}

export default function MessagesPage() {
  const user = auth.currentUser;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toId, setToId] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.uid),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as ChatMessage));
      setMessages(data);
    });
    return () => unsub();
  }, [user]);

  async function sendMessage() {
    if (!user || !toId || !text.trim()) return;
    try {
      await addDoc(collection(db, 'messages'), {
        fromId: user.uid,
        toId,
        participants: [user.uid, toId],
        text,
        createdAt: serverTimestamp()
      });
      setText('');
    } catch (err: any) {
      pushToast(err?.message || 'Failed to send');
    }
  }

  const grouped = useMemo(() => {
    const byUser: Record<string, ChatMessage[]> = {};
    messages.forEach((m) => {
      const peer = m.fromId === user?.uid ? m.toId : m.fromId;
      if (!byUser[peer]) byUser[peer] = [];
      byUser[peer].push(m);
    });
    return byUser;
  }, [messages, user?.uid]);

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Conversations</h2>
          <div className="mt-3 space-y-2 text-sm">
            {Object.keys(grouped).length === 0 && <p className="text-slate-500">No messages yet.</p>}
            {Object.entries(grouped).map(([peer, msgs]) => (
              <button
                key={peer}
                onClick={() => setToId(peer)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                  toId === peer
                    ? 'border-brand-400 bg-brand-50 dark:bg-brand-500/10'
                    : 'border-slate-200 hover:border-brand-200 dark:border-slate-800'
                }`}
              >
                <p className="font-semibold">{peer}</p>
                <p className="text-xs text-slate-500 line-clamp-1">{msgs[msgs.length - 1]?.text}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="card flex h-[420px] flex-col p-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100">
              <span>Chat</span>
              <span className="text-xs text-slate-500">To ID: {toId || 'Select a conversation'}</span>
            </div>
            <div className="mt-3 flex-1 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
              {toId ? (
                grouped[toId]?.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow ${
                      m.fromId === user?.uid
                        ? 'ml-auto bg-brand-500 text-white'
                        : 'bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {m.text}
                  </div>
                )) ?? <p className="text-sm text-slate-500">No messages yet.</p>
              ) : (
                <p className="text-sm text-slate-500">Select a conversation or start a new one.</p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                placeholder="Recipient user id"
                className="w-48 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700"
              />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button onClick={sendMessage} className="btn-primary">Send</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
