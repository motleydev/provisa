import type { ReactNode } from 'react';
import { cx, pad2, type Html } from './util';

export interface AccordionItem {
  title: string;
  /** Numbered variant: the bold line beside the body. */
  lede?: string;
  /** Paragraphs of copy (trusted HTML). */
  body: Html | Html[];
  link?: string;
  href?: string;
}

/**
 * Accordion: `faq` (serif question, + / −) or `numbered` (01, 02 … with a
 * bold lede beside the body). Built on native `<details name>`, so it needs
 * no script and opening one item closes the others. `initial` opens one item
 * on load; -1 opens none.
 */
export function Accordion({ name, items, variant = 'faq', initial = 0 }: { name: string; items: AccordionItem[]; variant?: 'faq' | 'numbered'; initial?: number }) {
  const numbered = variant === 'numbered';
  return (
    <div className={cx('pv-accordion', numbered && 'pv-accordion--numbered')}>
      {items.map((it, i) => {
        const paras = Array.isArray(it.body) ? it.body : [it.body];
        const copy = (
          <>
            {paras.map((p, k) => (
              <p key={k} className="pv-p" dangerouslySetInnerHTML={{ __html: p }} />
            ))}
            {it.link && it.href && (
              <a className="pv-acc__link" href={it.href}>
                {it.link} →
              </a>
            )}
          </>
        );
        return (
          <details key={it.title} className="pv-acc" name={name} open={i === initial}>
            <summary className="pv-acc__summary">
              {numbered && <span className="pv-acc__num">{pad2(i + 1)}</span>}
              <span className="pv-acc__title">{it.title}</span>
              <span className="pv-acc__sign" aria-hidden="true" />
            </summary>
            {numbered ? (
              <div className="pv-acc__body">
                {it.lede && <h3 className="pv-acc__lede">{it.lede}</h3>}
                <div className="pv-acc__col">{copy}</div>
              </div>
            ) : (
              <div className="pv-acc__body">{copy}</div>
            )}
          </details>
        );
      })}
    </div>
  );
}

/** Disclosure: a single Accordion row whose body is arbitrary content. */
export function Disclosure({ title, open, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <div className="pv-accordion">
      <details className="pv-acc" open={open}>
        <summary className="pv-acc__summary">
          <span className="pv-acc__title">{title}</span>
          <span className="pv-acc__sign" aria-hidden="true" />
        </summary>
        <div className="pv-acc__body">{children}</div>
      </details>
    </div>
  );
}
