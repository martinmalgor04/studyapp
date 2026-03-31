'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/actions/auth';
import { isGoogleCalendarConnected } from '@/lib/actions/google-calendar';
import { cn } from '@/lib/utils/cn';

interface UserMenuProps {
  userEmail: string;
  userName?: string;
}

export function UserMenu({ userEmail, userName }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkConnection() {
      const connected = await isGoogleCalendarConnected();
      setIsGoogleConnected(connected);
    }
    checkConnection();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-container"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary text-sm font-medium text-on-primary">
          {userName?.[0]?.toUpperCase() || userEmail[0].toUpperCase()}
        </div>
        <span className="text-on-surface-variant">{userEmail}</span>
        <span
          className={cn(
            'material-symbols-outlined text-[18px] text-on-surface-variant transition-transform',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-outline-variant/30 bg-surface-container-lowest shadow-subtle">
          <div className="p-2">
            <div className="px-3 py-2 text-sm">
              <p className="font-medium text-on-surface">
                {userName || 'Usuario'}
              </p>
              <p className="truncate text-on-surface-variant">{userEmail}</p>

              {isGoogleConnected && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-tertiary-container/30 px-2 py-1">
                  <span className="material-symbols-outlined text-[16px] text-on-tertiary-container" aria-hidden="true">
                    event
                  </span>
                  <span className="text-xs font-medium text-on-tertiary-container">
                    Google Calendar
                  </span>
                  <span className="ml-auto inline-flex h-2 w-2 rounded-full bg-secondary" />
                </div>
              )}
            </div>

            <div className="my-2 border-t border-outline-variant/20" />

            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container"
              onClick={() => setIsOpen(false)}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                person
              </span>
              Mi Perfil
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container"
              onClick={() => setIsOpen(false)}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                settings
              </span>
              Configuración
            </Link>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-error transition-colors hover:bg-error-container/20"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                logout
              </span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
