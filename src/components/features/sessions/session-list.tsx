'use client';

import { SessionCard } from './session-card';

interface SessionWithTopicSubject {
  id: string;
  scheduled_at: string;
  duration_minutes?: number | null;
  duration?: number | null;
  topic?: { id: string; name: string; source_date?: string | null } | null;
  subject?: { id: string; name: string } | null;
  priority?: string | null;
  status: string;
  number?: number;
  topic_id?: string;
  session_type?: 'REVIEW' | 'PRE_CLASS' | string | null;
}

interface SessionListProps {
  sessions: SessionWithTopicSubject[];
  onStatusChange: () => void;
  onReschedule: (session: SessionWithTopicSubject) => void;
}

export function SessionList({ sessions, onStatusChange, onReschedule }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">event_available</span>
        <p className="font-headline text-lg text-on-surface-variant">No hay sesiones para mostrar</p>
        <p className="text-sm text-on-surface-variant/60 mt-1">Las sesiones se generan automáticamente al crear temas</p>
      </div>
    );
  }

  const sessionsByDay = sessions.reduce((acc, session) => {
    const date = new Date(session.scheduled_at);
    const dayKey = date.toISOString().split('T')[0];
    
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(session);
    return acc;
  }, {} as Record<string, SessionWithTopicSubject[]>);

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
          <h3 className="mb-3 font-label text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">
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
