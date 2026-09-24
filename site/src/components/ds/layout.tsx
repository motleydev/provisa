import type { CSSProperties, ReactNode } from 'react';
import { FigureArt } from './diagrams';
import type { FigName } from './figures';
import { Button, Eyebrow, SectionIndex } from './primitives';
import { cx, rich, type RichText } from './rich';

export type Tone = 'paper' | 'surface' | 'forest' | 'ink' | 'cobalt' | 'vermilion';

/**
 * Section: a full-width band. The tone sets the ground and the colors every
 * component inside reads. Alternate paper and surface; use forest, ink and
 * vermilion for one band at a time, never two in a row.
 */
export function Section({
  tone = 'paper',
  size = 'md',
  flushBottom,
  id,
  labelledBy,
  label,
  className,
  children,
}: {
  tone?: Tone;
  size?: 'md' | 'lg';
  flushBottom?: boolean;
  id?: string;
  labelledBy?: string;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      aria-label={label}
      className={cx('pv-section', `pv-tone-${tone}`, size === 'lg' && 'pv-section--lg', flushBottom && 'pv-section--flush-bottom', className)}
    >
      <div className="pv-container">{children}</div>
    </section>
  );
}

/** Vertical stack of blocks inside a band. */
export function Block({ gap = 48, children, className }: { gap?: number; children: ReactNode; className?: string }) {
  return (
    <div className={cx('pv-block', className)} style={{ '--gap': `${gap}px` } as CSSProperties}>
      {children}
    </div>
  );
}

/**
 * Editorial band content (home page): a rail with the section index and its
 * figure plate, the content across two thirds, and optional full-width
 * content (`wide`) such as a screenshot.
 */
export function Editorial({
  index,
  label,
  figure,
  figureLabel,
  gap = 40,
  children,
  wide,
}: {
  index: string;
  label: string;
  figure: FigName;
  figureLabel?: string;
  gap?: number;
  children: ReactNode;
  wide?: ReactNode;
}) {
  return (
    <div className="pv-editorial">
      <div className="pv-editorial__rail">
        <SectionIndex number={index} label={label} />
        <FigureArt name={figure} label={figureLabel ?? `FIG. ${index}`} />
      </div>
      <div className="pv-editorial__main" style={{ '--gap': `${gap}px` } as CSSProperties}>
        {children}
      </div>
      {wide && <div className="pv-editorial__wide">{wide}</div>}
    </div>
  );
}

/**
 * Split header (inner pages): eyebrow and heading on the left, body on the
 * right. Children are the body.
 */
export function SplitHeader({
  eyebrow,
  eyebrowTone,
  title,
  titleId,
  children,
}: {
  eyebrow: string;
  eyebrowTone?: 'cobalt' | 'forest' | 'vermilion' | 'ink';
  title: RichText;
  titleId?: string;
  children?: ReactNode;
}) {
  return (
    <div className="pv-split">
      <div className="pv-split__head">
        <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow>
        <h2 className="t-h2" id={titleId}>
          {rich(title)}
        </h2>
      </div>
      {children && <div className="pv-split__body">{children}</div>}
    </div>
  );
}

/**
 * Feature: copy on one side and an illustration (code, screenshot, widget) on
 * the other, vertically centered. Children are the body paragraphs.
 */
export function Feature({
  eyebrow,
  eyebrowTone,
  title,
  titleId,
  lead,
  children,
  aside,
}: {
  eyebrow: string;
  eyebrowTone?: 'cobalt' | 'forest' | 'vermilion' | 'ink';
  title: RichText;
  titleId?: string;
  lead?: RichText;
  children?: ReactNode;
  /** The illustration. In Astro, pass it with slot="aside". */
  aside?: ReactNode;
}) {
  return (
    <div className="pv-feature">
      <div className="pv-feature__copy">
        <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow>
        <h2 className="t-h2" id={titleId}>
          {rich(title)}
        </h2>
        {lead && <p className="t-lead-serif">{rich(lead)}</p>}
        {children}
      </div>
      {aside && <div className="pv-feature__aside">{aside}</div>}
    </div>
  );
}

/**
 * Rail layout: a narrow side column (sticky on wide screens) beside the main
 * content, in the proportions of the editorial band.
 */
export function RailLayout({ rail, children }: { rail?: ReactNode; children: ReactNode }) {
  return (
    <div className="pv-rail">
      <div className="pv-rail__side">{rail}</div>
      <div className="pv-rail__main">{children}</div>
    </div>
  );
}

export interface Crumb {
  label: string;
  href?: string;
}

/** Breadcrumb: Provisa / Page. The last item is the current page. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="pv-crumb" role="list">
        {items.map((c) => (
          <li key={c.label}>
            {c.href ? (
              <a href={c.href}>{c.label}</a>
            ) : (
              <span aria-current="page">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export interface HeroAction {
  label: string;
  href: string;
  variant?: 'primary' | 'outline';
}

/**
 * Page hero (inner pages): breadcrumb, eyebrow, headline, lede and actions on
 * the left; a diagram (`aside`) on the right, bottom-aligned.
 */
export function PageHero({
  crumbs,
  eyebrow,
  eyebrowTone = 'forest',
  title,
  lede,
  actions,
  aside,
}: {
  crumbs: Crumb[];
  eyebrow: string;
  eyebrowTone?: 'cobalt' | 'forest' | 'vermilion';
  title: RichText;
  lede?: RichText;
  actions?: HeroAction[];
  aside?: ReactNode;
}) {
  return (
    <section className="pv-page-hero pv-tone-paper" aria-labelledby="page-title">
      <div className="pv-container">
        <Breadcrumb items={crumbs} />
        <div className="pv-page-hero__grid">
          <div className="pv-page-hero__copy">
            <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow>
            <h1 className="t-display" id="page-title">
              {rich(title)}
            </h1>
            {lede && <p className="t-lede pv-page-hero__lede">{rich(lede)}</p>}
            {actions && actions.length > 0 && (
              <div className="pv-actions">
                {actions.map((a) => (
                  <Button key={a.label} href={a.href} variant={a.variant ?? 'primary'} size="lg">
                    {a.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          {aside && <div>{aside}</div>}
        </div>
      </div>
    </section>
  );
}
