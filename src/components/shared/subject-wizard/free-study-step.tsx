'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { StepProps } from '@/components/shared/wizard';
import type { TopicInput } from './subject-wizard-types';
import { TopicEntryPanel } from './topic-entry-panel';

interface FreeStudySavedData {
  examDate: string;
  topics: TopicInput[];
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

function getInitialTopics(saved?: FreeStudySavedData, pdfExtraction?: PdfExtractionData): TopicInput[] {
  if (saved?.topics?.length) return saved.topics;
  if (pdfExtraction?.topics?.length) return pdfExtraction.topics;
  return [];
}

function getInitialExamDate(saved?: FreeStudySavedData, pdfExtraction?: PdfExtractionData): string {
  if (saved?.examDate) return saved.examDate;
  const finalExam = pdfExtraction?.exams?.find(e => e.type === 'FINAL');
  if (finalExam?.date) return finalExam.date;
  return '';
}

export function FreeStudyStep({
  onNext,
  onBack,
  wizardData,
  updateWizardData,
}: StepProps) {
  const saved = wizardData.freeStudy as FreeStudySavedData | undefined;
  const pdfExtraction = wizardData.pdfExtraction as PdfExtractionData | undefined;
  const [examDate, setExamDate] = useState(() => getInitialExamDate(saved, pdfExtraction));
  const [topics, setTopics] = useState<TopicInput[]>(() => getInitialTopics(saved, pdfExtraction));
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const handleFinish = () => {
    if (!examDate) {
      setError('Seleccioná la fecha del examen');
      return;
    }
    if (topics.length === 0) {
      setError('Agregá al menos un tema de estudio');
      return;
    }
    setError(null);
    updateWizardData('freeStudy', { examDate, topics });
    onNext();
  };

  return (
    <div>
      <h2 className="font-headline text-xl text-on-surface mb-2 text-center">
        Preparación para el final
      </h2>
      <p className="text-sm text-on-surface-variant mb-8 text-center">
        Configurá la fecha y los temas para tu examen
      </p>

      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <label
            htmlFor="exam-date"
            className="block text-sm font-medium text-on-surface-variant mb-1.5"
          >
            Fecha del examen final <span className="text-error">*</span>
          </label>
          <input
            id="exam-date"
            type="date"
            min={today}
            value={examDate}
            onChange={e => {
              setExamDate(e.target.value);
              if (error) setError(null);
            }}
            className="block w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-3 py-2.5 text-on-surface focus:border-tertiary focus:outline-none focus:ring-2 focus:ring-tertiary/30 sm:text-sm"
          />
        </div>

        {pdfExtraction?.topics?.length ? (
          <div className="flex items-center gap-2 rounded-xl bg-secondary-container/15 px-4 py-3">
            <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
            <p className="text-xs text-on-secondary-container">
              Datos pre-cargados desde el PDF. Podés editarlos abajo.
            </p>
          </div>
        ) : null}

        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-3">
            Temas a estudiar <span className="text-error">*</span>
          </label>
          <TopicEntryPanel topics={topics} onChange={setTopics} />
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
          Finalizar
        </Button>
      </div>
    </div>
  );
}
