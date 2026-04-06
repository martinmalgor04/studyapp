import { describe, it, expect } from 'vitest';
import {
  earliestClassDateKeysForTopics,
  buildTopicDistributorInputFromWizard,
  toDateKey,
  type ScheduleBlock,
  type TentativeScheduleItem,
} from '@/lib/services/topic-distributor';

/** Medianoche UTC para fechas determinísticas en tests. */
function utcDate(y: number, m0: number, d: number): Date {
  return new Date(Date.UTC(y, m0, d, 0, 0, 0, 0));
}

const sampleSchedule: ScheduleBlock[] = [
  { day: 'Lunes', startTime: '09:00', endTime: '11:00' },
];

describe('Topic Distributor — pure helpers', () => {
  describe('earliestClassDateKeysForTopics', () => {
    it('devuelve null para cada topic si el calendario tentativo está vacío', () => {
      const topics = [{ id: 'a' }, { id: 'b' }];
      expect(earliestClassDateKeysForTopics([], topics)).toEqual([null, null]);
    });

    it('mapea cada id al dateKey UTC (YYYY-MM-DD) de su primera aparición en orden de ítems', () => {
      const d1 = utcDate(2026, 3, 10);
      const d2 = utcDate(2026, 3, 12);
      const tentative: TentativeScheduleItem[] = [
        {
          date: d1,
          dayOfWeek: 'Viernes',
          topicIds: ['t2', 't1'],
          isNew: true,
        },
        {
          date: d2,
          dayOfWeek: 'Domingo',
          topicIds: ['t1'],
          isNew: true,
        },
      ];
      const keys = earliestClassDateKeysForTopics(tentative, [
        { id: 't1' },
        { id: 't2' },
      ]);
      expect(keys).toEqual(['2026-04-10', '2026-04-10']);
    });

    it('si un topic aparece en varias fechas, elige la fecha más temprana (lexicográfica YYYY-MM-DD)', () => {
      const early = utcDate(2026, 1, 1);
      const late = utcDate(2026, 5, 20);
      const tentative: TentativeScheduleItem[] = [
        {
          date: late,
          dayOfWeek: 'Sábado',
          topicIds: ['x'],
          isNew: true,
        },
        {
          date: early,
          dayOfWeek: 'Domingo',
          topicIds: ['x'],
          isNew: true,
        },
      ];
      const keys = earliestClassDateKeysForTopics(tentative, [{ id: 'x' }]);
      expect(keys).toEqual(['2026-02-01']);
    });

    it('respeta el orden de topicsInOrder y devuelve null si el id no figura en ningún slot', () => {
      const d = utcDate(2026, 0, 15);
      const tentative: TentativeScheduleItem[] = [
        {
          date: d,
          dayOfWeek: 'Jueves',
          topicIds: ['solo'],
          isNew: true,
        },
      ];
      const keys = earliestClassDateKeysForTopics(tentative, [
        { id: 'missing' },
        { id: 'solo' },
      ]);
      expect(keys).toEqual([null, '2026-01-15']);
    });

    it('deduplica el mismo topicId repetido en el mismo slot (no altera la fecha más temprana)', () => {
      const d = utcDate(2026, 2, 3);
      const tentative: TentativeScheduleItem[] = [
        {
          date: d,
          dayOfWeek: 'Martes',
          topicIds: ['dup', 'dup', 'dup'],
          isNew: true,
        },
      ];
      const keys = earliestClassDateKeysForTopics(tentative, [{ id: 'dup' }]);
      expect(keys).toEqual([toDateKey(d)]);
    });
  });

  describe('buildTopicDistributorInputFromWizard', () => {
    it('ordena parciales por fecha ascendente (UTC) y asigna index 0..n-1 aunque el wizard venga en otro orden', () => {
      const start = utcDate(2026, 0, 1);
      const input = buildTopicDistributorInputFromWizard({
        schedule: sampleSchedule,
        topics: [
          { id: 't1', name: 'T1', hours: 60 },
          { id: 't2', name: 'T2', hours: 30 },
        ],
        parciales: [
          {
            index: 1,
            name: 'Segundo',
            date: '2026-06-15',
            assignedTopicIds: ['t2'],
          },
          {
            index: 0,
            name: 'Primero',
            date: '2026-03-01',
            assignedTopicIds: ['t1'],
          },
        ],
        startDate: start,
      });

      expect(input.parciales).toHaveLength(2);
      expect(input.parciales[0]).toMatchObject({
        index: 0,
        name: 'Primero',
      });
      expect(input.parciales[0].date.getTime()).toBe(utcDate(2026, 2, 1).getTime());

      expect(input.parciales[1]).toMatchObject({
        index: 1,
        name: 'Segundo',
      });
      expect(input.parciales[1].date.getTime()).toBe(utcDate(2026, 5, 15).getTime());

      const byId = Object.fromEntries(
        input.topics.map((t) => [t.id, t.parcialIndex]),
      );
      expect(byId).toEqual({ t1: 0, t2: 1 });
    });

    it('topic huérfano (no listado en ningún parcial) recibe parcialIndex 0', () => {
      const start = utcDate(2026, 0, 1);
      const input = buildTopicDistributorInputFromWizard({
        schedule: sampleSchedule,
        topics: [
          { id: 'asignado', name: 'A', hours: 45 },
          { id: 'huérfano', name: 'H', hours: 20 },
        ],
        parciales: [
          {
            index: 0,
            name: 'P1',
            date: '2026-04-01',
            assignedTopicIds: ['asignado'],
          },
          {
            index: 1,
            name: 'P2',
            date: '2026-05-01',
            assignedTopicIds: [],
          },
        ],
        startDate: start,
      });

      const orphan = input.topics.find((t) => t.id === 'huérfano');
      expect(orphan?.parcialIndex).toBe(0);

      const assigned = input.topics.find((t) => t.id === 'asignado');
      expect(assigned?.parcialIndex).toBe(0);
    });

    it('si un topic está asignado a dos parciales, gana el de fecha más temprana (menor índice tras ordenar)', () => {
      const start = utcDate(2026, 0, 1);
      const input = buildTopicDistributorInputFromWizard({
        schedule: sampleSchedule,
        topics: [{ id: 'ambos', name: 'Ambos', hours: 90 }],
        parciales: [
          {
            index: 0,
            name: 'Tarde',
            date: '2026-08-01',
            assignedTopicIds: ['ambos'],
          },
          {
            index: 0,
            name: 'Temprano',
            date: '2026-02-01',
            assignedTopicIds: ['ambos'],
          },
        ],
        startDate: start,
      });

      expect(input.parciales[0].name).toBe('Temprano');
      expect(input.topics[0].parcialIndex).toBe(0);
    });

    it('normaliza startDate a medianoche UTC', () => {
      const noisy = new Date(Date.UTC(2026, 3, 4, 14, 30, 45, 123));
      const input = buildTopicDistributorInputFromWizard({
        schedule: sampleSchedule,
        topics: [{ id: 't', name: 'T', hours: 10 }],
        parciales: [
          {
            index: 0,
            name: 'P',
            date: '2026-05-01',
            assignedTopicIds: ['t'],
          },
        ],
        startDate: noisy,
      });

      expect(input.startDate.getUTCHours()).toBe(0);
      expect(input.startDate.getUTCMinutes()).toBe(0);
      expect(input.startDate.getTime()).toBe(utcDate(2026, 3, 4).getTime());
    });
  });
});
