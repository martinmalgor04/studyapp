'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { PdfUpload } from '@/components/shared/pdf-upload/pdf-upload';
import { ExtractionReview } from './extraction-review';
import { uploadPDF } from '@/lib/actions/pdf';
import { processPDF } from '@/lib/actions/ai-extraction';
import type { StepProps } from '@/components/shared/wizard';
import type { TopicInput } from './subject-wizard-types';

type StepState = 'idle' | 'uploading' | 'processing' | 'reviewing' | 'error';

interface UploadResult {
  fileUrl: string;
  extractionId: string;
  fileName: string;
}

interface ProcessResult {
  metadata: {
    name?: string;
    year?: number;
    semester?: string;
    totalHours?: number;
    weeklyHours?: number;
    professors?: string[];
    bibliography?: string[];
    evaluationCriteria?: string;
  };
  groupedTopics: Array<{
    name: string;
    unitNumber: number;
    subtopics: string[];
    estimatedMinutes: number;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    order: number;
  }>;
  schedule?: Array<{
    date: string;
    topics: string[];
    type: 'CLASS' | 'EXAM' | 'RECOVERY' | 'HOLIDAY';
  }>;
  exams?: Array<{
    name: string;
    date?: string;
    type: 'PARCIAL' | 'RECUPERATORIO' | 'FINAL';
    unitsIncluded: number[];
  }>;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function PdfUploadStep({
  onNext,
  onBack,
  updateWizardData,
}: StepProps) {
  const [state, setState] = useState<StepState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleFileSelected = useCallback(async (file: File) => {
    setState('uploading');
    setErrorMessage(null);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    setUploadProgress(30);
    const result = await uploadPDF(formData);
    setUploadProgress(100);

    if (result.error || !result.data) {
      setState('error');
      setErrorMessage(result.error ?? 'Error al subir el archivo');
      return;
    }

    setUploadResult(result.data);
    setState('processing');

    const processResponse = await processPDF(result.data.extractionId);

    if (processResponse.error || !processResponse.data) {
      setState('error');
      setErrorMessage(processResponse.error ?? 'Error al procesar el PDF');
      return;
    }

    setProcessResult(processResponse.data);
    setState('reviewing');
  }, []);

  const handleFileRemoved = useCallback(() => {
    setState('idle');
    setErrorMessage(null);
    setUploadProgress(0);
    setProcessResult(null);
    setUploadResult(null);
  }, []);

  const handleConfirm = useCallback(
    (data: {
      topics: Array<{ id: string; name: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD'; hours: number }>;
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
    }) => {
      const topics: TopicInput[] = data.topics.map(t => ({
        id: t.id,
        name: t.name,
        difficulty: t.difficulty,
        hours: t.hours,
      }));

      updateWizardData('pdfExtraction', {
        topics,
        metadata: data.metadata,
        exams: data.exams,
        extractionId: uploadResult?.extractionId,
      });

      onNext();
    },
    [updateWizardData, onNext, uploadResult],
  );

  const handleSkip = useCallback(() => {
    onNext();
  }, [onNext]);

  const handleSwitchToManual = useCallback(() => {
    onNext();
  }, [onNext]);

  const handleRetry = useCallback(() => {
    setState('idle');
    setErrorMessage(null);
    setUploadProgress(0);
    setProcessResult(null);
    setUploadResult(null);
  }, []);

  if (state === 'reviewing' && processResult) {
    return (
      <div>
        <h2 className="font-headline text-xl text-on-surface mb-2 text-center">
          Revisá los datos extraídos
        </h2>
        <p className="text-sm text-on-surface-variant mb-6 text-center">
          Editá lo que necesites antes de confirmar
        </p>

        <ExtractionReview
          metadata={processResult.metadata}
          groupedTopics={processResult.groupedTopics}
          schedule={processResult.schedule}
          exams={processResult.exams}
          confidence={processResult.confidence}
          onConfirm={handleConfirm}
          onSwitchToManual={handleSwitchToManual}
        />
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-headline text-xl text-on-surface mb-2 text-center">
        Programa de la materia
      </h2>
      <p className="text-sm text-on-surface-variant mb-8 text-center">
        Subí el programa o planificación en PDF y extraemos los temas automáticamente
      </p>

      <div className="mx-auto max-w-lg space-y-6">
        {state === 'processing' ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-tertiary/30 bg-tertiary/5 px-6 py-12">
            <div className="relative mb-4">
              <span
                className={cn(
                  'material-symbols-outlined text-[40px] text-tertiary',
                  'animate-pulse',
                )}
              >
                neurology
              </span>
            </div>
            <p className="text-sm font-medium text-on-surface mb-1">
              Procesando tu programa...
            </p>
            <p className="text-xs text-on-surface-variant/60">
              Esto puede tardar unos segundos
            </p>
          </div>
        ) : (
          <PdfUpload
            onFileSelected={handleFileSelected}
            onFileRemoved={handleFileRemoved}
            isUploading={state === 'uploading'}
            uploadProgress={uploadProgress}
            error={state === 'error' ? errorMessage : null}
            disabled={state === 'uploading'}
          />
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-error text-center">
              <span className="material-symbols-outlined text-[16px] align-text-bottom">error</span>{' '}
              {errorMessage}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Reintentar
              </Button>
              <Button variant="outline" size="sm" onClick={handleSwitchToManual}>
                Ingresar manualmente
              </Button>
            </div>
          </div>
        )}

        {state !== 'error' && (
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-outline-variant/20" />
            <span className="text-xs text-on-surface-variant/50">o</span>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>
        )}

        {state !== 'error' && (
          <button
            type="button"
            onClick={handleSkip}
            disabled={state === 'uploading' || state === 'processing'}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant/30 py-4',
              'text-sm text-on-surface-variant transition-all duration-200',
              'hover:border-tertiary/40 hover:text-tertiary',
              'disabled:opacity-40 disabled:pointer-events-none',
            )}
          >
            <span className="material-symbols-outlined text-[20px]">edit_note</span>
            Omitir — Ingresar datos manualmente
          </button>
        )}
      </div>

      <div className="mt-8 flex justify-center gap-4">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Volver
          </Button>
        )}
      </div>
    </div>
  );
}
