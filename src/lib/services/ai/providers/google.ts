import {
  GoogleGenerativeAI,
  type EnhancedGenerateContentResponse,
  FinishReason,
  BlockReason,
} from '@google/generative-ai';
import { logger } from '@/lib/utils/logger';
import type { AIProvider, ExtractionRawResult, RawExtraction } from '../types';

/** Default: modelo rápido con soporte multimodal (PDF/imagen) vía Google AI Studio. */
const DEFAULT_MODEL = 'gemini-2.0-flash';
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_TOKENS = 8_192;

const IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
]);

export class GoogleProvider implements AIProvider {
  readonly name = 'google';

  private readonly client: GoogleGenerativeAI;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly maxTokens: number;

  constructor(apiKey: string) {
    this.model = process.env.AI_MODEL || DEFAULT_MODEL;
    this.timeoutMs = Number(process.env.AI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
    this.maxTokens = Number(process.env.AI_MAX_TOKENS) || DEFAULT_MAX_TOKENS;
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async extractFromPDF(
    fileBuffer: Buffer,
    mimeType: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<ExtractionRawResult> {
    const base64 = fileBuffer.toString('base64');

    if (!this.isSupportedMimeType(mimeType)) {
      return {
        success: false,
        error: `Tipo MIME no soportado para Gemini: ${mimeType}`,
        model: this.model,
      };
    }

    try {
      const model = this.client.getGenerativeModel(
        {
          model: this.model,
          systemInstruction: systemPrompt,
          generationConfig: {
            maxOutputTokens: this.maxTokens,
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        },
        { timeout: this.timeoutMs },
      );

      logger.info(
        `[AI:Google] Enviando ${mimeType} (${(fileBuffer.length / 1024).toFixed(1)} KB) a ${this.model}`,
      );

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: base64,
          },
        },
        { text: userPrompt },
      ]);

      const response = result.response;
      const blockError = this.checkPromptBlocked(response);
      if (blockError) {
        return {
          success: false,
          error: blockError,
          model: this.model,
        };
      }

      const finishError = this.checkFinishReason(response);
      if (finishError) {
        return {
          success: false,
          error: finishError,
          model: this.model,
        };
      }

      let text: string;
      try {
        text = response.text();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error('[AI:Google] response.text() falló:', msg);
        return {
          success: false,
          error:
            'La respuesta fue bloqueada por políticas de seguridad o no se pudo leer el texto.',
          model: this.model,
        };
      }

      if (!text?.trim()) {
        return {
          success: false,
          error: 'El modelo no devolvió contenido en la respuesta',
          model: this.model,
        };
      }

      const parsed = this.parseResponse(text);
      const tokensUsed = response.usageMetadata?.totalTokenCount;

      logger.info(
        `[AI:Google] Extracción exitosa — ${tokensUsed ?? '?'} tokens`,
      );

      return {
        success: true,
        data: parsed,
        model: this.model,
        tokensUsed,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private isSupportedMimeType(mimeType: string): boolean {
    return mimeType === 'application/pdf' || IMAGE_MIME_TYPES.has(mimeType);
  }

  private checkPromptBlocked(
    response: EnhancedGenerateContentResponse,
  ): string | null {
    const pf = response.promptFeedback;
    if (!pf) return null;
    if (
      pf.blockReason &&
      pf.blockReason !== BlockReason.BLOCKED_REASON_UNSPECIFIED
    ) {
      return `El prompt fue bloqueado (${pf.blockReason}). ${pf.blockReasonMessage ?? 'Probá con otro PDF o contactá soporte.'}`;
    }
    return null;
  }

  private checkFinishReason(
    response: EnhancedGenerateContentResponse,
  ): string | null {
    const fr = response.candidates?.[0]?.finishReason;
    if (!fr || fr === FinishReason.STOP) {
      return null;
    }
    if (fr === FinishReason.MAX_TOKENS) {
      return (
        `La salida se cortó por límite de tokens (maxOutputTokens=${this.maxTokens}). ` +
        `Subí AI_MAX_TOKENS en .env.local o probá con un PDF más corto.`
      );
    }
    if (fr === FinishReason.FINISH_REASON_UNSPECIFIED) {
      return null;
    }
    return this.mapFinishReasonToMessage(fr);
  }

  private mapFinishReasonToMessage(reason: FinishReason): string {
    switch (reason) {
      case FinishReason.SAFETY:
      case FinishReason.BLOCKLIST:
      case FinishReason.PROHIBITED_CONTENT:
        return 'La respuesta fue filtrada por seguridad. Probá con otro documento o revisá el contenido.';
      case FinishReason.RECITATION:
        return 'El modelo evitó reproducir contenido con posibles problemas de derechos de autor.';
      case FinishReason.LANGUAGE:
        return 'El modelo no pudo procesar el idioma o formato del documento.';
      case FinishReason.SPII:
        return 'Se detectó información personal sensible; no se puede completar la extracción.';
      default:
        return `Generación detenida (${reason}). Intentá de nuevo o con otro archivo.`;
    }
  }

  private parseResponse(content: string): RawExtraction {
    try {
      const json = JSON.parse(content) as RawExtraction;
      return json;
    } catch {
      throw new Error(
        `Respuesta del modelo no es JSON válido: ${content.slice(0, 200)}...`,
      );
    }
  }

  private handleError(error: unknown): ExtractionRawResult {
    const message = error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();

    if (
      lower.includes('fetch failed') ||
      lower.includes('network') ||
      lower.includes('econnrefused')
    ) {
      logger.error('[AI:Google] Error de red:', message);
      return {
        success: false,
        error: `Error de conexión con Google AI: ${message}`,
        model: this.model,
      };
    }

    if (lower.includes('timeout') || message.includes('AbortError')) {
      logger.error('[AI:Google] Timeout:', message);
      return {
        success: false,
        error: `Timeout (${this.timeoutMs}ms). Podés aumentar AI_TIMEOUT_MS en .env.local`,
        model: this.model,
      };
    }

    if (
      lower.includes('429') ||
      lower.includes('resource exhausted') ||
      lower.includes('quota')
    ) {
      logger.error('[AI:Google] Cuota / rate limit');
      return {
        success: false,
        error:
          'Cuota o límite de velocidad de Google AI alcanzado. Intentá más tarde.',
        model: this.model,
      };
    }

    if (
      lower.includes('401') ||
      lower.includes('403') ||
      lower.includes('api key') ||
      lower.includes('invalid')
    ) {
      logger.error('[AI:Google] API key inválida o sin permiso:', message);
      return {
        success: false,
        error:
          'API key de Google AI inválida o sin acceso. Verificá AI_API_KEY en .env.local (Google AI Studio).',
        model: this.model,
      };
    }

    logger.error('[AI:Google] Error inesperado:', message);
    return {
      success: false,
      error: `Error inesperado: ${message}`,
      model: this.model,
    };
  }
}
