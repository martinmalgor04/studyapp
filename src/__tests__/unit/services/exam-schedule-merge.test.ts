import { describe, expect, it } from 'vitest';
import {
  mergeExamsWithScheduleDates,
  processExtractionResult,
} from '@/lib/services/ai/extraction-processor';
import type { NormalizedScheduleEntry } from '@/lib/services/ai/extraction-processor';

describe('mergeExamsWithScheduleDates', () => {
  it('rellena fecha del cronograma cuando el examen del modelo no tiene date y comparte unidad', () => {
    const exams = [
      {
        name: '1er Parcial',
        unitsIncluded: [1],
        type: 'PARCIAL' as const,
      },
    ];
    const normalizedSchedule: NormalizedScheduleEntry[] = [
      {
        date: '2026-05-20',
        topics: ['Parcial Unidad 1'],
        type: 'EXAM',
        unitNumbers: [1],
      },
    ];
    const merged = mergeExamsWithScheduleDates(exams, normalizedSchedule);
    expect(merged).toHaveLength(1);
    expect(merged![0].date).toBe('2026-05-20');
    expect(merged![0].name).toBe('1er Parcial');
  });

  it('sintetiza dos exams cuando el modelo no devolvió exams pero el schedule tiene EXAM', () => {
    const normalizedSchedule: NormalizedScheduleEntry[] = [
      {
        date: '2026-04-10',
        topics: ['Parcial unidad 1'],
        type: 'EXAM',
        unitNumbers: [1],
      },
      {
        date: '2026-06-01',
        topics: ['Parcial unidad 2'],
        type: 'EXAM',
        unitNumbers: [2],
      },
    ];
    const merged = mergeExamsWithScheduleDates(undefined, normalizedSchedule);
    expect(merged).toHaveLength(2);
    expect(merged![0].date).toBe('2026-04-10');
    expect(merged![1].date).toBe('2026-06-01');
    expect(merged![0].type).toBe('PARCIAL');
    expect(merged![1].unitsIncluded).toEqual([2]);
  });

  it('no sobrescribe la fecha que ya vino del modelo', () => {
    const exams = [
      {
        name: 'Parcial 1',
        date: '2026-06-01',
        unitsIncluded: [1],
        type: 'PARCIAL' as const,
      },
    ];
    const normalizedSchedule: NormalizedScheduleEntry[] = [
      {
        date: '2026-06-15',
        topics: ['Otro parcial'],
        type: 'EXAM',
        unitNumbers: [1],
      },
    ];
    const merged = mergeExamsWithScheduleDates(exams, normalizedSchedule);
    expect(merged).toHaveLength(1);
    expect(merged![0].date).toBe('2026-06-01');
  });

  it('devuelve exams sin cambio si normalizedSchedule está vacío', () => {
    const exams = [{ name: 'X', unitsIncluded: [], type: 'PARCIAL' as const }];
    expect(mergeExamsWithScheduleDates(exams, undefined)).toBe(exams);
    expect(mergeExamsWithScheduleDates(exams, [])).toBe(exams);
  });

  it('processExtractionResult aplica el merge al resultado final', () => {
    const raw = {
      documentType: 'PLANIFICACION',
      subjectMetadata: {},
      units: [
        { number: 1, name: 'Unidad 1', subtopics: ['a'] },
        { number: 2, name: 'Unidad 2', subtopics: ['b'] },
      ],
      schedule: [
        {
          date: '10/04/2026',
          topic: 'Parcial unidad 1',
          type: 'EXAM',
        },
        {
          date: '01/06/2026',
          topic: 'Parcial unidad 2',
          type: 'EXAM',
        },
      ],
      exams: [
        { name: 'Primer parcial', unitsIncluded: [1], type: 'PARCIAL' },
        { name: 'Segundo parcial', unitsIncluded: [2], type: 'PARCIAL' },
      ],
    };
    const out = processExtractionResult(raw);
    expect(out.exams).toBeDefined();
    expect(out.exams![0].date).toBe('2026-04-10');
    expect(out.exams![1].date).toBe('2026-06-01');
  });
});
