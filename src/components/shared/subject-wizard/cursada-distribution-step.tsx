'use client';

import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { StepProps } from '@/components/shared/wizard';
import type { ClassBlock, CursadaDistributionData, TopicInput } from './subject-wizard-types';
import type { ExamModality } from '@/lib/validations/exams';
import {
  buildTopicDistributorInputFromWizard,
  distributeTopics,
  earliestClassDateKeysForTopics,
  toDateKey,
  type TentativeScheduleItem,
} from '@/lib/services/topic-distributor';

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

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Warnings de topic-distributor que indican que el plan no cabe en el calendario tentativo. */
function isBlockingDistributionWarning(w: string): boolean {
  if (w.includes('No hay suficientes clases')) return true;
  if (w.includes('requieren') && w.includes('pero solo hay')) return true;
  if (w.includes('No hay clases disponibles para distribuir')) return true;
  if (w.includes('No se encontraron clases disponibles')) return true;
  if (w.includes('No hay tiempo suficiente para distribuir')) return true;
  return false;
}

const DAY_SHORT: Record<string, string> = {
  Domingo: 'Dom',
  Lunes: 'Lun',
  Martes: 'Mar',
  Miércoles: 'Mié',
  Jueves: 'Jue',
  Viernes: 'Vie',
  Sábado: 'Sáb',
};

function formatItemLabel(item: TentativeScheduleItem): string {
  const d = item.date.getUTCDate();
  const m = item.date.getUTCMonth() + 1;
  const short = DAY_SHORT[item.dayOfWeek] ?? item.dayOfWeek.slice(0, 3);
  return `${short} ${d}/${m}`;
}

function labelForDateKey(key: string, schedule: TentativeScheduleItem[]): string {
  const match = schedule.find((i) => toDateKey(i.date) === key);
  if (match) return formatItemLabel(match);
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!parts) return key;
  const y = Number(parts[1]);
  const mo = Number(parts[2]);
  const da = Number(parts[3]);
  const date = new Date(Date.UTC(y, mo - 1, da));
  const w = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getUTCDay()] ?? '';
  return `${w} ${da}/${mo}`;
}

function collectDateOptionKeys(
  schedule: TentativeScheduleItem[],
  selections: string[],
): string[] {
  const set = new Set<string>();
  for (const item of schedule) {
    set.add(toDateKey(item.date));
  }
  for (const sel of selections) {
    if (sel && YMD_RE.test(sel)) set.add(sel);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function distributionResetKey(cursada: CursadaSavedData | undefined): string {
  if (!cursada) return 'empty';
  const sched = cursada.schedule.map((b) => `${b.day}-${b.startTime}-${b.endTime}`).join(';');
  const tops = cursada.topics.map((t) => `${t.id}:${t.hours}`).join('|');
  const pars = cursada.parciales.map((p) => `${p.id}-${p.date}-${p.assignedTopicIds.join(',')}`).join(';');
  return `${sched}||${tops}||${pars}`;
}

/**
 * Debe montarse con `key` estable por datos de cursada (ver export envoltorio).
 */
function CursadaDistributionStepInner({
  onNext,
  onBack,
  isCompleting,
  wizardData,
  updateWizardData,
}: StepProps) {
  const cursada = wizardData.cursada as CursadaSavedData | undefined;

  const validationError = useMemo(() => {
    if (!cursada) return 'Faltan datos de cursada. Volvé al paso anterior.';
    if (cursada.schedule.length === 0) return 'Agregá al menos un horario de clase.';
    if (cursada.topics.length === 0) return 'Agregá al menos un tema de estudio.';
    const withDate = cursada.parciales.filter((p) => p.date.trim() !== '');
    if (withDate.length === 0) return 'Agregá al menos un parcial con fecha.';
    return null;
  }, [cursada]);

  const distributorInput = useMemo(() => {
    if (!cursada || validationError) return null;
    const parcialesForDist = cursada.parciales
      .filter((p) => p.date.trim() !== '')
      .map((p, idx) => ({
        index: idx,
        name: p.name,
        date: p.date,
        assignedTopicIds: p.assignedTopicIds,
      }));

    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);

    return buildTopicDistributorInputFromWizard({
      schedule: cursada.schedule.map((b) => ({
        day: b.day,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
      topics: cursada.topics.map((t) => ({
        id: t.id,
        name: t.name,
        hours: t.hours,
      })),
      parciales: parcialesForDist,
      startDate,
    });
  }, [cursada, validationError]);

  const distResult = useMemo(() => {
    if (!distributorInput) return null;
    return distributeTopics(distributorInput);
  }, [distributorInput]);

  const topics = cursada?.topics ?? [];

  const defaultTopicClassDates = useMemo(() => {
    if (!cursada || !distResult || distResult.schedule.length === 0) {
      return [] as string[];
    }
    const saved = wizardData.cursadaDistribution as CursadaDistributionData | undefined;
    if (saved?.topicClassDates && saved.topicClassDates.length === cursada.topics.length) {
      return [...saved.topicClassDates];
    }
    const earliest = earliestClassDateKeysForTopics(distResult.schedule, cursada.topics);
    return earliest.map((k) => k ?? '');
  }, [cursada, distResult, wizardData.cursadaDistribution]);

  const [overrides, setOverrides] = useState<Record<number, string>>({});

  const topicClassDates = useMemo(() => {
    if (!cursada) return [];
    return cursada.topics.map((_, i) =>
      Object.prototype.hasOwnProperty.call(overrides, i)
        ? overrides[i]
        : (defaultTopicClassDates[i] ?? ''),
    );
  }, [cursada, defaultTopicClassDates, overrides]);

  const dateOptionKeys = useMemo(
    () => collectDateOptionKeys(distResult?.schedule ?? [], topicClassDates),
    [distResult?.schedule, topicClassDates],
  );

  const [stepError, setStepError] = useState<string | null>(null);

  const handleSelectChange = useCallback((topicIndex: number, value: string) => {
    setOverrides((prev) => ({ ...prev, [topicIndex]: value }));
  }, []);

  const handleFinish = () => {
    if (validationError) {
      setStepError(validationError);
      return;
    }
    if (!distResult || distResult.schedule.length === 0) {
      setStepError(
        'No hay fechas de clase disponibles en la distribución. Volvé atrás y revisá horarios o parciales.',
      );
      return;
    }
    if (distResult.warnings.some(isBlockingDistributionWarning)) {
      setStepError(
        'Hay más minutos de temas que horas de clase hasta el parcial (o no entran en las fechas disponibles). Volvé al paso anterior para reducir temas, unir ítems del programa o ajustar fechas de parciales y horarios.',
      );
      return;
    }
    if (topicClassDates.length !== topics.length) {
      setStepError('Las fechas por tema no están alineadas. Recargá el paso o volvé atrás.');
      return;
    }
    setStepError(null);
    updateWizardData('cursadaDistribution', { topicClassDates: [...topicClassDates] });
    onNext();
  };

  if (!cursada) {
    return (
      <div className="text-center">
        <p className="text-sm text-on-surface-variant">No hay datos de cursada.</p>
        {onBack && (
          <Button variant="outline" className="mt-4" onClick={onBack}>
            Volver
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-headline mb-2 text-center text-xl text-on-surface">
        Revisar distribución en clases
      </h2>
      <p className="mb-6 text-center text-sm text-on-surface-variant">
        Confirmá o ajustá la primera clase asociada a cada tema según el calendario tentativo.
      </p>

      {validationError && (
        <p className="mb-4 text-center text-sm text-error" role="alert">
          {validationError}
        </p>
      )}

      {distResult && distResult.warnings.length > 0 && (
        <ul className="mb-4 space-y-1 rounded-xl border border-outline-variant/15 bg-surface-container-low/30 px-4 py-3 text-xs text-on-surface-variant">
          {distResult.warnings.map((w, i) => (
            <li key={`${i}-${w.slice(0, 40)}`} className="flex gap-2">
              <span className="material-symbols-outlined shrink-0 text-[14px] text-warning">
                warning
              </span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}

      {!validationError && distResult && distResult.schedule.length === 0 && (
        <p className="mb-4 text-center text-sm text-on-surface-variant" role="status">
          No se generaron fechas en el calendario tentativo. Revisá horarios y fechas de parciales
          en el paso anterior.
        </p>
      )}

      {!validationError && distResult && distResult.schedule.length > 0 && (
        <div className="space-y-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          {topics.map((topic, idx) => {
            const value = topicClassDates[idx] ?? '';
            const missingSuggested = value === '' || !YMD_RE.test(value);
            return (
              <div
                key={topic.id}
                className="flex flex-col gap-2 border-b border-outline-variant/10 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-on-surface">{topic.name}</p>
                  <p className="text-xs text-on-surface-variant">{topic.hours} min de estudio</p>
                  {missingSuggested && (
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Sin fecha en el calendario tentativo: podés elegir una clase o dejar automático.
                    </p>
                  )}
                </div>
                <div className="w-full sm:w-56">
                  <label htmlFor={`topic-class-date-${topic.id}`} className="sr-only">
                    Fecha de clase para {topic.name}
                  </label>
                  <select
                    id={`topic-class-date-${topic.id}`}
                    value={
                      value === ''
                        ? ''
                        : dateOptionKeys.includes(value) || YMD_RE.test(value)
                          ? value
                          : ''
                    }
                    onChange={(e) => handleSelectChange(idx, e.target.value)}
                    className={cn(
                      'block w-full rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface',
                      'focus:border-tertiary focus:outline-none focus:ring-2 focus:ring-tertiary/30',
                    )}
                  >
                    <option value="">Automático (sugerencia del sistema)</option>
                    {dateOptionKeys.map((key) => (
                      <option key={key} value={key}>
                        {labelForDateKey(key, distResult.schedule)}
                      </option>
                    ))}
                    {value && YMD_RE.test(value) && !dateOptionKeys.includes(value) ? (
                      <option value={value}>{labelForDateKey(value, distResult.schedule)}</option>
                    ) : null}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {stepError && (
        <p className="mt-4 text-center text-sm text-error" role="alert">
          {stepError}
        </p>
      )}

      <div className="mt-8 flex justify-center gap-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={isCompleting}>
            Volver
          </Button>
        )}
        <Button
          onClick={handleFinish}
          size="lg"
          disabled={
            !!validationError ||
            !distResult ||
            distResult.schedule.length === 0 ||
            isCompleting
          }
        >
          {isCompleting ? 'Creando materia…' : 'Siguiente'}
        </Button>
      </div>
    </div>
  );
}

/** Remonta el paso interno cuando cambian horario/temas/parciales (evita estado obsoleto). */
export function CursadaDistributionStep(props: StepProps) {
  const cursada = props.wizardData.cursada as CursadaSavedData | undefined;
  const k = distributionResetKey(cursada);
  return <CursadaDistributionStepInner key={k} {...props} />;
}
