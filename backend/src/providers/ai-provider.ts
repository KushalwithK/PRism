import type { AIGenerationResult } from '@prism/shared';

export interface AIProvider {
  readonly name: string;
  generate(prompt: string): Promise<AIGenerationResult>;
}
