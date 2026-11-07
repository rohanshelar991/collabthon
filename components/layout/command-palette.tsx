'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { type Route } from 'next';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Bell,
  Briefcase,
  Command,
  CreditCard,
  FolderKanban,
  Home,
  LogOut,
  MessageCircle,
  Radar,
  Search,
  Shield,
  Sparkles,
  UserCircle2,
  UserCog
} from 'lucide-react';
import type { UserRole } from '@/lib/roles';

type CommandAction = {
  id: string;
  label: string;
  description: string;
  href?: Route;
  icon: LucideIcon;
  roles?: UserRole[];
  accent?: string;
  keywords: string[];
  onSelect?: () => void | Promise<void>;
};

export function CommandPalette({
  role,
  notificationCount,
  onSignOut
}: {
  role: UserRole | null;
  notificationCount: number;
  onSignOut: () => void | Promise<void>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const actions = useMemo<CommandAction[]>(() => {
    const base: CommandAction[] = [
      {
        id: 'overview',
        label: 'Overview',
        description: 'Open your main mission control dashboard.',
        href: '/dashboard',
        icon: Home,
        accent: 'Dashboard',
        keywords: ['home', 'overview', 'dashboard', 'mission control']
      },
      {
        id: 'profile',
        label: 'Profile',
        description: 'Update your identity, availability, and account surface.',
        href: '/profile',
        icon: UserCog,
        accent: 'Identity',
        keywords: ['profile', 'account', 'availability', 'settings']
      },
      {
        id: 'radar',
        label: 'Saved radar',
        description: 'Jump back into your saved students and briefs.',
        href: '/watchlist',
        icon: Radar,
        accent: 'Shortlist',
        keywords: ['radar', 'saved', 'watchlist', 'shortlist']
      },
      {
        id: 'students',
        label: 'Student directory',
        description: 'Search talent, compare profiles, and message builders.',
        href: '/students',
        icon: UserCircle2,
        accent: 'Talent',
        keywords: ['students', 'talent', 'directory', 'teammates']
      },
      {
        id: 'projects',
        label: 'Project board',
        description: 'Browse, save, and act on live briefs.',
        href: '/projects',
        icon: Briefcase,
        accent: 'Briefs',
        keywords: ['projects', 'briefs', 'opportunities', 'jobs']
      },
      {
        id: 'workspace',
        label: 'Workspace',
        description: 'Open sprint planning, Kanban, and delivery flow.',
        href: '/workspace',
        icon: FolderKanban,
        accent: 'Execution',
        keywords: ['workspace', 'sprint', 'kanban', 'tasks']
      },
      {
        id: 'messages',
        label: 'Messages',
        description: 'Continue active conversations and collaboration threads.',
        href: '/messages',
        icon: MessageCircle,
        accent: 'Comms',
        keywords: ['messages', 'chat', 'conversation', 'dm']
      },
      {
        id: 'notifications',
        label: notificationCount > 0 ? `Notifications (${notificationCount})` : 'Notifications',
        description: 'Review unread updates, applications, and message alerts.',
        href: '/notifications',
        icon: Bell,
        accent: 'Alerts',
        keywords: ['notifications', 'alerts', 'updates', 'inbox']
      },
      {
        id: 'billing',
        label: 'Billing',
        description: 'Manage Stripe plans, portals, and workspace upgrades.',
        href: '/billing',
        icon: CreditCard,
        accent: 'Growth',
        keywords: ['billing', 'plans', 'subscription', 'stripe']
      }
    ];

    if (role === 'student') {
      base.unshift({
        id: 'student-lane',
        label: 'Student lane',
        description: 'Open the student-specific dashboard lane.',
        href: '/dashboard/user',
        icon: Sparkles,
        accent: 'Student',
        keywords: ['student', 'dashboard', 'lane']
      });
    }

    if (role === 'client') {
      base.unshift({
        id: 'client-lane',
        label: 'Client lane',
        description: 'Open the client delivery and hiring dashboard.',
        href: '/dashboard/client',
        icon: Sparkles,
        accent: 'Client',
        keywords: ['client', 'dashboard', 'hiring', 'delivery']
      });
    }

    if (role === 'admin') {
      base.unshift({
        id: 'admin',
        label: 'Admin suite',
        description: 'Jump into moderation, trust, and platform oversight.',
        href: '/admin',
        icon: Shield,
        accent: 'Governance',
        keywords: ['admin', 'moderation', 'governance', 'trust'],
        roles: ['admin']
      });
    }

    base.push({
      id: 'sign-out',
      label: 'Sign out',
      description: 'Exit the current session safely.',
      icon: LogOut,
      accent: 'Session',
      keywords: ['logout', 'sign out', 'exit'],
      onSelect: onSignOut
    });

    return base.filter((action) => !action.roles || (role ? action.roles.includes(role) : false));
  }, [notificationCount, onSignOut, role]);

  const filteredActions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return actions;

    return actions.filter((action) => {
      const haystack = [
        action.label,
        action.description,
        action.accent || '',
        ...action.keywords
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [actions, query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
      }

      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    const nextFrame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(nextFrame);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const nextFrame = requestAnimationFrame(() => {
      setOpen(false);
      setQuery('');
    });

    return () => cancelAnimationFrame(nextFrame);
  }, [open, pathname]);

  async function handleSelect(action: CommandAction) {
    setOpen(false);
    setQuery('');

    if (action.onSelect) {
      await action.onSelect();
      return;
    }

    if (action.href) {
      router.push(action.href);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setQuery('');
          setOpen(true);
        }}
        className="command-launcher"
        aria-label="Open command palette"
      >
        <div className="flex items-center gap-2">
          <span className="stat-orb h-9 w-9 rounded-[14px]">
            <Command size={16} />
          </span>
          <div className="text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Command
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Quick actions</p>
          </div>
        </div>
        <span className="kbd-chip">⌘K</span>
      </button>

      {open ? (
        <div className="command-overlay" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close command palette"
            onClick={() => {
              setOpen(false);
              setQuery('');
            }}
          />
          <div className="command-palette">
            <div className="command-head">
              <div className="flex items-center gap-3">
                <span className="stat-orb h-11 w-11 rounded-2xl">
                  <Command size={18} />
                </span>
                <div>
                  <p className="data-kicker">Command deck</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                    Move through Collabathon faster
                  </h2>
                </div>
              </div>
              <span className="kbd-chip">ESC</span>
            </div>

            <div className="command-search">
              <Search size={18} className="text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search dashboards, briefs, messages, billing, admin..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              <span className="control-pill hidden sm:inline-flex">Role-aware</span>
            </div>

            <div className="command-results">
              {filteredActions.length ? (
                filteredActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      className="command-result group"
                      onClick={() => void handleSelect(action)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="stat-orb h-11 w-11 rounded-2xl">
                          <Icon size={18} />
                        </span>
                        <div className="text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {action.label}
                            </p>
                            {action.accent ? (
                              <span className="badge">{action.accent}</span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">
                            {action.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-400 transition group-hover:translate-x-0.5" />
                    </button>
                  );
                })
              ) : (
                <div className="command-empty">
                  <p className="font-semibold text-slate-900 dark:text-white">No direct match yet</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
                    Try searching for a surface like workspace, radar, admin, or billing.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
