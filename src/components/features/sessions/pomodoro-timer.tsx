'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface PomodoroTimerProps {
  studyMinutes?: number;
  breakMinutes?: number;
  onStudyComplete?: () => void;
  onSessionEnd?: (totalMinutes: number) => void;
}

export function PomodoroTimer({
  studyMinutes = 25,
  breakMinutes = 5,
  onStudyComplete,
  onSessionEnd
}: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(studyMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalTime = isBreak ? breakMinutes * 60 : studyMinutes * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            handleCycleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleCycleComplete is stable and used inside setState callback
  }, [isRunning, timeLeft]);

  const handleCycleComplete = () => {
    if (!isBreak) {
      setTotalStudyTime(prev => prev + studyMinutes);
      setIsBreak(true);
      setTimeLeft(breakMinutes * 60);
      setIsRunning(false);
      if (onStudyComplete) onStudyComplete();
      if (typeof window !== 'undefined' && 'Notification' in window) {
        new Notification('StudyApp', { body: '¡Descanso de 5 minutos!' });
      }
    } else {
      setIsBreak(false);
      setTimeLeft(studyMinutes * 60);
      setIsRunning(false);
    }
  };

  const togglePlay = () => {
    setIsRunning(!isRunning);
  };

  const reset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(studyMinutes * 60);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleEndSession = () => {
    const minutesStudied = totalStudyTime + Math.floor((studyMinutes * 60 - timeLeft) / 60);
    if (onSessionEnd) onSessionEnd(minutesStudied);
    reset();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex flex-col items-center">
      {/* Circular Progress */}
      <div className="relative" role="timer" aria-label={`${isBreak ? 'Descanso' : 'Estudio'}: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}>
        <svg className="h-64 w-64 -rotate-90 transform" aria-hidden="true">
          <circle
            cx="128"
            cy="128"
            r="112"
            stroke="currentColor"
            strokeWidth="16"
            fill="none"
            className="text-surface-container"
          />
          <circle
            cx="128"
            cy="128"
            r="112"
            stroke="currentColor"
            strokeWidth="16"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 112}`}
            strokeDashoffset={`${2 * Math.PI * 112 * (1 - progress / 100)}`}
            className={`transition-all duration-1000 ${isBreak ? 'text-secondary' : 'text-tertiary'}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-headline text-6xl text-on-surface">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </p>
          <p className="mt-2 text-sm text-on-surface-variant">
            {isBreak ? 'Descanso' : 'Estudiando'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4">
        <Button
          onClick={togglePlay}
          aria-label={isRunning ? 'Pausar temporizador' : 'Iniciar temporizador'}
          className="rounded-full px-8"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isRunning ? 'pause' : 'play_arrow'}
          </span>
          {isRunning ? 'Pausar' : 'Iniciar'}
        </Button>
        <Button
          variant="outline"
          onClick={reset}
          aria-label="Reiniciar temporizador"
          className="rounded-full px-8"
        >
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
          Reiniciar
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-6 text-center text-sm text-on-surface-variant">
        <p>Tiempo total de estudio: <span className="font-semibold font-headline">{totalStudyTime} minutos</span></p>
      </div>

      {totalStudyTime > 0 && (
        <button
          onClick={handleEndSession}
          aria-label={`Finalizar sesión anticipadamente (${totalStudyTime} minutos estudiados)`}
          className="mt-4 text-sm text-tertiary hover:text-tertiary-dim"
        >
          Terminé antes →
        </button>
      )}
    </div>
  );
}
