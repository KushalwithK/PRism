import type { AIGenerationResult } from '@prism/shared';
import type { AIProvider } from './ai-provider.js';

const RETRY_CONCISENESS_PREFIX = `IMPORTANT: Your previous response was too long and got truncated. Be much more concise. Use 2-4 bullet points per placeholder max. Keep the total response under 2000 tokens.\n\n`;

/**
 * Attempt to repair truncated JSON from a Gemini response that was cut off
 * mid-generation (finishReason: MAX_TOKENS).
 *
 * Strategy: close any open strings, then close open braces/brackets to form
 * valid JSON. Only returns a result if the repaired JSON has both `title`
 * and `placeholders`.
 */
function repairTruncatedJson(text: string): AIGenerationResult | null {
  let repaired = text.trim();

  // If the text ends inside a string literal, close it
  // Count unescaped quotes — if odd, we're inside a string
  const unescapedQuotes = repaired.match(/(?<!\\)"/g);
  if (unescapedQuotes && unescapedQuotes.length % 2 !== 0) {
    repaired += '"';
  }

  // Close any trailing comma (invalid JSON)
  repaired = repaired.replace(/,\s*$/, '');

  // Count open vs close braces and brackets
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;

  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (ch === '\\' && inString) {
      i++; // skip escaped character
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') openBraces++;
    else if (ch === '}') openBraces--;
    else if (ch === '[') openBrackets++;
    else if (ch === ']') openBrackets--;
  }

  // Close open brackets and braces
  for (let i = 0; i < openBrackets; i++) repaired += ']';
  for (let i = 0; i < openBraces; i++) repaired += '}';

  try {
    const parsed = JSON.parse(repaired) as AIGenerationResult;
    if (parsed.title && parsed.placeholders) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';

  constructor(private apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
  }

  async generate(prompt: string): Promise<AIGenerationResult> {
    return this.callGemini(prompt, false);
  }

  private async callGemini(prompt: string, isRetry: boolean): Promise<AIGenerationResult> {
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
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const finishReason: string | undefined = data?.candidates?.[0]?.finishReason;

    // Extract token usage from the top-level response
    const usage = data?.usageMetadata;
    const tokenUsage = usage ? {
      promptTokens: usage.promptTokenCount ?? 0,
      completionTokens: usage.candidatesTokenCount ?? 0,
      totalTokens: usage.totalTokenCount ?? 0,
    } : undefined;

    if (!text) {
      throw new Error(`Empty response from Gemini API (finishReason: ${finishReason ?? 'unknown'})`);
    }

    // 1. Try direct JSON parse
    try {
      const parsed = JSON.parse(text) as AIGenerationResult;
      if (!parsed.title || !parsed.placeholders) {
        throw new Error('Invalid response structure');
      }
      if (tokenUsage) parsed.tokenUsage = tokenUsage;
      return parsed;
    } catch (parseError) {
      // 2. If truncated (MAX_TOKENS), try repair then retry
      if (finishReason === 'MAX_TOKENS') {
        const repaired = repairTruncatedJson(text);
        if (repaired) {
          if (tokenUsage) repaired.tokenUsage = tokenUsage;
          return repaired;
        }

        // Retry once with conciseness hint
        if (!isRetry) {
          return this.callGemini(RETRY_CONCISENESS_PREFIX + prompt, true);
        }

        throw new Error(
          `Failed to parse Gemini response (finishReason: MAX_TOKENS): response was truncated and could not be repaired after retry`,
        );
      }

      // 3. Try to extract JSON from markdown code fences
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim()) as AIGenerationResult;
          if (parsed.title && parsed.placeholders) {
            if (tokenUsage) parsed.tokenUsage = tokenUsage;
            return parsed;
          }
        } catch {
          // fall through to final error
        }
      }

      throw new Error(
        `Failed to parse Gemini response (finishReason: ${finishReason ?? 'unknown'}): ${(parseError as Error).message}`,
      );
    }
  }
}
