'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSubject, updateSubject } from '@/lib/actions/subjects';
import { createSubjectSchema, type CreateSubjectInput, type SemesterType, type SubjectStatus } from '@/lib/validations/subjects';

interface SubjectFormProps {
  subject?: {
    id: string;
    name: string;
    description: string | null;
    year?: number | null;
    semester?: SemesterType | null;
    status?: SubjectStatus;
    professors?: string[] | null;
    schedule?: any | null;
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
    watch,
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
      schedule: subject?.schedule || [],
    },
  });

  const { fields: scheduleFields, append: appendSchedule, remove: removeSchedule } = useFieldArray({
    control,
    name: 'schedule',
  });

  const professors = watch('professors') || [];

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
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nombre de la Materia
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="Ej: Análisis Matemático I"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
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
          placeholder="Notas sobre la materia..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Campos adicionales - Solo en modo edición */}
      {isEditing && (
        <>
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Información Adicional</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Año */}
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                  Año
                </label>
                <input
                  id="year"
                  type="number"
                  {...register('year', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="2024"
                />
                {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>}
              </div>

              {/* Cuatrimestre */}
              <div>
                <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                  Cuatrimestre
                </label>
                <select
                  id="semester"
                  {...register('semester')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="ANNUAL">Anual</option>
                  <option value="FIRST">Primer Cuatrimestre</option>
                  <option value="SECOND">Segundo Cuatrimestre</option>
                </select>
                {errors.semester && <p className="mt-1 text-sm text-red-600">{errors.semester.message}</p>}
              </div>
            </div>

            {/* Estado */}
            <div className="mt-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                id="status"
                {...register('status')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              >
                <option value="CURSANDO">Cursando</option>
                <option value="REGULAR">Regular (Final pendiente)</option>
                <option value="APROBADA">Aprobada</option>
                <option value="LIBRE">Libre (Debe recursar)</option>
              </select>
              {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
            </div>

            {/* Profesores */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profesores (opcional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
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
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="Nombre del profesor"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (professorInput.trim()) {
                      setValue('professors', [...professors, professorInput.trim()]);
                      setProfessorInput('');
                    }
                  }}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Agregar
                </button>
              </div>
              {professors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {professors.map((prof, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                    >
                      {prof}
                      <button
                        type="button"
                        onClick={() => {
                          setValue('professors', professors.filter((_, i) => i !== index));
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Horarios */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horarios de Clases (opcional)
              </label>
              {scheduleFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 mb-2 items-start">
                  <select
                    {...register(`schedule.${index}.day` as const)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Día</option>
                    <option value="Lunes">Lunes</option>
                    <option value="Martes">Martes</option>
                    <option value="Miércoles">Miércoles</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                    <option value="Sábado">Sábado</option>
                  </select>
                  <input
                    type="time"
                    {...register(`schedule.${index}.startTime` as const)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                  <span className="py-2 text-gray-500">-</span>
                  <input
                    type="time"
                    {...register(`schedule.${index}.endTime` as const)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeSchedule(index)}
                    className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendSchedule({ day: 'Lunes', startTime: '09:00', endTime: '11:00' })}
                className="mt-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                + Agregar Horario
              </button>
            </div>
          </div>
        </>
      )}

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
          {isSubmitting ? 'Guardando...' : subject ? 'Actualizar' : 'Crear Materia'}
        </button>
      </div>
    </form>
  );
}
