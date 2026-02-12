'use client';

import { useState, useEffect, useRef } from 'react';

interface PomodoroTimerProps {
  studyMinutes?: number; // Default 25
  breakMinutes?: number; // Default 5
  onStudyComplete?: () => void;
  onSessionEnd?: (totalMinutes: number) => void;
}

export function PomodoroTimer({
  studyMinutes = 25,
  breakMinutes = 5,
  onStudyComplete,
  onSessionEnd
}: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(studyMinutes * 60); // Segundos
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [totalStudyTime, setTotalStudyTime] = useState(0); // Minutos acumulados
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalTime = isBreak ? breakMinutes * 60 : studyMinutes * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Terminó el ciclo
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
      // Terminó estudio, empezar descanso
      setTotalStudyTime(prev => prev + studyMinutes);
      setIsBreak(true);
      setTimeLeft(breakMinutes * 60);
      setIsRunning(false);
      if (onStudyComplete) onStudyComplete();
      // Sonido o notificación
      if (typeof window !== 'undefined' && 'Notification' in window) {
        new Notification('StudyApp', { body: '¡Descanso de 5 minutos!' });
      }
    } else {
      // Terminó descanso, volver a estudio
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
      <div className="relative">
        <svg className="h-64 w-64 -rotate-90 transform">
          <circle
            cx="128"
            cy="128"
            r="112"
            stroke="currentColor"
            strokeWidth="16"
            fill="none"
            className="text-gray-200"
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
            className={`transition-all duration-1000 ${isBreak ? 'text-green-500' : 'text-blue-600'}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-6xl font-bold text-gray-900">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {isBreak ? 'Descanso' : 'Estudiando'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={togglePlay}
          className="rounded-full bg-blue-600 px-8 py-3 text-sm font-medium text-white hover:bg-blue-700 shadow-md"
        >
          {isRunning ? 'Pausar' : 'Iniciar'}
        </button>
        <button
          onClick={reset}
          className="rounded-full border border-gray-300 bg-white px-8 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Reiniciar
        </button>
      </div>

      {/* Stats */}
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>Tiempo total de estudio: <span className="font-semibold">{totalStudyTime} minutos</span></p>
      </div>

      {/* End Session Early */}
      {totalStudyTime > 0 && (
        <button
          onClick={handleEndSession}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700"
        >
          Terminé antes →
        </button>
      )}
    </div>
  );
}
