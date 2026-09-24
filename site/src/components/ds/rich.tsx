import { Fragment, type ReactNode } from 'react';

/**
 * Inline formatting for text passed as data: `code`, *emphasis*, **strong**
 * and [label](href). Keeps copy in data files readable while letting it carry
 * the few inline styles the brand uses.
 */
export type RichText = string | ReactNode;

const TOKEN = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;

export function rich(text: RichText): ReactNode {
  if (typeof text !== 'string') return text;
  const parts = text.split(TOKEN).filter((p) => p !== '');
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) return <a key={i} href={link[2]} {...external(link[2])}>{link[1]}</a>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Links that leave provisa.dev open in a new tab; mail links do not. */
export function external(href: string): { target?: string; rel?: string } {
  return /^https?:\/\//.test(href) && !/^https?:\/\/(www\.)?provisa\.dev(\/|$)/.test(href)
    ? { target: '_blank', rel: 'noopener' }
    : {};
}

/** Joins class names, dropping empty values. */
export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ');
}

/** Two-digit index: 0 → "01". */
export const pad2 = (i: number) => String(i + 1).padStart(2, '0');
