import type { CSSProperties } from 'react';
import { Switch, TextLink } from './primitives';
import { cx, pad2, rich, type RichText } from './rich';

/* ------------------------------------------------------------ Accordion */

export interface AccordionItem {
  title: string;
  /** Answer copy (FAQ) or the body under the lede (numbered). */
  body: RichText;
  /** Numbered variant: the bold one-line summary beside the body. */
  lede?: string;
  link?: { label: string; href: string };
}

/**
 * Accordion: native details elements sharing one `name`, so opening one
 * closes the others. `numbered` adds a mono index and lays each open item out
 * as lede beside body; the default is the FAQ layout.
 */
export function Accordion({ name, items, numbered, open = 0 }: { name: string; items: AccordionItem[]; numbered?: boolean; open?: number | null }) {
  return (
    <div className={cx('pv-accordion', numbered && 'pv-accordion--numbered')}>
      {items.map((item, i) => (
        <details key={item.title} className="pv-accordion__item" name={name} open={open === i}>
          <summary className="pv-accordion__summary">
            {numbered && <span className="pv-accordion__num">{pad2(i)}</span>}
            <span>{item.title}</span>
            <span className="pv-accordion__sign" aria-hidden="true" />
          </summary>
          <div className="pv-accordion__panel">
            {numbered && item.lede ? (
              <>
                <p className="pv-accordion__lede">{item.lede}</p>
                <div className="l-stack" style={{ '--gap': '16px' } as CSSProperties}>
                  <p className="t-body pv-body">{rich(item.body)}</p>
                  {item.link && (
                    <TextLink href={item.link.href} plain arrow>
                      {item.link.label}
                    </TextLink>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="t-body">{rich(item.body)}</p>
                {item.link && (
                  <TextLink href={item.link.href} plain arrow>
                    {item.link.label}
                  </TextLink>
                )}
              </>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- Tabs */

export interface TabItem {
  label: string;
  title: string;
  body: RichText;
}

/**
 * Tabs: a bar of tabs over one panel. Each panel pairs a mono kicker and a
 * heading with a paragraph. Arrow keys move between tabs.
 */
export function Tabs({ id, label, kicker, tabs }: { id: string; label: string; kicker?: string; tabs: TabItem[] }) {
  return (
    <div className="pv-tabs" data-pv-tabs="">
      <div className="pv-tabs__list" role="tablist" aria-label={label}>
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-controls={`${id}-panel-${i}`}
            aria-selected={i === 0}
            tabIndex={i === 0 ? 0 : -1}
            className="pv-tabs__tab"
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.label} className="pv-tabs__panel" role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} hidden={i !== 0}>
          <div className="l-grid" style={{ '--min': '300px', '--gap': '24px 56px', alignItems: 'start' } as CSSProperties}>
            <div className="l-stack" style={{ '--gap': '10px' } as CSSProperties}>
              {kicker && <span className="t-mono-sm pv-muted">{kicker}</span>}
              <h3 className="t-h3">{t.title}</h3>
            </div>
            <p className="t-body-lg pv-body">{rich(t.body)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- RoleSwitcher */

export interface RoleState {
  name: string;
  /** Whether the flag is on for this role. */
  on: boolean;
  rows: Array<{ k: string; v: string; ok: boolean }>;
}

/**
 * Role switcher: segmented buttons choose a role; the panel shows one flag's
 * state for that role and what the role gets. A paper card for forest bands.
 */
export function RoleSwitcher({ id, label, flag, roles }: { id: string; label: string; flag: string; roles: RoleState[] }) {
  return (
    <div className="pv-segmented pv-card pv-card--paper pv-tone-paper" data-pv-tabs="" style={{ padding: 'clamp(24px, 3vw, 36px)' }}>
      <div className="pv-segmented__list" role="tablist" aria-label={label}>
        {roles.map((r, i) => (
          <button
            key={r.name}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-controls={`${id}-panel-${i}`}
            aria-selected={i === 0}
            tabIndex={i === 0 ? 0 : -1}
            className="pv-segmented__tab"
          >
            {r.name}
          </button>
        ))}
      </div>
      {roles.map((r, i) => (
        <div key={r.name} role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} hidden={i !== 0} className="l-stack" style={{ '--gap': '22px' } as CSSProperties}>
          <div className="pv-kv-head">
            <span>{flag}</span>
            <Switch on={r.on} />
          </div>
          <dl className="pv-kv">
            {r.rows.map((row) => (
              <div key={row.k}>
                <dt>{row.k}</dt>
                <dd className={row.ok ? 'pv-kv__on' : 'pv-kv__off'}>{row.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
