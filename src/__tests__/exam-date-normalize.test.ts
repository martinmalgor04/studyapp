import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { normalizeExamDateToIso } from '@/lib/utils/exam-date-normalize';

describe('normalizeExamDateToIso', () => {
  it('convierte DD/MM/AAAA a ISO', () => {
    expect(normalizeExamDateToIso('13/07/2026')).toBe('2026-07-13');
  });

  it('acepta YYYY-MM-DD válido', () => {
    expect(normalizeExamDateToIso('2026-07-13')).toBe('2026-07-13');
  });

  it('convierte DD-MM-AAAA con guiones (día primero)', () => {
    expect(normalizeExamDateToIso('01-02-2026')).toBe('2026-02-01');
  });

  it('devuelve null para vacío o solo espacios', () => {
    expect(normalizeExamDateToIso('')).toBeNull();
    expect(normalizeExamDateToIso('   ')).toBeNull();
  });

  it('devuelve null para basura', () => {
    expect(normalizeExamDateToIso('no-es-una-fecha')).toBeNull();
    expect(normalizeExamDateToIso('32/01/2026')).toBeNull();
    expect(normalizeExamDateToIso('2026-13-01')).toBeNull();
  });

  describe('DD/MM sin año', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(Date.UTC(2026, 5, 1, 12, 0, 0)));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('usa el año actual', () => {
      expect(normalizeExamDateToIso('15/06')).toBe('2026-06-15');
    });
  });
});
