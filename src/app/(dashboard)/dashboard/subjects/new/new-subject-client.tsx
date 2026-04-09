'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { completeSubjectWizard } from '@/lib/actions/onboarding-wizard';
import { Wizard } from '@/components/shared/wizard';
import {
  CreateSubjectStep,
  FreeStudyStep,
  CursadaBasicsStep,
  CursadaParcialesStep,
  CursadaDistributionStep,
  PdfUploadStep,
  buildSubjectWizardInput,
  type StudyPath,
  type SubjectWizardData,
} from '@/components/shared/subject-wizard';
import type { WizardStep } from '@/components/shared/wizard';

export function NewSubjectClient() {
  const router = useRouter();
  const [studyPath, setStudyPath] = useState<StudyPath | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const steps = useMemo<WizardStep[]>(() => {
    const base: WizardStep[] = [
      { id: 'subject', title: 'Materia', component: CreateSubjectStep },
    ];

    if (studyPath === 'CURSANDO') {
      base.push({ id: 'cursadaBasics', title: 'Cursada', component: CursadaBasicsStep });
    }

    if (studyPath === 'LIBRE' || studyPath === 'CURSANDO') {
      base.push({
        id: 'pdfUpload',
        title: 'Programa (PDF)',
        component: PdfUploadStep,
        optional: true,
      });
    }

    if (studyPath === 'LIBRE') {
      base.push({ id: 'freeStudy', title: 'Plan de Estudio', component: FreeStudyStep });
    } else if (studyPath === 'CURSANDO') {
      base.push({ id: 'cursada', title: 'Temas y parciales', component: CursadaParcialesStep });
      base.push({
        id: 'cursadaDistribution',
        title: 'Distribución',
        component: CursadaDistributionStep,
      });
    }

    return base;
  }, [studyPath]);

  const handleDataChange = useCallback(
    (data: Record<string, unknown>) => {
      const subject = data.subject as SubjectWizardData | undefined;
      if (subject?.studyPath && subject.studyPath !== studyPath) {
        setStudyPath(subject.studyPath);
      }
    },
    [studyPath],
  );

  const handleComplete = useCallback(
    async (data: Record<string, unknown>) => {
      const wizardInput = buildSubjectWizardInput(data);
      const result = await completeSubjectWizard(wizardInput);

      if (result.error) {
        throw new Error(result.error);
      }

      const { sessionsGenerated, subjectId } = result.data!;

      setSuccessMessage(
        `Plan de estudio listo. Se programaron ${sessionsGenerated} sesiones.`,
      );

      router.push(`/dashboard/subjects/${subjectId}`);
      router.refresh();
    },
    [router],
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high"
          aria-label="Volver atrás"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="font-headline text-3xl text-on-surface">Nueva Materia</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Configurá tu plan de estudio paso a paso
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 rounded-xl border border-secondary/30 bg-secondary-container/20 p-4 text-center animate-slide-in-right">
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-on-secondary-container">
            <span className="material-symbols-outlined text-[20px] text-secondary">check_circle</span>
            {successMessage}
          </p>
          <p className="mt-2 text-xs text-on-secondary-container/90">
            Revisá la agenda en{' '}
            <Link
              href="/dashboard/sessions"
              className="font-semibold text-secondary underline underline-offset-2 hover:text-secondary-dim"
            >
              Sesiones
            </Link>
            .
          </p>
        </div>
      )}

      <Wizard
        steps={steps}
        onComplete={handleComplete}
        onDataChange={handleDataChange}
      />
    </div>
  );
}
