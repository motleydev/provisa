import type { CSSProperties, ReactNode } from 'react';
import { Links } from './actions';
import { BrandBars, FigPanel, type FigureName } from './brand';
import { Heading, SectionLabel } from './content';
import { Breadcrumb, type NavLink } from './navigation';
import { cx, type Band, type Tone } from './util';

/**
 * Sec: a full-width band. `paper` is the default ground; alternate with
 * `white`; use `forest` and `ink` one at a time, never two dark bands in a
 * row. Components inside take their colors from the band.
 */
export function Sec({
  band = 'paper',
  id,
  labelledBy,
  label,
  flushTop,
  className,
  children,
}: {
  band?: Band;
  id?: string;
  labelledBy?: string;
  label?: string;
  flushTop?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cx('pv-sec', `pv-band-${band}`, flushTop && 'pv-sec--flush-top', className)} aria-labelledby={labelledBy} aria-label={label}>
      <div className="pv-container pv-sec__inner">{children}</div>
    </section>
  );
}

/** Stack: a vertical flow with a fixed gap. */
export function Stack({ gap = 40, className, children }: { gap?: number; className?: string; children: ReactNode }) {
  return (
    <div className={cx('pv-stack', className)} style={{ '--gap': `${gap}px` } as CSSProperties}>
      {children}
    </div>
  );
}

/**
 * RailGrid: the home kit's numbered section — section label and figure plate
 * on the left third, content on the right two thirds.
 */
export function RailGrid({ num, label, figure, sticky, side, children }: { num?: string; label?: string; figure?: FigureName; sticky?: boolean; side?: ReactNode; children: ReactNode }) {
  return (
    <div className={cx('pv-rail', sticky && 'pv-rail--sticky')}>
      <div className="pv-rail__side">
        {num && label && <SectionLabel num={num}>{label}</SectionLabel>}
        {figure && <FigPanel figure={figure} label={num ? `FIG. ${num}` : undefined} />}
        {side}
      </div>
      <div className="pv-rail__main">{children}</div>
    </div>
  );
}

/** Two: the page kits' two-column split — heading left, copy right. */
export function Two({ min = 420, center, children }: { min?: number; center?: boolean; children: ReactNode }) {
  return (
    <div className={cx('pv-two', center && 'pv-two--center')} style={{ '--min': `${min}px` } as CSSProperties}>
      {children}
    </div>
  );
}

/** Head: an eyebrow over a section heading, the left half of a Two. */
export function Head({ children }: { children: ReactNode }) {
  return <div className="pv-head">{children}</div>;
}

/** Copy: stacked paragraphs, the right half of a Two. */
export function Copy({ children }: { children: ReactNode }) {
  return <div className="pv-copy">{children}</div>;
}

/** HeadRow: a section heading with one link on the right. */
export function HeadRow({ children }: { children: ReactNode }) {
  return <div className="pv-headrow">{children}</div>;
}

/**
 * PageHero: an inner page's opening — breadcrumb, then the copy (eyebrow,
 * page title, lede, actions) beside a summary diagram. Pass the diagram as
 * `aside`; pages without one get a single column.
 */
export function PageHero({ crumb, aside, children }: { crumb: string; aside?: ReactNode; children: ReactNode }) {
  const crumbs: NavLink[] = [{ label: 'Provisa', href: '/' }];
  return (
    <section className="pv-container pv-hero" aria-label="Introduction">
      <Breadcrumb items={crumbs} current={crumb} />
      <div className="pv-hero__grid">
        <div className="pv-hero__copy">{children}</div>
        {aside}
      </div>
    </section>
  );
}

/* ------------------------------------------------ Hero diagram stack */

/** HeroStack: the kits' hero diagram, top to bottom — head, rows, note. */
export function HeroStack({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="pv-hstack" aria-label={label}>
      {children}
    </figure>
  );
}
export function StackHead({ children }: { children: ReactNode }) {
  return <div className="pv-hstack__head">{children}</div>;
}
export function StackNote({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pv-hstack__note">
      <span className="pv-hstack__note-label">{label}</span>
      <span>{children}</span>
    </div>
  );
}
export function StackBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pv-hstack__box">
      <span className="pv-hstack__box-label">{label}</span>
      <span className="pv-hstack__box-text">{children}</span>
    </div>
  );
}
export function StackArrow() {
  return (
    <div className="pv-hstack__arrow" aria-hidden="true">
      ↓
    </div>
  );
}
export function StackPanel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pv-hstack__panel">
      <span className="pv-hstack__panel-label">{label}</span>
      {children}
    </div>
  );
}

/* ------------------------------------------------- Governance kit */

export interface LayerGroup {
  name: string;
  range: string;
  tone: Tone;
}

/** Legend: the governance groups — who can see, what they get, whether it runs. */
export function Legend({ groups }: { groups: LayerGroup[] }) {
  return (
    <ul className="pv-legend">
      {groups.map((g) => (
        <li key={g.name} className={`pv-tone-${g.tone}`}>
          <span className="pv-legend__swatch" aria-hidden="true" />
          <span className="pv-legend__name">{g.name}</span>
          <span className="pv-legend__range">{g.range}</span>
        </li>
      ))}
    </ul>
  );
}

/** LayerDetail: one governance layer in full — numeral, group, title, copy. */
export function LayerDetail({ id, num, group, tone, title, children }: { id?: string; num: string; group: string; tone: Tone; title: string; children: ReactNode }) {
  return (
    <article id={id} className={cx('pv-detail', `pv-tone-${tone}`)}>
      <span className="pv-detail__num" aria-hidden="true">
        {num}
      </span>
      <div className="pv-detail__body">
        <p className="pv-eyebrow pv-eyebrow--sm">
          {group}
        </p>
        <Heading level="sub">
          <span className="visually-hidden">{num} — </span>
          {title}
        </Heading>
        {children}
      </div>
    </article>
  );
}

/* ---------------------------------------------------- Long form */

/**
 * Chapter: one section of a long-form page — its number and heading on the
 * left (sticky on wide screens), the copy on the right. Chapters stack inside
 * a Chapters wrapper, divided by rules.
 */
export function Chapters({ children }: { children: ReactNode }) {
  return <div className="pv-chapters">{children}</div>;
}
export function Chapter({ id, num, title, children }: { id?: string; num?: string; title: string; children: ReactNode }) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} className="pv-chapter" aria-labelledby={headingId}>
      <div className="pv-chapter__head">
        {num && <span className="pv-chapter__num">{num}</span>}
        <h2 className="pv-chapter__title" id={headingId}>
          {title}
        </h2>
      </div>
      <div className="pv-chapter__body">{children}</div>
    </section>
  );
}

/* ---------------------------------------------------- ContactBand */

/**
 * ContactBand: the closing call to action on every page — forest on the
 * home page, ink (with the brand bars) inside. The form sits on the right.
 */
export function ContactBand({
  tone = 'forest',
  title,
  sub,
  links,
  form,
}: {
  tone?: 'forest' | 'ink';
  title: string;
  sub: string;
  links: NavLink[];
  /** The form card on the right (named slot `form` from Astro). */
  form?: ReactNode;
}) {
  return (
    <section id="contact" className={cx('pv-contact', `pv-band-${tone}`)} aria-labelledby="contact-title">
      <div className="pv-container pv-contact__grid">
        <div className="pv-contact__copy">
          {tone === 'ink' && <BrandBars />}
          <Heading level="cta" id="contact-title">
            {title}
          </Heading>
          <p className="pv-contact__sub">{sub}</p>
          <Links links={links} arrow={false} />
        </div>
        {form}
      </div>
    </section>
  );
}

/* ------------------------------------------------ Site additions */

/** SourceGrid: source names on hairlines (the home kit's source list). */
export function SourceGrid({ items, label }: { items: string[]; label?: string }) {
  return (
    <ul className="pv-sourcegrid" aria-label={label}>
      {items.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ul>
  );
}

/** SourceGroup: a titled SourceGrid, e.g. one category of the 53. */
export function SourceGroup({ title, items, count }: { title: string; items: string[]; count?: boolean }) {
  return (
    <div className="pv-sourcegroup">
      <h3 className="pv-sourcegroup__title">
        {title}
        {count && <span className="pv-sourcegroup__count"> · {items.length}</span>}
      </h3>
      <SourceGrid items={items} />
    </div>
  );
}

export interface Download {
  os: 'macos' | 'windows' | 'linux';
  name: string;
  action: string;
  meta: string;
}

/** DownloadList: one row per desktop platform; the site script marks the visitor's OS. */
export function DownloadList({ items }: { items: Download[] }) {
  return (
    <ul className="pv-downloads" data-pv-downloads="">
      {items.map((d) => (
        <li key={d.os} id={`dl-${d.os}`} className="pv-download" data-os={d.os}>
          <h3 className="pv-download__os">
            {d.name}
            <span className="pv-download__mark">Your OS</span>
          </h3>
          <a className="pv-download__link" href={`/dl/${d.os}`}>
            <span className="pv-download__action">{d.action}</span>
            <span className="pv-download__meta">{d.meta}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Prose: a readable column for legal pages. */
export function Prose({ children }: { children: ReactNode }) {
  return <div className="pv-prose">{children}</div>;
}
