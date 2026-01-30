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

// Función para detectar si debe activarse el modo automático de Estudio Libre
function isAutoFreeStudyMode(exams: Array<{ type: string; date: string }>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const finals = exams.filter(e => e.type.startsWith('FINAL_'));
  const parciales = exams.filter(e => 
    e.type.startsWith('PARCIAL_') || e.type.startsWith('RECUPERATORIO_')
  );
  
  // Debe tener al menos un Final
  if (finals.length === 0) return false;
  
  // Si no hay parciales, está en modo auto
  if (parciales.length === 0) return true;
  
  // Si todos los parciales ya pasaron, está en modo auto
  const allParcialsPassed = parciales.every(p => {
    const examDate = new Date(p.date);
    examDate.setHours(0, 0, 0, 0);
    return examDate < today;
  });
  
  return allParcialsPassed;
}

interface TopicFormProps {
  subjectId: string;
  exams: Array<{ id: string; type: string; number: number | null; date: string }>;
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
  // Detectar modo automático (solo para temas nuevos, no para edición)
  const isAutoMode = !topic && isAutoFreeStudyMode(exams);
  const autoFinalExam = isAutoMode ? exams.find(e => e.type.startsWith('FINAL_')) : null;
  
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

  // Si está en modo auto, asegurar valores ocultos
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

    // Validar warning para finales con poco tiempo
    if (data.exam_id) {
      const exam = exams.find((e) => e.id === data.exam_id);

      if (exam && exam.type.startsWith('FINAL_')) {
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
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {isAutoMode && autoFinalExam && (
        <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-blue-600">ℹ️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Modo Estudio Libre</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Esta materia tiene solo exámenes finales. El tema se creará automáticamente como
                  <strong> Estudio Libre</strong> y se asociará al final:
                </p>
                <p className="mt-1 font-medium">
                  {autoFinalExam.type} - {new Date(autoFinalExam.date).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nombre del Tema
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="Ej: Ecuaciones Diferenciales"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
          Dificultad
        </label>
        <select
          id="difficulty"
          {...register('difficulty')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        >
          {difficulties.map((diff) => (
            <option key={diff} value={diff}>
              {DIFFICULTY_LABELS[diff]}
            </option>
          ))}
        </select>
        {errors.difficulty && (
          <p className="mt-1 text-sm text-red-600">{errors.difficulty.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="hours" className="block text-sm font-medium text-gray-700">
          Duración (minutos)
        </label>
        <input
          id="hours"
          type="number"
          min="1"
          max="600"
          {...register('hours', {
            setValueAs: (v) => (v === '' ? undefined : parseInt(v, 10)),
          })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="Ej: 120"
        />
        <p className="mt-1 text-xs text-gray-500">Ejemplos: 60min (1h), 120min (2h), 180min (3h)</p>
        {errors.hours && <p className="mt-1 text-sm text-red-600">{errors.hours.message}</p>}
      </div>

      {!isAutoMode && (
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700">
            Fuente
          </label>
          <select
            id="source"
            {...register('source')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          >
            {topicSources.map((source) => (
              <option key={source} value={source}>
                {SOURCE_LABELS[source]}
              </option>
            ))}
          </select>
          {errors.source && <p className="mt-1 text-sm text-red-600">{errors.source.message}</p>}
        </div>
      )}

      {!isAutoMode && showSourceDate && (
        <div>
          <label htmlFor="source_date" className="block text-sm font-medium text-gray-700">
            Fecha de Clase
          </label>
          <input
            id="source_date"
            type="date"
            {...register('source_date')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
          {errors.source_date && (
            <p className="mt-1 text-sm text-red-600">{errors.source_date.message}</p>
          )}
        </div>
      )}

      {!isAutoMode && (
        <div>
          <label htmlFor="exam_id" className="block text-sm font-medium text-gray-700">
            Examen (opcional)
          </label>
          <select
            id="exam_id"
            {...register('exam_id')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Sin examen asignado</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.type} {exam.number ? `${exam.number}` : ''} -{' '}
                {new Date(exam.date).toLocaleDateString('es-AR')}
              </option>
            ))}
          </select>
          {errors.exam_id && <p className="mt-1 text-sm text-red-600">{errors.exam_id.message}</p>}
        </div>
      )}

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Descripción (opcional)
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="Notas sobre el tema..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : topic ? 'Actualizar' : 'Crear Tema'}
        </button>
      </div>
    </form>
  );
}
