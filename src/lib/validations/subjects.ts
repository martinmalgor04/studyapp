import { z } from 'zod';

// Enums
export const semesterTypeSchema = z.enum(['ANNUAL', 'FIRST', 'SECOND']);
export const subjectStatusSchema = z.enum(['CURSANDO', 'APROBADA', 'REGULAR', 'LIBRE']);

// Schema para horarios de clases (JSONB)
export const scheduleItemSchema = z.object({
  day: z.enum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:MM'),
});

const emptyToUndefined = z.literal('').transform(() => undefined);

export const createSubjectSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z.string().max(500, 'La descripción no puede exceder 500 caracteres').optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  semester: z.union([semesterTypeSchema, emptyToUndefined]).optional(),
  status: z.union([subjectStatusSchema, emptyToUndefined]).optional(),
  professors: z.array(z.string().max(100)).optional(),
  schedule: z.array(scheduleItemSchema).optional(),
});

export const updateSubjectSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  description: z.string().max(500, 'La descripción no puede exceder 500 caracteres').optional(),
  isActive: z.boolean().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  semester: z.union([semesterTypeSchema, emptyToUndefined]).optional(),
  status: z.union([subjectStatusSchema, emptyToUndefined]).optional(),
  professors: z.array(z.string().max(100)).optional(),
  schedule: z.array(scheduleItemSchema).optional(),
});

export type SemesterType = z.infer<typeof semesterTypeSchema>;
export type SubjectStatus = z.infer<typeof subjectStatusSchema>;
export type ScheduleItem = z.infer<typeof scheduleItemSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
