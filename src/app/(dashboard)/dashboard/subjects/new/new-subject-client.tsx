'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { completeSubjectWizard } from '@/lib/actions/onboarding-wizard';
import type { SubjectWizardInput } from '@/lib/actions/onboarding-wizard';
import { Wizard } from '@/components/shared/wizard';
import {
  CreateSubjectStep,
  FreeStudyStep,
  CursadaParcialesStep,
  PdfUploadStep,
} from '@/components/shared/subject-wizard';
import type { WizardStep } from '@/components/shared/wizard';
import type { StudyPath, SubjectWizardData, TopicInput, ClassBlock } from '@/components/shared/subject-wizard';

interface ParcialRawData {
  id: string;
  name: string;
  date: string;
  modality: string;
  assignedTopicIds: string[];
}

interface CursadaRawData {
  schedule: ClassBlock[];
  topics: TopicInput[];
  parciales: ParcialRawData[];
}

function buildWizardInput(data: Record<string, unknown>): SubjectWizardInput {
  const subject = data.subject as SubjectWizardData;

  const input: SubjectWizardInput = {
    subject: {
      name: subject.name,
      year: subject.year,
      semester: subject.semester,
      professors: subject.professors,
      description: subject.description,
      studyPath: subject.studyPath,
    },
  };

  if (subject.studyPath === 'LIBRE') {
    const fs = data.freeStudy as { examDate: string; topics: TopicInput[] } | undefined;
    if (fs) {
      input.freeStudy = {
        examDate: fs.examDate,
        topics: fs.topics.map(t => ({ name: t.name, difficulty: t.difficulty, hours: t.hours })),
      };
    }
  } else if (subject.studyPath === 'CURSANDO') {
    const c = data.cursada as CursadaRawData | undefined;
    if (c) {
      input.cursada = {
        schedule: c.schedule.map(s => ({ day: s.day, startTime: s.startTime, endTime: s.endTime })),
        topics: c.topics.map(t => ({ name: t.name, difficulty: t.difficulty, hours: t.hours })),
        parciales: c.parciales.map(p => ({
          name: p.name,
          date: p.date,
          category: 'PARCIAL' as const,
          modality: p.modality as 'THEORY' | 'PRACTICE' | 'THEORY_PRACTICE',
          topicIndices: p.assignedTopicIds
            .map(id => c.topics.findIndex(t => t.id === id))
            .filter(i => i !== -1),
        })),
      };
    }
  }

  const pdf = data.pdfExtraction as
    | {
        extractionId?: string;
        metadata?: {
          totalHours?: number;
          weeklyHours?: number;
          bibliography?: string[];
          evaluationCriteria?: string;
        };
      }
    | undefined;
  if (pdf?.extractionId || pdf?.metadata) {
    input.pdfMetadata = {
      extractionId: pdf.extractionId,
      totalHours: pdf.metadata?.totalHours,
      weeklyHours: pdf.metadata?.weeklyHours,
      bibliography: pdf.metadata?.bibliography,
      evaluationCriteria: pdf.metadata?.evaluationCriteria,
    };
  }

  return input;
}

export function NewSubjectClient() {
  const router = useRouter();
  const [studyPath, setStudyPath] = useState<StudyPath | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const steps = useMemo<WizardStep[]>(() => {
    const base: WizardStep[] = [
      { id: 'subject', title: 'Materia', component: CreateSubjectStep },
    ];

    // Mismo orden que onboarding: PDF opcional antes del plan (cursada / estudio libre)
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
      base.push({ id: 'cursada', title: 'Cursada', component: CursadaParcialesStep });
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
      const wizardInput = buildWizardInput(data);
      const result = await completeSubjectWizard(wizardInput);

      if (result.error) {
        throw new Error(result.error);
      }

      const { sessionsGenerated, subjectId } = result.data!;

      setSuccessMessage(
        `Plan de estudio creado. ${sessionsGenerated} sesiones programadas.`,
      );

      await new Promise(resolve => setTimeout(resolve, 2500));

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
