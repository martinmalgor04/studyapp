import {
  GoogleGenerativeAI,
  type EnhancedGenerateContentResponse,
  FinishReason,
  BlockReason,
} from '@google/generative-ai';
import { logger } from '@/lib/utils/logger';
import type {
  AIProvider,
  AIExtractionErrorDetail,
  ExtractionRawResult,
  RawExtraction,
} from '../types';

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

/** JSON/texto UTF-8 (p. ej. `TopicGrouper` envía `application/json` vía buffer, no PDF). */
const TEXT_MIME_TYPES = new Set(['application/json', 'text/plain']);

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
    if (!this.isSupportedMimeType(mimeType)) {
      return {
        success: false,
        error: `Tipo MIME no soportado para Gemini: ${mimeType}`,
        model: this.model,
        errorDetail: {
          phase: 'extraction',
          provider: 'google',
          category: 'unknown',
          model: this.model,
        },
      };
    }

    const primaryModel = this.model;
    const fallbackRaw = process.env.AI_FALLBACK_MODEL?.trim();
    const fallbackModel =
      fallbackRaw && fallbackRaw !== primaryModel ? fallbackRaw : undefined;

    const first = await this.extractWithModel(
      fileBuffer,
      mimeType,
      systemPrompt,
      userPrompt,
      primaryModel,
    );
    if (first.success) return first;

    if (fallbackModel) {
      logger.warn(
        `[AI:Google] Falló extracción con ${primaryModel}, probando AI_FALLBACK_MODEL=${fallbackModel}`,
      );
      const second = await this.extractWithModel(
        fileBuffer,
        mimeType,
        systemPrompt,
        userPrompt,
        fallbackModel,
      );
      if (second.success) return second;

      const cat =
        second.errorDetail?.category ??
        first.errorDetail?.category ??
        'unknown';
      const merged: AIExtractionErrorDetail = {
        phase: 'extraction',
        provider: 'google',
        category: cat,
        model: second.model ?? fallbackModel,
        httpStatus:
          second.errorDetail?.httpStatus ?? first.errorDetail?.httpStatus,
        fallbackFromModel: primaryModel,
        primaryAttemptError: first.error,
      };
      return {
        success: false,
        error: second.error ?? first.error,
        model: second.model ?? fallbackModel,
        tokensUsed: second.tokensUsed ?? first.tokensUsed,
        errorDetail: merged,
      };
    }

    return {
      ...first,
      errorDetail:
        first.errorDetail ??
        ({
          phase: 'extraction',
          provider: 'google',
          category: 'unknown',
          model: primaryModel,
        } satisfies AIExtractionErrorDetail),
    };
  }

  private async extractWithModel(
    fileBuffer: Buffer,
    mimeType: string,
    systemPrompt: string,
    userPrompt: string,
    modelName: string,
  ): Promise<ExtractionRawResult> {
    const useTextPayload = TEXT_MIME_TYPES.has(mimeType);

    try {
      const genModel = this.client.getGenerativeModel(
        {
          model: modelName,
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
        `[AI:Google] Enviando ${mimeType} (${(fileBuffer.length / 1024).toFixed(1)} KB) a ${modelName}${useTextPayload ? ' [texto]' : ''}`,
      );

      const userParts = useTextPayload
        ? [{ text: fileBuffer.toString('utf8') }, { text: userPrompt }]
        : [
            {
              inlineData: {
                mimeType,
                data: fileBuffer.toString('base64'),
              },
            },
            { text: userPrompt },
          ];

      const result = await genModel.generateContent(userParts);

      const response = result.response;
      const blockError = this.checkPromptBlocked(response);
      if (blockError) {
        return {
          success: false,
          error: blockError,
          model: modelName,
          errorDetail: {
            phase: 'extraction',
            provider: 'google',
            category: 'blocked',
            model: modelName,
          },
        };
      }

      const finishError = this.checkFinishReason(response);
      if (finishError) {
        return {
          success: false,
          error: finishError,
          model: modelName,
          errorDetail: {
            phase: 'extraction',
            provider: 'google',
            category: 'api',
            model: modelName,
          },
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
          model: modelName,
          errorDetail: {
            phase: 'extraction',
            provider: 'google',
            category: 'blocked',
            model: modelName,
          },
        };
      }

      if (!text?.trim()) {
        return {
          success: false,
          error: 'El modelo no devolvió contenido en la respuesta',
          model: modelName,
          errorDetail: {
            phase: 'extraction',
            provider: 'google',
            category: 'api',
            model: modelName,
          },
        };
      }

      try {
        const parsed = this.parseResponse(text);
        const tokensUsed = response.usageMetadata?.totalTokenCount;
        logger.info(
          `[AI:Google] Extracción exitosa — ${tokensUsed ?? '?'} tokens`,
        );
        return {
          success: true,
          data: parsed,
          model: modelName,
          tokensUsed,
        };
      } catch {
        return {
          success: false,
          error: 'Respuesta del modelo no es JSON válido',
          model: modelName,
          errorDetail: {
            phase: 'extraction',
            provider: 'google',
            category: 'parse',
            model: modelName,
          },
        };
      }
    } catch (error) {
      return this.handleError(error, modelName);
    }
  }

  private isSupportedMimeType(mimeType: string): boolean {
    return (
      mimeType === 'application/pdf' ||
      IMAGE_MIME_TYPES.has(mimeType) ||
      TEXT_MIME_TYPES.has(mimeType)
    );
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
    const json = JSON.parse(content) as RawExtraction;
    return json;
  }

  private handleError(error: unknown, model: string): ExtractionRawResult {
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
        model,
        errorDetail: {
          phase: 'extraction',
          provider: 'google',
          category: 'connection',
          model,
        },
      };
    }

    if (lower.includes('timeout') || message.includes('AbortError')) {
      logger.error('[AI:Google] Timeout:', message);
      return {
        success: false,
        error: `Timeout (${this.timeoutMs}ms). Podés aumentar AI_TIMEOUT_MS en .env.local`,
        model,
        errorDetail: {
          phase: 'extraction',
          provider: 'google',
          category: 'timeout',
          model,
        },
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
        model,
        errorDetail: {
          phase: 'extraction',
          provider: 'google',
          category: 'rate_limit',
          model,
          httpStatus: 429,
        },
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
        model,
        errorDetail: {
          phase: 'extraction',
          provider: 'google',
          category: 'auth',
          model,
          httpStatus: lower.includes('401') ? 401 : 403,
        },
      };
    }

    logger.error('[AI:Google] Error inesperado:', message);
    return {
      success: false,
      error: `Error inesperado: ${message}`,
      model,
      errorDetail: {
        phase: 'extraction',
        provider: 'google',
        category: 'unknown',
        model,
      },
    };
  }
}
