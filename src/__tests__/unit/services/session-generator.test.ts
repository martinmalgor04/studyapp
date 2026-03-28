import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock priority-calculator before importing session-generator
vi.mock('@/lib/services/priority-calculator', () => ({
  calculatePriority: vi.fn(() => 'NORMAL'),
  daysBetween: vi.fn((date1: Date, date2: Date) => {
    return Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
  }),
}));

// Mock google-calendar service to avoid Supabase client dependency in unit tests
vi.mock('@/lib/services/google-calendar.service', () => ({
  getGoogleCalendarService: vi.fn(() => ({
    isConnected: vi.fn().mockResolvedValue(false),
    findConflictFreeSlot: vi.fn().mockResolvedValue({ date: new Date(), adjusted: false }),
  })),
}));

// Import after mocking
import { generateSessionsForTopic } from '@/lib/services/session-generator';
import { calculatePriority } from '@/lib/services/priority-calculator';

describe('UC-006: Session Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset date mocks
    vi.setSystemTime(new Date('2026-01-27'));
  });

  describe('generateSessionsForTopic', () => {
    const baseTopic = {
      id: 'topic-1',
      subject_id: 'subject-1',
      exam_id: 'exam-1',
      difficulty: 'MEDIUM' as const,
      hours: 60,
      source: 'CLASS',
      source_date: '2026-01-27',
    };

    const parcialExam = {
      id: 'exam-1',
      date: '2026-02-28',
      category: 'PARCIAL',
      modality: 'THEORY',
    };

    const finalExam = {
      id: 'exam-2',
      date: '2026-03-15',
      category: 'FINAL',
      modality: 'THEORY',
    };

    describe('Input Validation', () => {
      it('should throw if source_date is null', async () => {
        const topic = { ...baseTopic, source_date: null };

        await expect(
          generateSessionsForTopic(topic, parcialExam, 'user-1')
        ).rejects.toThrow('Topic must have a source_date to generate sessions');
      });
    });

    describe('Mode Detection', () => {
      it('should generate PARCIAL mode for PARCIAL_THEORY exam', async () => {
        const sessions = await generateSessionsForTopic(baseTopic, parcialExam, 'user-1');

        expect(sessions).toHaveLength(4);
        // Verify isFinal is false in priority calculation
        expect(calculatePriority).toHaveBeenCalledWith(
          expect.objectContaining({ isFinal: false })
        );
      });

      it('should generate PARCIAL mode for PARCIAL PRACTICE exam', async () => {
        const exam = { ...parcialExam, category: 'PARCIAL', modality: 'PRACTICE' };
        const sessions = await generateSessionsForTopic(baseTopic, exam, 'user-1');

        expect(sessions).toHaveLength(4);
        expect(calculatePriority).toHaveBeenCalledWith(
          expect.objectContaining({ isFinal: false })
        );
      });

      it('should generate PARCIAL mode for RECUPERATORIO exam', async () => {
        const exam = { ...parcialExam, category: 'RECUPERATORIO', modality: 'THEORY' };
        const sessions = await generateSessionsForTopic(baseTopic, exam, 'user-1');

        expect(sessions).toHaveLength(4);
        expect(calculatePriority).toHaveBeenCalledWith(
          expect.objectContaining({ isFinal: false })
        );
      });

      it('should generate COUNTDOWN mode for FINAL_THEORY exam', async () => {
        const topic = { ...baseTopic, exam_id: finalExam.id };
        const sessions = await generateSessionsForTopic(topic, finalExam, 'user-1');

        expect(sessions).toHaveLength(4);
        expect(calculatePriority).toHaveBeenCalledWith(
          expect.objectContaining({ isFinal: true })
        );
      });

      it('should generate COUNTDOWN mode for FINAL PRACTICE exam', async () => {
        const exam = { ...finalExam, category: 'FINAL', modality: 'PRACTICE' };
        const topic = { ...baseTopic, exam_id: exam.id };
        const sessions = await generateSessionsForTopic(topic, exam, 'user-1');

        expect(sessions).toHaveLength(4);
        expect(calculatePriority).toHaveBeenCalledWith(
          expect.objectContaining({ isFinal: true })
        );
      });

      it('should generate PARCIAL mode when exam is null', async () => {
        const sessions = await generateSessionsForTopic(
          { ...baseTopic, exam_id: null },
          null,
          'user-1'
        );

        expect(sessions).toHaveLength(4);
        expect(calculatePriority).toHaveBeenCalledWith(
          expect.objectContaining({ isFinal: false })
        );
      });
    });

    describe('PARCIAL Mode - Forward Sessions', () => {
      it('should generate 4 sessions with intervals [1,3,7,14]', async () => {
        const sessions = await generateSessionsForTopic(baseTopic, parcialExam, 'user-1');

        expect(sessions).toHaveLength(4);
        expect(sessions[0].number).toBe(1);
        expect(sessions[1].number).toBe(2);
        expect(sessions[2].number).toBe(3);
        expect(sessions[3].number).toBe(4);
      });

      it('should calculate sessions FORWARD from source_date', async () => {
        const sourceDate = new Date('2026-01-27');
        const sessions = await generateSessionsForTopic(baseTopic, parcialExam, 'user-1');

        // Verify sessions are after source_date
        sessions.forEach((session) => {
          const sessionDate = new Date(session.scheduled_at);
          expect(sessionDate.getTime()).toBeGreaterThan(sourceDate.getTime());
        });

        // Verify sessions are ordered (R1 < R2 < R3 < R4)
        for (let i = 1; i < sessions.length; i++) {
          const prevDate = new Date(sessions[i - 1].scheduled_at);
          const currDate = new Date(sessions[i].scheduled_at);
          expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
        }

        // Verify intervals are approximately [1, 3, 7, 14] days
        const intervals = [1, 3, 7, 14];
        sessions.forEach((session, idx) => {
          const sessionDate = new Date(session.scheduled_at);
          const expectedDate = new Date(sourceDate);
          expectedDate.setDate(expectedDate.getDate() + intervals[idx]);
          
          // Allow 1 day tolerance for timezone differences
          const diffDays = Math.abs(
            (sessionDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          expect(diffDays).toBeLessThanOrEqual(1);
        });
      });

      it('should set default time to 09:00 Argentina (12:00 UTC) when no availability provided', async () => {
        const sessions = await generateSessionsForTopic(baseTopic, parcialExam, 'user-1');

        sessions.forEach((session) => {
          const date = new Date(session.scheduled_at);
          expect(date.getUTCHours()).toBe(12);
          expect(date.getUTCMinutes()).toBe(0);
        });
      });
    });

    describe('FREE_STUDY Mode - Forward from Today', () => {
      it('should generate 4 sessions with forward intervals [1,3,7,14]', async () => {
        const exam = { ...finalExam, date: '2026-03-15' }; // 47 days from today
        const topic = { ...baseTopic, exam_id: exam.id, source: 'FREE_STUDY' };
        const sessions = await generateSessionsForTopic(topic, exam, 'user-1');

        expect(sessions).toHaveLength(4);
      });

      it('should calculate sessions FORWARD from today', async () => {
        // Set system time
        vi.setSystemTime(new Date('2026-01-27'));
        
        const examDate = new Date('2026-03-15');
        const exam = { ...finalExam, date: examDate.toISOString() };
        const topic = { ...baseTopic, exam_id: exam.id, source: 'FREE_STUDY' };
        const sessions = await generateSessionsForTopic(topic, exam, 'user-1');

        const today = new Date('2026-01-27');
        today.setHours(9, 0, 0, 0);

        // Verify sessions are scheduled after today
        sessions.forEach((session) => {
          const sessionDate = new Date(session.scheduled_at);
          expect(sessionDate.getTime()).toBeGreaterThanOrEqual(today.getTime());
        });

        // Verify they're in order (R1 earliest, R4 latest)
        for (let i = 1; i < sessions.length; i++) {
          const prevDate = new Date(sessions[i - 1].scheduled_at);
          const currDate = new Date(sessions[i].scheduled_at);
          expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
        }

        // Verify intervals are approximately [1, 3, 7, 14] days FROM today
        const intervals = [1, 3, 7, 14];
        sessions.forEach((session, idx) => {
          const sessionDate = new Date(session.scheduled_at);
          const expectedDate = new Date(today);
          expectedDate.setDate(expectedDate.getDate() + intervals[idx]);
          
          // Allow 1 day tolerance
          const diffDays = Math.abs(
            (sessionDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          expect(diffDays).toBeLessThanOrEqual(1);
        });
      });

      it('should still generate 4 sessions even if exam is close', async () => {
        vi.setSystemTime(new Date('2026-01-27'));
        const exam = { ...finalExam, date: '2026-02-03' }; // Only 7 days
        const topic = { ...baseTopic, exam_id: exam.id, source: 'FREE_STUDY' };
        const sessions = await generateSessionsForTopic(topic, exam, 'user-1');

        // Siempre 4 sesiones (algunas podrían quedar después del examen)
        expect(sessions).toHaveLength(4);
      });

      it('should start sessions from today forward', async () => {
        vi.setSystemTime(new Date('2026-01-27'));
        const exam = { ...finalExam, date: '2026-03-15' };
        const topic = { ...baseTopic, exam_id: exam.id, source: 'FREE_STUDY' };
        const sessions = await generateSessionsForTopic(topic, exam, 'user-1');

        const today = new Date('2026-01-27');
        today.setHours(0, 0, 0, 0);

        // All sessions should be scheduled today or after
        sessions.forEach((session) => {
          const sessionDate = new Date(session.scheduled_at);
          expect(sessionDate.getTime()).toBeGreaterThanOrEqual(today.getTime());
        });
      });
    });

    describe('Difficulty Multipliers', () => {
      it('should apply EASY multiplier (0.7) to duration', async () => {
        const topic = { ...baseTopic, difficulty: 'EASY' as const, hours: 100 };
        const sessions = await generateSessionsForTopic(topic, parcialExam, 'user-1');

        // R1 duration = 100 * 0.7 * 0.60 = 42
        expect(sessions[0].duration).toBe(42);
      });

      it('should apply MEDIUM multiplier (1.0) to duration', async () => {
        const topic = { ...baseTopic, difficulty: 'MEDIUM' as const, hours: 100 };
        const sessions = await generateSessionsForTopic(topic, parcialExam, 'user-1');

        // R1 duration = 100 * 1.0 * 0.60 = 60
        expect(sessions[0].duration).toBe(60);
      });

      it('should apply HARD multiplier (1.3) to duration', async () => {
        const topic = { ...baseTopic, difficulty: 'HARD' as const, hours: 100 };
        const sessions = await generateSessionsForTopic(topic, parcialExam, 'user-1');

        // R1 duration = 100 * 1.3 * 0.60 = 78
        expect(sessions[0].duration).toBe(78);
      });
    });

    describe('Duration Factors', () => {
      it('should apply duration factors [0.60, 0.35, 0.30, 0.25]', async () => {
        const topic = { ...baseTopic, difficulty: 'MEDIUM' as const, hours: 100 };
        const sessions = await generateSessionsForTopic(topic, parcialExam, 'user-1');

        // hours * multiplier(1.0) * factor
        expect(sessions[0].duration).toBe(60); // 100 * 1.0 * 0.60
        expect(sessions[1].duration).toBe(35); // 100 * 1.0 * 0.35
        expect(sessions[2].duration).toBe(30); // 100 * 1.0 * 0.30
        expect(sessions[3].duration).toBe(25); // 100 * 1.0 * 0.25
      });

      it('should enforce minimum duration of 15 minutes', async () => {
        const topic = { ...baseTopic, hours: 10 }; // Very short
        const sessions = await generateSessionsForTopic(topic, parcialExam, 'user-1');

        sessions.forEach((session) => {
          expect(session.duration).toBeGreaterThanOrEqual(15);
        });
      });
    });

    describe('Session Properties', () => {
      it('should set correct user_id', async () => {
        const sessions = await generateSessionsForTopic(baseTopic, parcialExam, 'my-user-id');

        sessions.forEach((session) => {
          expect(session.user_id).toBe('my-user-id');
        });
      });

      it('should set correct subject_id', async () => {
        const sessions = await generateSessionsForTopic(baseTopic, parcialExam, 'user-1');

        sessions.forEach((session) => {
          expect(session.subject_id).toBe('subject-1');
        });
      });

      it('should set correct topic_id', async () => {
        const sessions = await generateSessionsForTopic(baseTopic, parcialExam, 'user-1');

        sessions.forEach((session) => {
          expect(session.topic_id).toBe('topic-1');
        });
      });

      it('should set correct exam_id', async () => {
        const sessions = await generateSessionsForTopic(baseTopic, parcialExam, 'user-1');

        sessions.forEach((session) => {
          expect(session.exam_id).toBe('exam-1');
        });
      });

      it('should set status to PENDING', async () => {
        const sessions = await generateSessionsForTopic(baseTopic, parcialExam, 'user-1');

        sessions.forEach((session) => {
          expect(session.status).toBe('PENDING');
        });
      });

      it('should set attempts to 0', async () => {
        const sessions = await generateSessionsForTopic(baseTopic, parcialExam, 'user-1');

        sessions.forEach((session) => {
          expect(session.attempts).toBe(0);
        });
      });
    });

    describe('Priority Calculation', () => {
      it('should call calculatePriority with correct params for PARCIAL', async () => {
        await generateSessionsForTopic(baseTopic, parcialExam, 'user-1');

        expect(calculatePriority).toHaveBeenCalledTimes(4);
        expect(calculatePriority).toHaveBeenCalledWith(
          expect.objectContaining({
            difficulty: 'MEDIUM',
            sessionNumber: 1,
            isFinal: false,
          })
        );
      });

      it('should call calculatePriority with isFinal=true for FINAL', async () => {
        const topic = { ...baseTopic, exam_id: finalExam.id };
        await generateSessionsForTopic(topic, finalExam, 'user-1');

        expect(calculatePriority).toHaveBeenCalledWith(
          expect.objectContaining({ isFinal: true })
        );
      });
    });
  });
});
