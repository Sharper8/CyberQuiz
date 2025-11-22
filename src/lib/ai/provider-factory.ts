import { AIProvider } from './providers/base';
import { OllamaProvider } from './providers/ollama';
import { OpenAIProvider } from './providers/openai';
import { logger } from '../logging/logger';

/**
 * AI Provider Factory
 * Returns appropriate provider based on availability and config
 * Preference order: Ollama (local) -> OpenAI (if enabled)
 */

let ollamaProvider: OllamaProvider | null = null;
let openaiProvider: OpenAIProvider | null = null;

/**
 * Initialize providers on first use
 */
function initializeProviders(): void {
  if (!ollamaProvider) {
    ollamaProvider = new OllamaProvider();
  }

  if (!openaiProvider) {
    const allowExternal = process.env.ALLOW_EXTERNAL_AI === 'true';
    if (allowExternal) {
      openaiProvider = new OpenAIProvider();
    }
  }
}

/**
 * Get provider by name
 * Validates provider is available before returning
 */
export async function getAIProvider(preferredName?: string): Promise<AIProvider> {
  initializeProviders();

  if (preferredName === 'openai' && openaiProvider) {
    const available = await openaiProvider.isAvailable();
    if (available) {
      logger.debug('[ProviderFactory] Using OpenAI provider');
      return openaiProvider;
    }
  }

  if (preferredName === 'ollama' && ollamaProvider) {
    const available = await ollamaProvider.isAvailable();
    if (available) {
      logger.debug('[ProviderFactory] Using Ollama provider');
      return ollamaProvider;
    }
  }

  // Fallback: try Ollama first (local), then OpenAI
  if (ollamaProvider) {
    const available = await ollamaProvider.isAvailable();
    if (available) {
      logger.debug('[ProviderFactory] Using Ollama provider (fallback)');
      return ollamaProvider;
    }
  }

  if (openaiProvider) {
    const available = await openaiProvider.isAvailable();
    if (available) {
      logger.debug('[ProviderFactory] Using OpenAI provider (fallback)');
      return openaiProvider;
    }
  }

  throw new Error('No AI provider available');
}

/**
 * Get all available providers
 */
export function getAvailableProviders(): string[] {
  initializeProviders();
  const available: string[] = [];

  if (ollamaProvider?.isAvailable()) available.push('ollama');
  if (openaiProvider?.isAvailable()) available.push('openai');

  return available;
}

/**
 * Check if specific provider is available
 */
export async function isProviderAvailable(name: string): Promise<boolean> {
  initializeProviders();

  if (name === 'ollama') return (await ollamaProvider?.isAvailable()) || false;
  if (name === 'openai') return (await openaiProvider?.isAvailable()) || false;

  return false;
}
