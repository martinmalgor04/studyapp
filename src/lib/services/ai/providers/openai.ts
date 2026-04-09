import OpenAI from 'openai';
import { logger } from '@/lib/utils/logger';
import type {
  AIProvider,
  AIExtractionErrorDetail,
  ExtractionRawResult,
  RawExtraction,
} from '../types';

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_TOKENS = 4_096;

const IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
]);

const TEXT_MIME_TYPES = new Set(['application/json', 'text/plain']);

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';

  private client: OpenAI;
  private model: string;
  private timeoutMs: number;
  private maxTokens: number;

  constructor(apiKey: string) {
    this.model = process.env.AI_MODEL || DEFAULT_MODEL;
    this.timeoutMs = Number(process.env.AI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
    this.maxTokens = Number(process.env.AI_MAX_TOKENS) || DEFAULT_MAX_TOKENS;

    this.client = new OpenAI({
      apiKey,
      timeout: this.timeoutMs,
    });
  }

  async extractFromPDF(
    fileBuffer: Buffer,
    mimeType: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<ExtractionRawResult> {
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
        `[AI:OpenAI] Falló extracción con ${primaryModel}, probando AI_FALLBACK_MODEL=${fallbackModel}`,
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
        provider: 'openai',
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
          provider: 'openai',
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
    model: string,
  ): Promise<ExtractionRawResult> {
    const base64 = fileBuffer.toString('base64');

    try {
      const fileContent = TEXT_MIME_TYPES.has(mimeType)
        ? ({
            type: 'text',
            text: fileBuffer.toString('utf8'),
          } satisfies OpenAI.Chat.Completions.ChatCompletionContentPart)
        : this.buildFileContent(base64, mimeType);

      logger.info(
        `[AI:OpenAI] Sending ${mimeType} (${(fileBuffer.length / 1024).toFixed(1)} KB) to ${model}`,
      );

      const completion = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              fileContent,
              { type: 'text', text: userPrompt },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: this.maxTokens,
        temperature: 0.1,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        return {
          success: false,
          error: 'El modelo no devolvió contenido en la respuesta',
          model,
          tokensUsed: completion.usage?.total_tokens,
          errorDetail: {
            phase: 'extraction',
            provider: 'openai',
            category: 'api',
            model,
          },
        };
      }

      try {
        const parsed = this.parseResponse(content);
        logger.info(
          `[AI:OpenAI] Extracción exitosa — ${completion.usage?.total_tokens ?? '?'} tokens`,
        );
        return {
          success: true,
          data: parsed,
          model,
          tokensUsed: completion.usage?.total_tokens,
        };
      } catch {
        return {
          success: false,
          error: 'Respuesta del modelo no es JSON válido',
          model,
          tokensUsed: completion.usage?.total_tokens,
          errorDetail: {
            phase: 'extraction',
            provider: 'openai',
            category: 'parse',
            model,
          },
        };
      }
    } catch (error) {
      return this.handleError(error, model);
    }
  }

  /**
   * Construye el content part adecuado según el tipo MIME:
   * - PDFs → content type "file" con data URI
   * - Imágenes → content type "image_url" con data URI
   * - `application/json` / `text/plain` se manejan arriba como `type: "text"` (p. ej. TopicGrouper).
   */
  private buildFileContent(
    base64: string,
    mimeType: string,
  ): OpenAI.Chat.Completions.ChatCompletionContentPart {
    if (IMAGE_MIME_TYPES.has(mimeType)) {
      return {
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${base64}` },
      };
    }

    return {
      type: 'file',
      file: {
        filename: 'document.pdf',
        file_data: `data:${mimeType};base64,${base64}`,
      },
    } as OpenAI.Chat.Completions.ChatCompletionContentPart;
  }

  private parseResponse(content: string): RawExtraction {
    const json = JSON.parse(content);
    return json as RawExtraction;
  }

  private handleError(error: unknown, model: string): ExtractionRawResult {
    if (error instanceof OpenAI.APIConnectionError) {
      logger.error('[AI:OpenAI] Error de conexión:', error.message);
      return {
        success: false,
        error: `Error de conexión con OpenAI: ${error.message}`,
        model,
        errorDetail: {
          phase: 'extraction',
          provider: 'openai',
          category: 'connection',
          model,
        },
      };
    }

    if (error instanceof OpenAI.RateLimitError) {
      logger.error('[AI:OpenAI] Rate limit alcanzado');
      return {
        success: false,
        error: 'Rate limit de OpenAI alcanzado. Intentá de nuevo en unos minutos.',
        model,
        errorDetail: {
          phase: 'extraction',
          provider: 'openai',
          category: 'rate_limit',
          model,
          httpStatus: 429,
        },
      };
    }

    if (error instanceof OpenAI.APIError) {
      logger.error(`[AI:OpenAI] API error (${error.status}):`, error.message);

      if (error.status === 401) {
        return {
          success: false,
          error: 'API key de OpenAI inválida. Verificá AI_API_KEY en .env.local',
          model,
          errorDetail: {
            phase: 'extraction',
            provider: 'openai',
            category: 'auth',
            model,
            httpStatus: 401,
          },
        };
      }

      return {
        success: false,
        error: `Error de OpenAI (${error.status}): ${error.message}`,
        model,
        errorDetail: {
          phase: 'extraction',
          provider: 'openai',
          category: 'api',
          model,
          httpStatus: error.status ?? undefined,
        },
      };
    }

    if (error instanceof Error && error.message.includes('timed out')) {
      logger.error('[AI:OpenAI] Timeout:', error.message);
      return {
        success: false,
        error: `Timeout (${this.timeoutMs}ms). Podés aumentar AI_TIMEOUT_MS en .env.local`,
        model,
        errorDetail: {
          phase: 'extraction',
          provider: 'openai',
          category: 'timeout',
          model,
        },
      };
    }

    const message = error instanceof Error ? error.message : String(error);
    logger.error('[AI:OpenAI] Error inesperado:', message);
    return {
      success: false,
      error: `Error inesperado: ${message}`,
      model,
      errorDetail: {
        phase: 'extraction',
        provider: 'openai',
        category: 'unknown',
        model,
      },
    };
  }
}
