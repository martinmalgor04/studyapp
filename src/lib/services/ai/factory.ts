import type { AIProvider } from './types';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { GoogleProvider } from './providers/google';

const SUPPORTED_PROVIDERS = ['openai', 'anthropic', 'google'] as const;
type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

/**
 * Crea la instancia del AIProvider según la env var AI_PROVIDER.
 * Default: openai. Requiere AI_API_KEY configurada.
 */
export function getAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER || 'openai') as string;
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'AI_API_KEY no configurada. Agregala a .env.local',
    );
  }

  if (!SUPPORTED_PROVIDERS.includes(provider as SupportedProvider)) {
    throw new Error(
      `AI_PROVIDER '${provider}' no soportado. Opciones: ${SUPPORTED_PROVIDERS.join(', ')}`,
    );
  }

  switch (provider as SupportedProvider) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'anthropic':
      return new AnthropicProvider(apiKey);
    case 'google':
      return new GoogleProvider(apiKey);
  }
}
