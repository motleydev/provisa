import type { CSSProperties, ReactNode } from 'react';
import { Callout } from './content';
import { cx, type Html, type Tone } from './util';

/** Chip: a small label. Brand tones are solid; the default is sand. */
export function Chip({ tone, strong, children }: { tone?: Tone; strong?: boolean; children: ReactNode }) {
  return <span className={cx('pv-chip', tone && `pv-chip--solid pv-tone-${tone}`, strong && 'pv-chip--strong')}>{children}</span>;
}

/** A wrapping list of Chips. */
export function Chips({ items, label }: { items: Array<string | { label: string; tone?: Tone }>; label?: string }) {
  return (
    <ul className="pv-chips" aria-label={label}>
      {items.map((it) => {
        const { label: text, tone } = typeof it === 'string' ? { label: it, tone: undefined } : it;
        return (
          <li key={text}>
            <Chip tone={tone}>{text}</Chip>
          </li>
        );
      })}
    </ul>
  );
}

const isComment = (t: string) => /^\s*(#|--|\/\/)/.test(t);

/**
 * CodeBlock: an ink panel of monospaced lines. Lines that start with `#`,
 * `--` or `//` read as comments; `highlight` marks lines (0-based) in
 * vermilion.
 */
export function CodeBlock({
  code = '',
  lines,
  highlight = [],
  title,
  topRule,
  deep,
  label,
  style,
}: {
  code?: string;
  lines?: string[];
  highlight?: number[];
  title?: string;
  topRule?: Tone;
  deep?: boolean;
  /** Accessible name for the scrollable code region. */
  label?: string;
  style?: CSSProperties;
}) {
  const L = lines ?? code.replace(/^\n+|\n+$/g, '').split('\n');
  return (
    <div className={cx('pv-code', deep && 'pv-code--deep', topRule && `pv-code--rule pv-tone-${topRule}`)} style={style}>
      {title && <div className="pv-code__title">{title}</div>}
      <pre tabIndex={0} aria-label={label ?? title ?? 'Code sample'}>
        <code>
          {L.map((t, i) => (
            <span
              key={i}
              className={cx('pv-code__line', highlight.includes(i) ? 'pv-code__line--hl' : isComment(t) && 'pv-code__line--comment')}
            >
              {t || ' '}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

export interface CodeTab {
  lang: string;
  wire: string;
  code: string;
}

/**
 * CodeTabs: one question in several languages. ARIA tabs; the site's
 * behavior script switches panels (click, arrows, Home/End). Without script
 * the first tab shows.
 */
export function CodeTabs({ id, tabs, initial = 0, minHeight = 290, label }: { id: string; tabs: CodeTab[]; initial?: number; minHeight?: number; label: string }) {
  return (
    <div className="pv-codetabs" data-pv-tabs="" style={{ '--min-h': `${minHeight}px` } as CSSProperties}>
      <div className="pv-codetabs__list" role="tablist" aria-label={label}>
        {tabs.map((t, i) => (
          <button
            key={t.lang}
            className="pv-codetabs__tab"
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-controls={`${id}-panel-${i}`}
            aria-selected={i === initial}
            tabIndex={i === initial ? 0 : -1}
          >
            <span className="pv-codetabs__lang">{t.lang}</span>
            <span className="pv-codetabs__wire">{t.wire}</span>
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.lang} className="pv-codetabs__panel" role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} hidden={i !== initial}>
          <CodeBlock code={t.code} label={`${t.lang} over ${t.wire}`} />
        </div>
      ))}
    </div>
  );
}

/**
 * ComparisonTable: row labels down the left, one column per option, the
 * `highlight` column (Provisa, by convention last) on forest-tint.
 */
export function ComparisonTable({
  columns,
  rows,
  highlight = columns.length - 1,
  caption,
}: {
  columns: string[];
  rows: Array<[string, ...Html[]]>;
  highlight?: number;
  caption: string;
}) {
  return (
    <div className="pv-table-wrap" tabIndex={0} role="region" aria-label={caption}>
      <table className="pv-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <td />
            {columns.map((c, i) => (
              <th key={c} scope="col" className={i === highlight ? 'is-hl' : undefined}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, ...v], r) => (
            <tr key={r}>
              <th scope="row">{k}</th>
              {v.map((x, i) => (
                <td key={i} className={i === highlight ? 'is-hl' : undefined} dangerouslySetInnerHTML={{ __html: x }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * LayerRow: one governance layer. `tint` is the colored row used in hero
 * stacks (a link when given `href`); `list` is the numbered row on the
 * forest band.
 */
export function LayerRow({
  idx,
  title,
  tone = 'cobalt',
  href,
  variant = 'tint',
  desc,
}: {
  idx: string;
  title: ReactNode;
  tone?: Tone;
  href?: string;
  variant?: 'tint' | 'list';
  desc?: ReactNode;
}) {
  if (variant === 'list')
    return (
      <li className="pv-layer pv-layer--list">
        <span className="pv-layer__idx">{idx}</span>
        <h3 className="pv-layer__title">
          {title}
        </h3>
        {desc && <p className="pv-layer__desc">{desc}</p>}
      </li>
    );
  const inner = (
    <>
      <span className="pv-layer__idx">{idx}</span>
      <span className="pv-layer__title">{title}</span>
    </>
  );
  return href ? (
    <a className={cx('pv-layer', `pv-tone-${tone}`)} href={href}>
      {inner}
    </a>
  ) : (
    <div className={cx('pv-layer', `pv-tone-${tone}`)}>{inner}</div>
  );
}

/** LayerList: the home page's layer list on the forest band — head row, numbered layers, the plan-out callout. */
export function LayerList({ head, layers, callout }: { head: string; layers: Array<{ title: string; desc: string }>; callout: string }) {
  return (
    <div className="pv-layers">
      <p className="pv-layers__head">
        {head}
      </p>
      <ol>
        {layers.map((l, i) => (
          <LayerRow key={l.title} variant="list" idx={String(i)} title={l.title} desc={l.desc} />
        ))}
      </ol>
      <Callout>{callout}</Callout>
    </div>
  );
}
