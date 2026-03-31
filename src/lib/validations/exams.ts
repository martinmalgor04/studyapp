import { z } from 'zod';

export const examCategories = [
  'PARCIAL',
  'RECUPERATORIO',
  'FINAL',
  'TP',
] as const;

export const examModalities = [
  'THEORY',
  'PRACTICE',
  'THEORY_PRACTICE',
] as const;

export type ExamCategory = (typeof examCategories)[number];
export type ExamModality = (typeof examModalities)[number];

export const CATEGORY_LABELS: Record<ExamCategory, string> = {
  PARCIAL: 'Parcial',
  RECUPERATORIO: 'Recuperatorio',
  FINAL: 'Final',
  TP: 'Trabajo Práctico',
};

export const MODALITY_LABELS: Record<ExamModality, string> = {
  THEORY: 'Teórico',
  PRACTICE: 'Práctico',
  THEORY_PRACTICE: 'Teórico-Práctico',
};

export const CATEGORY_COLORS: Record<ExamCategory, string> = {
  PARCIAL: 'bg-tertiary-container/30 text-on-tertiary-container',
  RECUPERATORIO: 'bg-primary-container/40 text-on-primary-container',
  FINAL: 'bg-tertiary-container/50 text-tertiary',
  TP: 'bg-surface-container text-on-surface-variant',
};

export function formatExamLabel(category: ExamCategory, modality: ExamModality): string {
  if (category === 'TP') return CATEGORY_LABELS.TP;
  return `${CATEGORY_LABELS[category]} ${MODALITY_LABELS[modality]}`;
}

const SHORT_CATEGORY_PREFIX: Record<ExamCategory, string> = {
  PARCIAL: 'P',
  RECUPERATORIO: 'R',
  FINAL: 'Final',
  TP: 'TP',
};

export function formatExamShortLabel(category: ExamCategory, number: number | null): string {
  const prefix = SHORT_CATEGORY_PREFIX[category];
  if (category === 'TP' || category === 'FINAL') return prefix;
  return number != null ? `${prefix}${number}` : prefix;
}

export const createExamSchema = z.object({
  subject_id: z.string().uuid('ID de materia inválido'),
  category: z.enum(examCategories, {
    errorMap: () => ({ message: 'Categoría de examen inválida' }),
  }),
  modality: z.enum(examModalities, {
    errorMap: () => ({ message: 'Modalidad de examen inválida' }),
  }),
  number: z.number().int().min(1).max(10).optional(),
  date: z.string().min(1, 'La fecha es requerida'),
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
}).refine(
  (data) => data.category !== 'TP' || data.modality === 'PRACTICE',
  { message: 'TP siempre es modalidad práctica', path: ['modality'] },
);

export const updateExamSchema = z.object({
  category: z.enum(examCategories).optional(),
  modality: z.enum(examModalities).optional(),
  number: z.number().int().min(1).max(10).optional(),
  date: z.string().optional(),
  description: z.string().max(500, 'La descripción no puede exceder 500 caracteres').optional(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
