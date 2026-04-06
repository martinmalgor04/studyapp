import { describe, it, expect } from 'vitest';
import { generatePreClassSessions } from '@/lib/services/pre-class-generator';

describe('pre-class-generator (SA-96)', () => {
  it('mismo día UTC que la clase y generatedAt: scheduled_at no queda antes de generatedAt', () => {
    const classDate = new Date(Date.UTC(2026, 3, 6, 0, 0, 0));
    const generatedAt = new Date(Date.UTC(2026, 3, 6, 12, 0, 0));

    const sessions = generatePreClassSessions({
      userId: 'user-1',
      subjectId: 'sub-1',
      schedule: [{ day: 'Lunes', startTime: '18:00', endTime: '20:00' }],
      topicsWithDates: [
        {
          id: 'topic-1',
          subject_id: 'sub-1',
          exam_id: null,
          name: 'Tema 1',
          hours: 60,
          classDate,
        },
      ],
      examDates: [],
      generatedAt,
      options: {
        studyHours: { startHour: '09:00', endHour: '23:00' },
      },
    });

    expect(sessions.length).toBe(1);
    const scheduled = new Date(sessions[0]!.scheduled_at);
    expect(scheduled.getTime()).toBeGreaterThanOrEqual(generatedAt.getTime());
  });

  it('sin hueco antes de la cursada (clase muy temprano, generatedAt tarde): omite pre-clase', () => {
    const classDate = new Date(Date.UTC(2026, 3, 6, 0, 0, 0));
    const generatedAt = new Date(Date.UTC(2026, 3, 6, 14, 0, 0));

    const sessions = generatePreClassSessions({
      userId: 'user-1',
      subjectId: 'sub-1',
      schedule: [{ day: 'Lunes', startTime: '08:00', endTime: '10:00' }],
      topicsWithDates: [
        {
          id: 'topic-1',
          subject_id: 'sub-1',
          exam_id: null,
          name: 'Tema 1',
          hours: 60,
          classDate,
        },
      ],
      examDates: [],
      generatedAt,
      options: {
        studyHours: { startHour: '09:00', endHour: '23:00' },
      },
    });

    expect(sessions.length).toBe(0);
  });
});
