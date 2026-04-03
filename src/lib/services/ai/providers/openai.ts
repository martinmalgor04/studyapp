import OpenAI from 'openai';
import { logger } from '@/lib/utils/logger';
import type { AIProvider, ExtractionRawResult, RawExtraction } from '../types';

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
    const base64 = fileBuffer.toString('base64');

    try {
      const fileContent = this.buildFileContent(base64, mimeType);

      logger.info(
        `[AI:OpenAI] Sending ${mimeType} (${(fileBuffer.length / 1024).toFixed(1)} KB) to ${this.model}`,
      );

      const completion = await this.client.chat.completions.create({
        model: this.model,
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
          model: this.model,
          tokensUsed: completion.usage?.total_tokens,
        };
      }

      const parsed = this.parseResponse(content);

      logger.info(
        `[AI:OpenAI] Extracción exitosa — ${completion.usage?.total_tokens ?? '?'} tokens`,
      );

      return {
        success: true,
        data: parsed,
        model: this.model,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Construye el content part adecuado según el tipo MIME:
   * - PDFs → content type "file" con data URI
   * - Imágenes → content type "image_url" con data URI
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

    // PDFs y otros documentos: usar file content type
    // Compatible con gpt-4o, gpt-4o-mini y modelos posteriores
    return {
      type: 'file',
      file: {
        filename: 'document.pdf',
        file_data: `data:${mimeType};base64,${base64}`,
      },
    } as OpenAI.Chat.Completions.ChatCompletionContentPart;
  }

  private parseResponse(content: string): RawExtraction {
    try {
      const json = JSON.parse(content);
      return json as RawExtraction;
    } catch {
      throw new Error(
        `Respuesta del modelo no es JSON válido: ${content.slice(0, 200)}...`,
      );
    }
  }

  private handleError(error: unknown): ExtractionRawResult {
    if (error instanceof OpenAI.APIConnectionError) {
      logger.error('[AI:OpenAI] Error de conexión:', error.message);
      return {
        success: false,
        error: `Error de conexión con OpenAI: ${error.message}`,
        model: this.model,
      };
    }

    if (error instanceof OpenAI.RateLimitError) {
      logger.error('[AI:OpenAI] Rate limit alcanzado');
      return {
        success: false,
        error: 'Rate limit de OpenAI alcanzado. Intentá de nuevo en unos minutos.',
        model: this.model,
      };
    }

    if (error instanceof OpenAI.APIError) {
      logger.error(
        `[AI:OpenAI] API error (${error.status}):`,
        error.message,
      );

      if (error.status === 401) {
        return {
          success: false,
          error: 'API key de OpenAI inválida. Verificá AI_API_KEY en .env.local',
          model: this.model,
        };
      }

      return {
        success: false,
        error: `Error de OpenAI (${error.status}): ${error.message}`,
        model: this.model,
      };
    }

    if (error instanceof Error && error.message.includes('timed out')) {
      logger.error('[AI:OpenAI] Timeout:', error.message);
      return {
        success: false,
        error: `Timeout (${this.timeoutMs}ms). Podés aumentar AI_TIMEOUT_MS en .env.local`,
        model: this.model,
      };
    }

    const message = error instanceof Error ? error.message : String(error);
    logger.error('[AI:OpenAI] Error inesperado:', message);
    return {
      success: false,
      error: `Error inesperado: ${message}`,
      model: this.model,
    };
  }
}
