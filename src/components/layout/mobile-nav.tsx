'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getNotifications } from '@/lib/actions/notifications';
import { cn } from '@/lib/utils/cn';

const MOBILE_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/dashboard/subjects', label: 'Materias', icon: 'menu_book' },
  { href: '/dashboard/sessions', label: 'Sesiones', icon: 'calendar_month' },
  { href: '/dashboard/settings', label: 'Config', icon: 'settings' },
  { href: '/dashboard/notifications', label: 'Avisos', icon: 'notifications', showBadge: true },
];

export function MobileNav() {
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
    <nav
      className="fixed inset-x-0 bottom-0 z-50 h-16 border-t border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur-xl md:hidden"
      aria-label="Navegación móvil"
    >
      <ul className="flex h-full items-center justify-around px-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors',
                  active
                    ? 'font-semibold text-tertiary'
                    : 'text-on-surface-variant'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                  {item.icon}
                </span>
                {item.showBadge && unreadCount > 0 && (
                  <span className="absolute -top-0.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-2xl bg-error px-1 text-[9px] font-bold text-on-error">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <span className="text-[10px]">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
