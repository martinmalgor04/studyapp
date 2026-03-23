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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md text-center">
        <div className="mb-4 text-4xl">🔐</div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Error de autenticación</h2>
        <p className="mb-6 text-gray-600">
          Ocurrió un error. Podés intentar de nuevo o volver al inicio.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/login"
            className="rounded-md border border-gray-300 px-6 py-2 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Ir al login
          </Link>
        </div>
      </div>
    </div>
  );
}
