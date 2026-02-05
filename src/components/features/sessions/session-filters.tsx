'use client';

interface SessionFiltersProps {
  filters: {
    status?: string;
    priority?: string;
    subjectId?: string;
  };
  subjects: Array<{ id: string; name: string }>;
  onChange: (filters: { status?: string; priority?: string; subjectId?: string }) => void;
}

export function SessionFilters({ filters, subjects, onChange }: SessionFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {/* Filtro por Estado */}
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="status-filter" className="block text-xs font-medium text-gray-700 mb-1">
          Estado
        </label>
        <select
          id="status-filter"
          value={filters.status || ''}
          onChange={(e) => onChange({ ...filters, status: e.target.value || undefined })}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="">Todas</option>
          <option value="PENDING">⏰ Pendientes</option>
          <option value="COMPLETED">✅ Completadas</option>
          <option value="RESCHEDULED">🔄 Reagendadas</option>
          <option value="ABANDONED">❌ Abandonadas</option>
        </select>
      </div>

      {/* Filtro por Prioridad */}
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="priority-filter" className="block text-xs font-medium text-gray-700 mb-1">
          Prioridad
        </label>
        <select
          id="priority-filter"
          value={filters.priority || ''}
          onChange={(e) => onChange({ ...filters, priority: e.target.value || undefined })}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="">Todas</option>
          <option value="CRITICAL">🔴 Crítico</option>
          <option value="URGENT">🟠 Urgente</option>
          <option value="IMPORTANT">🟡 Importante</option>
          <option value="NORMAL">🔵 Normal</option>
          <option value="LOW">⚪ Baja</option>
        </select>
      </div>

      {/* Filtro por Materia */}
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="subject-filter" className="block text-xs font-medium text-gray-700 mb-1">
          Materia
        </label>
        <select
          id="subject-filter"
          value={filters.subjectId || ''}
          onChange={(e) => onChange({ ...filters, subjectId: e.target.value || undefined })}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="">Todas</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
