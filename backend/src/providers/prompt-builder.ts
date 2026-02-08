import { PLACEHOLDERS, MAX_DIFF_LENGTH } from '@prism/shared';
import type { PlaceholderDef } from '@prism/shared';

const TEMPLATE_CONTEXT: Record<string, string> = {
  Minimal: 'small or straightforward',
  Standard: 'general-purpose',
  Feature: 'new feature',
  Bugfix: 'bug fix',
  Enterprise: 'enterprise or business-critical',
};

export function buildPrompt(
  diff: string,
  placeholderKeys: string[],
  additionalPrompt?: string,
  templateName?: string,
): string {
  const truncatedDiff = diff.length > MAX_DIFF_LENGTH
    ? diff.slice(0, MAX_DIFF_LENGTH) + '\n\n[DIFF TRUNCATED]'
    : diff;

  const placeholderDescriptions = placeholderKeys
    .map((key) => {
      const def: PlaceholderDef | undefined = PLACEHOLDERS[key];
      return `- "${key}": ${def?.description ?? 'Provide appropriate content'}`;
    })
    .join('\n');

  const templateContext = templateName && TEMPLATE_CONTEXT[templateName]
    ? `\nThe author selected the "${templateName}" template, which indicates this is a ${TEMPLATE_CONTEXT[templateName]} PR.\nTailor your tone and detail level accordingly.\n`
    : '';

  return `You are a senior software engineer writing a pull request description.
${templateContext}
Analyze the following code diff and generate:
1. A concise PR title (max 72 characters)
2. Values for each requested placeholder

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "title": "your PR title here",
  "placeholders": {
    ${placeholderKeys.map((k) => `"${k}": "value for ${k}"`).join(',\n    ')}
  }
}

Placeholder descriptions:
${placeholderDescriptions}

Guidelines:
- Title: use imperative mood (e.g., "Add user authentication"), max 72 characters, no "PR:" prefix
- Use markdown formatting: bullets with "- ", numbered lists with "1. ", backticks for \`file names\`, \`function names\`, and \`variable names\`
- Reference actual file paths and function names from the diff — don't be generic
- Summary: focus on WHAT changed and WHY, not HOW it was implemented
- Test instructions: use numbered steps with concrete commands or actions a reviewer can follow
- When a placeholder description says output "None" if not applicable, output exactly "None" — don't fabricate content
- Don't repeat the same information across different placeholders
- For bug-related placeholders: clearly distinguish symptoms from root cause
- Keep bullet points concise (1-2 lines each) — avoid walls of text
- Use professional, direct language — no filler phrases like "This PR aims to" or "In order to"
- Keep each placeholder value to 3-8 bullet points maximum — be selective, not exhaustive
- Total JSON response must be under 6000 tokens — prioritize brevity over completeness
- Use short, dense sentences — every word should carry information
- Never include full code snippets — reference file paths and function names with backticks instead
${additionalPrompt ? `\nAdditional instructions from the author:\n${additionalPrompt}\n` : ''}
Code diff:
\`\`\`
${truncatedDiff}
\`\`\``;
}
