'use client';

import { useEffect, useState } from 'react';
import { getUpcomingSessions } from '@/lib/actions/sessions';
import { getSubjects } from '@/lib/actions/subjects';
import { SessionList } from '@/components/features/sessions/session-list';
import { SessionFilters } from '@/components/features/sessions/session-filters';
import { RescheduleDialog } from '@/components/features/sessions/reschedule-dialog';

interface SessionsClientProps {
  userId: string;
}

export function SessionsClient({ userId }: SessionsClientProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filters, setFilters] = useState<{ status?: string; priority?: string; subjectId?: string }>({});
  const [loading, setLoading] = useState(true);
  const [rescheduleSession, setRescheduleSession] = useState<any>(null);

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
  const totalCount = sessions.length;

  return (
    <div className="space-y-6">
      {/* Stats rápidos */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Próximos 30 días</p>
            <p className="text-2xl font-bold text-gray-900">
              {pendingCount} <span className="text-sm font-normal text-gray-500">/ {totalCount} sesiones</span>
            </p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>✅ {sessions.filter((s) => s.status === 'COMPLETED').length} completadas</p>
            <p>🔄 {sessions.filter((s) => s.status === 'RESCHEDULED').length} reagendadas</p>
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

      {/* Lista de sesiones */}
      <SessionList 
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
