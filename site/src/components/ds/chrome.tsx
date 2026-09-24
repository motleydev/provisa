import type { ReactNode } from 'react';
import { Button, Logo, Tricolor, TextLink } from './primitives';
import { cx, external, rich, type RichText } from './rich';

export interface NavLink {
  label: string;
  href: string;
}

/* ----------------------------------------------------------- Utility bar */

/** Utility bar: the cobalt strip with one announcement and a few links. */
export function UtilityBar({ message, cta, links }: { message: string; cta: NavLink; links: NavLink[] }) {
  return (
    <div className="pv-utility">
      <div className="pv-container pv-utility__inner">
        <p>
          {message}{' '}
          <a className="pv-utility__cta" href={cta.href} {...external(cta.href)}>
            {cta.label}
          </a>
        </p>
        <nav className="pv-utility__links" aria-label="Utility">
          {links.map((l) => (
            <a key={l.href} href={l.href} {...external(l.href)}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Header */

/**
 * Site header: logo, primary nav and the two calls to action. Below 1240px the
 * nav folds into a Menu disclosure (works without script); the page's own nav
 * item is marked with `current`.
 */
export function SiteHeader({
  nav,
  current,
  trial,
  demo,
}: {
  nav: NavLink[];
  current?: string;
  trial: NavLink;
  demo: NavLink;
}) {
  const isCurrent = (l: NavLink) => (current && l.href === current ? 'page' : undefined);
  return (
    <header className="pv-header">
      <div className="pv-container pv-header__inner">
        <Logo />
        <nav className="pv-nav" aria-label="Primary">
          {nav.map((l) => (
            <a key={l.href} href={l.href} aria-current={isCurrent(l)}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="pv-header__actions">
          <a className="pv-header__trial" href={trial.href} {...external(trial.href)}>
            {trial.label}
          </a>
          <Button href={demo.href} className="pv-header__demo">
            {demo.label}
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
                  {nav.map((l) => (
                    <a key={l.href} href={l.href} aria-current={isCurrent(l)}>
                      {l.label}
                    </a>
                  ))}
                </nav>
                <div className="pv-menu__actions">
                  <Button href={demo.href}>{demo.label}</Button>
                  <Button href={trial.href} variant="outline">
                    {trial.label}
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

/* --------------------------------------------------------------- Fields */

export interface FieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel';
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
  autoComplete?: string;
  multiline?: boolean;
  rows?: number;
  id?: string;
}

/** Field: a visible label over a square input. Placeholders never replace labels. */
export function Field({ label, name, type = 'text', placeholder, required, optional, autoComplete, multiline, rows = 3, id }: FieldProps) {
  const fieldId = id ?? `f-${name}`;
  return (
    <div className="pv-field">
      <label className="pv-field__label" htmlFor={fieldId}>
        {label}
        {optional && <span className="pv-field__optional"> (optional)</span>}
      </label>
      {multiline ? (
        <textarea className="pv-input" id={fieldId} name={name} placeholder={placeholder} required={required} rows={rows} />
      ) : (
        <input className="pv-input" id={fieldId} name={name} type={type} placeholder={placeholder} required={required} autoComplete={autoComplete} />
      )}
    </div>
  );
}

/** Honeypot input: off-screen, skipped by keyboard and assistive tech. */
export function Honeypot({ name }: { name: string }) {
  return (
    <div className="pv-hp" aria-hidden="true">
      <label>
        Leave this empty
        <input type="text" name={name} tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

/**
 * A form wired to a JSON endpoint by the site's form script: posts the fields,
 * reports in the status line, resets on success.
 */
export function ApiForm({
  endpoint,
  success,
  className,
  label,
  children,
}: {
  endpoint: string;
  success: string;
  className?: string;
  label?: string;
  children: ReactNode;
}) {
  return (
    <form className={className} data-pv-form={endpoint} data-success={success} aria-label={label} noValidate>
      {children}
    </form>
  );
}

/** Status line for an ApiForm. */
export function FormStatus() {
  return <p className="pv-status" role="status" aria-live="polite" data-pv-status="" />;
}

/* ------------------------------------------------------------ Demo form */

/** Demo form: the paper card in the contact band that books a demo. */
export function DemoForm({ title = 'Book a demo', endpoint = '/api/demo', idPrefix = 'demo', fine }: { title?: string; endpoint?: string; idPrefix?: string; fine?: RichText }) {
  return (
    <ApiForm className="pv-demo pv-tone-paper" endpoint={endpoint} success="Thanks — your request is in. We'll be in touch by email." label={title}>
      <h3 className="t-h3">{title}</h3>
      <div className="pv-demo__grid">
        <Field id={`${idPrefix}-name`} label="Full name" name="name" autoComplete="name" required />
        <Field id={`${idPrefix}-email`} label="Work email" name="email" type="email" autoComplete="email" required />
        <Field id={`${idPrefix}-company`} label="Company" name="company" autoComplete="organization" required />
        <Field id={`${idPrefix}-title`} label="Job title" name="title" autoComplete="organization-title" optional />
      </div>
      <Field id={`${idPrefix}-message`} label="What would you like to connect?" name="message" multiline optional />
      <Honeypot name="website" />
      <Button type="submit" size="lg" block>
        {title}
      </Button>
      <FormStatus />
      {fine && <p className="pv-demo__fine t-fine">{rich(fine)}</p>}
    </ApiForm>
  );
}

/* ---------------------------------------------------------- Contact band */

/**
 * Contact band: the closing call to action with the demo form. Forest on the
 * home page, ink (with the tricolor marker) on inner pages.
 */
export function ContactSection({
  tone = 'ink',
  title,
  lead,
  links,
  form,
  id = 'contact',
}: {
  tone?: 'forest' | 'ink';
  title: string;
  lead: string;
  links: Array<{ label: string; href: string }>;
  form?: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={cx('pv-section', 'pv-contact', `pv-tone-${tone}`)} aria-labelledby={`${id}-title`}>
      <div className="pv-container">
        <div className="pv-contact__grid">
          <div className="pv-contact__copy">
            {tone === 'ink' && <Tricolor />}
            <h2 className="t-cta" id={`${id}-title`}>
              {title}
            </h2>
            <p className="t-lead pv-contact__lead">{lead}</p>
            <div className="pv-links">
              {links.map((l) => (
                <TextLink key={l.label} href={l.href}>
                  {l.label}
                </TextLink>
              ))}
            </div>
          </div>
          {form ?? <DemoForm idPrefix={`${id}-demo`} />}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Footer */

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

/**
 * Site footer: the logo and license note, link columns, the mailing-list
 * form, and the legal line.
 */
export function SiteFooter({
  note,
  columns,
  subscribe,
  copyright,
  legal,
}: {
  note: RichText;
  columns: FooterColumn[];
  subscribe?: { title: string; text: string; fine: RichText; endpoint: string };
  copyright: string;
  legal: NavLink[];
}) {
  return (
    <footer className="pv-footer">
      <div className="pv-container pv-footer__inner">
        <div className="pv-footer__grid">
          <div className="pv-footer__brand">
            <Logo />
            <p className="pv-footer__note t-fine">{rich(note)}</p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} className="pv-footer__col" aria-label={col.title}>
              <h2 className="pv-footer__title">{col.title}</h2>
              {col.links.map((l) => (
                <a key={l.href + l.label} href={l.href} {...external(l.href)}>
                  {l.label}
                </a>
              ))}
            </nav>
          ))}
          {subscribe && (
            <ApiForm className="pv-footer__col pv-footer__col--wide" endpoint={subscribe.endpoint} success="You're on the list. Thanks!" label={subscribe.title}>
              <h2 className="pv-footer__title">{subscribe.title}</h2>
              <p className="pv-footer__text">{subscribe.text}</p>
              <div>
                <div className="pv-inline">
                  <label className="visually-hidden" htmlFor="sub-name">
                    Your name
                  </label>
                  <input className="pv-inline__input" id="sub-name" name="name" type="text" placeholder="Your name" autoComplete="name" required />
                </div>
                <div className="pv-inline">
                  <label className="visually-hidden" htmlFor="sub-email">
                    Work email
                  </label>
                  <input className="pv-inline__input" id="sub-email" name="email" type="email" placeholder="Work email" autoComplete="email" required />
                  <button className="pv-inline__btn" type="submit">
                    Subscribe
                  </button>
                </div>
              </div>
              <Honeypot name="company" />
              <FormStatus />
              <p className="pv-footer__fine">{rich(subscribe.fine)}</p>
            </ApiForm>
          )}
        </div>
        <div className="pv-footer__bottom">
          <span>{copyright}</span>
          <nav className="pv-footer__legal" aria-label="Legal">
            {legal.map((l) => (
              <a key={l.href} href={l.href} {...external(l.href)}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
