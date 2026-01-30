'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createExam, updateExam } from '@/lib/actions/exams';
import {
  createExamSchema,
  examTypes,
  type CreateExamInput,
  type ExamType,
} from '@/lib/validations/exams';

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  PARCIAL_THEORY: 'Parcial Teórico',
  PARCIAL_PRACTICE: 'Parcial Práctico',
  RECUPERATORIO_THEORY: 'Recuperatorio Teórico',
  RECUPERATORIO_PRACTICE: 'Recuperatorio Práctico',
  FINAL_THEORY: 'Final Teórico',
  FINAL_PRACTICE: 'Final Práctico',
  TP: 'Trabajo Práctico',
};

interface ExamFormProps {
  subjectId: string;
  exam?: {
    id: string;
    type: ExamType;
    number: number | null;
    date: string;
    description: string | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function ExamForm({ subjectId, exam, onSuccess, onCancel }: ExamFormProps) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateExamInput>({
    resolver: zodResolver(createExamSchema),
    defaultValues: {
      subject_id: subjectId,
      type: exam?.type || 'PARCIAL_THEORY',
      number: exam?.number || undefined,
      date: exam?.date ? new Date(exam.date).toISOString().split('T')[0] : '',
      description: exam?.description || '',
    },
  });

  const selectedType = watch('type');
  const showNumberField =
    selectedType &&
    (selectedType.includes('PARCIAL') || selectedType.includes('RECUPERATORIO'));

  const onSubmit = async (data: CreateExamInput) => {
    setError(null);

    const result = exam ? await updateExam(exam.id, data) : await createExam(data);

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

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Tipo de Examen
        </label>
        <select
          id="type"
          {...register('type')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        >
          {examTypes.map((type) => (
            <option key={type} value={type}>
              {EXAM_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
      </div>

      {showNumberField && (
        <div>
          <label htmlFor="number" className="block text-sm font-medium text-gray-700">
            Número (opcional)
          </label>
          <input
            id="number"
            type="number"
            min="1"
            max="10"
            {...register('number', {
              setValueAs: (v) => (v === '' ? undefined : parseInt(v, 10)),
            })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="Ej: 1, 2, 3..."
          />
          {errors.number && <p className="mt-1 text-sm text-red-600">{errors.number.message}</p>}
        </div>
      )}

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Fecha del Examen
        </label>
        <input
          id="date"
          type="date"
          {...register('date')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
        {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Descripción (opcional)
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="Notas sobre el examen..."
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
          {isSubmitting ? 'Guardando...' : exam ? 'Actualizar' : 'Crear Examen'}
        </button>
      </div>
    </form>
  );
}
