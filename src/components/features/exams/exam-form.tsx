'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createExam, updateExam } from '@/lib/actions/exams';
import {
  createExamSchema,
  examCategories,
  examModalities,
  CATEGORY_LABELS,
  MODALITY_LABELS,
  type CreateExamInput,
  type ExamCategory,
  type ExamModality,
} from '@/lib/validations/exams';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface ExamFormProps {
  subjectId: string;
  exam?: {
    id: string;
    category: ExamCategory;
    modality: ExamModality;
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
      category: exam?.category || 'PARCIAL',
      modality: exam?.modality || 'THEORY_PRACTICE',
      number: exam?.number || undefined,
      date: exam?.date ? new Date(exam.date).toISOString().split('T')[0] : '',
      description: exam?.description || '',
    },
  });

  const selectedCategory = watch('category');
  const showNumberField =
    selectedCategory === 'PARCIAL' || selectedCategory === 'RECUPERATORIO';
  const showModalityField = selectedCategory !== 'TP';

  const onSubmit = async (data: CreateExamInput) => {
    setError(null);

    const payload = {
      ...data,
      modality: data.category === 'TP' ? ('PRACTICE' as const) : data.modality,
    };

    const result = exam ? await updateExam(exam.id, payload) : await createExam(payload);

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

      <div>
        <label htmlFor="category" className="block text-sm font-headline text-on-surface mb-1.5">
          Tipo de Examen
        </label>
        <Select id="category" {...register('category')}>
          {examCategories.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </Select>
        {errors.category && <p className="mt-1 text-sm text-error">{errors.category.message}</p>}
      </div>

      {showModalityField && (
        <div>
          <label htmlFor="modality" className="block text-sm font-headline text-on-surface mb-1.5">
            Modalidad
          </label>
          <Select id="modality" {...register('modality')}>
            {examModalities.map((mod) => (
              <option key={mod} value={mod}>
                {MODALITY_LABELS[mod]}
              </option>
            ))}
          </Select>
          {errors.modality && <p className="mt-1 text-sm text-error">{errors.modality.message}</p>}
        </div>
      )}

      {showNumberField && (
        <div>
          <label htmlFor="number" className="block text-sm font-headline text-on-surface mb-1.5">
            Número (opcional)
          </label>
          <Input
            id="number"
            type="number"
            min="1"
            max="10"
            {...register('number', {
              setValueAs: (v) => (v === '' ? undefined : parseInt(v, 10)),
            })}
            placeholder="Ej: 1, 2, 3..."
          />
          {errors.number && <p className="mt-1 text-sm text-error">{errors.number.message}</p>}
        </div>
      )}

      <div>
        <label htmlFor="date" className="block text-sm font-headline text-on-surface mb-1.5">
          Fecha del Examen
        </label>
        <Input
          id="date"
          type="date"
          {...register('date')}
        />
        {errors.date && <p className="mt-1 text-sm text-error">{errors.date.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-headline text-on-surface mb-1.5">
          Descripción (opcional)
        </label>
        <Textarea
          id="description"
          {...register('description')}
          rows={3}
          placeholder="Notas sobre el examen..."
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
          {isSubmitting ? 'Guardando...' : exam ? 'Actualizar' : 'Crear Examen'}
        </Button>
      </div>
    </form>
  );
}
