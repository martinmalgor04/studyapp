'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface-container-low px-4">
          <div className="w-full max-w-md rounded-lg bg-surface-container-lowest p-8 shadow-md text-center">
            <div className="mb-4 text-5xl">⚠️</div>
            <h1 className="mb-2 text-2xl font-bold text-on-surface">Algo salió mal</h1>
            <p className="mb-6 text-on-surface-variant">
              Ocurrió un error inesperado. Por favor intentá de nuevo.
            </p>
            {error.digest && (
              <p className="mb-4 text-xs text-on-surface-variant">ID: {error.digest}</p>
            )}
            <button
              onClick={reset}
              className="rounded-md bg-tertiary px-6 py-2 text-on-tertiary font-medium hover:bg-tertiary-dim transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
