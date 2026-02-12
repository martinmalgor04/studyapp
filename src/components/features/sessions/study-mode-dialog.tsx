'use client';

import { useState } from 'react';
import { PomodoroTimer } from './pomodoro-timer';

interface StudyModeDialogProps {
  isOpen: boolean;
  session: {
    id: string;
    topic: { name: string };
    subject: { name: string };
    number: number;
    duration: number;
  } | null;
  onComplete: () => void;
  onIncomplete: (actualMinutes: number) => void;
  onClose: () => void;
}

export function StudyModeDialog({
  isOpen,
  session,
  onComplete,
  onIncomplete,
  onClose
}: StudyModeDialogProps) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  if (!isOpen || !session) return null;

  const handleStudyComplete = () => {
    // El timer terminó un pomodoro
    console.log('Pomodoro cycle completed');
  };

  const handleEndSession = (totalMinutes: number) => {
    // Usuario terminó antes
    if (totalMinutes >= session.duration) {
      // Estudió todo el tiempo planeado o más
      onComplete();
    } else {
      // Estudió parcialmente
      onIncomplete(totalMinutes);
    }
  };

  const handleClose = () => {
    if (showExitConfirm) {
      setShowExitConfirm(false);
      onClose();
    } else {
      setShowExitConfirm(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-blue-50 to-white">
      <div className="min-h-screen p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{session.subject.name}</p>
            <h1 className="text-3xl font-bold text-gray-900">
              {session.topic.name} - R{session.number}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Duración estimada: {session.duration} minutos
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {showExitConfirm ? 'Confirmar salida' : 'Salir'}
          </button>
        </div>

        {/* Exit Confirmation Warning */}
        {showExitConfirm && (
          <div className="mb-6 rounded-md bg-yellow-50 border border-yellow-300 p-4">
            <p className="text-sm text-yellow-800">
              ¿Estás seguro de salir? Se perderá el progreso del timer.
            </p>
          </div>
        )}

        {/* Timer Central */}
        <div className="flex justify-center">
          <PomodoroTimer
            studyMinutes={Math.min(session.duration, 50)} // Max 50min por pomodoro
            breakMinutes={5}
            onStudyComplete={handleStudyComplete}
            onSessionEnd={handleEndSession}
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex justify-center gap-4">
          <button
            onClick={onComplete}
            className="rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white shadow-md hover:bg-green-700"
          >
            Completar Sesión
          </button>
          <button
            onClick={() => onIncomplete(0)}
            className="rounded-md border border-orange-300 bg-orange-50 px-6 py-3 text-sm font-medium text-orange-700 hover:bg-orange-100"
          >
            No pude terminar
          </button>
        </div>
      </div>
    </div>
  );
}
