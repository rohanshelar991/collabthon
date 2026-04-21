'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BellRing,
  Compass,
  MessageSquareText,
  MoveRight,
  Search,
  SendHorizontal,
  Sparkles,
  UserRoundSearch
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { pushToast } from '@/components/ui/toaster';
import { listMessageContacts, sendMessage } from '@/lib/firestore';

interface ChatMessage {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  createdAt?: { seconds: number };
}

type Contact = { id: string; name: string; email?: string; role?: string };

function initialsFor(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function MessagesClient({
  initialToId,
  initialName,
  initialContacts = []
}: {
  initialToId?: string;
  initialName?: string;
  initialContacts?: Contact[];
}) {
  const [user, setUser] = useState(() => auth.currentUser);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toId, setToId] = useState(initialToId || '');
  const [recipientName, setRecipientName] = useState(initialName || '');
  const [text, setText] = useState('');
  const [contactList, setContactList] = useState<Contact[]>(initialContacts);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);

  const contacts = contactList.reduce<Record<string, Contact>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  useEffect(() => onAuthStateChanged(auth, (nextUser) => setUser(nextUser)), []);

  useEffect(() => {
    if (initialContacts.length) return;
    listMessageContacts()
      .then((loadedContacts) => setContactList(loadedContacts))
      .catch(() => setContactList([]));
  }, [initialContacts.length]);

  useEffect(() => {
    if (initialToId) {
      setToId(initialToId);
      setRecipientName(initialName || contacts[initialToId]?.name || '');
    }
  }, [contacts, initialName, initialToId]);

  useEffect(() => {
    if (!user) {
      setMessages([]);
      return;
    }
    const liveQuery = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.uid),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(
      liveQuery,
      (snap) => {
        const data = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as any)
        })) as ChatMessage[];
        setMessages(data);
      },
      () => setMessages([])
    );
    return () => unsubscribe();
  }, [user]);

  const groupedMessages = useMemo(() => {
    const groups: Record<string, ChatMessage[]> = {};
    messages.forEach((message) => {
      const peer = message.fromId === user?.uid ? message.toId : message.fromId;
      if (!groups[peer]) groups[peer] = [];
      groups[peer].push(message);
    });
    return groups;
  }, [messages, user?.uid]);

  const filteredContacts = useMemo(() => {
    const queryText = search.trim().toLowerCase();
    if (!queryText) return contactList;
    return contactList.filter((contact) => {
      return (
        contact.name.toLowerCase().includes(queryText) ||
        contact.email?.toLowerCase().includes(queryText) ||
        contact.role?.toLowerCase().includes(queryText)
      );
    });
  }, [contactList, search]);

  const activeThread = toId ? groupedMessages[toId] || [] : [];
  const activeContact = toId ? contacts[toId] : undefined;
  const threadCount = Object.keys(groupedMessages).length;
  const replyCount = messages.filter((message) => message.fromId !== user?.uid).length;
  const responsePrompts = [
    'Can we sync on scope and ownership today?',
    'Here is the build plan and timeline I can cover.',
    'Would you like me to send a prototype or repo next?',
    'Let us lock the next milestone and review window.'
  ];

  async function handleSendMessage() {
    if (!user || !toId || !text.trim()) return;
    setSending(true);
    try {
      await sendMessage(user.uid, toId, text.trim());
      setText('');
    } catch (error: any) {
      pushToast(error?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell>
      <section className="mesh-panel p-5 sm:p-7 text-white">
        <div className="relative z-[1] flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="data-kicker text-cyan-200">Realtime comms lane</p>
            <h1 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              Keep collaboration warm, fast, and impossible to lose in the noise.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Your message workspace is tuned for quick outreach, project follow-ups, and live team
              coordination with cleaner context around every conversation.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:min-w-[320px] sm:grid-cols-2 lg:min-w-[520px] lg:grid-cols-3 xl:min-w-[420px] xl:grid-cols-1">
            {[
              { label: 'Known contacts', value: contactList.length, icon: UserRoundSearch },
              { label: 'Live threads', value: threadCount, icon: MessageSquareText },
              { label: 'Incoming replies', value: replyCount, icon: BellRing }
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                        {metric.label}
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-white">{metric.value}</p>
                    </div>
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                      <Icon size={18} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.82fr,1.18fr]">
        <section className="command-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="data-kicker">Network</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                Conversation directory
              </h2>
            </div>
            <div className="stat-orb h-12 w-12 rounded-[18px]">
              <Compass size={18} />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/60">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or role"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <div className="mt-4 grid gap-3">
            {filteredContacts.length === 0 ? (
              <div className="rail-card p-5 text-sm text-slate-500 dark:text-slate-300">
                No contacts match this search yet.
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const selected = toId === contact.id;
                return (
                  <button
                    key={contact.id}
                    onClick={() => {
                      setToId(contact.id);
                      setRecipientName(contact.name);
                    }}
                    className={`${selected ? 'spotlight-card' : 'rail-card'} p-4 text-left transition hover:-translate-y-0.5`}
                  >
                    <div className="relative z-[1] flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="profile-orbit flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
                          {initialsFor(contact.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {contact.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {contact.email || contact.id}
                          </p>
                        </div>
                      </div>
                      {contact.role ? <span className="badge capitalize">{contact.role}</span> : null}
                    </div>
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">
                      {groupedMessages[contact.id]?.at(-1)?.text ||
                        'Start the conversation and lock in the next step.'}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="aura-card p-5">
          <div className="relative z-[1] flex min-h-[560px] flex-col lg:min-h-[680px]">
            <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="profile-orbit flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-950 text-lg font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
                  {activeContact ? initialsFor(activeContact.name) : '??'}
                </div>
                <div>
                  <p className="data-kicker">Active thread</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    {recipientName || 'Select a collaborator'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    {activeContact?.email || 'Choose a contact to start chatting.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeContact?.role ? (
                  <span className="glass-chip capitalize">{activeContact.role}</span>
                ) : null}
                <span className="glass-chip">{activeThread.length} messages</span>
                {activeContact?.email ? <span className="glass-chip">{activeContact.email}</span> : null}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="insight-card">
                <div className="relative z-[1]">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Thread health
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    {toId ? (activeThread.length > 6 ? 'Warm' : activeThread.length > 0 ? 'Starting' : 'Cold') : 'Idle'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    Use a clear ask, scope, and next step to keep momentum high.
                  </p>
                </div>
              </div>
              <div className="insight-card">
                <div className="relative z-[1]">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Reply pressure
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{replyCount}</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    Incoming notes across active collaboration threads.
                  </p>
                </div>
              </div>
              <div className="insight-card">
                <div className="relative z-[1]">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Next best move
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                    Send a concrete milestone ask
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    Specific timelines convert better than open-ended intros.
                  </p>
                </div>
              </div>
            </div>

            <div className="thread-stage mt-5 flex-1 overflow-y-auto p-4 sm:p-5">
              {toId ? (
                activeThread.length ? (
                  <div className="space-y-3">
                    {activeThread.map((message) => (
                      <div
                        key={message.id}
                        className={`thread-bubble ${
                          message.fromId === user?.uid
                            ? 'thread-bubble-mine ml-auto'
                            : 'thread-bubble-peer'
                        }`}
                      >
                        <p>{message.text}</p>
                        <p
                          className={`mt-2 text-[11px] ${
                            message.fromId === user?.uid ? 'text-white/70' : 'text-slate-400'
                          }`}
                        >
                          {message.fromId === user?.uid ? 'You' : activeContact?.name || 'Collaborator'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid h-full place-items-center">
                    <div className="max-w-md rounded-[28px] border border-dashed border-slate-300/80 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
                      <MessageSquareText className="mx-auto h-5 w-5 text-brand-500" />
                      <p className="mt-3 font-semibold text-slate-900 dark:text-white">
                        No messages yet.
                      </p>
                      <p className="mt-2 leading-7">
                        Break the ice with a short intro, your project context, and a clear next ask.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="grid h-full place-items-center">
                  <div className="max-w-lg rounded-[28px] border border-dashed border-slate-300/80 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
                    <Sparkles className="mx-auto h-5 w-5 text-brand-500" />
                    <p className="mt-3 font-semibold text-slate-900 dark:text-white">
                      Your message lane is ready.
                    </p>
                    <p className="mt-2 leading-7">
                      Pick a student, client, or teammate from the directory to start a live thread.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="command-surface mt-5 p-4">
              <div className="mb-4 flex flex-wrap gap-2">
                {responsePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="thread-prompt"
                    onClick={() => setText(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={4}
                placeholder="Type a message, outline a deliverable, or propose the next sync. Press Enter to send."
                className="w-full resize-none bg-transparent text-sm outline-none"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSendMessage();
                  }
                }}
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="signal-pill">Realtime notifications</span>
                  <span className="signal-pill">Firestore-backed chat</span>
                  <span className="signal-pill">Role-aware threads</span>
                </div>
                <button
                  onClick={() => void handleSendMessage()}
                  disabled={!toId || !text.trim() || sending}
                  className="btn-primary w-full sm:w-auto"
                >
                  <SendHorizontal size={16} />
                  {sending ? 'Sending...' : 'Send message'}
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <MoveRight size={14} />
                Press Enter to send. Use Shift+Enter for a new line.
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
