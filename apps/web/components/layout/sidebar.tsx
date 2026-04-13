'use client';

import {
  Activity,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Layers,
  LogOut,
  MessageSquare,
  Plus,
  Rss,
  Settings,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface ProjectItem {
  id: string;
  name: string;
}

interface SidebarProps {
  user: SidebarUser;
  projects?: ProjectItem[];
}

const navWork = [{ href: '/', icon: MessageSquare, label: 'Chat' }];

const navBuild = [
  { href: '/studio', icon: Layers, label: 'Agent Studio' },
  { href: '/skills', icon: Wrench, label: 'Skills' },
  { href: '/mcps', icon: Rss, label: 'MCP Servers' },
];

const navObserve = [{ href: '/runs', icon: Activity, label: 'Runs & Analytics' }];

function NavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: typeof navWork;
  pathname: string;
}) {
  return (
    <>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 pt-4 pb-1">
        {title}
      </div>
      {items.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-all',
              isActive
                ? 'bg-accent font-medium text-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function Sidebar({ user, projects = [] }: SidebarProps) {
  const pathname = usePathname();

  const initials = (user.name ?? user.email ?? '?').slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar-wrap w-[256px] shrink-0 bg-card rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.06)] flex flex-col p-3 gap-0.5 overflow-hidden max-md:hidden">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
        <div className="size-7 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-xs font-bold">
          R
        </div>
        <span className="text-[15px] font-semibold tracking-tight">OpenRush</span>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          v0.3
        </span>
      </div>

      {/* Project Selector */}
      {projects.length > 0 && (
        <button
          type="button"
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-border text-[12px] hover:bg-accent/50 transition-all cursor-pointer mb-2 w-full text-left"
        >
          <FolderOpen className="size-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium text-foreground truncate flex-1">{projects[0].name}</span>
          <span className="flex flex-col text-muted-foreground">
            <ChevronUp className="size-2.5 -mb-0.5" />
            <ChevronDown className="size-2.5 -mt-0.5" />
          </span>
        </button>
      )}

      {/* New Chat */}
      <Link
        href="/"
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-muted-foreground text-[13px] font-medium hover:border-foreground/20 hover:text-foreground hover:bg-accent/30 transition-all w-full mb-1"
      >
        <Plus className="size-4" />
        New Chat
      </Link>

      {/* Nav sections */}
      <NavSection title="Work" items={navWork} pathname={pathname} />
      <NavSection title="Build" items={navBuild} pathname={pathname} />
      <NavSection title="Observe" items={navObserve} pathname={pathname} />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Separator + User */}
      <div className="h-px bg-border mx-1 my-1" />
      <div className="flex items-center gap-2.5 px-2 py-1.5">
        <div className="size-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium truncate">{user.name ?? 'User'}</div>
          <div className="text-[11px] text-muted-foreground">Admin</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent/50 transition cursor-pointer"
          >
            <Settings className="size-4" />
          </button>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent/50 transition cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
