'use client';

import { useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSubject, updateSubject } from '@/lib/actions/subjects';
import { createSubjectSchema, type CreateSubjectInput, type SemesterType, type SubjectStatus } from '@/lib/validations/subjects';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface SubjectFormProps {
  subject?: {
    id: string;
    name: string;
    description: string | null;
    year?: number | null;
    semester?: SemesterType | null;
    status?: SubjectStatus;
    professors?: string[] | null;
    schedule?: Record<string, unknown> | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function SubjectForm({ subject, onSuccess, onCancel }: SubjectFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [professorInput, setProfessorInput] = useState('');
  const isEditing = !!subject;
  
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateSubjectInput>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      name: subject?.name || '',
      description: subject?.description || '',
      year: subject?.year || undefined,
      semester: subject?.semester || undefined,
      status: subject?.status || 'CURSANDO',
      professors: subject?.professors || [],
      schedule: (Array.isArray(subject?.schedule) ? subject.schedule : []) as CreateSubjectInput['schedule'],
    },
  });

  const { fields: scheduleFields, append: appendSchedule, remove: removeSchedule } = useFieldArray({
    control,
    name: 'schedule',
  });

  const professors = useWatch({ control, name: 'professors' }) || [];

  const onSubmit = async (data: CreateSubjectInput) => {
    setError(null);

    const result = subject
      ? await updateSubject(subject.id, data)
      : await createSubject(data);

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
        <label htmlFor="name" className="block text-sm font-headline text-on-surface mb-1.5">
          Nombre de la Materia
        </label>
        <Input
          id="name"
          type="text"
          {...register('name')}
          placeholder="Ej: Análisis Matemático I"
        />
        {errors.name && <p className="mt-1 text-sm text-error">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-headline text-on-surface mb-1.5">
          Descripción (opcional)
        </label>
        <Textarea
          id="description"
          {...register('description')}
          rows={3}
          placeholder="Notas sobre la materia..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-error">{errors.description.message}</p>
        )}
      </div>

      {isEditing && (
        <>
          <div className="border-t border-outline-variant/20 pt-4">
            <h3 className="text-sm font-headline text-on-surface mb-3">Información Adicional</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="year" className="block text-sm font-headline text-on-surface mb-1.5">
                  Año
                </label>
                <Input
                  id="year"
                  type="number"
                  {...register('year', { valueAsNumber: true })}
                  placeholder="2024"
                />
                {errors.year && <p className="mt-1 text-sm text-error">{errors.year.message}</p>}
              </div>

              <div>
                <label htmlFor="semester" className="block text-sm font-headline text-on-surface mb-1.5">
                  Cuatrimestre
                </label>
                <Select id="semester" {...register('semester')}>
                  <option value="">Seleccionar...</option>
                  <option value="ANNUAL">Anual</option>
                  <option value="FIRST">Primer Cuatrimestre</option>
                  <option value="SECOND">Segundo Cuatrimestre</option>
                </Select>
                {errors.semester && <p className="mt-1 text-sm text-error">{errors.semester.message}</p>}
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="status" className="block text-sm font-headline text-on-surface mb-1.5">
                Estado
              </label>
              <Select id="status" {...register('status')}>
                <option value="CURSANDO">Cursando</option>
                <option value="REGULAR">Regular (Final pendiente)</option>
                <option value="APROBADA">Aprobada</option>
                <option value="LIBRE">Libre (Debe recursar)</option>
              </Select>
              {errors.status && <p className="mt-1 text-sm text-error">{errors.status.message}</p>}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-headline text-on-surface mb-1.5">
                Profesores (opcional)
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  type="text"
                  value={professorInput}
                  onChange={(e) => setProfessorInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (professorInput.trim()) {
                        setValue('professors', [...professors, professorInput.trim()]);
                        setProfessorInput('');
                      }
                    }
                  }}
                  className="flex-1"
                  placeholder="Nombre del profesor"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (professorInput.trim()) {
                      setValue('professors', [...professors, professorInput.trim()]);
                      setProfessorInput('');
                    }
                  }}
                >
                  Agregar
                </Button>
              </div>
              {professors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {professors.map((prof, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-full bg-tertiary-container/40 px-3 py-1 text-sm text-on-tertiary-container"
                    >
                      {prof}
                      <button
                        type="button"
                        onClick={() => {
                          setValue('professors', professors.filter((_, i) => i !== index));
                        }}
                        className="text-on-tertiary-container/60 hover:text-on-tertiary-container"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-headline text-on-surface mb-1.5">
                Horarios de Clases (opcional)
              </label>
              {scheduleFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 mb-2 items-center">
                  <Select {...register(`schedule.${index}.day` as const)}>
                    <option value="">Día</option>
                    <option value="Lunes">Lunes</option>
                    <option value="Martes">Martes</option>
                    <option value="Miércoles">Miércoles</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                    <option value="Sábado">Sábado</option>
                  </Select>
                  <Input
                    type="time"
                    {...register(`schedule.${index}.startTime` as const)}
                  />
                  <span className="text-on-surface-variant">-</span>
                  <Input
                    type="time"
                    {...register(`schedule.${index}.endTime` as const)}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeSchedule(index)}
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendSchedule({ day: 'Lunes', startTime: '09:00', endTime: '11:00' })}
                className="mt-2"
              >
                + Agregar Horario
              </Button>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : subject ? 'Actualizar' : 'Crear Materia'}
        </Button>
      </div>
    </form>
  );
}
