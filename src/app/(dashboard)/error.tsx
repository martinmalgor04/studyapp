'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/utils/logger';
import { Button } from '@/components/ui/button';

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
      <div className="w-full max-w-md rounded-xl bg-surface-container-lowest p-8 shadow-card border border-error/10 text-center">
        <div className="mb-4 flex justify-center">
          <span className="material-symbols-rounded text-[48px] text-error/60">error</span>
        </div>
        <h2 className="mb-2 font-headline text-xl text-on-surface">Error al cargar la página</h2>
        <p className="mb-6 text-on-surface-variant">
          Algo salió mal cargando este contenido. Podés intentar de nuevo.
        </p>
        {error.digest && (
          <p className="mb-4 text-xs text-on-surface-variant/40">Ref: {error.digest}</p>
        )}
        <Button onClick={reset}>
          Intentar de nuevo
        </Button>
      </div>
    </div>
  );
}
