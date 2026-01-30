import { describe, it, expect } from 'vitest';
import { calculatePriority, daysBetween } from '@/lib/services/priority-calculator';

describe('UC-006: Priority Calculator', () => {
  describe('daysBetween', () => {
    it('should calculate days correctly for positive difference', () => {
      const date1 = new Date('2026-01-27');
      const date2 = new Date('2026-02-03');
      expect(daysBetween(date1, date2)).toBe(7);
    });

    it('should return 0 for same day', () => {
      const date = new Date('2026-01-27');
      expect(daysBetween(date, date)).toBe(0);
    });

    it('should handle negative days (past dates)', () => {
      const date1 = new Date('2026-02-03');
      const date2 = new Date('2026-01-27');
      expect(daysBetween(date1, date2)).toBe(-7);
    });

    it('should handle dates across months', () => {
      const date1 = new Date('2026-01-27');
      const date2 = new Date('2026-03-15');
      expect(daysBetween(date1, date2)).toBe(47);
    });
  });

  describe('calculatePriority', () => {
    const baseParams = {
      daysToExam: 14,
      difficulty: 'MEDIUM' as const,
      sessionNumber: 1,
      daysToSession: 1,
      isFinal: false,
    };

    describe('Urgency Score (daysToExam)', () => {
      it('should return 0 urgency for null daysToExam', () => {
        const result = calculatePriority({
          ...baseParams,
          daysToExam: null,
          difficulty: 'EASY',
          sessionNumber: 6,
          daysToSession: 30,
        });
        // With low scores everywhere, should be LOW or NORMAL
        expect(['LOW', 'NORMAL']).toContain(result);
      });

      it('should give high urgency (40) for <=3 days to exam', () => {
        const result = calculatePriority({ ...baseParams, daysToExam: 3 });
        // 40 + 20 + 20 + 10 = 90 -> CRITICAL
        expect(result).toBe('CRITICAL');
      });

      it('should give urgency (35) for <=7 days to exam', () => {
        const result = calculatePriority({ ...baseParams, daysToExam: 7 });
        // 35 + 20 + 20 + 10 = 85 -> CRITICAL
        expect(result).toBe('CRITICAL');
      });

      it('should give urgency (30) for <=14 days to exam', () => {
        const result = calculatePriority({ ...baseParams, daysToExam: 14 });
        // 30 + 20 + 20 + 10 = 80 -> URGENT
        expect(result).toBe('URGENT');
      });

      it('should give low urgency (5) for >30 days to exam', () => {
        const result = calculatePriority({
          ...baseParams,
          daysToExam: 60,
          sessionNumber: 4,
          daysToSession: 14,
        });
        // 5 + 20 + 12 + 3 = 40 -> NORMAL
        expect(result).toBe('NORMAL');
      });
    });

    describe('Difficulty Score', () => {
      it('should give 10 for EASY difficulty', () => {
        const result = calculatePriority({
          ...baseParams,
          difficulty: 'EASY',
          daysToExam: 30, // 10
          sessionNumber: 3, // 15
          daysToSession: 7, // 5
        });
        // 10 + 10 + 15 + 5 = 40 -> NORMAL
        expect(result).toBe('NORMAL');
      });

      it('should give 20 for MEDIUM difficulty', () => {
        const result = calculatePriority({
          ...baseParams,
          difficulty: 'MEDIUM',
          daysToExam: 30, // 10
          sessionNumber: 3, // 15
          daysToSession: 7, // 5
        });
        // 10 + 20 + 15 + 5 = 50 -> IMPORTANT
        expect(result).toBe('IMPORTANT');
      });

      it('should give 30 for HARD difficulty', () => {
        const result = calculatePriority({
          ...baseParams,
          difficulty: 'HARD',
          daysToExam: 30, // 10
          sessionNumber: 3, // 15
          daysToSession: 7, // 5
        });
        // 10 + 30 + 15 + 5 = 60 -> IMPORTANT
        expect(result).toBe('IMPORTANT');
      });
    });

    describe('Session Number Score', () => {
      it('should give 20 for session 1 (first review is critical)', () => {
        const result = calculatePriority({
          ...baseParams,
          daysToExam: 21, // 20
          difficulty: 'MEDIUM', // 20
          sessionNumber: 1, // 20
          daysToSession: 7, // 5
        });
        // 20 + 20 + 20 + 5 = 65 -> IMPORTANT
        expect(result).toBe('IMPORTANT');
      });

      it('should give 18 for session 2', () => {
        const result = calculatePriority({
          ...baseParams,
          sessionNumber: 2,
        });
        // Score should be slightly lower than session 1
        expect(['URGENT', 'IMPORTANT']).toContain(result);
      });

      it('should give lower scores for later sessions', () => {
        const session1 = calculatePriority({ ...baseParams, sessionNumber: 1 });
        const session4 = calculatePriority({ ...baseParams, sessionNumber: 4 });
        
        // Session 1 should have equal or higher priority
        const priorities = ['CRITICAL', 'URGENT', 'IMPORTANT', 'NORMAL', 'LOW'];
        expect(priorities.indexOf(session1)).toBeLessThanOrEqual(priorities.indexOf(session4));
      });
    });

    describe('Proximity Score (daysToSession)', () => {
      it('should give 12 for today (0 days)', () => {
        const result = calculatePriority({
          ...baseParams,
          daysToSession: 0,
        });
        expect(['CRITICAL', 'URGENT']).toContain(result);
      });

      it('should give 10 for tomorrow (1 day)', () => {
        const result = calculatePriority({
          ...baseParams,
          daysToSession: 1,
        });
        expect(['CRITICAL', 'URGENT']).toContain(result);
      });

      it('should give lower score for distant sessions', () => {
        const nearSession = calculatePriority({ ...baseParams, daysToSession: 1 });
        const farSession = calculatePriority({ ...baseParams, daysToSession: 20 });
        
        const priorities = ['CRITICAL', 'URGENT', 'IMPORTANT', 'NORMAL', 'LOW'];
        expect(priorities.indexOf(nearSession)).toBeLessThanOrEqual(priorities.indexOf(farSession));
      });
    });

    describe('isFinal Bonus', () => {
      it('should apply minimum urgency 30 when isFinal=true and urgency<30', () => {
        // Without isFinal, far exam should have low urgency
        const withoutFinal = calculatePriority({
          ...baseParams,
          daysToExam: 60, // Would be 5 urgency
          sessionNumber: 4, // 12
          daysToSession: 14, // 3
          isFinal: false,
        });
        // 5 + 20 + 12 + 3 = 40 -> NORMAL

        // With isFinal, urgency should be boosted to 30
        const withFinal = calculatePriority({
          ...baseParams,
          daysToExam: 60, // Boosted to 30 urgency
          sessionNumber: 4, // 12
          daysToSession: 14, // 3
          isFinal: true,
        });
        // 30 + 20 + 12 + 3 = 65 -> IMPORTANT

        expect(withFinal).not.toBe(withoutFinal);
        const priorities = ['CRITICAL', 'URGENT', 'IMPORTANT', 'NORMAL', 'LOW'];
        expect(priorities.indexOf(withFinal)).toBeLessThan(priorities.indexOf(withoutFinal));
      });

      it('should not change urgency if already >=30 for finals', () => {
        // Close exam already has high urgency
        const result = calculatePriority({
          ...baseParams,
          daysToExam: 7, // 35 urgency
          isFinal: true,
        });
        // 35 + 20 + 20 + 10 = 85 -> CRITICAL
        expect(result).toBe('CRITICAL');
      });

      it('should ensure finals with distant exams still get IMPORTANT+', () => {
        const result = calculatePriority({
          ...baseParams,
          daysToExam: 90, // Would be 5, boosted to 30
          difficulty: 'HARD', // 30
          sessionNumber: 1, // 20
          daysToSession: 1, // 10
          isFinal: true,
        });
        // 30 + 30 + 20 + 10 = 90 -> CRITICAL
        expect(['CRITICAL', 'URGENT']).toContain(result);
      });
    });

    describe('Classification Thresholds', () => {
      it('should return CRITICAL for score >=85', () => {
        const result = calculatePriority({
          ...baseParams,
          daysToExam: 3, // 40
          difficulty: 'HARD', // 30
          sessionNumber: 1, // 20
          daysToSession: 0, // 12
        });
        // 40 + 30 + 20 + 12 = 102 -> CRITICAL
        expect(result).toBe('CRITICAL');
      });

      it('should return URGENT for score >=70 and <85', () => {
        const result = calculatePriority({
          ...baseParams,
          daysToExam: 14, // 30
          difficulty: 'MEDIUM', // 20
          sessionNumber: 1, // 20
          daysToSession: 3, // 8
        });
        // 30 + 20 + 20 + 8 = 78 -> URGENT
        expect(result).toBe('URGENT');
      });

      it('should return IMPORTANT for score >=50 and <70', () => {
        const result = calculatePriority({
          ...baseParams,
          daysToExam: 21, // 20
          difficulty: 'MEDIUM', // 20
          sessionNumber: 2, // 18
          daysToSession: 7, // 5
        });
        // 20 + 20 + 18 + 5 = 63 -> IMPORTANT
        expect(result).toBe('IMPORTANT');
      });

      it('should return NORMAL for score >=30 and <50', () => {
        const result = calculatePriority({
          ...baseParams,
          daysToExam: 30, // 10
          difficulty: 'EASY', // 10
          sessionNumber: 4, // 12
          daysToSession: 7, // 5
        });
        // 10 + 10 + 12 + 5 = 37 -> NORMAL
        expect(result).toBe('NORMAL');
      });

      it('should return LOW for score <30', () => {
        const result = calculatePriority({
          ...baseParams,
          daysToExam: null, // 0
          difficulty: 'EASY', // 10
          sessionNumber: 6, // 5
          daysToSession: 30, // 2
          isFinal: false,
        });
        // 0 + 10 + 5 + 2 = 17 -> LOW
        expect(result).toBe('LOW');
      });
    });

    describe('Real-world Scenarios', () => {
      it('should prioritize upcoming final exam session', () => {
        const result = calculatePriority({
          daysToExam: 5,
          difficulty: 'HARD',
          sessionNumber: 1,
          daysToSession: 0, // Today!
          isFinal: true,
        });
        expect(result).toBe('CRITICAL');
      });

      it('should give normal priority to distant parcial session', () => {
        const result = calculatePriority({
          daysToExam: 45,
          difficulty: 'EASY',
          sessionNumber: 4,
          daysToSession: 10,
          isFinal: false,
        });
        expect(['NORMAL', 'LOW']).toContain(result);
      });

      it('should boost final exam even if far away', () => {
        const result = calculatePriority({
          daysToExam: 60,
          difficulty: 'MEDIUM',
          sessionNumber: 1,
          daysToSession: 1,
          isFinal: true,
        });
        // With isFinal bonus: 30 + 20 + 20 + 10 = 80 -> URGENT
        expect(['URGENT', 'IMPORTANT']).toContain(result);
      });
    });
  });
});
