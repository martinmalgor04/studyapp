'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createTopic } from '@/lib/actions/topics';
import { createSubject } from '@/lib/actions/subjects';
import { getExamsBySubject } from '@/lib/actions/exams';
import { difficulties, topicSources, type Difficulty, type TopicSource } from '@/lib/validations/topics';

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

const quickAddSchema = z
  .object({
    subject_id: z.string().min(1, 'Seleccioná una materia'),
    exam_id: z.string().uuid().optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
    name: z.string().min(1, 'El nombre es requerido').max(200),
    difficulty: z.enum(difficulties),
    hours: z.number().positive().max(600),
    source: z.enum(topicSources),
    source_date: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.source === 'CLASS') {
        return !!data.source_date && data.source_date.length > 0;
      }
      return true;
    },
    {
      message: 'La fecha es requerida para temas de clase',
      path: ['source_date'],
    }
  );

type QuickAddInput = z.infer<typeof quickAddSchema>;

interface QuickAddTopicProps {
  subjects: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

export function QuickAddTopic({ subjects, onSuccess }: QuickAddTopicProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [createdSubjects, setCreatedSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [examsForSubject, setExamsForSubject] = useState<Array<{ id: string; type: string; number: number | null; date: string }>>([]);

  // Combinar materias existentes con las creadas localmente
  const allSubjects = [...subjects, ...createdSubjects];


  // Declarar useForm PRIMERO antes de usar watch
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuickAddInput>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      subject_id: '',
      exam_id: '',
      name: '',
      difficulty: 'MEDIUM',
      hours: 60,
      source: 'CLASS',
      source_date: new Date().toISOString().split('T')[0],
    },
  });

  // Ahora sí podemos usar watch
  const selectedSubjectId = watch('subject_id');
  const selectedSource = watch('source');
  const showSourceDate = selectedSource === 'CLASS';

  // Effect para cargar exámenes cuando cambia la materia seleccionada
  useEffect(() => {
    if (!selectedSubjectId || selectedSubjectId === '__new__') {
      setExamsForSubject([]);
      return;
    }
    getExamsBySubject(selectedSubjectId).then(setExamsForSubject);
  }, [selectedSubjectId]);

  const handleCreateNewSubject = async () => {
    if (!newSubjectName.trim()) {
      setError('Ingresá un nombre para la materia');
      return;
    }

    setIsCreatingSubject(true);
    setError(null);

    try {
      const result = await createSubject({ name: newSubjectName.trim() });

      if (result.error) {
        setError(result.error);
        setIsCreatingSubject(false);
      } else if (result.data) {
        const newSubject = { id: result.data.id, name: result.data.name };
        
        // Agregar a la lista de materias creadas localmente
        setCreatedSubjects([...createdSubjects, newSubject]);
        
        // Actualizar el form con la nueva materia
        setValue('subject_id', result.data.id, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        
        setShowNewSubject(false);
        setNewSubjectName('');
        setIsCreatingSubject(false);
      } else {
        setError('Error al crear la materia');
        setIsCreatingSubject(false);
      }
    } catch (err) {
      console.error('Error creating subject:', err);
      setError('Error inesperado al crear la materia');
      setIsCreatingSubject(false);
    }
  };

  const onSubmit = async (data: QuickAddInput) => {
    setError(null);
    setSuccess(false);

    const payload = {
      ...data,
      exam_id: data.exam_id || undefined,
    };
    const result = await createTopic(payload);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      reset();
      setIsExpanded(false);
      setShowNewSubject(false);
      setNewSubjectName('');
      onSuccess?.();
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  if (!isExpanded) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Agregar Tema Rápido</h3>
            <p className="text-sm text-gray-500">Registrá una clase o tema nuevo</p>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            + Nuevo Tema
          </button>
        </div>
        {success && (
          <div className="mt-3 rounded-md bg-green-50 p-3">
            <p className="text-sm text-green-800">✓ Tema agregado correctamente</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-green-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Agregar Tema Rápido</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          {/* Materia */}
          <div>
            <label htmlFor="subject_id" className="block text-sm font-medium text-gray-700">
              Materia *
            </label>
            {!showNewSubject ? (
              <>
                <select
                  id="subject_id"
                  {...register('subject_id', {
                    onChange: (e) => {
                      if (e.target.value === '__new__') {
                        setShowNewSubject(true);
                        setValue('subject_id', '');
                      }
                    }
                  })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                >
              <option value="">Seleccionar...</option>
              {allSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
                  <option value="__new__" className="text-green-600 font-medium">
                    + Nueva Materia
                  </option>
                </select>
                {errors.subject_id && (
                  <p className="mt-1 text-xs text-red-600">{errors.subject_id.message}</p>
                )}
              </>
            ) : (
              <div className="mt-1 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateNewSubject();
                      }
                    }}
                    placeholder="Nombre de la materia"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                    disabled={isCreatingSubject}
                  />
                  <button
                    type="button"
                    onClick={handleCreateNewSubject}
                    disabled={isCreatingSubject}
                    className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {isCreatingSubject ? '...' : '✓'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewSubject(false);
                      setNewSubjectName('');
                    }}
                    className="rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-gray-500">Presioná Enter o click en ✓ para crear</p>
              </div>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Tema *
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              placeholder="Ej: Integrales Dobles"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
        </div>

        {examsForSubject.length > 0 && (
          <div>
            <label htmlFor="exam_id" className="block text-sm font-medium text-gray-700">
              Examen (opcional)
            </label>
            <select
              id="exam_id"
              {...register('exam_id')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
            >
              <option value="">Sin examen asignado</option>
              {examsForSubject.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.type} {exam.number != null ? `${exam.number}` : ''} -{' '}
                  {new Date(exam.date).toLocaleDateString('es-AR')}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-4">
          {/* Dificultad */}
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
              Dificultad
            </label>
            <select
              id="difficulty"
              {...register('difficulty')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
            >
              {difficulties.map((diff) => (
                <option key={diff} value={diff}>
                  {DIFFICULTY_LABELS[diff]}
                </option>
              ))}
            </select>
          </div>

          {/* Duración */}
          <div>
            <label htmlFor="hours" className="block text-sm font-medium text-gray-700">
              Duración (min)
            </label>
            <input
              id="hours"
              type="number"
              min="1"
              max="600"
              {...register('hours', {
                setValueAs: (v) => (v === '' ? undefined : parseInt(v, 10)),
              })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              placeholder="60"
            />
          </div>

          {/* Fuente */}
          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700">
              Fuente
            </label>
            <select
              id="source"
              {...register('source')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
            >
              {topicSources.map((source) => (
                <option key={source} value={source}>
                  {SOURCE_LABELS[source]}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha (condicional) */}
          {showSourceDate && (
            <div>
              <label htmlFor="source_date" className="block text-sm font-medium text-gray-700">
                Fecha Clase
              </label>
              <input
                id="source_date"
                type="date"
                {...register('source_date')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              />
              {errors.source_date && (
                <p className="mt-1 text-xs text-red-600">{errors.source_date.message}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Agregar Tema'}
          </button>
        </div>
      </form>
    </div>
  );
}
