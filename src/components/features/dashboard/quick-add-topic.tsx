'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createTopic } from '@/lib/actions/topics';
import { createSubject } from '@/lib/actions/subjects';
import { getExamsBySubject } from '@/lib/actions/exams';
import { difficulties, topicSources, type Difficulty, type TopicSource } from '@/lib/validations/topics';
import { formatExamLabel, type ExamCategory, type ExamModality } from '@/lib/validations/exams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

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
  const [examsForSubject, setExamsForSubject] = useState<Array<{ id: string; category: string; modality: string; number: number | null; date: string }>>([]);

  const allSubjects = [...subjects, ...createdSubjects];

  const {
    register,
    handleSubmit,
    control,
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

  const selectedSubjectId = useWatch({ control, name: 'subject_id' });
  const selectedSource = useWatch({ control, name: 'source' });
  const showSourceDate = selectedSource === 'CLASS';

  const [prevSubjectId, setPrevSubjectId] = useState(selectedSubjectId);
  if (selectedSubjectId !== prevSubjectId) {
    setPrevSubjectId(selectedSubjectId);
    if (!selectedSubjectId || selectedSubjectId === '__new__') {
      setExamsForSubject([]);
    }
  }

  useEffect(() => {
    if (!selectedSubjectId || selectedSubjectId === '__new__') return;
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
        setCreatedSubjects([...createdSubjects, newSubject]);
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
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  if (!isExpanded) {
    return (
      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-on-surface">Agregar Tema Rápido</h3>
            <p className="text-sm text-on-surface-variant">Registrá una clase o tema nuevo</p>
          </div>
          <Button variant="secondary" onClick={() => setIsExpanded(true)}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nuevo Tema
          </Button>
        </div>
        {success && (
          <div className="mt-3 rounded-lg bg-secondary-container/30 p-3">
            <p className="text-sm text-on-secondary-container flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Tema agregado correctamente
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-secondary/20 bg-surface-container-lowest p-4 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-on-surface">Agregar Tema Rápido</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-error-container/20 border border-error/20 p-4">
          <p className="text-sm text-on-error-container">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="subject_id" className="block text-sm font-headline text-on-surface mb-1.5">
              Materia *
            </label>
            {!showNewSubject ? (
              <>
                <Select
                  id="subject_id"
                  {...register('subject_id', {
                    onChange: (e) => {
                      if (e.target.value === '__new__') {
                        setShowNewSubject(true);
                        setValue('subject_id', '');
                      }
                    }
                  })}
                >
                  <option value="">Seleccionar...</option>
                  {allSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                  <option value="__new__">
                    + Nueva Materia
                  </option>
                </Select>
                {errors.subject_id && (
                  <p className="mt-1 text-xs text-error">{errors.subject_id.message}</p>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
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
                    className="flex-1"
                    disabled={isCreatingSubject}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCreateNewSubject}
                    disabled={isCreatingSubject}
                  >
                    {isCreatingSubject ? '...' : (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowNewSubject(false);
                      setNewSubjectName('');
                    }}
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </Button>
                </div>
                <p className="text-xs text-on-surface-variant">Presioná Enter o click en el check para crear</p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-headline text-on-surface mb-1.5">
              Tema *
            </label>
            <Input
              id="name"
              type="text"
              {...register('name')}
              placeholder="Ej: Integrales Dobles"
            />
            {errors.name && <p className="mt-1 text-xs text-error">{errors.name.message}</p>}
          </div>
        </div>

        {examsForSubject.length > 0 && (
          <div>
            <label htmlFor="exam_id" className="block text-sm font-headline text-on-surface mb-1.5">
              Examen (opcional)
            </label>
            <Select id="exam_id" {...register('exam_id')}>
              <option value="">Sin examen asignado</option>
              {examsForSubject.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {formatExamLabel(exam.category as ExamCategory, exam.modality as ExamModality)} {exam.number != null ? `${exam.number}` : ''} -{' '}
                  {new Date(exam.date).toLocaleDateString('es-AR')}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-4">
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
          </div>

          <div>
            <label htmlFor="hours" className="block text-sm font-headline text-on-surface mb-1.5">
              Duración (min)
            </label>
            <Input
              id="hours"
              type="number"
              min="1"
              max="600"
              {...register('hours', {
                setValueAs: (v) => (v === '' ? undefined : parseInt(v, 10)),
              })}
              placeholder="60"
            />
          </div>

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
          </div>

          {showSourceDate && (
            <div>
              <label htmlFor="source_date" className="block text-sm font-headline text-on-surface mb-1.5">
                Fecha Clase
              </label>
              <Input
                id="source_date"
                type="date"
                {...register('source_date')}
              />
              {errors.source_date && (
                <p className="mt-1 text-xs text-error">{errors.source_date.message}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsExpanded(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="secondary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Agregar Tema'}
          </Button>
        </div>
      </form>
    </div>
  );
}
