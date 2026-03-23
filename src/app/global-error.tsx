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
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md text-center">
            <div className="mb-4 text-5xl">⚠️</div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Algo salió mal</h1>
            <p className="mb-6 text-gray-600">
              Ocurrió un error inesperado. Por favor intentá de nuevo.
            </p>
            {error.digest && (
              <p className="mb-4 text-xs text-gray-400">ID: {error.digest}</p>
            )}
            <button
              onClick={reset}
              className="rounded-md bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
