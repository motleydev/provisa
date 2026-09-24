import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { cx, external, rich, type RichText } from './rich';

type Brand = 'cobalt' | 'forest' | 'vermilion';

/** The Provisa logo: three brand bars and the serif wordmark. */
export function Logo({ href = '/', size = 'md', label = 'Provisa home' }: { href?: string; size?: 'md' | 'sm'; label?: string }) {
  return (
    <a className={cx('pv-logo', size === 'sm' && 'pv-logo--sm')} href={href} aria-label={label}>
      <span className="pv-logo__mark" aria-hidden="true">
        <span className="pv-logo__bar" />
        <span className="pv-logo__bar" />
        <span className="pv-logo__bar" />
      </span>
      <span aria-hidden="true">Provisa</span>
    </a>
  );
}

/** The logo bars as a band marker above a closing headline. */
export function Tricolor() {
  return (
    <span className="pv-tricolor" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

type ButtonBase = {
  variant?: 'primary' | 'outline' | 'ink';
  size?: 'md' | 'lg';
  block?: boolean;
  children: ReactNode;
  className?: string;
};

export type ButtonProps = ButtonBase &
  (
    | ({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>)
    | ({ href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>)
  );

/**
 * Button. Primary (cobalt) is for "Book a demo" and the one action a view is
 * for; outline is the secondary action beside it. A link when given `href`.
 */
export function Button({ variant = 'primary', size = 'md', block, className, children, ...rest }: ButtonProps) {
  const classes = cx('pv-btn', `pv-btn--${variant}`, size === 'lg' && 'pv-btn--lg', block && 'pv-btn--block', className);
  if (rest.href !== undefined) {
    const { href, ...anchor } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    return (
      <a className={classes} href={href} {...external(href)} {...anchor}>
        {children}
      </a>
    );
  }
  const { type = 'button', ...button } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classes} type={type} {...button}>
      {children}
    </button>
  );
}

/** A group of buttons, wrapping on narrow screens. */
export function Actions({ children }: { children: ReactNode }) {
  return <div className="pv-actions">{children}</div>;
}

/**
 * Ruled link: underlined in the band's link color. `arrow` appends →;
 * `plain` drops the rule (use inside dense panels).
 */
export function TextLink({
  href,
  children,
  arrow,
  plain,
  className,
}: {
  href: string;
  children: ReactNode;
  arrow?: boolean;
  plain?: boolean;
  className?: string;
}) {
  return (
    <a className={cx('pv-link', plain && 'pv-link--plain', className)} href={href} {...external(href)}>
      {children}
      {arrow && <span aria-hidden="true">→</span>}
    </a>
  );
}

/** A row of ruled links. */
export function Links({ items, className }: { items: Array<{ label: string; href: string; arrow?: boolean }>; className?: string }) {
  return (
    <div className={cx('pv-links', className)}>
      {items.map((l) => (
        <TextLink key={l.href + l.label} href={l.href} arrow={l.arrow}>
          {l.label}
        </TextLink>
      ))}
    </div>
  );
}

/**
 * Eyebrow: the uppercase label above a heading. `tone` picks a brand color;
 * the band decides the text-safe shade (vermilion is vermilion-deep on light
 * grounds, vermilion-light on ink).
 */
export function Eyebrow({
  children,
  tone,
  as: Tag = 'p',
  small,
  className,
}: {
  children: ReactNode;
  tone?: Brand | 'ink';
  as?: 'p' | 'span' | 'div' | 'h2' | 'h3';
  small?: boolean;
  className?: string;
}) {
  return <Tag className={cx(small ? 't-label' : 't-eyebrow', 'pv-eyebrow', tone && `pv-eyebrow--${tone}`, className)}>{children}</Tag>;
}

/** Section index: the mono number and label that open an editorial band. */
export function SectionIndex({ number, label }: { number: string; label: string }) {
  return (
    <div className="pv-index">
      <span className="pv-index__num t-mono">{number}</span>
      <span className="t-eyebrow">{label}</span>
    </div>
  );
}

/** Tag: a short label. Brand tones are filled; the default is stone. */
export function Tag({ children, tone }: { children: ReactNode; tone?: Brand | 'ink' }) {
  return <span className={cx('pv-tag', tone && `pv-tag--${tone}`)}>{children}</span>;
}

export function Tags({ items }: { items: Array<{ label: string; tone?: Brand | 'ink' }> }) {
  return (
    <div className="pv-tags">
      {items.map((t) => (
        <Tag key={t.label} tone={t.tone}>
          {rich(t.label)}
        </Tag>
      ))}
    </div>
  );
}

/** Switch: shows an on/off state set elsewhere. Not itself a control. */
export function Switch({ on, label }: { on: boolean; label?: string }) {
  return (
    <span className="pv-switch" data-on={on ? '' : undefined}>
      <span>{label ?? (on ? 'on' : 'off')}</span>
      <span className="pv-switch__track" aria-hidden="true">
        <span className="pv-switch__knob" />
      </span>
    </span>
  );
}

/** Auto-fitting grid: columns at least `min` wide. */
export function Grid({ min = 240, gap = 32, children, className }: { min?: number; gap?: number; children: ReactNode; className?: string }) {
  const style = { '--min': `${min}px`, '--gap': `${gap}px` } as CSSProperties;
  return (
    <div className={cx('l-grid', className)} style={style}>
      {children}
    </div>
  );
}

/** Paragraph of rich text in the band's body color. */
export function Body({ children, size = 'lg', className }: { children: RichText; size?: 'lg' | 'md' | 'sm'; className?: string }) {
  const cls = size === 'lg' ? 't-body-lg' : size === 'md' ? 't-body' : 't-body-sm';
  return <p className={cx(cls, 'pv-body', className)}>{rich(children)}</p>;
}
