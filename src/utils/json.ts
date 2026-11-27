/**
 * Reading JSON we do not control (source pages, APIs, storage) as `unknown`,
 * checked field by field instead of cast. Shared by the app and the collector.
 */

export type JsonObject = Record<string, unknown>;

export const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The object, or an empty one: its fields then read as missing. */
export const asObject = (value: unknown): JsonObject =>
  isObject(value) ? value : {};

export const asList = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

/** The objects of a list, skipping anything else. */
export const objectsOf = (value: unknown): JsonObject[] =>
  asList(value).filter(isObject);

export const toNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

/** A non-empty string, or null. */
export const toText = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

/** `JSON.parse` typed as what it is: unknown until checked. */
export function parseJson(text: string): unknown {
  const value: unknown = JSON.parse(text);
  return value;
}

/** The balanced `{...}` or `[...]` that starts at `start`, strings aware. */
export function readBalanced(text: string, start: number): string | null {
  const open = text[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') {
      inString = true;
    } else if (char === open) {
      depth++;
    } else if (char === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}
