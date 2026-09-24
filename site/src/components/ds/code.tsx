import { Fragment, type ReactNode } from 'react';
import { cx } from './rich';

/**
 * Code is written as an array of lines. A line is a string, a list of
 * segments, or `{ hl: … }` for a line governance injected (shown on a
 * vermilion wash). Comments are found automatically for the block's comment
 * style; other emphasis is explicit: `{ t, k: 's' }` for a string,
 * `{ t, k: 'ok' }` for a confirmation mark, `{ t, k: 'c' }` for a comment.
 */
export type CodeSeg = string | { t: string; k: 'c' | 's' | 'ok' };
export type CodeLine = string | CodeSeg[] | { hl: string | CodeSeg[] };
export type Code = CodeLine[];
export type CommentStyle = 'hash' | 'dash' | 'none';

/** Splits `text` into code and a trailing comment, respecting quotes. */
function splitComment(text: string, style: CommentStyle): [string, string] {
  if (style === 'none') return [text, ''];
  let quote: string | null = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    const starts = style === 'hash' ? ch === '#' : ch === '-' && text[i + 1] === '-';
    if (starts && (i === 0 || /\s/.test(text[i - 1]))) return [text.slice(0, i), text.slice(i)];
  }
  return [text, ''];
}

function renderSegs(segs: string | CodeSeg[], style: CommentStyle): ReactNode {
  const list = typeof segs === 'string' ? [segs] : segs;
  return list.map((seg, i) => {
    if (typeof seg !== 'string') return <span key={i} className={`tk-${seg.k}`}>{seg.t}</span>;
    const [code, comment] = splitComment(seg, style);
    return (
      <Fragment key={i}>
        {code}
        {comment && <span className="tk-c">{comment}</span>}
      </Fragment>
    );
  });
}

/** The lines of a code block, each on its own row. */
export function CodeLines({ code, comments = 'hash' }: { code: Code; comments?: CommentStyle }) {
  return (
    <>
      {code.map((line, i) => {
        const hl = typeof line === 'object' && !Array.isArray(line);
        const content = hl ? (line as { hl: string | CodeSeg[] }).hl : (line as string | CodeSeg[]);
        const empty = content === '' || (Array.isArray(content) && content.length === 0);
        return (
          <span key={i} className={cx('pv-code__line', hl && 'pv-code__line--hl')}>
            {empty ? ' ' : renderSegs(content, comments)}
          </span>
        );
      })}
    </>
  );
}

/** Splits a template string into lines, dropping one leading and trailing blank line. */
export function lines(text: string): string[] {
  return text.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n');
}

export interface CodeBlockProps {
  code: Code | string;
  /** Comment syntax to color: `#` (shell, GraphQL) or `--` (SQL). */
  comments?: CommentStyle;
  /** A caption strip above the code, e.g. "psql · port 5439". */
  head?: string;
  /** A 6px brand-colored top edge. */
  accent?: 'cobalt' | 'forest' | 'vermilion';
  /** Tighter padding, for code beside copy. */
  compact?: boolean;
  /** Accessible name for the scrollable code region. */
  label?: string;
  className?: string;
}

/** A dark code panel. Scrolls sideways rather than wrapping. */
export function CodeBlock({ code, comments = 'hash', head, accent, compact, label, className }: CodeBlockProps) {
  const body = typeof code === 'string' ? lines(code) : code;
  return (
    <div className={cx('pv-code', compact && 'pv-code--compact', accent && `pv-code--${accent}`, className)}>
      {head && <div className="pv-code__head">{head}</div>}
      <pre className="pv-code__pre" tabIndex={0} aria-label={label ?? head ?? 'Code sample'}>
        <code>
          <CodeLines code={body} comments={comments} />
        </code>
      </pre>
    </div>
  );
}

export interface CodeTab {
  lang: string;
  wire: string;
  code: Code | string;
  comments?: CommentStyle;
}

/**
 * The hero's language switcher: one tab per query language, each captioned
 * with the wire protocol it rides, over a code panel.
 */
export function CodeTabs({ id, label, tabs }: { id: string; label: string; tabs: CodeTab[] }) {
  return (
    <div className="pv-codetabs" data-pv-tabs="">
      <div className="pv-codetabs__list" role="tablist" aria-label={label}>
        {tabs.map((tab, i) => (
          <button
            key={tab.lang}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-controls={`${id}-panel-${i}`}
            aria-selected={i === 0}
            tabIndex={i === 0 ? 0 : -1}
            className="pv-codetabs__tab"
          >
            <span className="pv-codetabs__lang">{tab.lang}</span>
            <span className="pv-codetabs__wire">{tab.wire}</span>
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={tab.lang}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={i !== 0}
        >
          <pre className="pv-code__pre" tabIndex={0} aria-label={`${tab.lang} over ${tab.wire}`}>
            <code>
              <CodeLines code={typeof tab.code === 'string' ? lines(tab.code) : tab.code} comments={tab.comments} />
            </code>
          </pre>
        </div>
      ))}
    </div>
  );
}
