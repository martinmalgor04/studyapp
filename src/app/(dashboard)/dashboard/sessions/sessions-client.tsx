'use client';

import { useEffect, useState } from 'react';
import { getUpcomingSessions } from '@/lib/actions/sessions';
import { getSubjects } from '@/lib/actions/subjects';
import { UnifiedCalendar } from '@/components/shared/calendar/unified-calendar';
import { SessionFilters } from '@/components/features/sessions/session-filters';
import { RescheduleDialog } from '@/components/features/sessions/reschedule-dialog';

interface SessionsClientProps {
  userId: string;
}

interface SessionWithRelations {
  id: string;
  scheduled_at: string;
  duration_minutes?: number | null;
  duration: number;
  number: number;
  status: string;
  priority: string;
  topic?: { id: string; name: string; difficulty?: string };
  subject?: { name: string } | null;
  subject_id?: string;
  topic_id?: string;
}

export function SessionsClient({ userId }: SessionsClientProps) {
  void userId; // Reserved for future use (e.g. filtering by user)
  const [sessions, setSessions] = useState<SessionWithRelations[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionWithRelations[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [filters, setFilters] = useState<{ status?: string; priority?: string; subjectId?: string }>({});
  const [loading, setLoading] = useState(true);
  const [rescheduleSession, setRescheduleSession] = useState<SessionWithRelations | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [sessionsData, subjectsData] = await Promise.all([
      getUpcomingSessions(30), // Mostrar próximos 30 días en vez de 7
      getSubjects(),
    ]);
    
    setSessions(sessionsData);
    setFilteredSessions(sessionsData);
    setSubjects(subjectsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...sessions];

    if (filters.status) {
      filtered = filtered.filter((s) => s.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter((s) => s.priority === filters.priority);
    }

    if (filters.subjectId) {
      filtered = filtered.filter((s) => s.subject_id === filters.subjectId);
    }

    setFilteredSessions(filtered);
  }, [filters, sessions]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-gray-500">Cargando sesiones...</div>
      </div>
    );
  }

  const pendingCount = sessions.filter((s) => s.status === 'PENDING').length;
  const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length;
  const rescheduledCount = sessions.filter((s) => s.status === 'RESCHEDULED').length;
  const totalCount = sessions.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats con gráfico circular */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">Progreso Mensual</h3>
        <div className="flex items-center gap-6">
          {/* Gráfico circular simple */}
          <div className="relative flex h-32 w-32 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-gray-200"
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
                className="text-blue-600 transition-all duration-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-xs text-gray-500">/ {totalCount} sesiones</p>
            </div>
          </div>

          {/* Stats secundarias */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-700">Completadas</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{completedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-700">Pendientes</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{pendingCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-700">Reagendadas</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{rescheduledCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Filtros</h3>
        <SessionFilters
          filters={filters}
          subjects={subjects}
          onChange={setFilters}
        />
        
        {(filters.status || filters.priority || filters.subjectId) && (
          <button
            onClick={() => setFilters({})}
            className="mt-4 text-xs text-blue-600 hover:text-blue-700"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Calendario Unificado */}
      <UnifiedCalendar
        defaultView="month"
        sessions={filteredSessions}
        onStatusChange={loadData}
        onReschedule={setRescheduleSession}
      />

      {/* Dialog de reagendar */}
      <RescheduleDialog
        isOpen={!!rescheduleSession}
        session={rescheduleSession}
        onClose={() => setRescheduleSession(null)}
        onSuccess={loadData}
      />
    </div>
  );
}