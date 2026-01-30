import { z } from 'zod';

export const sessionStatuses = ['PENDING', 'COMPLETED', 'INCOMPLETE', 'RESCHEDULED', 'ABANDONED'] as const;
export type SessionStatus = (typeof sessionStatuses)[number];

export const priorities = ['CRITICAL', 'URGENT', 'IMPORTANT', 'NORMAL', 'LOW'] as const;
export type Priority = (typeof priorities)[number];

export const createSessionSchema = z.object({
  user_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  topic_id: z.string().uuid(),
  exam_id: z.string().uuid().nullable(),
  number: z.number().int().positive(),
  scheduled_at: z.string(),
  duration: z.number().int().positive(),
  priority: z.enum(priorities),
  status: z.enum(sessionStatuses).default('PENDING'),
  attempts: z.number().int().min(0).default(0),
});

export const updateSessionSchema = z.object({
  scheduled_at: z.string().optional(),
  duration: z.number().int().positive().optional(),
  priority: z.enum(priorities).optional(),
  status: z.enum(sessionStatuses).optional(),
  attempts: z.number().int().min(0).optional(),
  completed_at: z.string().optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
