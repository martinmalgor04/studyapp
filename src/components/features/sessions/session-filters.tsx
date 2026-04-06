'use client';

export type SessionTypeFilter = 'REVIEW' | 'PRE_CLASS';

interface SessionFiltersProps {
  filters: {
    status?: string;
    priority?: string;
    subjectId?: string;
    sessionType?: SessionTypeFilter;
  };
  subjects: Array<{ id: string; name: string }>;
  onChange: (filters: {
    status?: string;
    priority?: string;
    subjectId?: string;
    sessionType?: SessionTypeFilter;
  }) => void;
}

const selectClasses = "block w-full rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary";

export function SessionFilters({ filters, subjects, onChange }: SessionFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="status-filter" className="block font-label text-[10px] font-medium text-on-surface-variant uppercase tracking-widest mb-1">
          Estado
        </label>
        <select
          id="status-filter"
          value={filters.status || ''}
          onChange={(e) => onChange({ ...filters, status: e.target.value || undefined })}
          className={selectClasses}
        >
          <option value="">Todas</option>
          <option value="PENDING">Pendientes</option>
          <option value="COMPLETED">Completadas</option>
          <option value="RESCHEDULED">Reagendadas</option>
          <option value="ABANDONED">Abandonadas</option>
        </select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <label htmlFor="priority-filter" className="block font-label text-[10px] font-medium text-on-surface-variant uppercase tracking-widest mb-1">
          Prioridad
        </label>
        <select
          id="priority-filter"
          value={filters.priority || ''}
          onChange={(e) => onChange({ ...filters, priority: e.target.value || undefined })}
          className={selectClasses}
        >
          <option value="">Todas</option>
          <option value="CRITICAL">Crítico</option>
          <option value="URGENT">Urgente</option>
          <option value="IMPORTANT">Importante</option>
          <option value="NORMAL">Normal</option>
          <option value="LOW">Baja</option>
        </select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <label htmlFor="session-type-filter" className="block font-label text-[10px] font-medium text-on-surface-variant uppercase tracking-widest mb-1">
          Tipo
        </label>
        <select
          id="session-type-filter"
          value={filters.sessionType || ''}
          onChange={(e) =>
            onChange({
              ...filters,
              sessionType: (e.target.value as SessionTypeFilter | '') || undefined,
            })
          }
          className={selectClasses}
        >
          <option value="">Todas</option>
          <option value="REVIEW">Repaso</option>
          <option value="PRE_CLASS">Pre-clase</option>
        </select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <label htmlFor="subject-filter" className="block font-label text-[10px] font-medium text-on-surface-variant uppercase tracking-widest mb-1">
          Materia
        </label>
        <select
          id="subject-filter"
          value={filters.subjectId || ''}
          onChange={(e) => onChange({ ...filters, subjectId: e.target.value || undefined })}
          className={selectClasses}
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
