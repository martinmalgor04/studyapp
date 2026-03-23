import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de Supabase
const mockSupabaseClient = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock de session generator
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
    },
  ]),
}));

// Importar después de los mocks
import { generateSessions } from '@/lib/actions/sessions';
import { generateSessionsForTopic } from '@/lib/services/session-generator';

describe('Integration: Topic → Session Generation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock de getUser
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
  });

  describe('generateSessions action', () => {
    it('should fetch topic, generate sessions, and insert them', async () => {
      // Mock de topic query
      const mockTopic = {
        id: 'topic-1',
        subject_id: 'subject-1',
        exam_id: 'exam-1',
        name: 'Test Topic',
        difficulty: 'MEDIUM',
        hours: 60,
        source: 'CLASS',
        source_date: '2026-01-27',
        subject: { user_id: 'user-1' },
      };

      const mockExam = {
        id: 'exam-1',
        type: 'PARCIAL_THEORY',
        date: '2026-02-28',
      };

      // Setup chain para topics.select()
      const topicSelectChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTopic, error: null }),
      };

      // Setup chain para exams.select()
      const examSelectChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockExam, error: null }),
      };

      // Setup chain para sessions.insert()
      const insertChain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      // Mock de from() que retorna diferentes chains según la tabla
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'topics') {
          return {
            select: vi.fn().mockReturnValue(topicSelectChain),
          };
        }
        if (table === 'exams') {
          return {
            select: vi.fn().mockReturnValue(examSelectChain),
          };
        }
        if (table === 'sessions') {
          return insertChain;
        }
        return {};
      });

      // Ejecutar
      const result = await generateSessions('topic-1');

      // Verificaciones
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);

      // Verificar que se llamó al generator
      expect(generateSessionsForTopic).toHaveBeenCalledWith(
        mockTopic,
        mockExam,
        'user-1'
      );

      // Verificar que se insertaron las sesiones
      expect(insertChain.insert).toHaveBeenCalledWith(
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
      const topicSelectChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Topic not found' },
        }),
      };

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'topics') {
          return {
            select: vi.fn().mockReturnValue(topicSelectChain),
          };
        }
        return {};
      });

      const result = await generateSessions('non-existent-id');

      expect(result.error).toBe('Topic no encontrado o no pertenece al usuario');
      expect(generateSessionsForTopic).not.toHaveBeenCalled();
    });

    it('should return error if source_date is null', async () => {
      const mockTopic = {
        id: 'topic-1',
        subject_id: 'subject-1',
        exam_id: null,
        name: 'Test Topic',
        difficulty: 'MEDIUM',
        hours: 60,
        source: 'FREE_STUDY',
        source_date: null, // Sin fecha
        subject: { user_id: 'user-1' },
      };

      const topicSelectChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTopic, error: null }),
      };

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'topics') {
          return {
            select: vi.fn().mockReturnValue(topicSelectChain),
          };
        }
        return {};
      });

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
        difficulty: 'MEDIUM',
        hours: 60,
        source: 'FREE_STUDY',
        source_date: '2026-01-27',
        subject: { user_id: 'user-1' },
      };

      const topicSelectChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTopic, error: null }),
      };

      const insertChain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'topics') {
          return {
            select: vi.fn().mockReturnValue(topicSelectChain),
          };
        }
        if (table === 'sessions') {
          return insertChain;
        }
        return {};
      });

      const result = await generateSessions('topic-1');

      expect(result.success).toBe(true);
      expect(generateSessionsForTopic).toHaveBeenCalledWith(mockTopic, null, 'user-1');
    });
  });
});
