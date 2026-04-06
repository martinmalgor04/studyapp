'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveOnboardingAvailability } from '@/lib/actions/onboarding';
import { completeSubjectWizard } from '@/lib/actions/onboarding-wizard';
import type { SubjectWizardInput } from '@/lib/actions/onboarding-wizard';
import { connectGoogleCalendar } from '@/lib/actions/google-calendar';
import { Button } from '@/components/ui/button';
import { Wizard } from '@/components/shared/wizard';
import {
  CreateSubjectStep,
  FreeStudyStep,
  CursadaParcialesStep,
  CursadaDistributionStep,
  PdfUploadStep,
} from '@/components/shared/subject-wizard';
import type { StepProps, WizardStep } from '@/components/shared/wizard';
import type { StudyPath, SubjectWizardData, TopicInput, ClassBlock } from '@/components/shared/subject-wizard';

type Shift = 'MORNING' | 'AFTERNOON' | 'NIGHT';
type OnboardingMode = 'selection' | 'manual';

interface AvailabilityData {
  shifts: Shift[];
  includeWeekends: boolean;
  studyStartHour: string;
  studyEndHour: string;
}

function AvailabilityStep({ onNext, updateWizardData, wizardData }: StepProps) {
  const saved = wizardData.availability as AvailabilityData | undefined;

  const [mode, setMode] = useState<OnboardingMode>('selection');
  const [selectedShifts, setSelectedShifts] = useState<Shift[]>(saved?.shifts ?? []);
  const [includeWeekends, setIncludeWeekends] = useState(saved?.includeWeekends ?? false);
  const [studyStartHour, setStudyStartHour] = useState(saved?.studyStartHour ?? '08:00');
  const [studyEndHour, setStudyEndHour] = useState(saved?.studyEndHour ?? '23:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleShift = (shift: Shift) => {
    setSelectedShifts(prev =>
      prev.includes(shift) ? prev.filter(s => s !== shift) : [...prev, shift],
    );
  };

  const handleImportFromGoogle = async () => {
    setSaving(true);
    setError(null);
    try {
      await connectGoogleCalendar('onboarding');
    } catch {
      setError('Error al conectar con Google Calendar');
      setSaving(false);
    }
  };

  const handleFinish = () => {
    if (selectedShifts.length === 0) {
      setError('Seleccioná al menos un turno');
      return;
    }
    setError(null);

    const data: AvailabilityData = {
      shifts: selectedShifts,
      includeWeekends,
      studyStartHour,
      studyEndHour,
    };
    updateWizardData('availability', data);
    onNext();
  };

  if (mode === 'selection') {
    return (
      <div className="grid gap-6 sm:grid-cols-2">
        <button
          onClick={() => setMode('manual')}
          className="rounded-xl border-2 border-outline-variant/20 bg-surface-container-lowest p-8 transition-all hover:border-tertiary hover:shadow-lg text-left"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-tertiary-container/30 mb-4">
            <span className="material-symbols-outlined text-[32px] text-tertiary">calendar_month</span>
          </div>
          <h3 className="text-xl font-semibold text-on-surface mb-2">Configurar Manualmente</h3>
          <p className="text-sm text-on-surface-variant">
            Elegí turnos predefinidos (Mañana, Tarde, Noche)
          </p>
          <p className="text-xs text-on-surface-variant/60 mt-3">
            <span className="material-symbols-outlined text-[14px] align-text-bottom">timer</span> Toma 1 minuto
          </p>
        </button>

        <button
          onClick={handleImportFromGoogle}
          disabled={saving}
          className="rounded-xl border-2 border-tertiary bg-gradient-to-br from-tertiary-container/10 to-surface-container-lowest p-8 transition-all hover:border-tertiary-dim hover:shadow-xl text-left disabled:opacity-50 relative"
        >
          <div className="absolute -top-3 -right-3 bg-tertiary text-on-tertiary text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            Recomendado
          </div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-tertiary-container/30 mb-4">
            <svg className="h-8 w-8 text-tertiary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-on-surface mb-2">Conectar Google Calendar</h3>
          <p className="text-sm text-on-surface-variant mb-2">Sincronización automática y continua</p>
          <ul className="text-xs text-on-surface-variant/60 space-y-1">
            <li>✓ Detecta tus horarios libres automáticamente</li>
            <li>✓ Evita conflictos con tus eventos</li>
            <li>✓ Se actualiza cuando cambia tu agenda</li>
          </ul>
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setMode('selection')}
        className="mb-6 flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Volver atrás
      </button>

      <div className="mb-12">
        <h2 className="font-headline text-xl text-on-surface mb-6 text-center">
          ¿Cuándo preferís estudiar?
        </h2>
        <p className="text-sm text-on-surface-variant mb-6 text-center">
          Seleccioná todos los momentos que quieras (podés elegir más de uno)
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          {([
            { shift: 'MORNING' as const, label: 'Mañana', time: '08:00 - 12:00 hs', icon: 'light_mode', iconColor: 'text-warning', activeBg: 'bg-warning-container/30' },
            { shift: 'AFTERNOON' as const, label: 'Tarde', time: '13:00 - 17:00 hs', icon: 'partly_cloudy_day', iconColor: 'text-warning', activeBg: 'bg-warning-container/30' },
            { shift: 'NIGHT' as const, label: 'Noche', time: '18:00 - 22:00 hs', icon: 'dark_mode', iconColor: 'text-primary', activeBg: 'bg-primary-container/30' },
          ]).map(({ shift, label, time, icon, iconColor, activeBg }) => {
            const isSelected = selectedShifts.includes(shift);
            return (
              <button
                key={shift}
                onClick={() => toggleShift(shift)}
                className={`rounded-xl border-2 p-8 transition-all hover:shadow-lg ${
                  isSelected
                    ? 'border-tertiary bg-tertiary-container/10 shadow-md'
                    : 'border-outline-variant/20 bg-surface-container-lowest hover:border-tertiary/50'
                }`}
              >
                <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                  isSelected ? activeBg : 'bg-surface-container-low'
                }`}>
                  <span className={`material-symbols-outlined text-[40px] ${iconColor}`}>{icon}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-on-surface">{label}</h3>
                <p className="mt-2 text-sm text-on-surface-variant">{time}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-12">
        <div className="rounded-xl border-2 border-outline-variant/20 bg-surface-container-lowest p-6 text-center">
          <h2 className="font-headline text-lg text-on-surface mb-4">
            ¿Estudiás los fines de semana?
          </h2>
          <label className="inline-flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeWeekends}
              onChange={(e) => setIncludeWeekends((e.target as HTMLInputElement).checked)}
              className="h-6 w-6 rounded border-outline-variant/30 text-secondary accent-secondary focus:ring-2 focus:ring-secondary/30"
            />
            <span className="text-base text-on-surface-variant">
              Sí, incluir sábados y domingos con los turnos seleccionados
            </span>
          </label>
        </div>
      </div>

      <div className="mb-12">
        <div className="rounded-xl border-2 border-outline-variant/20 bg-surface-container-lowest p-6">
          <h2 className="font-headline text-lg text-on-surface mb-2 text-center">
            Horario de estudio
          </h2>
          <p className="text-sm text-on-surface-variant mb-4 text-center">
            Las sesiones se programarán dentro de este rango horario
          </p>
          <div className="flex items-center justify-center gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Desde</label>
              <input
                type="time"
                value={studyStartHour}
                onChange={(e) => setStudyStartHour(e.target.value)}
                className="block w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-on-surface focus:border-tertiary focus:outline-none focus:ring-2 focus:ring-tertiary/30 sm:text-sm"
              />
            </div>
            <span className="mt-6 text-on-surface-variant/40">—</span>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Hasta</label>
              <input
                type="time"
                value={studyEndHour}
                onChange={(e) => setStudyEndHour(e.target.value)}
                className="block w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-on-surface focus:border-tertiary focus:outline-none focus:ring-2 focus:ring-tertiary/30 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-error-container/20 border border-error/20 p-4 text-center">
          <p className="text-sm text-on-error-container">{error}</p>
        </div>
      )}

      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => setMode('selection')}
        >
          Volver
        </Button>
        <Button
          onClick={handleFinish}
          disabled={saving || selectedShifts.length === 0}
          size="lg"
        >
          {saving ? 'Guardando...' : 'Siguiente'}
        </Button>
      </div>

      <p className="mt-8 text-center text-xs text-on-surface-variant/60">
        Podés ajustar estos horarios más tarde en Configuración
      </p>
    </>
  );
}

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

interface CursadaDistributionRawData {
  topicClassDates: string[];
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
          modality: p.modality as 'THEORY' | 'PRACTICE' | 'THEORY_PRACTICE',
          topicIndices: p.assignedTopicIds
            .map(id => c.topics.findIndex(t => t.id === id))
            .filter(i => i !== -1),
        })),
        ...(topicClassDates ? { topicClassDates } : {}),
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

export function OnboardingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [googleConnectedSuccess] = useState(
    () => searchParams?.get('google_connected') === 'true',
  );
  const [studyPath, setStudyPath] = useState<StudyPath | null>(null);

  useEffect(() => {
    if (searchParams?.get('google_connected') === 'true') {
      router.replace('/onboarding', { scroll: false });
    }
  }, [searchParams, router]);

  const steps = useMemo<WizardStep[]>(() => {
    const base: WizardStep[] = [
      { id: 'availability', title: 'Disponibilidad', component: AvailabilityStep },
      { id: 'subject', title: 'Materia', component: CreateSubjectStep },
      { id: 'pdfUpload', title: 'Programa (PDF)', component: PdfUploadStep, optional: true },
    ];

    if (studyPath === 'LIBRE') {
      base.push({ id: 'freeStudy', title: 'Plan de Estudio', component: FreeStudyStep });
    } else if (studyPath === 'CURSANDO') {
      base.push({ id: 'cursada', title: 'Cursada', component: CursadaParcialesStep });
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
      const availability = data.availability as AvailabilityData | undefined;
      if (availability) {
        const availResult = await saveOnboardingAvailability(
          availability.shifts,
          availability.includeWeekends,
          availability.studyStartHour,
          availability.studyEndHour,
        );
        if (availResult.error) {
          throw new Error(availResult.error);
        }
      }

      const subject = data.subject as SubjectWizardData | undefined;
      if (subject) {
        const wizardInput = buildWizardInput(data);
        const result = await completeSubjectWizard(wizardInput);
        if (result.error) {
          throw new Error(result.error);
        }
      }

      router.push('/dashboard');
      router.refresh();
    },
    [router],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-tertiary-container/10 to-surface flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="font-headline text-4xl text-on-surface mb-2">Bienvenido a StudyApp</h1>
          <p className="text-lg text-on-surface-variant">
            Configuremos tus horarios de estudio para empezar
          </p>
        </div>

        {googleConnectedSuccess && (
          <div className="mb-6 rounded-xl border border-secondary/20 bg-secondary-container/20 p-4 text-center text-on-secondary-container">
            <p className="font-medium">Google Calendar conectado.</p>
            <p className="text-sm mt-1 text-on-secondary-container/80">Podés elegir otra opción o continuar al dashboard.</p>
          </div>
        )}

        <Wizard
          steps={steps}
          onComplete={handleComplete}
          onDataChange={handleDataChange}
        />

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Omitir por ahora
          </button>
        </div>
      </div>
    </div>
  );
}
