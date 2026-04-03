'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { logger } from '@/lib/utils/logger';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Auth error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-container-low px-4">
      <div className="w-full max-w-md rounded-lg bg-surface-container-lowest p-8 shadow-md text-center">
        <div className="mb-4 text-4xl">🔐</div>
        <h2 className="mb-2 text-xl font-bold text-on-surface">Error de autenticación</h2>
        <p className="mb-6 text-on-surface-variant">
          Ocurrió un error. Podés intentar de nuevo o volver al inicio.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-tertiary px-6 py-2 text-on-tertiary font-medium hover:bg-tertiary-dim transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/login"
            className="rounded-md border border-outline-variant px-6 py-2 text-on-surface-variant font-medium hover:bg-surface-container-low transition-colors"
          >
            Ir al login
          </Link>
        </div>
      </div>
    </div>
  );
}
