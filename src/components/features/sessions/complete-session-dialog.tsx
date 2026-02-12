'use client';

interface CompleteSessionDialogProps {
  isOpen: boolean;
  session: {
    id: string;
    topic: { name: string };
    number: number;
  } | null;
  onComplete: (sessionId: string, rating: 'EASY' | 'NORMAL' | 'HARD') => Promise<void>;
  onClose: () => void;
}

export function CompleteSessionDialog({ isOpen, session, onComplete, onClose }: CompleteSessionDialogProps) {
  if (!isOpen || !session) return null;

  const handleRating = async (rating: 'EASY' | 'NORMAL' | 'HARD') => {
    await onComplete(session.id, rating);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />

        {/* Dialog */}
        <div className="relative z-50 w-full max-w-2xl rounded-lg bg-white p-8 shadow-xl">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 text-center">
            ¡Excelente trabajo!
          </h2>
          <p className="mb-6 text-center text-gray-600">
            Completaste: <span className="font-semibold">{session.topic.name} - R{session.number}</span>
          </p>

          <h3 className="mb-4 text-center text-lg font-medium text-gray-900">
            ¿Cómo te fue con este tema?
          </h3>

          {/* Rating Cards */}
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            {/* Fácil */}
            <button
              onClick={() => handleRating('EASY')}
              className="rounded-xl border-2 border-green-300 bg-green-50 p-6 transition-all hover:border-green-500 hover:shadow-lg"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="mt-4 text-lg font-semibold text-gray-900">Fácil</h4>
              <p className="mt-1 text-xs text-gray-600">Lo entendí rápido</p>
            </button>

            {/* Normal */}
            <button
              onClick={() => handleRating('NORMAL')}
              className="rounded-xl border-2 border-blue-300 bg-blue-50 p-6 transition-all hover:border-blue-500 hover:shadow-lg"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <h4 className="mt-4 text-lg font-semibold text-gray-900">Normal</h4>
              <p className="mt-1 text-xs text-gray-600">Lo repasé bien</p>
            </button>

            {/* Difícil */}
            <button
              onClick={() => handleRating('HARD')}
              className="rounded-xl border-2 border-orange-300 bg-orange-50 p-6 transition-all hover:border-orange-500 hover:shadow-lg"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="mt-4 text-lg font-semibold text-gray-900">Difícil</h4>
              <p className="mt-1 text-xs text-gray-600">Me costó bastante</p>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
