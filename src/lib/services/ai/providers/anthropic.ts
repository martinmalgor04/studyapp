import type { AIProvider, ExtractionRawResult } from '../types';

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';

  constructor(_apiKey: string) {
    // API key almacenada para uso futuro cuando se implemente
  }

  async extractFromPDF(
    _fileBuffer: Buffer,
    _mimeType: string,
    _systemPrompt: string,
    _userPrompt: string,
  ): Promise<ExtractionRawResult> {
    throw new Error(
      'Anthropic provider no implementado. Configurá AI_PROVIDER=openai en .env.local',
    );
  }
}
