import { z } from 'zod';

// Enum de tipos de examen (debe coincidir con el enum de la DB)
export const examTypes = [
  'PARCIAL_THEORY',
  'PARCIAL_PRACTICE',
  'RECUPERATORIO_THEORY',
  'RECUPERATORIO_PRACTICE',
  'FINAL_THEORY',
  'FINAL_PRACTICE',
  'TP',
] as const;

export type ExamType = (typeof examTypes)[number];

export const createExamSchema = z.object({
  subject_id: z.string().uuid('ID de materia inválido'),
  type: z.enum(examTypes, {
    errorMap: () => ({ message: 'Tipo de examen inválido' }),
  }),
  number: z.number().int().min(1).max(10).optional(),
  date: z.string().min(1, 'La fecha es requerida'),
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
});

export const updateExamSchema = z.object({
  type: z.enum(examTypes).optional(),
  number: z.number().int().min(1).max(10).optional(),
  date: z.string().optional(),
  description: z.string().max(500, 'La descripción no puede exceder 500 caracteres').optional(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
