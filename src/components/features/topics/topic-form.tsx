'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTopic, updateTopic } from '@/lib/actions/topics';
import {
  createTopicSchema,
  difficulties,
  topicSources,
  type CreateTopicInput,
  type Difficulty,
  type TopicSource,
} from '@/lib/validations/topics';
import { formatExamLabel, type ExamCategory, type ExamModality } from '@/lib/validations/exams';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: 'Fácil',
  MEDIUM: 'Medio',
  HARD: 'Difícil',
};

const SOURCE_LABELS: Record<TopicSource, string> = {
  CLASS: 'Clase',
  FREE_STUDY: 'Estudio Libre',
  PROGRAM: 'Programa',
};

function isAutoFreeStudyMode(exams: Array<{ category: string; date: string }>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const finals = exams.filter(e => e.category === 'FINAL');
  const parciales = exams.filter(e => 
    e.category === 'PARCIAL' || e.category === 'RECUPERATORIO'
  );
  
  if (finals.length === 0) return false;
  if (parciales.length === 0) return true;
  
  const allParcialsPassed = parciales.every(p => {
    const examDate = new Date(p.date);
    examDate.setHours(0, 0, 0, 0);
    return examDate < today;
  });
  
  return allParcialsPassed;
}

interface TopicFormProps {
  subjectId: string;
  exams: Array<{ id: string; category: string; modality: string; number: number | null; date: string }>;
  topic?: {
    id: string;
    name: string;
    description: string | null;
    difficulty: Difficulty;
    hours: number;
    source: TopicSource;
    source_date: string | null;
    exam_id: string | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function TopicForm({ subjectId, exams, topic, onSuccess, onCancel }: TopicFormProps) {
  const isAutoMode = !topic && isAutoFreeStudyMode(exams);
  const autoFinalExam = isAutoMode ? exams.find(e => e.category === 'FINAL') : null;
  
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTopicInput>({
    resolver: zodResolver(createTopicSchema),
    defaultValues: {
      subject_id: subjectId,
      exam_id: topic?.exam_id || (isAutoMode && autoFinalExam ? autoFinalExam.id : undefined),
      name: topic?.name || '',
      description: topic?.description || '',
      difficulty: topic?.difficulty || 'MEDIUM',
      hours: topic?.hours || 60,
      source: topic?.source || (isAutoMode ? 'FREE_STUDY' : 'CLASS'),
      source_date: topic?.source_date 
        ? new Date(topic.source_date).toISOString().split('T')[0] 
        : (isAutoMode ? new Date().toISOString().split('T')[0] : ''),
    },
  });

  useEffect(() => {
    if (isAutoMode && autoFinalExam) {
      setValue('source', 'FREE_STUDY');
      setValue('source_date', new Date().toISOString().split('T')[0]);
      setValue('exam_id', autoFinalExam.id);
    }
  }, [isAutoMode, autoFinalExam, setValue]);

  const selectedSource = watch('source');
  const showSourceDate = selectedSource === 'CLASS';

  const onSubmit = async (data: CreateTopicInput) => {
    setError(null);

    if (data.exam_id) {
      const exam = exams.find((e) => e.id === data.exam_id);

      if (exam && exam.category === 'FINAL') {
        const today = new Date();
        const examDate = new Date(exam.date);
        const daysToExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysToExam < 25) {
          const confirmed = window.confirm(
            `⚠️ Tiempo ajustado\n\n` +
              `Quedan solo ${daysToExam} días hasta el examen.\n` +
              `Las sesiones se comprimirán proporcionalmente.\n\n` +
              `¿Continuar de todos modos?`
          );

          if (!confirmed) return;
        }
      }
    }

    const result = topic ? await updateTopic(topic.id, data) : await createTopic(data);

    if (result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-error-container/20 border border-error/20 p-4">
          <p className="text-sm text-on-error-container">{error}</p>
        </div>
      )}

      {isAutoMode && autoFinalExam && (
        <div className="rounded-lg bg-tertiary-container/20 border border-tertiary/20 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="material-symbols-outlined text-[18px] text-tertiary">info</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-headline text-on-surface">Modo Estudio Libre</h3>
              <div className="mt-2 text-sm text-on-surface-variant">
                <p>
                  Esta materia tiene solo exámenes finales. El tema se creará automáticamente como
                  <strong> Estudio Libre</strong> y se asociará al final:
                </p>
                <p className="mt-1 font-medium text-on-surface">
                  {formatExamLabel(autoFinalExam.category as ExamCategory, autoFinalExam.modality as ExamModality)} - {new Date(autoFinalExam.date).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-headline text-on-surface mb-1.5">
          Nombre del Tema
        </label>
        <Input
          id="name"
          type="text"
          {...register('name')}
          placeholder="Ej: Ecuaciones Diferenciales"
        />
        {errors.name && <p className="mt-1 text-sm text-error">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="difficulty" className="block text-sm font-headline text-on-surface mb-1.5">
          Dificultad
        </label>
        <Select id="difficulty" {...register('difficulty')}>
          {difficulties.map((diff) => (
            <option key={diff} value={diff}>
              {DIFFICULTY_LABELS[diff]}
            </option>
          ))}
        </Select>
        {errors.difficulty && (
          <p className="mt-1 text-sm text-error">{errors.difficulty.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="hours" className="block text-sm font-headline text-on-surface mb-1.5">
          Duración (minutos)
        </label>
        <Input
          id="hours"
          type="number"
          min="1"
          max="600"
          {...register('hours', {
            setValueAs: (v) => (v === '' ? undefined : parseInt(v, 10)),
          })}
          placeholder="Ej: 120"
        />
        <p className="mt-1 text-xs text-on-surface-variant">Ejemplos: 60min (1h), 120min (2h), 180min (3h)</p>
        {errors.hours && <p className="mt-1 text-sm text-error">{errors.hours.message}</p>}
      </div>

      {!isAutoMode && (
        <div>
          <label htmlFor="source" className="block text-sm font-headline text-on-surface mb-1.5">
            Fuente
          </label>
          <Select id="source" {...register('source')}>
            {topicSources.map((source) => (
              <option key={source} value={source}>
                {SOURCE_LABELS[source]}
              </option>
            ))}
          </Select>
          {errors.source && <p className="mt-1 text-sm text-error">{errors.source.message}</p>}
        </div>
      )}

      {!isAutoMode && showSourceDate && (
        <div>
          <label htmlFor="source_date" className="block text-sm font-headline text-on-surface mb-1.5">
            Fecha de Clase
          </label>
          <Input
            id="source_date"
            type="date"
            {...register('source_date')}
          />
          {errors.source_date && (
            <p className="mt-1 text-sm text-error">{errors.source_date.message}</p>
          )}
        </div>
      )}

      {exams.length > 0 && (
        <div>
          <label htmlFor="exam_id" className="block text-sm font-headline text-on-surface mb-1.5">
            Examen (opcional)
          </label>
          <Select id="exam_id" {...register('exam_id')}>
            <option value="">Sin examen asignado</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {formatExamLabel(exam.category as ExamCategory, exam.modality as ExamModality)} {exam.number ? `${exam.number}` : ''} -{' '}
                {new Date(exam.date).toLocaleDateString('es-AR')}
              </option>
            ))}
          </Select>
          {errors.exam_id && <p className="mt-1 text-sm text-error">{errors.exam_id.message}</p>}
        </div>
      )}

      <div>
        <label htmlFor="description" className="block text-sm font-headline text-on-surface mb-1.5">
          Descripción (opcional)
        </label>
        <Textarea
          id="description"
          {...register('description')}
          rows={3}
          placeholder="Notas sobre el tema..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-error">{errors.description.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : topic ? 'Actualizar' : 'Crear Tema'}
        </Button>
      </div>
    </form>
  );
}
