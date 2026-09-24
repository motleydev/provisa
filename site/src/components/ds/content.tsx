import type { CSSProperties, ReactNode } from 'react';
import { cx, type Html, type Tone } from './util';

/** Eyebrow: the small uppercase label above a heading. Follows the band unless given a tone. */
export function Eyebrow({
  tone,
  size,
  as: El = 'p',
  id,
  children,
}: {
  tone?: 'forest' | 'cobalt' | 'vermilion' | 'ink';
  size?: 'sm';
  as?: 'p' | 'span' | 'div' | 'h2' | 'h3' | 'h4';
  id?: string;
  children: ReactNode;
}) {
  return (
    <El id={id} className={cx('pv-eyebrow', size === 'sm' && 'pv-eyebrow--sm', tone && tone !== 'forest' && `pv-eyebrow--${tone}`)}>
      {children}
    </El>
  );
}

/** SectionLabel: a section's mono number over its uppercase name. */
export function SectionLabel({ num, children }: { num: string; children: ReactNode }) {
  return (
    <p className="pv-seclabel">
      <span className="pv-seclabel__num">{num}</span>
      <span className="pv-seclabel__text">{children}</span>
    </p>
  );
}

const HEADING_TAG = { hero: 'h1', page: 'h1', section: 'h2', 'section-sm': 'h2', cta: 'h2', sub: 'h3', card: 'h3', lede: 'p' } as const;
export type HeadingLevel = keyof typeof HEADING_TAG;

/**
 * Heading, in the style guide's levels: `hero` (home only), `page` (one per
 * inner page), `section`, `section-sm` (inner-page sections), `cta`, `sub`,
 * `card`, and `lede` (a serif pull paragraph).
 */
export function Heading({
  level = 'section',
  as,
  id,
  className,
  children,
}: {
  level?: HeadingLevel;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p';
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const El = as ?? HEADING_TAG[level];
  return (
    <El id={id} className={cx('pv-h', `pv-h--${level}`, className)}>
      {children}
    </El>
  );
}

/** Emph: the vermilion italic that closes a display headline. */
export function Emph({ children }: { children: ReactNode }) {
  return <em>{children}</em>;
}

/** P: body copy in the band's body color. */
export function P({ size, className, children }: { size?: 'sm' | '16'; className?: string; children: ReactNode }) {
  return <p className={cx('pv-p', size === 'sm' && 'pv-p--sm', size === '16' && 'pv-p--16', className)}>{children}</p>;
}

/** Lede: the larger paragraph under a page title. */
export function Lede({ children }: { children: ReactNode }) {
  return <p className="pv-lede">{children}</p>;
}

/** Fine print. */
export function Fine({ children }: { children: ReactNode }) {
  return <p className="pv-fine">{children}</p>;
}

/**
 * RuledCard: a title and copy under a rule. `weight={4}` with a brand `rule`
 * marks a category; the default 1px ink rule is for plain groups.
 */
export function RuledCard({
  title,
  num,
  rule = 'ink',
  weight = 1,
  titleSize,
  as: TitleTag = 'h3',
  id,
  children,
}: {
  title?: ReactNode;
  num?: string;
  rule?: Tone | 'mint';
  weight?: 1 | 4;
  titleSize?: number;
  as?: 'h2' | 'h3' | 'h4';
  id?: string;
  children?: ReactNode;
}) {
  const style = titleSize ? ({ '--title-size': `${titleSize}px` } as CSSProperties) : undefined;
  return (
    <div id={id} className={cx('pv-ruled', `pv-rule-${rule}`, weight > 1 && 'pv-ruled--heavy', num && 'pv-ruled--num')} style={style}>
      {num && <span className="pv-ruled__num">{num}</span>}
      {title && <TitleTag className="pv-ruled__title">{title}</TitleTag>}
      {children && <div className="pv-ruled__body">{children}</div>}
    </div>
  );
}

/** Grid: an auto-fitting grid of cards; `min` is the narrowest column in px. */
export function Grid({ min = 240, gap = 32, gapX, as: El = 'div', children }: { min?: number; gap?: number; gapX?: number; as?: 'div' | 'ul'; children: ReactNode }) {
  const style = { '--min': `${min}px`, '--gap-y': `${gap}px`, '--gap-x': `${gapX ?? gap}px` } as CSSProperties;
  return (
    <El className="pv-grid" style={style}>
      {children}
    </El>
  );
}

/** Callout: a vermilion-edged note with a mono label ("PLAN OUT"). */
export function Callout({ label = 'PLAN OUT', variant = 'paper', children }: { label?: string; variant?: 'paper' | 'ink'; children: ReactNode }) {
  return (
    <div className={cx('pv-callout', variant === 'ink' && 'pv-callout--ink')}>
      <span className="pv-callout__label">{label}</span>
      <span className="pv-callout__text">{children}</span>
    </div>
  );
}

/** ItemList: the ChoiceCard's square-marker rows, standalone. */
export function ItemList({ items, tone, loose }: { items: Html[]; tone?: Tone; loose?: boolean }) {
  return (
    <ul className={cx('pv-list', loose && 'pv-list--loose', tone && `pv-tone-${tone}`)}>
      {items.map((t, i) => (
        <li key={i} dangerouslySetInnerHTML={{ __html: t }} />
      ))}
    </ul>
  );
}

/** ChoiceCard: a tinted card with a heavy top rule and a list — "Choose X when…". */
export function ChoiceCard({ title, items, tone = 'cobalt', as: TitleTag = 'h3' }: { title: string; items: Html[]; tone?: Tone; as?: 'h2' | 'h3' }) {
  return (
    <div className={cx('pv-choice', `pv-tone-${tone}`)}>
      <TitleTag className="pv-choice__title">{title}</TitleTag>
      <ItemList items={items} />
    </div>
  );
}

/** StatStrip: big numerals across a white band. */
export function StatStrip({ stats }: { stats: Array<[string, string, Tone]> }) {
  return (
    <section className="pv-statstrip" aria-label="At a glance">
      <div className="pv-container pv-statstrip__grid">
        {stats.map(([n, l, t]) => (
          <p key={l} className={cx('pv-stat', `pv-tone-${t}`)}>
            <span className="pv-stat__n">{n}</span>
            <span className="pv-stat__l">{l}</span>
          </p>
        ))}
      </div>
    </section>
  );
}

/** TileCard: an industry tile (numbered block art) or a resource card (eyebrow, title, art below). */
export function TileCard({
  kind = 'industry',
  title,
  body,
  eyebrow,
  num,
  color = 'cobalt',
  accent = 'vermilion',
  href,
}: {
  kind?: 'industry' | 'resource';
  title: string;
  body?: string;
  eyebrow?: string;
  num?: string;
  color?: Tone;
  accent?: Tone | 'paper';
  href: string;
}) {
  if (kind === 'resource')
    return (
      <a className="pv-tile pv-tile--resource" href={href}>
        <span className="pv-eyebrow pv-eyebrow--sm">{eyebrow}</span>
        <h3 className="pv-tile__title">{title}</h3>
        <span className={cx('pv-tile__art', `pv-fill-${color}`)} aria-hidden="true">
          <span className={cx('pv-tile__block', `pv-fill-${accent}`)} style={{ left: '8%', width: '22%', height: '58%' }} />
          <span className="pv-tile__block pv-fill-paper" style={{ left: '34%', width: '22%', height: '34%' }} />
        </span>
      </a>
    );
  return (
    <a className="pv-tile" href={href}>
      <span className={cx('pv-tile__art', `pv-fill-${color}`)} aria-hidden="true">
        <span className={cx('pv-tile__block', `pv-fill-${accent}`)} />
        <span className="pv-tile__num">{num}</span>
      </span>
      <h3 className="pv-tile__title">{title}</h3>
      {body && <p className="pv-tile__body">{body}</p>}
    </a>
  );
}
