'use client';

import { useState } from 'react';
import { PomodoroTimer } from './pomodoro-timer';
import { Button } from '@/components/ui/button';

interface StudyModeDialogProps {
  isOpen: boolean;
  session: {
    id: string;
    topic?: { name: string } | null;
    subject?: { name: string } | null;
    number?: number;
    duration?: number | null;
    duration_minutes?: number | null;
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

  const duration = session.duration ?? session.duration_minutes ?? 30;

  const handleStudyComplete = () => {
    console.log('Pomodoro cycle completed');
  };

  const handleEndSession = (totalMinutes: number) => {
    if (totalMinutes >= duration) {
      onComplete();
    } else {
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-surface-container-low to-surface-container-lowest">
      <div className="min-h-screen p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-on-surface-variant">{session.subject?.name ?? 'Sin materia'}</p>
            <h1 className="font-headline text-3xl text-on-surface">
              {session.topic?.name ?? 'Sin tema'} - R{session.number ?? 1}
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Duración estimada: {duration} minutos
            </p>
          </div>
          <Button variant="outline" onClick={handleClose}>
            {showExitConfirm ? 'Confirmar salida' : 'Salir'}
          </Button>
        </div>

        {showExitConfirm && (
          <div className="mb-6 rounded-xl bg-surface-container-high border border-outline-variant/20 p-4">
            <p className="text-sm text-on-surface-variant">
              ¿Estás seguro de salir? Se perderá el progreso del timer.
            </p>
          </div>
        )}

        <div className="flex justify-center">
          <PomodoroTimer
            studyMinutes={Math.min(duration, 50)}
            breakMinutes={5}
            onStudyComplete={handleStudyComplete}
            onSessionEnd={handleEndSession}
          />
        </div>

        <div className="mt-12 flex justify-center gap-4">
          <Button variant="secondary" size="lg" onClick={onComplete}>
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Completar Sesión
          </Button>
          <Button variant="outline" size="lg" onClick={() => onIncomplete(0)}>
            <span className="material-symbols-outlined text-[18px]">close</span>
            No pude terminar
          </Button>
        </div>
      </div>
    </div>
  );
}
