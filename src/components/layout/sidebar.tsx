'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { logoutUser } from '@/lib/actions/auth';
import { getNotifications } from '@/lib/actions/notifications';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface SidebarProps {
  userEmail: string;
  userName?: string;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/dashboard/subjects', label: 'Materias', icon: 'menu_book' },
  { href: '/dashboard/sessions', label: 'Sesiones', icon: 'calendar_month' },
  { href: '/dashboard/settings', label: 'Configuración', icon: 'settings' },
];

const SECONDARY_ITEMS = [
  { href: '/dashboard/notifications', label: 'Notificaciones', icon: 'notifications', showBadge: true },
  { href: '#', label: 'Archivo', icon: 'archive' },
  { href: '#', label: 'Ayuda', icon: 'help_outline' },
];

export function Sidebar({ userEmail, userName }: SidebarProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadUnread() {
      const result = await getNotifications();
      setUnreadCount(result.unreadCount);
    }
    loadUnread();
    const interval = setInterval(loadUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-surface-container-low">
      {/* Brand */}
      <div className="px-6 pt-8 pb-2">
        <Link href="/dashboard" className="block">
          <h1 className="font-headline text-2xl italic text-on-surface">
            The Curator
          </h1>
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
            Academic Session
          </span>
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-6" aria-label="Navegación principal">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-body transition-all duration-300',
                    active
                      ? 'bg-surface-container-lowest font-semibold text-on-surface shadow-sm'
                      : 'text-on-surface-variant hover:translate-x-1'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Separator */}
        <div className="my-4 border-t border-outline-variant/20" />

        {/* Secondary nav */}
        <ul className="space-y-1">
          {SECONDARY_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-body transition-all duration-300',
                    active
                      ? 'bg-surface-container-lowest font-semibold text-on-surface shadow-sm'
                      : 'text-on-surface-variant hover:translate-x-1'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                  {item.showBadge && unreadCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-2xl bg-error px-1.5 text-[10px] font-bold text-on-error">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-outline-variant/20 px-3 py-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary text-sm font-medium">
            {userName?.[0]?.toUpperCase() || userEmail[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-on-surface">
              {userName || 'Usuario'}
            </p>
            <p className="truncate text-xs text-on-surface-variant">
              {userEmail}
            </p>
          </div>
        </div>
        <form action={async () => { await logoutUser(); }}>
          <button
            type="submit"
            className="mt-1 w-full rounded-lg px-3 py-1.5 text-left text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-error"
          >
            Cerrar sesión
          </button>
        </form>
      </div>

      {/* CTA */}
      <div className="px-3 pb-6">
        <Link
          href="/dashboard/sessions"
          className={cn(buttonVariants({ variant: 'default', size: 'default' }), 'w-full')}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            add
          </span>
          Nueva sesión de estudio
        </Link>
      </div>
    </aside>
  );
}
