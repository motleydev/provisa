import type { ReactNode } from 'react';
import { cx } from './util';

/**
 * Button. `primary` (cobalt) is the page's one main action; `secondary` is
 * the outline beside it; `inverse` and `onColor` sit on dark or colored
 * grounds.
 */
export function Button({
  variant = 'primary',
  size = 'lg',
  href,
  block,
  type = 'button',
  className,
  children,
}: {
  variant?: 'primary' | 'secondary' | 'inverse' | 'onColor';
  size?: 'lg' | 'sm';
  href?: string;
  block?: boolean;
  type?: 'button' | 'submit';
  className?: string;
  children: ReactNode;
}) {
  const cls = cx(
    'pv-btn',
    variant !== 'primary' && `pv-btn--${variant}`,
    size === 'sm' && 'pv-btn--sm',
    block && 'pv-btn--block',
    className,
  );
  return href ? (
    <a className={cls} href={href}>
      {children}
    </a>
  ) : (
    <button className={cls} type={type}>
      {children}
    </button>
  );
}

/**
 * TextLink. `underline` (default) is the standalone link with a rule under
 * it; `plain` drops the rule; `inline` is for a link inside a sentence.
 * The color follows the band (forest on light grounds, white on dark) unless
 * `tone` says otherwise.
 */
export function TextLink({
  href,
  arrow,
  tone,
  variant = 'underline',
  className,
  children,
}: {
  href: string;
  arrow?: boolean;
  tone?: 'forest' | 'ink' | 'inverse';
  variant?: 'underline' | 'plain' | 'inline';
  className?: string;
  children: ReactNode;
}) {
  return (
    <a className={cx('pv-tlink', `pv-tlink--${variant}`, tone && tone !== 'forest' && `pv-tlink--${tone}`, className)} href={href}>
      {children}
      {arrow ? ' →' : ''}
    </a>
  );
}

/** A row of TextLinks, e.g. the "read next" links that end a page. */
export function Links({ links, arrow = true }: { links: Array<{ label: string; href: string }>; arrow?: boolean }) {
  return (
    <div className="pv-links">
      {links.map((l) => (
        <TextLink key={l.href + l.label} href={l.href} arrow={arrow}>
          {l.label}
        </TextLink>
      ))}
    </div>
  );
}

/** HeroCTAs: the page's primary and secondary buttons, side by side. */
export function HeroCTAs({
  primary,
  secondary,
  children,
}: {
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  children?: ReactNode;
}) {
  return (
    <div className="pv-cta-row">
      <Button href={primary.href}>{primary.label}</Button>
      {secondary && (
        <Button href={secondary.href} variant="secondary">
          {secondary.label}
        </Button>
      )}
      {children}
    </div>
  );
}
