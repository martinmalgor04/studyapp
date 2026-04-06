'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UnifiedCalendar } from '@/components/shared/calendar/unified-calendar';
import { SessionFilters, type SessionTypeFilter } from '@/components/features/sessions/session-filters';
import { RescheduleDialog } from '@/components/features/sessions/reschedule-dialog';
import { MotivationalQuote } from '@/components/shared/motivational-quote';

interface SessionWithRelations {
  id: string;
  scheduled_at: string;
  duration_minutes?: number | null;
  duration: number;
  number: number;
  status: string | null;
  priority: string | null;
  session_type?: 'REVIEW' | 'PRE_CLASS' | string | null;
  adjusted_for_conflict?: boolean | null;
  original_scheduled_at?: string | null;
  topic?: { id: string; name: string; difficulty?: string | null; source_date?: string | null } | null;
  subject?: { id: string; name: string } | null;
  subject_id?: string | null;
  topic_id?: string | null;
}

function effectiveSessionType(s: SessionWithRelations): SessionTypeFilter {
  if (s.session_type === 'PRE_CLASS') return 'PRE_CLASS';
  return 'REVIEW';
}

interface SessionsClientProps {
  initialSessions: SessionWithRelations[];
  initialSubjects: Array<{ id: string; name: string }>;
}

export function SessionsClient({ initialSessions, initialSubjects }: SessionsClientProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionWithRelations[]>(initialSessions);
  const [filteredSessions, setFilteredSessions] = useState<SessionWithRelations[]>(initialSessions);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>(initialSubjects);
  const [filters, setFilters] = useState<{
    status?: string;
    priority?: string;
    subjectId?: string;
    sessionType?: SessionTypeFilter;
  }>({});
  const [rescheduleSession, setRescheduleSession] = useState<SessionWithRelations | null>(null);

  useEffect(() => {
    setSessions(initialSessions);
    setFilteredSessions(initialSessions);
  }, [initialSessions]);

  useEffect(() => {
    setSubjects(initialSubjects);
  }, [initialSubjects]);

  useEffect(() => {
    let filtered = [...sessions];

    if (filters.status) {
      filtered = filtered.filter((s) => s.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter((s) => s.priority === filters.priority);
    }

    if (filters.subjectId) {
      filtered = filtered.filter(
        (s) => (s.subject_id ?? s.subject?.id) === filters.subjectId,
      );
    }

    if (filters.sessionType) {
      filtered = filtered.filter((s) => effectiveSessionType(s) === filters.sessionType);
    }

    setFilteredSessions(filtered);
  }, [filters, sessions]);

  const pendingCount = sessions.filter((s) => s.status === 'PENDING').length;
  const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length;
  const rescheduledCount = sessions.filter((s) => s.status === 'RESCHEDULED').length;
  const totalCount = sessions.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats con gráfico circular */}
      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-on-surface-variant uppercase tracking-wide">Progreso Mensual</h3>
        <div className="flex items-center gap-6">
          <div className="relative flex h-32 w-32 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-outline-variant/10"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - progressPercentage / 100)}`}
                className="text-tertiary transition-all duration-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold text-on-surface">{pendingCount}</p>
              <p className="text-xs text-on-surface-variant">/ {totalCount} sesiones</p>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-secondary"></div>
                <span className="text-sm text-on-surface-variant">Completadas</span>
              </div>
              <span className="text-sm font-semibold text-on-surface">{completedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-tertiary"></div>
                <span className="text-sm text-on-surface-variant">Pendientes</span>
              </div>
              <span className="text-sm font-semibold text-on-surface">{pendingCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-warning"></div>
                <span className="text-sm text-on-surface-variant">Reagendadas</span>
              </div>
              <span className="text-sm font-semibold text-on-surface">{rescheduledCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-on-surface">Filtros</h3>
        <SessionFilters
          filters={filters}
          subjects={subjects}
          onChange={setFilters}
        />

        {(filters.status || filters.priority || filters.subjectId || filters.sessionType) && (
          <button
            onClick={() => setFilters({})}
            className="mt-4 text-xs text-tertiary hover:text-tertiary-dim"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Calendario Unificado */}
      <UnifiedCalendar
        defaultView="month"
        sessions={filteredSessions}
        onStatusChange={() => router.refresh()}
        onReschedule={setRescheduleSession}
      />

      {/* Dialog de reagendar */}
      <RescheduleDialog
        isOpen={!!rescheduleSession}
        session={rescheduleSession}
        onClose={() => setRescheduleSession(null)}
        onSuccess={() => router.refresh()}
      />

      <MotivationalQuote />
    </div>
  );
}
