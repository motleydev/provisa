import { Button } from './actions';
import { Wordmark } from './brand';
import type { Html } from './util';

export interface NavLink {
  label: string;
  href: string;
}

/** UtilityBar: the cobalt strip above the header — one announcement, a few links. */
export function UtilityBar({ message, link, links }: { message: string; link: NavLink; links: NavLink[] }) {
  return (
    <div className="pv-utility">
      <div className="pv-container pv-utility__inner">
        <p>
          {message}{' '}
          <a className="pv-utility__cta" href={link.href}>
            {link.label}
          </a>
        </p>
        <nav className="pv-utility__links" aria-label="Utility">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

/**
 * SiteHeader: wordmark, primary nav, a secondary text link and the primary
 * button. Below 1080px the nav folds into a Menu disclosure that works
 * without script. `active` marks the current nav item.
 */
export function SiteHeader({
  items,
  active,
  homeHref = '/',
  badge,
  secondary,
  cta,
}: {
  items: NavLink[];
  active?: string;
  homeHref?: string;
  /** A short status label beside the wordmark, e.g. "Preview". */
  badge?: string;
  secondary: NavLink;
  cta: NavLink;
}) {
  const current = (l: NavLink) => (l.label === active ? 'page' : undefined);
  return (
    <header className="pv-header">
      <div className="pv-container pv-header__inner">
        <div className="pv-header__brand">
          <Wordmark href={homeHref} label="Provisa home" />
          {badge && <span className="pv-header__badge">{badge}</span>}
        </div>
        <nav className="pv-nav" aria-label="Primary">
          {items.map((l) => (
            <a key={l.label} href={l.href} aria-current={current(l)}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="pv-header__actions">
          <a className="pv-header__secondary" href={secondary.href}>
            {secondary.label}
          </a>
          <Button size="sm" href={cta.href} className="pv-header__cta">
            {cta.label}
          </Button>
          <details className="pv-menu" data-pv-menu="">
            <summary>
              <span className="pv-menu__icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              Menu
            </summary>
            <div className="pv-menu__panel">
              <div className="pv-container">
                <nav className="pv-menu__nav" aria-label="Primary">
                  {items.map((l) => (
                    <a key={l.label} href={l.href} aria-current={current(l)}>
                      {l.label}
                    </a>
                  ))}
                </nav>
                <div className="pv-menu__actions">
                  <Button href={cta.href}>{cta.label}</Button>
                  <Button href={secondary.href} variant="secondary">
                    {secondary.label}
                  </Button>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

/** Breadcrumb: "Provisa / Page". */
export function Breadcrumb({ items, current }: { items: NavLink[]; current: string }) {
  return (
    <nav className="pv-breadcrumb" aria-label="Breadcrumb">
      <ol>
        {items.map((l) => (
          <li key={l.href}>
            <a href={l.href}>{l.label}</a>
          </li>
        ))}
        <li>
          <span aria-current="page">{current}</span>
        </li>
      </ol>
    </nav>
  );
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

/**
 * SiteFooter: the wordmark and license blurb, link columns and the legal row.
 * The style guide's footer also carries a one-field subscribe form; the
 * mailing list needs a name as well as an email, so the site's signup form
 * lives in the ContactBand that closes every page instead.
 */
export function SiteFooter({
  blurb,
  columns,
  copyright,
  legal,
}: {
  blurb: Html;
  columns: FooterColumn[];
  copyright: string;
  legal: NavLink[];
}) {
  return (
    <footer className="pv-footer">
      <div className="pv-container pv-footer__inner">
        <div className="pv-footer__grid">
          <div className="pv-footer__brand">
            <Wordmark bars={false} />
            <p className="pv-footer__blurb" dangerouslySetInnerHTML={{ __html: blurb }} />
          </div>
          {columns.map((col) => (
            <nav key={col.title} className="pv-footer__col" aria-label={col.title}>
              <h2 className="pv-footer__title">{col.title}</h2>
              {col.links.map((l) => (
                <a key={l.label} href={l.href}>
                  {l.label}
                </a>
              ))}
            </nav>
          ))}
        </div>
        <div className="pv-footer__bottom">
          <span>{copyright}</span>
          <nav className="pv-footer__legal" aria-label="Legal">
            {legal.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
