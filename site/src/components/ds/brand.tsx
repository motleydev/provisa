import type { CSSProperties } from 'react';
import { cx } from './util';

const BARS = ['cobalt', 'forest', 'vermilion'] as const;

/** Wordmark: the three brand bars and "Provisa" in Source Serif 4. */
export function Wordmark({
  size = 26,
  inverse = false,
  bars = true,
  href,
  label,
}: {
  size?: number;
  inverse?: boolean;
  bars?: boolean;
  href?: string;
  /** Accessible name when the mark is a link, e.g. "Provisa home". */
  label?: string;
}) {
  const style = { '--wm': `${size}px` } as CSSProperties;
  const cls = cx('pv-wordmark', inverse && 'pv-wordmark--inverse');
  const inner = (
    <>
      {bars && (
        <span className="pv-wordmark__bars" aria-hidden="true">
          {BARS.map((c) => (
            <span key={c} className={`pv-fill-${c}`} />
          ))}
        </span>
      )}
      Provisa
    </>
  );
  return href ? (
    <a className={cls} style={style} href={href} aria-label={label}>
      {inner}
    </a>
  ) : (
    <span className={cls} style={style}>
      {inner}
    </span>
  );
}

/** BrandBars: the tricolor marker above a closing headline. */
export function BrandBars() {
  return (
    <div className="pv-brandbars" aria-hidden="true">
      {BARS.map((c) => (
        <span key={c} className={`pv-fill-${c}`} />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- FigPanel */

type Color = 'cobalt' | 'forest' | 'vermilion' | 'ink' | 'paper';
type Shape = [number, number, number, number | 'sq' | 'dot', Color];
interface Fig {
  bg: Color;
  s?: Shape[];
  rings?: boolean;
  lines?: boolean;
  dots?: boolean;
}

/** The style guide's figure plates, one per numbered home section. */
const FIGS: Record<string, Fig> = {
  platform: {
    bg: 'cobalt',
    s: [[10, 8, 34, 'sq', 'vermilion'], [27, 21, 2, 48, 'paper'], [27, 67, 23, 1.6, 'paper'], [50, 58, 11, 'sq', 'paper'], [64, 58, 11, 'sq', 'paper'], [78, 58, 11, 'sq', 'paper'], [50, 69.5, 11, 'sq', 'paper'], [64, 69.5, 11, 'sq', 'paper'], [78, 69.5, 11, 'sq', 'paper'], [50, 81, 11, 'sq', 'paper'], [64, 81, 11, 'sq', 'paper'], [78, 81, 11, 'sq', 'ink']],
  },
  usecases: {
    bg: 'vermilion',
    s: [[12, 18, 40, 6, 'paper'], [12, 31, 88, 6, 'cobalt'], [12, 44, 30, 6, 'paper'], [12, 57, 55, 6, 'paper'], [12, 70, 45, 6, 'paper'], [12, 86, 20, 1.6, 'ink']],
  },
  governance: { bg: 'cobalt', rings: true },
  security: { bg: 'forest', lines: true },
  interfaces: {
    bg: 'cobalt',
    s: [[16, 12, 16, 36, 'paper'], [42, 12, 16, 36, 'paper'], [68, 12, 16, 36, 'vermilion'], [16, 54, 68, 10, 'ink'], [42, 64, 16, 24, 'paper']],
  },
  sources: { bg: 'forest', dots: true },
  derived: {
    bg: 'vermilion',
    s: [[12, 10, 24, 'dot', 'paper'], [22, 34, 1.6, 20, 'ink'], [12, 74, 76, 14, 'paper'], [30, 60, 58, 14, 'paper'], [48, 46, 40, 14, 'cobalt'], [66, 32, 22, 14, 'ink']],
  },
  deploy: {
    bg: 'forest',
    s: [[10, 78, 8, 'sq', 'paper'], [22, 66, 14, 'sq', 'paper'], [40, 48, 24, 'sq', 'cobalt'], [58, 18, 32, 'sq', 'vermilion']],
  },
};

export type FigureName = keyof typeof FIGS;

const c = (n: Color) => `var(--${n})`;

function shapes(f: Fig): CSSProperties[] {
  if (f.rings)
    return [84, 70, 56, 42, 28, 14].map((w, i) => ({
      left: `${(100 - w) / 2}%`,
      top: '50%',
      width: `${w}%`,
      aspectRatio: '1',
      transform: 'translateY(-50%)',
      background: i === 5 ? c('vermilion') : i % 2 ? c('cobalt') : c('paper'),
    }));
  if (f.lines) {
    const a: CSSProperties[] = [];
    for (let i = 0; i < 12; i++) a.push({ left: '12%', top: `${18 + i * 6}%`, width: '76%', height: '0.5%', background: c('paper'), opacity: 0.7 });
    a.push({ left: '12%', top: '53.5%', width: '76%', height: '5%', background: c('vermilion') });
    a.push({ left: '12%', top: '84%', width: '10%', aspectRatio: '1', background: c('cobalt') });
    return a;
  }
  if (f.dots) {
    const hi: Record<string, Color> = { '1,1': 'vermilion', '1,5': 'cobalt', '3,2': 'vermilion', '4,5': 'cobalt', '5,3': 'vermilion', '6,4': 'ink', '7,4': 'cobalt' };
    const a: CSSProperties[] = [];
    for (let r = 0; r < 9; r++)
      for (let k = 0; k < 6; k++)
        a.push({ left: `${10 + k * 14}%`, top: `${12 + r * 8.8}%`, width: '8%', aspectRatio: '1', borderRadius: '50%', background: c(hi[`${r},${k}`] ?? 'paper') });
    return a;
  }
  return (f.s ?? []).map(([l, t, w, h, col]) => ({
    left: `${l}%`,
    top: `${t}%`,
    width: `${w}%`,
    ...(h === 'sq' ? { aspectRatio: '1' } : h === 'dot' ? { aspectRatio: '1', borderRadius: '50%' } : { height: `${h}%` }),
    background: c(col),
  }));
}

/**
 * FigPanel: a flat geometric plate in the brand colors, labeled "FIG. 0n".
 * Decorative, so it is hidden from assistive tech.
 */
export function FigPanel({ figure = 'platform', label }: { figure?: FigureName; label?: string }) {
  const f = FIGS[figure] ?? FIGS.platform;
  return (
    <div className={cx('pv-fig', `pv-fill-${f.bg}`)} aria-hidden="true">
      <div className="pv-fig__shapes">
        {shapes(f).map((s, i) => (
          <span key={i} style={s} />
        ))}
      </div>
      {label && <span className="pv-fig__label">{label}</span>}
    </div>
  );
}
