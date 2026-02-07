import type { AIGenerationResult } from '@prism/shared';
import type { AIProvider } from './ai-provider.js';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';

  constructor(private apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
  }

  async generate(prompt: string): Promise<AIGenerationResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    try {
      const parsed = JSON.parse(text) as AIGenerationResult;

      if (!parsed.title || !parsed.placeholders) {
        throw new Error('Invalid response structure');
      }

      return parsed;
    } catch (e) {
      // Try to extract JSON from the response if it's wrapped in markdown
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1].trim()) as AIGenerationResult;
        if (parsed.title && parsed.placeholders) {
          return parsed;
        }
      }
      throw new Error(`Failed to parse Gemini response: ${(e as Error).message}`);
    }
  }
}
