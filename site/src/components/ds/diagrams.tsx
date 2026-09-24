import type { CSSProperties, ReactNode } from 'react';
import { CodeBlock, type Code, type CommentStyle } from './code';
import { FIGURES, type FigName } from './figures';
import { cx, pad2, rich, type RichText } from './rich';

type Brand = 'cobalt' | 'forest' | 'vermilion';

/** Figure art: a 4:5 geometric plate labeled FIG. nn. Decorative. */
export function FigureArt({ name, label }: { name: FigName; label?: string }) {
  const plate = FIGURES[name];
  return (
    <div className="pv-fig" style={{ '--fig-bg': `var(--${plate.bg})` } as CSSProperties} aria-hidden="true">
      <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" focusable="false">
        {plate.shapes.map((s, i) =>
          'rect' in s ? (
            <rect key={i} className={`f-${s.fill}`} x={s.rect[0]} y={s.rect[1]} width={s.rect[2]} height={s.rect[3]} opacity={s.opacity} />
          ) : (
            <circle key={i} className={`f-${s.fill}`} cx={s.circle[0]} cy={s.circle[1]} r={s.circle[2]} />
          ),
        )}
      </svg>
      {label && <span className="pv-fig__label t-mono-xs">{label}</span>}
    </div>
  );
}

/* ---------------------------------------------------------------- Stack */

/** Stack: the layered diagram beside an inner page hero. Compose from the parts below. */
export function Stack({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="pv-stack" role={label ? 'group' : undefined} aria-label={label}>
      {children}
    </div>
  );
}

/** Stack header: the input, in mono, inside a ruled box. */
export function StackHead({ children }: { children: ReactNode }) {
  return <div className="pv-stack__head">{children}</div>;
}

/** Stack row: an index and a label on a brand tint with a 6px bar. Links when given `href`. */
export function StackRow({ index, label, tone, href, tall }: { index: string; label: string; tone: Brand; href?: string; tall?: boolean }) {
  const className = cx('pv-stack__row', `pv-stack__row--${tone}`, tall && 'pv-stack__row--tall');
  const inner = (
    <>
      <span className="pv-stack__idx">{index}</span>
      <span className="pv-stack__label">{label}</span>
    </>
  );
  return href ? (
    <a className={className} href={href}>
      {inner}
    </a>
  ) : (
    <div className={className}>{inner}</div>
  );
}

/** Stack node: a named dataset with a mono caption, for dependency chains. */
export function StackNode({ title, meta, tone }: { title: string; meta: string; tone: Brand }) {
  return (
    <div className={cx('pv-stack__node', `pv-stack__row--${tone}`)}>
      <span className="pv-stack__node-title">{title}</span>
      <span className="pv-stack__node-meta">{meta}</span>
    </div>
  );
}

/** A downward arrow between stack parts. */
export function StackArrow() {
  return (
    <div className="pv-stack__arrow" aria-hidden="true">
      ↓
    </div>
  );
}

/** Three-up grid of bordered mono chips (protocols, sources). */
export function StackCells({ items }: { items: string[] }) {
  return (
    <div className="pv-stack__cells">
      {items.map((item) => (
        <div key={item} className="pv-chip">
          {item}
        </div>
      ))}
    </div>
  );
}

/** Three-up grid of brand-filled cells (the three languages). */
export function StackFills({ items }: { items: Array<{ label: string; tone: Brand }> }) {
  return (
    <div className="pv-stack__cells">
      {items.map((item) => (
        <div key={item.label} className={cx('pv-stack__fill', `pv-bg-${item.tone}`)}>
          {item.label}
        </div>
      ))}
    </div>
  );
}

/** Stack footer: the output, on ink, with a vermilion mono label. */
export function StackNote({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pv-stack__note">
      <span className="pv-stack__note-label">{label}</span>
      <span>{children}</span>
    </div>
  );
}

/** Stack panel: a labeled box, cobalt-filled or outlined. */
export function StackPanel({ label, variant = 'outline', children }: { label: string; variant?: 'cobalt' | 'outline'; children: ReactNode }) {
  return (
    <div className={cx('pv-stack__panel', `pv-stack__panel--${variant}`)}>
      <span className="pv-stack__panel-label">{label}</span>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------- Callout */

/** Callout bar: a mono label and one sentence, edged in vermilion. */
export function Callout({ label, tone = 'ink', children }: { label: string; tone?: 'ink' | 'paper'; children: ReactNode }) {
  return (
    <div className={cx('pv-callout', `pv-callout--${tone}`)}>
      <span className="pv-callout__label">{label}</span>
      <span className="pv-callout__text">{children}</span>
    </div>
  );
}

/* --------------------------------------------------------------- Layers */

export interface LayerSummary {
  title: string;
  desc: RichText;
}

/**
 * Layer list: the six governance layers as index, name and one line each,
 * between an input line and an output callout. Built for a forest band.
 */
export function LayerList({ head, layers, out }: { head: string; layers: LayerSummary[]; out?: { label: string; text: string } }) {
  return (
    <div className="pv-layers">
      <div className="pv-layers__head">{head}</div>
      <ol role="list">
        {layers.map((l, i) => (
          <li key={l.title} className="pv-layers__row">
            <span className="pv-layers__num">{i}</span>
            <span className="pv-layers__name">{l.title}</span>
            <span className="pv-layers__desc">{rich(l.desc)}</span>
          </li>
        ))}
      </ol>
      {out && (
        <Callout label={out.label} tone="paper">
          {out.text}
        </Callout>
      )}
    </div>
  );
}

export interface LayerDetailItem {
  title: string;
  body: RichText;
  group: string;
  tone: Brand;
}

/** Layer detail: each layer with a large numeral, its group and full copy. */
export function LayerDetail({ layers, idPrefix = 'layer' }: { layers: LayerDetailItem[]; idPrefix?: string }) {
  return (
    <ol role="list" className="pv-layer-detail">
      {layers.map((l, i) => (
        <li key={l.title} id={`${idPrefix}-${i}`} className={cx('pv-layer', `pv-layer--${l.tone}`)}>
          <span className="pv-layer__num t-numeral-xl" aria-hidden="true">
            {i}
          </span>
          <div className="pv-layer__copy">
            <span className="pv-layer__group t-label">{l.group}</span>
            <h3 className="t-h3-xl">
              <span className="visually-hidden">Layer {i}: </span>
              {l.title}
            </h3>
            <p className="pv-layer__body t-body-lg">{rich(l.body)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Legend: colored squares naming groups, with their index range. */
export function Legend({ items }: { items: Array<{ name: string; range: string; tone: Brand }> }) {
  return (
    <ul className="pv-legend" role="list">
      {items.map((g) => (
        <li key={g.name}>
          <span className={cx('pv-legend__swatch', `pv-bg-${g.tone}`)} aria-hidden="true" />
          <span className="pv-legend__name">{g.name}</span>
          <span className="pv-legend__range">{g.range}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------- Trace */

export interface TraceStepData {
  title: string;
  body: RichText;
  code: Code | string;
  comments?: CommentStyle;
}

/** Trace: one request followed step by step, copy beside the code at that step. */
export function Trace({ steps, label }: { steps: TraceStepData[]; label?: string }) {
  return (
    <ol className="pv-trace" role="list" aria-label={label}>
      {steps.map((s, i) => (
        <li key={s.title} className="pv-trace__step">
          <div className="pv-trace__text">
            <span className="pv-trace__num t-mono">{pad2(i)}</span>
            <h3 className="t-h4">{s.title}</h3>
            <p className="pv-trace__body">{rich(s.body)}</p>
          </div>
          <CodeBlock code={s.code} comments={s.comments} compact label={`${s.title}: code`} />
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------ Protocols */

export interface ProtocolData {
  name: string;
  meta: string;
  body: RichText;
  code: string;
}

/** Protocol rows: name and caption, what it serves, and a one-line example. */
export function ProtocolList({ items }: { items: ProtocolData[] }) {
  return (
    <div className="pv-protocols">
      {items.map((p) => (
        <div key={p.name} className="pv-protocol">
          <div className="pv-protocol__name">
            <h3 className="t-h4">{p.name}</h3>
            <span className="pv-protocol__meta t-mono-sm">{p.meta}</span>
          </div>
          <p className="pv-protocol__desc t-body">{rich(p.body)}</p>
          <code className="pv-code-chip" title={p.code}>
            {p.code}
          </code>
        </div>
      ))}
    </div>
  );
}
