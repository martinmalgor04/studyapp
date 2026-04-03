'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';
type ScheduleType = 'CLASS' | 'EXAM' | 'RECOVERY' | 'HOLIDAY';
type ExamType = 'PARCIAL' | 'RECUPERATORIO' | 'FINAL';

interface GroupedTopic {
  name: string;
  unitNumber: number;
  subtopics: string[];
  estimatedMinutes: number;
  difficulty: Difficulty;
  order: number;
}

interface ScheduleEntry {
  date: string;
  topics: string[];
  type: ScheduleType;
}

interface ExamEntry {
  name: string;
  date?: string;
  type: ExamType;
  unitsIncluded: number[];
}

interface ExtractedMetadata {
  name?: string;
  year?: number;
  semester?: string;
  totalHours?: number;
  weeklyHours?: number;
  professors?: string[];
  bibliography?: string[];
  evaluationCriteria?: string;
}

interface InternalTopic {
  id: string;
  name: string;
  difficulty: Difficulty;
  hours: number;
  subtopics: string[];
  unitNumber: number;
}

interface InternalExam {
  id: string;
  name: string;
  date?: string;
  type: ExamType;
  unitsIncluded: number[];
}

export interface ExtractionReviewProps {
  metadata: ExtractedMetadata;
  groupedTopics: GroupedTopic[];
  schedule?: ScheduleEntry[];
  exams?: ExamEntry[];
  confidence: Confidence;
  onConfirm: (data: {
    topics: Array<{ id: string; name: string; difficulty: Difficulty; hours: number }>;
    metadata: {
      name?: string;
      year?: number;
      semester?: string;
      professors?: string[];
      totalHours?: number;
      weeklyHours?: number;
      bibliography?: string[];
      evaluationCriteria?: string;
    };
    exams: Array<{ name: string; date?: string; type: string; unitsIncluded: number[] }>;
  }) => void;
  onSwitchToManual: () => void;
  className?: string;
}

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

const CONFIDENCE_CONFIG: Record<Confidence, { icon: string; label: string; description: string; variant: 'success' | 'warning' | 'error' }> = {
  HIGH: {
    icon: 'check_circle',
    label: 'Extracción exitosa',
    description: 'Revisá los datos antes de confirmar',
    variant: 'success',
  },
  MEDIUM: {
    icon: 'warning',
    label: 'Extracción parcial',
    description: 'Algunos datos pueden necesitar corrección',
    variant: 'warning',
  },
  LOW: {
    icon: 'error',
    label: 'Extracción limitada',
    description: 'Revisá cuidadosamente todos los datos',
    variant: 'error',
  },
};

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; classes: string; activeClasses: string }[] = [
  {
    value: 'EASY',
    label: 'Fácil',
    classes: 'hover:bg-secondary-container/20 hover:text-secondary',
    activeClasses: 'bg-secondary-container/30 text-secondary',
  },
  {
    value: 'MEDIUM',
    label: 'Medio',
    classes: 'hover:bg-tertiary-container/20 hover:text-tertiary',
    activeClasses: 'bg-tertiary-container/30 text-tertiary',
  },
  {
    value: 'HARD',
    label: 'Difícil',
    classes: 'hover:bg-error-container/20 hover:text-error',
    activeClasses: 'bg-error-container/30 text-error',
  },
];

const SCHEDULE_TYPE_CONFIG: Record<ScheduleType, { label: string; className: string; icon: string }> = {
  CLASS: { label: 'Clase', className: 'bg-tertiary-container/30 text-on-tertiary-container', icon: 'school' },
  EXAM: { label: 'Examen', className: 'bg-error-container/30 text-on-error-container', icon: 'assignment' },
  RECOVERY: { label: 'Recuperatorio', className: 'bg-error-container/20 text-on-error-container', icon: 'event_upcoming' },
  HOLIDAY: { label: 'Feriado', className: 'bg-surface-container-high text-on-surface-variant', icon: 'event_busy' },
};

const EXAM_TYPE_OPTIONS: { value: ExamType; label: string }[] = [
  { value: 'PARCIAL', label: 'Parcial' },
  { value: 'RECUPERATORIO', label: 'Recuperatorio' },
  { value: 'FINAL', label: 'Final' },
];

const DIFFICULTY_DEFAULTS: Record<Difficulty, number> = {
  EASY: 35,
  MEDIUM: 70,
  HARD: 105,
};

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

function hasMetadata(metadata: ExtractedMetadata): boolean {
  return !!(
    metadata.name ||
    metadata.year ||
    metadata.semester ||
    metadata.professors?.length ||
    metadata.totalHours != null ||
    metadata.weeklyHours != null ||
    metadata.bibliography?.length ||
    metadata.evaluationCriteria
  );
}

// ────────────────────────────────────────────────────────────
// Collapsible Section
// ────────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-container-low/50"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined text-[20px] text-on-surface-variant">{icon}</span>
        <span className="flex-1 text-sm font-body font-semibold text-on-surface">{title}</span>
        {count !== undefined && (
          <span className="rounded-full bg-tertiary-container/30 px-2.5 py-0.5 text-xs font-label font-bold text-on-tertiary-container">
            {count}
          </span>
        )}
        <span
          className={cn(
            'material-symbols-outlined text-[18px] text-on-surface-variant/50 transition-transform duration-200',
            open && 'rotate-180',
          )}
        >
          expand_more
        </span>
      </button>
      {open && <div className="border-t border-outline-variant/10 px-5 pb-5 pt-4">{children}</div>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────

export function ExtractionReview({
  metadata: initialMetadata,
  groupedTopics,
  schedule,
  exams: initialExams,
  confidence,
  onConfirm,
  onSwitchToManual,
  className,
}: ExtractionReviewProps) {
  // ── Internal state ──
  const [metaName, setMetaName] = useState(initialMetadata.name ?? '');
  const [metaYear, setMetaYear] = useState(initialMetadata.year?.toString() ?? '');
  const [metaSemester, setMetaSemester] = useState(initialMetadata.semester ?? '');
  const [metaProfessors, setMetaProfessors] = useState(initialMetadata.professors?.join(', ') ?? '');

  const [topics, setTopics] = useState<InternalTopic[]>(() =>
    groupedTopics
      .sort((a, b) => a.order - b.order)
      .map(t => ({
        id: crypto.randomUUID(),
        name: t.name,
        difficulty: t.difficulty,
        hours: t.estimatedMinutes,
        subtopics: t.subtopics,
        unitNumber: t.unitNumber,
      })),
  );

  const [exams, setExams] = useState<InternalExam[]>(() =>
    (initialExams ?? []).map(e => ({
      id: crypto.randomUUID(),
      ...e,
    })),
  );

  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingHoursId, setEditingHoursId] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState('');

  const editInputRef = useRef<HTMLInputElement>(null);
  const hoursInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTopicId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTopicId]);

  useEffect(() => {
    if (editingHoursId && hoursInputRef.current) {
      hoursInputRef.current.focus();
      hoursInputRef.current.select();
    }
  }, [editingHoursId]);

  // ── Topic handlers ──
  const updateTopic = useCallback((id: string, patch: Partial<Omit<InternalTopic, 'id'>>) => {
    setTopics(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, ...patch };
        if (patch.difficulty && !patch.hours) {
          updated.hours = DIFFICULTY_DEFAULTS[patch.difficulty];
        }
        return updated;
      }),
    );
  }, []);

  const removeTopic = useCallback((id: string) => {
    setTopics(prev => prev.filter(t => t.id !== id));
  }, []);

  const commitNameEdit = useCallback(
    (id: string, value: string) => {
      const trimmed = value.trim();
      if (trimmed) updateTopic(id, { name: trimmed });
      setEditingTopicId(null);
    },
    [updateTopic],
  );

  const commitHoursEdit = useCallback(
    (id: string, value: string) => {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed > 0) updateTopic(id, { hours: parsed });
      setEditingHoursId(null);
    },
    [updateTopic],
  );

  const addTopic = useCallback(() => {
    const trimmed = newTopicName.trim();
    if (!trimmed) return;
    setTopics(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: trimmed,
        difficulty: 'MEDIUM' as Difficulty,
        hours: DIFFICULTY_DEFAULTS.MEDIUM,
        subtopics: [],
        unitNumber: 0,
      },
    ]);
    setNewTopicName('');
    addInputRef.current?.focus();
  }, [newTopicName]);

  // ── Exam handlers ──
  const updateExam = useCallback((id: string, patch: Partial<Omit<InternalExam, 'id'>>) => {
    setExams(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  // ── Confirm ──
  const handleConfirm = useCallback(() => {
    onConfirm({
      topics: topics.map(t => ({
        id: t.id,
        name: t.name,
        difficulty: t.difficulty,
        hours: t.hours,
      })),
      metadata: {
        name: metaName || undefined,
        year: metaYear ? parseInt(metaYear, 10) : undefined,
        semester: metaSemester || undefined,
        professors: metaProfessors
          ? metaProfessors.split(',').map(p => p.trim()).filter(Boolean)
          : undefined,
        totalHours: initialMetadata.totalHours,
        weeklyHours: initialMetadata.weeklyHours,
        bibliography: initialMetadata.bibliography,
        evaluationCriteria: initialMetadata.evaluationCriteria,
      },
      exams: exams.map(e => ({
        name: e.name,
        date: e.date,
        type: e.type,
        unitsIncluded: e.unitsIncluded,
      })),
    });
  }, [
    topics,
    metaName,
    metaYear,
    metaSemester,
    metaProfessors,
    exams,
    onConfirm,
    initialMetadata.totalHours,
    initialMetadata.weeklyHours,
    initialMetadata.bibliography,
    initialMetadata.evaluationCriteria,
  ]);

  const conf = CONFIDENCE_CONFIG[confidence];
  const showMetadata = hasMetadata(initialMetadata);

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {/* ── Confidence Banner ── */}
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl px-5 py-4',
          confidence === 'HIGH' && 'bg-secondary-container/20',
          confidence === 'MEDIUM' && 'bg-tertiary-container/20',
          confidence === 'LOW' && 'bg-error-container/20',
        )}
      >
        <span
          className={cn(
            'material-symbols-outlined text-[22px]',
            confidence === 'HIGH' && 'text-secondary',
            confidence === 'MEDIUM' && 'text-tertiary',
            confidence === 'LOW' && 'text-error',
          )}
        >
          {conf.icon}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-body font-semibold text-on-surface">{conf.label}</span>
            <Badge variant={conf.variant} className="text-[10px]">
              {confidence}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs font-body text-on-surface-variant">{conf.description}</p>
        </div>
      </div>

      {/* ── Metadata Section ── */}
      {showMetadata && (
        <Section title="Datos de la materia" icon="info" defaultOpen>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="meta-name" className="text-xs font-label font-bold uppercase tracking-widest text-on-surface-variant/60">
                Nombre
              </label>
              <Input
                id="meta-name"
                value={metaName}
                onChange={e => setMetaName(e.target.value)}
                placeholder="Nombre de la materia"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="meta-year" className="text-xs font-label font-bold uppercase tracking-widest text-on-surface-variant/60">
                Año
              </label>
              <Input
                id="meta-year"
                type="number"
                value={metaYear}
                onChange={e => setMetaYear(e.target.value)}
                placeholder="Ej: 3"
                min={1}
                max={6}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="meta-semester" className="text-xs font-label font-bold uppercase tracking-widest text-on-surface-variant/60">
                Cuatrimestre
              </label>
              <Input
                id="meta-semester"
                value={metaSemester}
                onChange={e => setMetaSemester(e.target.value)}
                placeholder="Ej: 1er cuatrimestre"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="meta-professors" className="text-xs font-label font-bold uppercase tracking-widest text-on-surface-variant/60">
                Profesores
              </label>
              <Input
                id="meta-professors"
                value={metaProfessors}
                onChange={e => setMetaProfessors(e.target.value)}
                placeholder="Separados por coma"
              />
            </div>
          </div>
        </Section>
      )}

      {/* ── Topics Section ── */}
      <Section title="Temas extraídos" icon="library_books" count={topics.length} defaultOpen>
        {topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant/60">
            <span className="material-symbols-outlined mb-2 text-[40px]">library_books</span>
            <p className="text-sm font-body">No se extrajeron temas</p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {topics.map(topic => (
              <li
                key={topic.id}
                className="group border-b border-outline-variant/10 py-3 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  {/* Unit badge */}
                  {topic.unitNumber > 0 && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tertiary-container/20 text-[10px] font-label font-bold text-on-tertiary-container">
                      {topic.unitNumber}
                    </span>
                  )}

                  {/* Name (inline editable) */}
                  <div className="min-w-0 flex-1">
                    {editingTopicId === topic.id ? (
                      <input
                        ref={editInputRef}
                        defaultValue={topic.name}
                        onBlur={e => commitNameEdit(topic.id, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            commitNameEdit(topic.id, e.currentTarget.value);
                          }
                          if (e.key === 'Escape') setEditingTopicId(null);
                        }}
                        className={cn(
                          'w-full rounded-lg border border-tertiary/40 bg-surface-container-lowest px-2 py-1',
                          'text-sm font-body text-on-surface outline-none',
                          'focus:ring-2 focus:ring-tertiary/30',
                        )}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingTopicId(topic.id)}
                        className="w-full truncate text-left text-sm font-body text-on-surface hover:text-tertiary transition-colors"
                      >
                        {topic.name}
                      </button>
                    )}
                  </div>

                  {/* Difficulty pills */}
                  <div className="hidden shrink-0 gap-1 sm:flex">
                    {DIFFICULTY_OPTIONS.map(opt => {
                      const isActive = topic.difficulty === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateTopic(topic.id, { difficulty: opt.value })}
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
                            isActive ? opt.activeClasses : cn('text-on-surface-variant/60', opt.classes),
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Duration */}
                  {editingHoursId === topic.id ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <input
                        ref={hoursInputRef}
                        type="number"
                        min={1}
                        defaultValue={topic.hours}
                        onBlur={e => commitHoursEdit(topic.id, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            commitHoursEdit(topic.id, e.currentTarget.value);
                          }
                          if (e.key === 'Escape') setEditingHoursId(null);
                        }}
                        className={cn(
                          'w-14 rounded-lg border border-tertiary/40 bg-surface-container-lowest px-2 py-1',
                          'text-center text-xs font-body text-on-surface outline-none',
                          'focus:ring-2 focus:ring-tertiary/30',
                        )}
                      />
                      <span className="text-xs text-on-surface-variant/50">min</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingHoursId(topic.id)}
                      className="shrink-0 text-xs text-on-surface-variant/50 hover:text-tertiary transition-colors"
                      aria-label={`Editar duración de ${topic.name}`}
                    >
                      ~{topic.hours} min
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeTopic(topic.id)}
                    aria-label={`Eliminar ${topic.name}`}
                    className={cn(
                      'shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                      'text-on-surface-variant/40 hover:text-error',
                    )}
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                {/* Subtopics */}
                {topic.subtopics.length > 0 && (
                  <div className={cn('mt-1.5 flex flex-wrap gap-1.5', topic.unitNumber > 0 ? 'pl-9' : 'pl-0')}>
                    {topic.subtopics.map((sub, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-surface-container-low px-2 py-0.5 text-[11px] font-body text-on-surface-variant/60"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Add new topic */}
        <div className="mt-4 flex gap-2">
          <Input
            ref={addInputRef}
            value={newTopicName}
            onChange={e => setNewTopicName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTopic();
              }
            }}
            placeholder="Agregar tema manualmente..."
            className="flex-1 rounded-xl border-outline-variant/20 bg-surface-container-lowest"
          />
          <button
            type="button"
            onClick={addTopic}
            disabled={!newTopicName.trim()}
            aria-label="Agregar tema"
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              'bg-tertiary text-on-tertiary transition-all duration-200',
              'hover:bg-tertiary-dim active:scale-95',
              'disabled:opacity-40 disabled:pointer-events-none',
            )}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        </div>

        {topics.length > 0 && (
          <p className="mt-3 text-center text-xs text-on-surface-variant/60">
            {topics.length} {topics.length === 1 ? 'tema' : 'temas'} · ~
            {Math.round(topics.reduce((acc, t) => acc + t.hours, 0))} min totales
          </p>
        )}
      </Section>

      {/* ── Schedule Section ── */}
      {schedule && schedule.length > 0 && (
        <Section title="Cronograma" icon="calendar_month" count={schedule.length} defaultOpen={false}>
          <div className="relative flex flex-col gap-0">
            {schedule.map((entry, idx) => {
              const config = SCHEDULE_TYPE_CONFIG[entry.type];
              return (
                <div key={idx} className="flex gap-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        config.className,
                      )}
                    >
                      <span className="material-symbols-outlined text-[16px]">{config.icon}</span>
                    </div>
                    {idx < schedule.length - 1 && (
                      <div className="w-px flex-1 bg-outline-variant/15" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-label font-bold text-on-surface-variant/60">
                        {formatDate(entry.date)}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {config.label}
                      </Badge>
                    </div>
                    {entry.topics.length > 0 && (
                      <p className="mt-1 text-sm font-body text-on-surface/80">
                        {entry.topics.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── Exams Section ── */}
      {exams.length > 0 && (
        <Section title="Exámenes detectados" icon="assignment" count={exams.length} defaultOpen>
          <div className="flex flex-col gap-3">
            {exams.map(exam => (
              <div
                key={exam.id}
                className="rounded-lg border border-outline-variant/15 bg-surface-container-low/30 p-4"
              >
                <div className="flex flex-wrap items-start gap-3">
                  {/* Exam name */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-body font-semibold text-on-surface">{exam.name}</p>
                    {exam.unitsIncluded.length > 0 && (
                      <p className="mt-1 text-xs font-body text-on-surface-variant/60">
                        Unidades: {exam.unitsIncluded.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Type selector */}
                  <div className="flex shrink-0 gap-1">
                    {EXAM_TYPE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateExam(exam.id, { type: opt.value })}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
                          exam.type === opt.value
                            ? 'bg-error-container/30 text-error'
                            : 'text-on-surface-variant/60 hover:bg-error-container/10 hover:text-error',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div className="mt-3">
                  <label
                    htmlFor={`exam-date-${exam.id}`}
                    className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant/60"
                  >
                    Fecha
                  </label>
                  <Input
                    id={`exam-date-${exam.id}`}
                    type="date"
                    value={exam.date ?? ''}
                    onChange={e => updateExam(exam.id, { date: e.target.value || undefined })}
                    className="mt-1 max-w-[200px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Footer ── */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <Button
          onClick={handleConfirm}
          disabled={topics.length === 0}
          className="w-full sm:w-auto"
          size="lg"
        >
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          Confirmar y crear plan de estudio
        </Button>
        <button
          type="button"
          onClick={onSwitchToManual}
          className="text-xs font-body text-on-surface-variant/60 underline-offset-2 hover:text-tertiary hover:underline transition-colors"
        >
          La extracción no es correcta → Ingresar manualmente
        </button>
      </div>
    </div>
  );
}
