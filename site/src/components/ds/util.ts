/** Joins class names, skipping empty ones. */
export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ');
}

/** Zero-pads an index: 1 → "01". */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export type Tone = 'cobalt' | 'forest' | 'vermilion' | 'ink';
export type Band = 'paper' | 'white' | 'forest' | 'ink';

/**
 * Copy that may carry inline markup (<strong>, <em>, <code>, <a>). Always
 * authored in this repository — never user input — and rendered as HTML.
 */
export type Html = string;
