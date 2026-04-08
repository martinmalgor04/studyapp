import { z } from 'zod';

// Enums
export const difficulties = ['EASY', 'MEDIUM', 'HARD'] as const;
export type Difficulty = (typeof difficulties)[number];

export const topicSources = ['CLASS', 'FREE_STUDY', 'PROGRAM'] as const;
export type TopicSource = (typeof topicSources)[number];

export const createTopicSchema = z
  .object({
    subject_id: z.string().uuid('ID de materia inválido'),
    exam_id: z
      .string()
      .uuid('ID de examen inválido')
      .optional()
      .or(z.literal(''))
      .transform((val) => (val === '' ? undefined : val)),
    name: z
      .string()
      .min(1, 'El nombre es requerido')
      .max(200, 'El nombre no puede exceder 200 caracteres'),
    description: z
      .string()
      .max(1000, 'La descripción no puede exceder 1000 caracteres')
      .optional()
      .or(z.literal(''))
      .transform((val) => (val === '' ? undefined : val)),
    difficulty: z.enum(difficulties, {
      errorMap: () => ({ message: 'Dificultad inválida' }),
    }),
    hours: z
      .number({ invalid_type_error: 'Debe ser un número' })
      .positive('Las horas deben ser mayores a 0')
      .max(600, 'Máximo 600 minutos (10 horas)'),
    source: z.enum(topicSources, {
      errorMap: () => ({ message: 'Fuente inválida' }),
    }),
    source_date: z.string().optional(),
    /** Solo server-side (wizard bulk): evita N notificaciones; undefined = notificar como siempre */
    skip_sessions_created_notification: z.boolean().optional(),
    /** Solo server-side (wizard bulk): evita N sync a Google Calendar por tema; luego un sync único al cerrar el wizard */
    skip_google_calendar_sync: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Si source es 'CLASS', source_date es requerido
      if (data.source === 'CLASS') {
        return !!data.source_date && data.source_date.length > 0;
      }
      // Para FREE_STUDY y PROGRAM, source_date es opcional
      return true;
    },
    {
      message: 'La fecha de clase es requerida cuando la fuente es "Clase"',
      path: ['source_date'],
    }
  );

export const updateTopicSchema = z
  .object({
    exam_id: z.string().uuid('ID de examen inválido').optional().or(z.literal('')),
    name: z
      .string()
      .min(1, 'El nombre es requerido')
      .max(200, 'El nombre no puede exceder 200 caracteres')
      .optional(),
    description: z
      .string()
      .max(1000, 'La descripción no puede exceder 1000 caracteres')
      .optional()
      .or(z.literal(''))
      .transform((val) => (val === '' ? undefined : val)),
    difficulty: z.enum(difficulties).optional(),
    hours: z
      .number({ invalid_type_error: 'Debe ser un número' })
      .positive('Las horas deben ser mayores a 0')
      .max(600, 'Máximo 600 minutos (10 horas)')
      .optional(),
    source: z.enum(topicSources).optional(),
    source_date: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      // Si source es 'CLASS', source_date es requerido
      if (data.source === 'CLASS') {
        return !!data.source_date && data.source_date.length > 0;
      }
      return true;
    },
    {
      message: 'La fecha de clase es requerida cuando la fuente es "Clase"',
      path: ['source_date'],
    }
  );

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
