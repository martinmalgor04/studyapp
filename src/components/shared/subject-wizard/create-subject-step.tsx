'use client';

import { useState } from 'react';
import { createSubjectSchema } from '@/lib/validations/subjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/cn';
import type { StepProps } from '@/components/shared/wizard';
import type { StudyPath, SubjectWizardData } from './subject-wizard-types';

type View = 'form' | 'path';

const CURRENT_YEAR = new Date().getFullYear();

const SEMESTER_OPTIONS = [
  { value: '', label: 'Seleccionar...' },
  { value: 'FIRST', label: '1er Cuatrimestre' },
  { value: 'SECOND', label: '2do Cuatrimestre' },
  { value: 'ANNUAL', label: 'Anual' },
] as const;

const PATH_OPTIONS: {
  path: StudyPath;
  icon: string;
  title: string;
  description: string;
  detail: string;
}[] = [
  {
    path: 'CURSANDO',
    icon: 'school',
    title: 'Estoy cursando esta materia',
    description: 'Voy a clases regulares, tengo parciales',
    detail: 'Generaremos pre-clases + repasos',
  },
  {
    path: 'LIBRE',
    icon: 'auto_stories',
    title: 'Estudio libre / Final',
    description: 'Estudio por mi cuenta para un final',
    detail: 'Generaremos repasos con countdown al examen',
  },
];

interface FormState {
  name: string;
  year: number;
  semester: string;
  professors: string;
  description: string;
}

function savedToFormState(saved: SubjectWizardData | undefined): FormState {
  return {
    name: saved?.name ?? '',
    year: saved?.year ?? CURRENT_YEAR,
    semester: saved?.semester ?? '',
    professors: saved?.professors ?? '',
    description: saved?.description ?? '',
  };
}

export function CreateSubjectStep({
  onNext,
  onBack,
  wizardData,
  updateWizardData,
}: StepProps) {
  const saved = wizardData.subject as SubjectWizardData | undefined;
  const [view, setView] = useState<View>('form');
  const [form, setForm] = useState<FormState>(() => savedToFormState(saved));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateAndGoToPath = () => {
    const input = {
      name: form.name.trim(),
      year: form.year,
      ...(form.semester ? { semester: form.semester as 'ANNUAL' | 'FIRST' | 'SECOND' } : {}),
      ...(form.professors.trim() ? { professors: [form.professors.trim()] } : {}),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
    };

    const result = createSubjectSchema.safeParse(input);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setView('path');
  };

  const handleSelectPath = (studyPath: StudyPath) => {
    const data: SubjectWizardData = {
      name: form.name.trim(),
      year: form.year,
      ...(form.semester ? { semester: form.semester as SubjectWizardData['semester'] } : {}),
      ...(form.professors.trim() ? { professors: form.professors.trim() } : {}),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      studyPath,
    };

    updateWizardData('subject', data);
    onNext();
  };

  if (view === 'path') {
    return (
      <div>
        <button
          onClick={() => setView('form')}
          className="mb-6 flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver al formulario
        </button>

        <h2 className="font-headline text-xl text-on-surface mb-2 text-center">
          ¿Cómo vas a estudiar <span className="text-tertiary">{form.name.trim()}</span>?
        </h2>
        <p className="text-sm text-on-surface-variant mb-8 text-center">
          Esto define cómo se generan tus sesiones de repaso
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {PATH_OPTIONS.map(({ path, icon, title, description, detail }) => (
            <button
              key={path}
              onClick={() => handleSelectPath(path)}
              className="rounded-xl border-2 border-outline-variant/20 bg-surface-container-lowest p-8 transition-all hover:border-tertiary hover:shadow-lg text-left"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-tertiary-container/30 mb-4">
                <span className="material-symbols-outlined text-[32px] text-tertiary">
                  {icon}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">{title}</h3>
              <p className="text-sm text-on-surface-variant">{description}</p>
              <p className="text-xs text-on-surface-variant/60 mt-3">
                <span className="material-symbols-outlined text-[14px] align-text-bottom">
                  auto_awesome
                </span>{' '}
                {detail}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-headline text-xl text-on-surface mb-2 text-center">
        Agregá tu primera materia
      </h2>
      <p className="text-sm text-on-surface-variant mb-8 text-center">
        Después podrás agregar más desde el dashboard
      </p>

      <div className="mx-auto max-w-lg space-y-5">
        <div>
          <label htmlFor="subject-name" className="block text-sm font-medium text-on-surface-variant mb-1.5">
            Nombre de la materia <span className="text-error">*</span>
          </label>
          <Input
            id="subject-name"
            placeholder="Ej: Análisis Matemático I"
            value={form.name}
            onChange={e => updateField('name', e.target.value)}
            className={cn(errors.name && 'border-error focus:ring-error/30 focus:border-error')}
          />
          {errors.name && <p className="mt-1 text-sm text-error">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="subject-year" className="block text-sm font-medium text-on-surface-variant mb-1.5">
              Año
            </label>
            <Input
              id="subject-year"
              type="number"
              min={2000}
              max={2100}
              value={form.year}
              onChange={e => updateField('year', Number(e.target.value))}
              className={cn(errors.year && 'border-error focus:ring-error/30 focus:border-error')}
            />
            {errors.year && <p className="mt-1 text-sm text-error">{errors.year}</p>}
          </div>

          <div>
            <label htmlFor="subject-semester" className="block text-sm font-medium text-on-surface-variant mb-1.5">
              Cuatrimestre
            </label>
            <Select
              id="subject-semester"
              value={form.semester}
              onChange={e => updateField('semester', e.target.value)}
            >
              {SEMESTER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label htmlFor="subject-professors" className="block text-sm font-medium text-on-surface-variant mb-1.5">
            Profesor/a
          </label>
          <Input
            id="subject-professors"
            placeholder="Ej: García, López"
            value={form.professors}
            onChange={e => updateField('professors', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="subject-description" className="block text-sm font-medium text-on-surface-variant mb-1.5">
            Descripción
          </label>
          <Textarea
            id="subject-description"
            placeholder="Notas adicionales sobre la materia..."
            rows={3}
            value={form.description}
            onChange={e => updateField('description', e.target.value)}
            className={cn(
              'min-h-[80px]',
              errors.description && 'border-error focus:ring-error/30 focus:border-error',
            )}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-error">{errors.description}</p>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-4">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Volver
          </Button>
        )}
        <Button onClick={validateAndGoToPath} size="lg">
          Siguiente
        </Button>
      </div>
    </div>
  );
}
