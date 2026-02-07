import { config } from '../config.js';
import type { AIProvider } from './ai-provider.js';
import { GeminiProvider } from './gemini.js';

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!provider) {
    // Default to Gemini; extend this factory for other providers
    provider = new GeminiProvider(config.gemini.apiKey);
  }
  return provider;
}
