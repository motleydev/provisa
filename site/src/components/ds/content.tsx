import type { CSSProperties, ReactNode } from 'react';
import { cx, external, pad2, rich, type RichText } from './rich';

type Brand = 'cobalt' | 'forest' | 'vermilion';
type Fill = Brand | 'ink' | 'paper';

/* ----------------------------------------------------------------- Stats */

/** Stat row: the four facts, big serif numerals on a white band. */
export function StatRow({ items, label = 'Provisa at a glance' }: { items: Array<{ value: string; label: string; color: Brand }>; label?: string }) {
  return (
    <section className="pv-stats" aria-label={label}>
      <div className="pv-container">
        <ul className="pv-stats__grid" role="list">
          {items.map((s) => (
            <li key={s.label} className="pv-stat">
              <span className={cx('t-numeral', `pv-c-${s.color}`)}>{s.value}</span>{' '}
              <span className="pv-stat__label">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- Cards */

/**
 * Rule card: heading and copy under a top rule. `rule="bar"` (4px) with a
 * brand color marks a principle; `hair` (1px ink) is the default grid card.
 */
export function RuleCard({
  title,
  children,
  body,
  rule = 'hair',
  color,
  index,
  titleClass = 't-h5',
  titleAs: Title = 'h3',
}: {
  title: RichText;
  children?: ReactNode;
  body?: RichText;
  rule?: 'hair' | 'bar' | 'accent';
  color?: Brand | 'ink';
  index?: string;
  titleClass?: string;
  titleAs?: 'h3' | 'h4';
}) {
  return (
    <div className={cx('pv-rule-card', rule !== 'hair' && `pv-rule-card--${rule}`, color && `pv-rule-card--${color}`)}>
      {index && <span className="pv-rule-card__index t-mono">{index}</span>}
      <Title className={titleClass}>{rich(title)}</Title>
      {body && <p className="pv-rule-card__body t-body">{rich(body)}</p>}
      {children}
    </div>
  );
}

/**
 * Tinted card: brand tint, 6px bar, title in the brand color. One per
 * language, audience or option; lay them out three or four across.
 */
export function TintCard({
  tone,
  title,
  meta,
  index,
  body,
  children,
  size = 'md',
  titleClass = 't-h3',
  plainTitle,
}: {
  tone: Brand | 'stone';
  title: RichText;
  meta?: string;
  index?: string;
  body?: RichText;
  children?: ReactNode;
  size?: 'md' | 'lg';
  titleClass?: string;
  plainTitle?: boolean;
}) {
  const heading = <h3 className={cx('pv-tint-card__title', titleClass)}>{rich(title)}</h3>;
  return (
    <div className={cx('pv-tint-card', `pv-tint-card--${tone}`, size === 'lg' && 'pv-tint-card--lg', plainTitle && 'pv-tint-card--plain-title')}>
      {index && <span className="pv-tint-card__index t-mono">{index}</span>}
      {meta ? (
        <div className="pv-tint-card__head">
          {heading}
          <span className="pv-tint-card__meta">{meta}</span>
        </div>
      ) : (
        heading
      )}
      {body && <p className="t-body">{rich(body)}</p>}
      {children}
    </div>
  );
}

/** Card: an outlined box, or a paper box for use on forest and ink bands. */
export function Card({ variant = 'outline', title, body, children, titleClass = 't-h4' }: { variant?: 'outline' | 'paper'; title: RichText; body?: RichText; children?: ReactNode; titleClass?: string }) {
  return (
    <div className={cx('pv-card', `pv-card--${variant}`)}>
      <h3 className={titleClass}>{rich(title)}</h3>
      {body && <p className="t-body pv-body">{rich(body)}</p>}
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------- Lists */

/**
 * Ruled list: rows between an opening rule and hairlines. `grid` flows the
 * rows into columns at least `min` px wide, `colGap` apart.
 */
export function RuleList({
  items,
  variant = 'default',
  label,
  min,
  colGap,
}: {
  items: RichText[];
  variant?: 'default' | 'dense' | 'grid';
  label?: string;
  min?: number;
  colGap?: number;
}) {
  const style = variant === 'grid' ? ({ ...(min && { '--min': `${min}px` }), ...(colGap && { '--col-gap': `${colGap}px` }) } as CSSProperties) : undefined;
  return (
    <ul className={cx('pv-list', variant !== 'default' && `pv-list--${variant}`)} role="list" aria-label={label} style={style}>
      {items.map((item, i) => (
        <li key={i}>{rich(item)}</li>
      ))}
    </ul>
  );
}

/** Checklist: square-bulleted conditions inside a tinted card. */
export function Checklist({ items, tone = 'ink' }: { items: RichText[]; tone?: Brand | 'ink' }) {
  return (
    <ul className={cx('pv-checklist', tone !== 'ink' && `pv-checklist--${tone}`)} role="list">
      {items.map((item, i) => (
        <li key={i}>
          <span>{rich(item)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Steps: numbered with large serif numerals, each in a brand color. */
export function Steps({ items }: { items: Array<{ title: string; body: RichText; color: Brand }> }) {
  return (
    <ol className="pv-steps" role="list">
      {items.map((s, i) => (
        <li key={s.title} className="pv-step">
          <span className={cx('pv-step__num t-numeral', `pv-c-${s.color}`)} aria-hidden="true">
            {pad2(i)}
          </span>
          <h3 className="t-h5">{s.title}</h3>
          <p className="t-body pv-body">{rich(s.body)}</p>
        </li>
      ))}
    </ol>
  );
}

/** Tier list: plain-language pricing, three across. */
export function TierList({ tiers }: { tiers: Array<{ name: string; desc: string }> }) {
  return (
    <dl className="pv-tiers" style={{ margin: 0 }}>
      {tiers.map((t) => (
        <div key={t.name} className="pv-tier">
          <dt className="pv-tier__name">{t.name}</dt>
          <dd className="pv-tier__desc" style={{ margin: 0 }}>
            {t.desc}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export interface DownloadItem {
  id: 'macos' | 'windows' | 'linux' | string;
  os: string;
  meta: string;
  cta: string;
  href: string;
}

/** Downloads: one row per installer. The row for the visitor's OS is marked by script. */
export function DownloadList({ items, hint = 'For this computer' }: { items: DownloadItem[]; hint?: string }) {
  return (
    <div className="pv-downloads" data-pv-downloads="">
      {items.map((d) => (
        <a key={d.id} className="pv-download" href={d.href} data-os={d.id}>
          <span className="pv-download__text">
            <span className="t-serif-md">{d.os}</span>
            <span className="pv-download__meta">{d.meta}</span>
          </span>
          <span className="pv-download__cta">
            <span className="pv-download__hint t-label">{hint}</span>
            <span>
              {d.cta} <span aria-hidden="true">↓</span>
            </span>
          </span>
        </a>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- Figures */

/** Screenshot figure with a serif italic caption. Children are the image. */
export function Figure({ caption, accent, children }: { caption: RichText; accent?: 'cobalt'; children: ReactNode }) {
  return (
    <figure className={cx('pv-figure', accent && `pv-figure--${accent}`)}>
      {children}
      <figcaption className="t-caption">{rich(caption)}</figcaption>
    </figure>
  );
}

/** Industry card: a 3:4 block in one brand color, a corner square in another, and a numeral. */
export function IndustryCard({ number, name, line, href, bg, corner }: { number: string; name: string; line: string; href: string; bg: Fill; corner: Fill }) {
  const style = { '--ind-bg': `var(--${bg})`, '--ind-corner': `var(--${corner})` } as CSSProperties;
  return (
    <a className="pv-industry" href={href} style={style}>
      <span className="pv-industry__art" aria-hidden="true">
        <span className="pv-industry__corner" />
        <span className="pv-industry__num t-numeral">{number}</span>
      </span>
      <h3 className="t-h4">{name}</h3>
      <p className="pv-industry__line t-body">{line}</p>
    </a>
  );
}

/** Resource card: type label, title and a two-bar block illustration. */
export function ResourceCard({ type, title, href, bg, a, b = 'paper' }: { type: string; title: string; href: string; bg: Fill; a: Fill; b?: Fill }) {
  const style = { '--res-bg': `var(--${bg})`, '--res-a': `var(--${a})`, '--res-b': `var(--${b})` } as CSSProperties;
  return (
    <a className="pv-resource" href={href} style={style} {...external(href)}>
      <span className="pv-resource__type t-label">{type}</span>
      <h3 className="t-h4">{title}</h3>
      <span className="pv-resource__art" aria-hidden="true" />
    </a>
  );
}

/* ---------------------------------------------------------------- Matrix */

export interface MatrixRow {
  title: string;
  desc: string;
  items: Array<{ name: string; desc: RichText }>;
}

/** Matrix: grouped rows, a title column beside a list of named items. */
export function Matrix({ rows }: { rows: MatrixRow[] }) {
  return (
    <div className="pv-matrix">
      {rows.map((row) => (
        <div key={row.title} className="pv-matrix__row">
          <div className="pv-matrix__head">
            <h4 className="t-h5">{row.title}</h4>
            <p className="pv-matrix__desc t-body-sm">{row.desc}</p>
          </div>
          <div className="pv-matrix__items">
            {row.items.map((item) => (
              <p key={item.name} className="t-body-sm">
                <strong>{item.name}</strong> — {rich(item.desc)}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- Table */

export interface ComparisonRow {
  label: string;
  them: RichText;
  us: RichText;
}

/**
 * Comparison table: row labels, the other option, and Provisa's column on
 * forest-tint. Scrolls sideways under 640px.
 */
export function ComparisonTable({ caption, them, us = 'Provisa', rows, rowHeader = '' }: { caption: string; them: string; us?: string; rows: ComparisonRow[]; rowHeader?: string }) {
  return (
    <div className="pv-table-wrap" tabIndex={0} role="region" aria-label={caption}>
      <table className="pv-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{rowHeader || <span className="visually-hidden">Aspect</span>}</th>
            <th scope="col">{them}</th>
            <th scope="col" className="is-us">
              {us}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              <td>{rich(r.them)}</td>
              <td className="is-us">{rich(r.us)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Prose: long-form copy (legal pages) at reading measure. */
export function Prose({ children }: { children: ReactNode }) {
  return <div className="pv-prose">{children}</div>;
}
