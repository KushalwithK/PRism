/**
 * Extract placeholder keys from a template body.
 * Matches {key_name} patterns.
 */
export function extractPlaceholders(body: string): string[] {
  const regex = /\{(\w+)\}/g;
  const keys = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(body)) !== null) {
    keys.add(match[1]);
  }
  return Array.from(keys);
}

/**
 * Render a template body by replacing {key} with values.
 */
export function renderTemplate(body: string, values: Record<string, string>): string {
  return body.replace(/\{(\w+)\}/g, (full, key: string) => {
    return values[key] ?? full;
  });
}
