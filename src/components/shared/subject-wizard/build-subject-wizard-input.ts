/**
 * Paridad [7i]: mismo mapeo `Record<string, unknown>` → `SubjectWizardInput` para onboarding y
 * dashboard «Nueva materia». PDF opcional (`pdfExtraction`) alimenta `pdfMetadata` antes del plan manual.
 */
import type { SubjectWizardInput } from '@/lib/actions/onboarding-wizard';
import type {
  CursadaDistributionRawData,
  CursadaRawData,
  SubjectWizardData,
  TopicInput,
} from './subject-wizard-types';

function toWizardModality(m: string): 'THEORY' | 'PRACTICE' | 'THEORY_PRACTICE' {
  if (m === 'THEORY' || m === 'PRACTICE' || m === 'THEORY_PRACTICE') {
    return m;
  }
  return 'THEORY_PRACTICE';
}

interface PdfExtractionWizardSlice {
  extractionId?: string;
  metadata?: {
    totalHours?: number;
    weeklyHours?: number;
    bibliography?: string[];
    evaluationCriteria?: string;
  };
}

export function buildSubjectWizardInput(data: Record<string, unknown>): SubjectWizardInput {
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
      const dist = data.cursadaDistribution as CursadaDistributionRawData | undefined;
      const topicClassDates =
        dist?.topicClassDates &&
        dist.topicClassDates.length === c.topics.length
          ? dist.topicClassDates
          : undefined;

      input.cursada = {
        schedule: c.schedule.map(s => ({ day: s.day, startTime: s.startTime, endTime: s.endTime })),
        topics: c.topics.map(t => ({ name: t.name, difficulty: t.difficulty, hours: t.hours })),
        parciales: c.parciales.map(p => ({
          name: p.name,
          date: p.date,
          category: 'PARCIAL' as const,
          modality: toWizardModality(p.modality),
          topicIndices: p.assignedTopicIds
            .map(id => c.topics.findIndex(t => t.id === id))
            .filter(i => i !== -1),
        })),
        ...(topicClassDates ? { topicClassDates } : {}),
      };
    }
  }

  const pdf = data.pdfExtraction as PdfExtractionWizardSlice | undefined;
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
