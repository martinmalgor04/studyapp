import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabaseClient = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('@/lib/repositories/sessions.repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/repositories/sessions.repository')>();
  return {
    ...actual,
    findTopicWithFullInfo: vi.fn(),
    findExamByIdForGeneration: vi.fn(),
    insertSessions: vi.fn(),
    findPendingSessionSlots: vi.fn(),
  };
});

vi.mock('@/lib/repositories/availability.repository', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/repositories/availability.repository')>();
  return {
    ...original,
    findAvailabilityByUserId: vi.fn(() => []),
  };
});

vi.mock('@/lib/repositories/user-settings.repository', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/repositories/user-settings.repository')>();
  return {
    ...original,
    findUserSettings: vi.fn(() => null),
  };
});

vi.mock('@/lib/services/session-generator', () => ({
  generateSessionsForTopic: vi.fn(() => [
    {
      user_id: 'user-1',
      topic_id: 'topic-1',
      subject_id: 'subject-1',
      exam_id: 'exam-1',
      number: 1,
      scheduled_at: '2026-01-28T09:00:00Z',
      duration: 60,
      priority: 'NORMAL',
      status: 'PENDING',
      attempts: 0,
      session_type: 'REVIEW',
    },
    {
      user_id: 'user-1',
      topic_id: 'topic-1',
      subject_id: 'subject-1',
      exam_id: 'exam-1',
      number: 2,
      scheduled_at: '2026-01-30T09:00:00Z',
      duration: 35,
      priority: 'NORMAL',
      status: 'PENDING',
      attempts: 0,
      session_type: 'REVIEW',
    },
  ]),
}));

import { generateSessions } from '@/lib/actions/sessions';
import { generateSessionsForTopic } from '@/lib/services/session-generator';
import {
  findTopicWithFullInfo,
  findExamByIdForGeneration,
  insertSessions,
  findPendingSessionSlots,
} from '@/lib/repositories/sessions.repository';

describe('Integration: Topic → Session Generation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
  });

  describe('generateSessions action', () => {
    it('should fetch topic, generate sessions, and insert them', async () => {
      const mockTopic = {
        id: 'topic-1',
        subject_id: 'subject-1',
        exam_id: 'exam-1',
        name: 'Test Topic',
        difficulty: 'MEDIUM' as const,
        hours: 60,
        source: 'CLASS',
        source_date: '2026-01-27',
        subject: { user_id: 'user-1' },
      };

      const mockExam = {
        id: 'exam-1',
        category: 'PARCIAL',
        modality: 'THEORY',
        date: '2026-02-28',
      };

      vi.mocked(findTopicWithFullInfo).mockResolvedValue(mockTopic);
      vi.mocked(findExamByIdForGeneration).mockResolvedValue(mockExam);
      vi.mocked(findPendingSessionSlots).mockResolvedValue([]);
      vi.mocked(insertSessions).mockResolvedValue({ error: null });

      const result = await generateSessions('topic-1');

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);

      expect(generateSessionsForTopic).toHaveBeenCalledWith(
        mockTopic,
        mockExam,
        'user-1',
        expect.objectContaining({
          availabilitySlots: expect.any(Array),
          studyHours: expect.any(Object),
        })
      );

      expect(insertSessions).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            topic_id: 'topic-1',
            number: 1,
          }),
          expect.objectContaining({
            topic_id: 'topic-1',
            number: 2,
          }),
        ])
      );
    });

    it('should return error if topic not found', async () => {
      vi.mocked(findTopicWithFullInfo).mockResolvedValue(null);

      const result = await generateSessions('non-existent-id');

      expect(result.error).toBe('Topic no encontrado o no pertenece al usuario');
      expect(generateSessionsForTopic).not.toHaveBeenCalled();
    });

    it('should return error if source_date is null for CLASS source', async () => {
      const mockTopic = {
        id: 'topic-1',
        subject_id: 'subject-1',
        exam_id: null,
        name: 'Test Topic',
        difficulty: 'MEDIUM' as const,
        hours: 60,
        source: 'CLASS',
        source_date: null,
        subject: { user_id: 'user-1' },
      };

      vi.mocked(findTopicWithFullInfo).mockResolvedValue(mockTopic);

      const result = await generateSessions('topic-1');

      expect(result.error).toContain('source_date');
      expect(generateSessionsForTopic).not.toHaveBeenCalled();
    });

    it('should work without exam (exam_id = null)', async () => {
      const mockTopic = {
        id: 'topic-1',
        subject_id: 'subject-1',
        exam_id: null,
        name: 'Test Topic',
        difficulty: 'MEDIUM' as const,
        hours: 60,
        source: 'FREE_STUDY',
        source_date: '2026-01-27',
        subject: { user_id: 'user-1' },
      };

      vi.mocked(findTopicWithFullInfo).mockResolvedValue(mockTopic);
      vi.mocked(findPendingSessionSlots).mockResolvedValue([]);
      vi.mocked(insertSessions).mockResolvedValue({ error: null });

      const result = await generateSessions('topic-1');

      expect(result.success).toBe(true);
      expect(generateSessionsForTopic).toHaveBeenCalledWith(
        mockTopic,
        null,
        'user-1',
        expect.objectContaining({
          availabilitySlots: expect.any(Array),
          studyHours: expect.any(Object),
        })
      );
    });
  });
});
