'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { StepProps } from '@/components/shared/wizard';
import type { ClassBlock, TopicInput } from './subject-wizard-types';
import { TopicEntryPanel } from './topic-entry-panel';
import type { ExamModality } from '@/lib/validations/exams';
import { MODALITY_LABELS } from '@/lib/validations/exams';
import { normalizeExamDateToIso } from '@/lib/utils/exam-date-normalize';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
type Day = (typeof DAYS)[number];

const MODALITY_OPTIONS: { value: ExamModality; label: string }[] = [
  { value: 'THEORY', label: MODALITY_LABELS.THEORY },
  { value: 'PRACTICE', label: MODALITY_LABELS.PRACTICE },
  { value: 'THEORY_PRACTICE', label: MODALITY_LABELS.THEORY_PRACTICE },
];

interface ParcialInput {
  id: string;
  name: string;
  date: string;
  modality: ExamModality;
  assignedTopicIds: string[];
}

interface CursadaSavedData {
  schedule: ClassBlock[];
  topics: TopicInput[];
  parciales: ParcialInput[];
}

interface PdfExtractionData {
  topics?: TopicInput[];
  exams?: Array<{ name: string; date?: string; type: string; unitsIncluded: number[] }>;
  metadata?: {
    name?: string;
    year?: number;
    semester?: string;
    professors?: string[];
    totalHours?: number;
    weeklyHours?: number;
    bibliography?: string[];
    evaluationCriteria?: string;
  };
  extractionId?: string;
}

function getInitialTopics(saved?: CursadaSavedData, pdfExtraction?: PdfExtractionData): TopicInput[] {
  if (saved?.topics?.length) return saved.topics;
  if (pdfExtraction?.topics?.length) return pdfExtraction.topics;
  return [];
}

function getInitialParciales(saved?: CursadaSavedData, pdfExtraction?: PdfExtractionData): ParcialInput[] {
  if (saved?.parciales?.length) return saved.parciales;
  if (pdfExtraction?.exams?.length) {
    return pdfExtraction.exams
      .filter(e => e.type === 'PARCIAL' || e.type === 'RECUPERATORIO')
      .map(e => ({
        id: crypto.randomUUID(),
        name: e.name,
        date: normalizeExamDateToIso(e.date?.trim() ?? '') ?? '',
        modality: 'THEORY_PRACTICE' as ExamModality,
        assignedTopicIds: [],
      }));
  }
  return [];
}

interface SectionHeaderProps {
  number: number;
  title: string;
  badge?: string;
  expanded: boolean;
  onToggle: () => void;
  completed: boolean;
}

function SectionHeader({ number, title, badge, expanded, onToggle, completed }: SectionHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 p-4"
      aria-expanded={expanded}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          completed
            ? 'bg-secondary-container text-on-secondary-container'
            : 'bg-tertiary-container/30 text-on-tertiary-container',
        )}
      >
        {completed ? (
          <span className="material-symbols-outlined text-[16px]">check</span>
        ) : (
          number
        )}
      </span>
      <div className="flex flex-1 items-center gap-2 text-left">
        <span className="text-sm font-medium text-on-surface">{title}</span>
        {badge && (
          <span className="text-xs text-on-surface-variant/60">{badge}</span>
        )}
      </div>
      <span
        className="material-symbols-outlined text-[18px] text-on-surface-variant transition-transform duration-200"
        style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
      >
        expand_more
      </span>
    </button>
  );
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function CursadaParcialesStep({
  onNext,
  onBack,
  wizardData,
  updateWizardData,
}: StepProps) {
  const saved = wizardData.cursada as CursadaSavedData | undefined;
  const pdfExtraction = wizardData.pdfExtraction as PdfExtractionData | undefined;

  const [classBlocks, setClassBlocks] = useState<ClassBlock[]>(saved?.schedule ?? []);
  const [topics, setTopics] = useState<TopicInput[]>(() => getInitialTopics(saved, pdfExtraction));
  const [parciales, setParciales] = useState<ParcialInput[]>(() => getInitialParciales(saved, pdfExtraction));

  const hasPdfTopics = !saved?.topics?.length && !!pdfExtraction?.topics?.length;
  const hasPdfParciales = !saved?.parciales?.length && !!pdfExtraction?.exams?.length;
  const [sections, setSections] = useState({
    schedule: true,
    topics: hasPdfTopics,
    parciales: hasPdfParciales,
  });

  const [addingDay, setAddingDay] = useState<Day | null>(null);
  const [addStart, setAddStart] = useState('18:00');
  const [addEnd, setAddEnd] = useState('22:00');

  const [error, setError] = useState<string | null>(null);

  const toggleSection = useCallback((key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // --- Schedule handlers ---
  const startAdding = (day: Day) => {
    setAddingDay(day);
    setAddStart('18:00');
    setAddEnd('22:00');
  };

  const confirmAdding = () => {
    if (!addingDay || addStart >= addEnd) return;
    const block: ClassBlock = { day: addingDay, startTime: addStart, endTime: addEnd };
    setClassBlocks(prev => {
      const next = [...prev, block].sort((a, b) => {
        const dayDiff = DAYS.indexOf(a.day as Day) - DAYS.indexOf(b.day as Day);
        return dayDiff !== 0 ? dayDiff : a.startTime.localeCompare(b.startTime);
      });
      return next;
    });
    setAddingDay(null);
  };

  const removeBlock = (index: number) => {
    setClassBlocks(prev => prev.filter((_, i) => i !== index));
  };

  // --- Parcial handlers ---
  const addParcial = useCallback(() => {
    const number = parciales.length + 1;
    setParciales(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `Parcial ${number}`,
        date: '',
        modality: 'THEORY_PRACTICE' as ExamModality,
        assignedTopicIds: [],
      },
    ]);
  }, [parciales.length]);

  const removeParcial = useCallback((id: string) => {
    setParciales(prev => prev.filter(p => p.id !== id));
  }, []);

  const updateParcialField = useCallback(
    (id: string, patch: Partial<Pick<ParcialInput, 'date' | 'modality'>>) => {
      setParciales(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
    },
    [],
  );

  const toggleTopicAssignment = useCallback((parcialId: string, topicId: string) => {
    setParciales(prev => {
      const target = prev.find(p => p.id === parcialId);
      if (!target) return prev;
      const isAssigned = target.assignedTopicIds.includes(topicId);

      return prev.map(p => {
        if (p.id === parcialId) {
          return isAssigned
            ? { ...p, assignedTopicIds: p.assignedTopicIds.filter(tid => tid !== topicId) }
            : { ...p, assignedTopicIds: [...p.assignedTopicIds, topicId] };
        }
        return { ...p, assignedTopicIds: p.assignedTopicIds.filter(tid => tid !== topicId) };
      });
    });
  }, []);

  // --- Derived state ---
  const allAssignedTopicIds = new Set(parciales.flatMap(p => p.assignedTopicIds));
  const unassignedTopics = topics.filter(t => !allAssignedTopicIds.has(t.id));
  const today = new Date().toISOString().split('T')[0];

  const handleFinish = () => {
    if (classBlocks.length === 0) {
      setError('Agregá al menos un horario de clase');
      setSections(prev => ({ ...prev, schedule: true }));
      return;
    }
    if (topics.length === 0) {
      setError('Agregá al menos un tema de estudio');
      setSections(prev => ({ ...prev, topics: true }));
      return;
    }
    if (parciales.length === 0 || parciales.every(p => !p.date)) {
      setError('Agregá al menos un parcial con fecha');
      setSections(prev => ({ ...prev, parciales: true }));
      return;
    }

    setError(null);
    updateWizardData('cursada', { schedule: classBlocks, topics, parciales });
    onNext();
  };

  return (
    <div>
      <h2 className="font-headline text-xl text-on-surface mb-2 text-center">
        Configurar cursada
      </h2>
      <p className="text-sm text-on-surface-variant mb-6 text-center">
        Horario, temas y parciales de la materia
      </p>

      {pdfExtraction?.topics?.length ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-secondary-container/15 px-4 py-3">
          <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
          <p className="text-xs text-on-secondary-container">
            Temas y parciales pre-cargados desde el PDF. Podés editarlos abajo.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {/* ── Section 1: Schedule ── */}
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden">
          <SectionHeader
            number={1}
            title="Horario de cursada"
            badge={classBlocks.length > 0 ? `${classBlocks.length} bloque${classBlocks.length !== 1 ? 's' : ''}` : undefined}
            expanded={sections.schedule}
            onToggle={() => toggleSection('schedule')}
            completed={classBlocks.length > 0}
          />
          {sections.schedule && (
            <div className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {DAYS.map(day => {
                  const dayBlocks = classBlocks.filter(b => b.day === day);
                  const isAddingThisDay = addingDay === day;
                  const timeError = isAddingThisDay && addStart >= addEnd;

                  return (
                    <div
                      key={day}
                      className="rounded-lg border border-outline-variant/15 bg-surface-container-low/30 p-2.5"
                    >
                      <p className="text-xs font-bold text-on-surface uppercase tracking-wide mb-2">
                        {day.slice(0, 3)}
                      </p>

                      {dayBlocks.map((block, idx) => {
                        const globalIdx = classBlocks.indexOf(block);
                        return (
                          <div
                            key={`${block.startTime}-${idx}`}
                            className="group mb-1.5 flex items-center justify-between rounded-md bg-tertiary-container/20 px-2 py-1"
                          >
                            <span className="text-xs text-on-surface">
                              {formatTime(block.startTime)}–{formatTime(block.endTime)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeBlock(globalIdx)}
                              className="ml-1 text-on-surface-variant/40 opacity-0 group-hover:opacity-100 hover:text-error transition-all"
                              aria-label={`Eliminar bloque ${formatTime(block.startTime)}–${formatTime(block.endTime)} de ${day}`}
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        );
                      })}

                      {isAddingThisDay ? (
                        <div className="space-y-1.5 rounded-md border border-tertiary/30 bg-tertiary-container/10 p-2">
                          <input
                            type="time"
                            value={addStart}
                            onChange={e => setAddStart(e.target.value)}
                            className="block w-full rounded border border-outline-variant/40 bg-surface-container-lowest px-1.5 py-1 text-xs text-on-surface focus:border-tertiary focus:outline-none"
                            aria-label={`Hora inicio para ${day}`}
                          />
                          <input
                            type="time"
                            value={addEnd}
                            onChange={e => setAddEnd(e.target.value)}
                            className="block w-full rounded border border-outline-variant/40 bg-surface-container-lowest px-1.5 py-1 text-xs text-on-surface focus:border-tertiary focus:outline-none"
                            aria-label={`Hora fin para ${day}`}
                          />
                          {timeError && (
                            <p className="text-[10px] text-error">Fin debe ser posterior a inicio</p>
                          )}
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={confirmAdding}
                              disabled={timeError}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-tertiary text-on-tertiary disabled:opacity-50"
                              aria-label="Confirmar bloque"
                            >
                              <span className="material-symbols-outlined text-[14px]">check</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddingDay(null)}
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/40 text-on-surface-variant"
                              aria-label="Cancelar"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startAdding(day)}
                          className="flex w-full items-center justify-center gap-0.5 rounded-md border border-dashed border-outline-variant/40 py-1.5 text-xs text-on-surface-variant hover:border-tertiary hover:text-tertiary transition-colors"
                          aria-label={`Agregar bloque a ${day}`}
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Section 2: Topics ── */}
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden">
          <SectionHeader
            number={2}
            title="Temas de estudio"
            badge={topics.length > 0 ? `${topics.length} tema${topics.length !== 1 ? 's' : ''}` : undefined}
            expanded={sections.topics}
            onToggle={() => toggleSection('topics')}
            completed={topics.length > 0}
          />
          {sections.topics && (
            <div className="px-4 pb-4">
              <TopicEntryPanel topics={topics} onChange={setTopics} />
            </div>
          )}
        </div>

        {/* ── Section 3: Parciales ── */}
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden">
          <SectionHeader
            number={3}
            title="Parciales"
            badge={parciales.length > 0 ? `${parciales.length} parcial${parciales.length !== 1 ? 'es' : ''}` : undefined}
            expanded={sections.parciales}
            onToggle={() => toggleSection('parciales')}
            completed={parciales.some(p => !!p.date)}
          />
          {sections.parciales && (
            <div className="px-4 pb-4 space-y-4">
              {parciales.map((parcial, pIdx) => (
                <div
                  key={parcial.id}
                  className="rounded-xl border border-outline-variant/15 bg-surface-container-low/20 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-tertiary-container/40 text-xs font-bold text-on-tertiary-container">
                        {pIdx + 1}
                      </span>
                      <span className="text-sm font-medium text-on-surface">{parcial.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeParcial(parcial.id)}
                      className="text-on-surface-variant/40 hover:text-error transition-colors"
                      aria-label={`Eliminar ${parcial.name}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>

                  <div>
                    <label
                      htmlFor={`parcial-date-${parcial.id}`}
                      className="block text-xs font-medium text-on-surface-variant mb-1"
                    >
                      Fecha
                    </label>
                    <input
                      id={`parcial-date-${parcial.id}`}
                      type="date"
                      min={today}
                      value={parcial.date}
                      onChange={e => updateParcialField(parcial.id, { date: e.target.value })}
                      className="block w-full rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-tertiary focus:outline-none focus:ring-2 focus:ring-tertiary/30"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-on-surface-variant mb-1.5">Modalidad</p>
                    <div className="flex gap-1.5">
                      {MODALITY_OPTIONS.map(opt => {
                        const isActive = parcial.modality === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateParcialField(parcial.id, { modality: opt.value })}
                            className={cn(
                              'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
                              isActive
                                ? 'bg-tertiary-container/30 text-tertiary'
                                : 'text-on-surface-variant/60 hover:bg-tertiary-container/15 hover:text-tertiary',
                            )}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {topics.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-on-surface-variant mb-1.5">
                        Asignar temas
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {topics.map(topic => {
                          const isAssigned = parcial.assignedTopicIds.includes(topic.id);
                          const assignedElsewhere =
                            !isAssigned &&
                            parciales.some(
                              p => p.id !== parcial.id && p.assignedTopicIds.includes(topic.id),
                            );

                          return (
                            <button
                              key={topic.id}
                              type="button"
                              onClick={() => toggleTopicAssignment(parcial.id, topic.id)}
                              className={cn(
                                'rounded-lg border px-2.5 py-1 text-xs transition-all duration-200',
                                isAssigned
                                  ? 'border-tertiary/40 bg-tertiary-container/25 text-tertiary font-medium'
                                  : assignedElsewhere
                                    ? 'border-outline-variant/10 text-on-surface-variant/30 line-through'
                                    : 'border-outline-variant/20 text-on-surface-variant hover:border-tertiary/30 hover:text-tertiary',
                              )}
                              aria-label={`${isAssigned ? 'Des-asignar' : 'Asignar'} ${topic.name} a ${parcial.name}`}
                            >
                              {topic.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addParcial}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant/30 py-3 text-sm text-on-surface-variant hover:border-tertiary hover:text-tertiary transition-colors"
                aria-label="Agregar parcial"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Agregar Parcial
              </button>

              {unassignedTopics.length > 0 && topics.length > 0 && parciales.length > 0 && (
                <p className="text-xs text-on-surface-variant/60 text-center">
                  <span className="material-symbols-outlined text-[14px] align-text-bottom text-warning">
                    warning
                  </span>{' '}
                  {unassignedTopics.length} tema{unassignedTopics.length !== 1 ? 's' : ''} sin
                  asignar a un parcial
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-error text-center">
          <span className="material-symbols-outlined text-[16px] align-text-bottom">error</span>{' '}
          {error}
        </p>
      )}

      <div className="mt-8 flex justify-center gap-4">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Volver
          </Button>
        )}
        <Button onClick={handleFinish} size="lg">
          Siguiente
        </Button>
      </div>
    </div>
  );
}
