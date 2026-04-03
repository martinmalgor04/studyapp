'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { StepProps } from '@/components/shared/wizard';
import type { ClassBlock, ClassScheduleData } from './subject-wizard-types';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
type Day = (typeof DAYS)[number];

const DEFAULT_START = '18:00';
const DEFAULT_END = '22:00';

interface AddingState {
  day: Day;
  startTime: string;
  endTime: string;
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function validateTimeRange(start: string, end: string): boolean {
  return start < end;
}

function DayColumn({
  day,
  blocks,
  adding,
  onStartAdding,
  onCancelAdding,
  onConfirmAdding,
  onUpdateAdding,
  onRemoveBlock,
  isCollapsed,
  onToggleCollapse,
}: {
  day: Day;
  blocks: ClassBlock[];
  adding: AddingState | null;
  onStartAdding: () => void;
  onCancelAdding: () => void;
  onConfirmAdding: () => void;
  onUpdateAdding: (field: 'startTime' | 'endTime', value: string) => void;
  onRemoveBlock: (index: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const isAdding = adding?.day === day;
  const timeError = isAdding && !validateTimeRange(adding.startTime, adding.endTime);

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden">
      <button
        type="button"
        onClick={onToggleCollapse}
        className="flex w-full items-center justify-between px-4 py-3 md:cursor-default"
        aria-expanded={!isCollapsed}
        aria-label={`${day} - ${blocks.length} bloque${blocks.length !== 1 ? 's' : ''}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-on-surface uppercase tracking-wide">
            {day}
          </span>
          {blocks.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-tertiary-container/40 text-xs font-medium text-on-tertiary-container">
              {blocks.length}
            </span>
          )}
        </div>
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant transition-transform duration-200 md:hidden"
          style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}
        >
          expand_more
        </span>
      </button>

      <div
        className={cn(
          'px-4 pb-4 space-y-2 transition-all duration-200',
          isCollapsed && 'hidden md:block',
        )}
      >
        {blocks.map((block, idx) => (
          <div
            key={`${block.startTime}-${block.endTime}-${idx}`}
            className="flex items-center justify-between rounded-lg bg-tertiary-container/20 px-3 py-2 group"
          >
            <div className="flex items-center gap-2 text-sm text-on-surface">
              <span className="material-symbols-outlined text-[16px] text-tertiary">
                schedule
              </span>
              {formatTime(block.startTime)} – {formatTime(block.endTime)}
            </div>
            <button
              type="button"
              onClick={() => onRemoveBlock(idx)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant opacity-0 group-hover:opacity-100 hover:bg-error-container/30 hover:text-error transition-all duration-200 focus:opacity-100"
              aria-label={`Eliminar bloque ${formatTime(block.startTime)} – ${formatTime(block.endTime)} de ${day}`}
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ))}

        {isAdding ? (
          <div className="space-y-2 rounded-lg border border-tertiary/30 bg-tertiary-container/10 p-3">
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={adding.startTime}
                onChange={(e) => onUpdateAdding('startTime', e.target.value)}
                className="h-8 rounded-md border border-outline-variant/40 bg-surface-container-lowest px-2 text-sm text-on-surface focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary/30"
                aria-label={`Hora inicio para ${day}`}
              />
              <span className="text-xs text-on-surface-variant">a</span>
              <input
                type="time"
                value={adding.endTime}
                onChange={(e) => onUpdateAdding('endTime', e.target.value)}
                className="h-8 rounded-md border border-outline-variant/40 bg-surface-container-lowest px-2 text-sm text-on-surface focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary/30"
                aria-label={`Hora fin para ${day}`}
              />
            </div>
            {timeError && (
              <p className="text-xs text-error">La hora de fin debe ser posterior a la de inicio</p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onConfirmAdding}
                disabled={timeError}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-tertiary text-on-tertiary hover:bg-tertiary-dim disabled:opacity-50 transition-colors duration-200"
                aria-label="Confirmar bloque"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
              </button>
              <button
                type="button"
                onClick={onCancelAdding}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low transition-colors duration-200"
                aria-label="Cancelar"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartAdding}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-outline-variant/40 py-2 text-sm text-on-surface-variant hover:border-tertiary hover:text-tertiary transition-all duration-200"
            aria-label={`Agregar bloque de clase a ${day}`}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Agregar
          </button>
        )}
      </div>
    </div>
  );
}

export function ClassScheduleStep({
  onNext,
  onBack,
  wizardData,
  updateWizardData,
}: StepProps) {
  const saved = wizardData.schedule as ClassScheduleData | undefined;
  const [classBlocks, setClassBlocks] = useState<ClassBlock[]>(saved ?? []);
  const [adding, setAdding] = useState<AddingState | null>(null);
  const [collapsedDays, setCollapsedDays] = useState<Set<Day>>(() => new Set(DAYS));
  const [error, setError] = useState<string | null>(null);

  const syncWizardData = useCallback(
    (blocks: ClassBlock[]) => {
      updateWizardData('schedule', blocks);
    },
    [updateWizardData],
  );

  const handleStartAdding = (day: Day) => {
    setAdding({ day, startTime: DEFAULT_START, endTime: DEFAULT_END });
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      next.delete(day);
      return next;
    });
  };

  const handleCancelAdding = () => {
    setAdding(null);
  };

  const handleConfirmAdding = () => {
    if (!adding) return;
    if (!validateTimeRange(adding.startTime, adding.endTime)) return;

    const newBlock: ClassBlock = {
      day: adding.day,
      startTime: adding.startTime,
      endTime: adding.endTime,
    };

    const updated = [...classBlocks, newBlock].sort((a, b) => {
      const dayDiff = DAYS.indexOf(a.day as Day) - DAYS.indexOf(b.day as Day);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    setClassBlocks(updated);
    syncWizardData(updated);
    setAdding(null);
    setError(null);
  };

  const handleUpdateAdding = (field: 'startTime' | 'endTime', value: string) => {
    if (!adding) return;
    setAdding((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleRemoveBlock = (day: Day, blockIndex: number) => {
    const dayBlocks = classBlocks.filter((b) => b.day === day);
    const blockToRemove = dayBlocks[blockIndex];
    if (!blockToRemove) return;

    const globalIndex = classBlocks.findIndex(
      (b) => b.day === blockToRemove.day && b.startTime === blockToRemove.startTime && b.endTime === blockToRemove.endTime,
    );
    if (globalIndex === -1) return;

    const updated = classBlocks.filter((_, i) => i !== globalIndex);
    setClassBlocks(updated);
    syncWizardData(updated);
  };

  const handleToggleCollapse = (day: Day) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const handleNext = () => {
    if (classBlocks.length === 0) {
      setError('Agregá al menos un horario de clase');
      return;
    }
    setError(null);
    onNext();
  };

  const blocksForDay = (day: Day) => classBlocks.filter((b) => b.day === day);

  const totalBlocks = classBlocks.length;
  const daysWithClasses = new Set(classBlocks.map((b) => b.day)).size;

  return (
    <div>
      <h2 className="font-headline text-xl text-on-surface mb-2 text-center">
        Horario de clases
      </h2>
      <p className="text-sm text-on-surface-variant mb-2 text-center">
        Ingresá los días y horarios en los que cursás
      </p>

      {totalBlocks > 0 && (
        <p className="text-xs text-on-surface-variant/70 mb-6 text-center">
          <span className="material-symbols-outlined text-[14px] align-text-bottom text-tertiary">
            event_available
          </span>{' '}
          {totalBlocks} bloque{totalBlocks !== 1 ? 's' : ''} en {daysWithClasses} día{daysWithClasses !== 1 ? 's' : ''}
        </p>
      )}

      {!totalBlocks && <div className="mb-6" />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {DAYS.map((day) => (
          <DayColumn
            key={day}
            day={day}
            blocks={blocksForDay(day)}
            adding={adding?.day === day ? adding : null}
            onStartAdding={() => handleStartAdding(day)}
            onCancelAdding={handleCancelAdding}
            onConfirmAdding={handleConfirmAdding}
            onUpdateAdding={handleUpdateAdding}
            onRemoveBlock={(idx) => handleRemoveBlock(day, idx)}
            isCollapsed={collapsedDays.has(day)}
            onToggleCollapse={() => handleToggleCollapse(day)}
          />
        ))}
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
        <Button onClick={handleNext} size="lg">
          Siguiente
        </Button>
      </div>
    </div>
  );
}
