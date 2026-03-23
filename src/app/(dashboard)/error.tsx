'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/utils/logger';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md border border-red-100 text-center">
        <div className="mb-4 text-4xl">😕</div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Error al cargar la página</h2>
        <p className="mb-6 text-gray-600">
          Algo salió mal cargando este contenido. Podés intentar de nuevo.
        </p>
        {error.digest && (
          <p className="mb-4 text-xs text-gray-400">Ref: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="rounded-md bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
