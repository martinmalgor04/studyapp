import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerateContent = vi.fn();

vi.mock('@google/generative-ai', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@google/generative-ai')>();
  class MockGoogleGenerativeAI {
    getGenerativeModel() {
      return {
        generateContent: (...args: unknown[]) => mockGenerateContent(...args),
      };
    }
  }
  return {
    ...mod,
    GoogleGenerativeAI:
      MockGoogleGenerativeAI as unknown as typeof mod.GoogleGenerativeAI,
  };
});

import { GoogleProvider } from '@/lib/services/ai/providers/google';

const minimalJson = JSON.stringify({
  documentType: 'PROGRAMA',
  subjectMetadata: {},
  units: [
    {
      number: 1,
      name: 'Unidad 1',
      subtopics: ['Tema A'],
    },
  ],
});

describe('GoogleProvider (Gemini)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve RawExtraction cuando la API responde JSON válido', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => minimalJson,
        usageMetadata: { totalTokenCount: 42 },
        candidates: [{ finishReason: 'STOP' }],
      },
    });

    const provider = new GoogleProvider('test-api-key');
    const result = await provider.extractFromPDF(
      Buffer.from('%PDF-1.4 mock'),
      'application/pdf',
      'System',
      'User',
    );

    expect(result.success).toBe(true);
    expect(result.data?.documentType).toBe('PROGRAMA');
    expect(result.tokensUsed).toBe(42);
    expect(result.model).toContain('gemini');
  });

  it('devuelve error cuando la API falla', async () => {
    mockGenerateContent.mockRejectedValue(new Error('401 invalid API key'));

    const provider = new GoogleProvider('bad-key');
    const result = await provider.extractFromPDF(
      Buffer.from('x'),
      'application/pdf',
      'S',
      'U',
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/API key|inválida/i);
  });

  it('rechaza MIME no soportado', async () => {
    const provider = new GoogleProvider('k');
    const result = await provider.extractFromPDF(
      Buffer.from('x'),
      'application/zip',
      'S',
      'U',
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/no soportado/i);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('devuelve error claro cuando finishReason es MAX_TOKENS (salida truncada)', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => '{"documentType":"PROGRAMA","units":[{"number":1', // truncado a propósito
        usageMetadata: { totalTokenCount: 9000 },
        candidates: [{ finishReason: 'MAX_TOKENS' }],
      },
    });

    const provider = new GoogleProvider('test-api-key');
    const result = await provider.extractFromPDF(
      Buffer.from('%PDF-1.4 mock'),
      'application/pdf',
      'System',
      'User',
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/cortó|límite de tokens/i);
    expect(result.error).toMatch(/AI_MAX_TOKENS/);
    expect(result.error).toMatch(/8192/);
    expect(result.error).toMatch(/PDF más corto/i);
  });
});
