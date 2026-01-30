'use client';

import { SessionCard } from './session-card';

interface SessionListProps {
  sessions: any[];
  onStatusChange: () => void;
  onReschedule: (session: any) => void;
}

export function SessionList({ sessions, onStatusChange, onReschedule }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
        <p className="text-gray-500">No hay sesiones para mostrar</p>
      </div>
    );
  }

  // Agrupar sesiones por día
  const sessionsByDay = sessions.reduce((acc, session) => {
    const date = new Date(session.scheduled_at);
    const dayKey = date.toISOString().split('T')[0];
    
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(session);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedDays = Object.keys(sessionsByDay).sort();

  const formatDayHeader = (dayKey: string) => {
    const date = new Date(dayKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es-AR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  return (
    <div className="space-y-6">
      {sortedDays.map((dayKey) => (
        <div key={dayKey}>
          <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {formatDayHeader(dayKey)} ({sessionsByDay[dayKey].length})
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessionsByDay[dayKey].map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onStatusChange={onStatusChange}
                onReschedule={onReschedule}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
