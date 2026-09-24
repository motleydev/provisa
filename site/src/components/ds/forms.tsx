import type { ReactNode } from 'react';
import { Button } from './actions';
import type { Html } from './util';

/* ------------------------------------------------------------- Inputs */

interface InputProps {
  id: string;
  name: string;
  type?: 'text' | 'email' | 'tel';
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  label?: string;
}

/** Input: a square white field. Give it a visible Field label, or `label` for an accessible name. */
export function Input({ id, name, type = 'text', placeholder, required, autoComplete, label }: InputProps) {
  return <input className="pv-input" id={id} name={name} type={type} placeholder={placeholder} required={required} autoComplete={autoComplete} aria-label={label} />;
}

export function Textarea({ id, name, placeholder, rows = 3, required }: { id: string; name: string; placeholder?: string; rows?: number; required?: boolean }) {
  return <textarea className="pv-input" id={id} name={name} placeholder={placeholder} rows={rows} required={required} />;
}

/** Field: a visible label over an Input. Placeholders are examples, never labels. */
export function Field({ label, optional, ...input }: InputProps & { label: string; optional?: boolean }) {
  return (
    <div className="pv-field">
      <label className="pv-field__label" htmlFor={input.id}>
        {label}
        {optional && <span className="pv-field__optional"> (optional)</span>}
      </label>
      <Input {...input} />
    </div>
  );
}

/** Honeypot: off-screen and skipped by keyboard and assistive tech; bots fill it and are dropped. */
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

/** Status line for an ApiForm. */
export function FormStatus() {
  return <p className="pv-status" role="status" aria-live="polite" data-pv-status="" />;
}

/**
 * ApiForm: posts its fields as JSON to `endpoint` (the Pages Functions under
 * functions/api), reports in its FormStatus, resets on success.
 */
export function ApiForm({ id, endpoint, success, label, className, children }: { id?: string; endpoint: string; success: string; label: string; className?: string; children: ReactNode }) {
  return (
    <form id={id} className={className} data-pv-form={endpoint} data-success={success} aria-label={label} noValidate>
      {children}
    </form>
  );
}

/* ------------------------------------------------------------- Signup */

/**
 * SignupForm: the "Keep me posted" mailing-list form, in the paper card the
 * style guide uses for DemoForm. Posts to /api/subscribe.
 */
export function SignupForm({ id = 'signup', title, lead, fine }: { id?: string; title: string; lead: string; fine: Html }) {
  return (
    <ApiForm id={id} className="pv-formcard" endpoint="/api/subscribe" success="You're on the list. Thanks!" label={title}>
      <h3 className="pv-formcard__title">{title}</h3>
      <p className="pv-p pv-p--sm">{lead}</p>
      <div className="pv-formcard__grid">
        <Field id={`${id}-name`} label="Your name" name="name" autoComplete="name" required />
        <Field id={`${id}-email`} label="Work email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
      </div>
      <Honeypot name="company" />
      <Button type="submit" block>
        {title}
      </Button>
      <FormStatus />
      <p className="pv-fine" dangerouslySetInnerHTML={{ __html: fine }} />
    </ApiForm>
  );
}

/** SubscribeField: the footer's one-line email form. */
export function SubscribeField({ id, label = 'Subscribe' }: { id: string; label?: string }) {
  return (
    <div className="pv-subscribe">
      <label className="visually-hidden" htmlFor={id}>
        Work email
      </label>
      <input className="pv-subscribe__input" id={id} name="email" type="email" placeholder="Work email" autoComplete="email" required />
      <button className="pv-subscribe__btn" type="submit">
        {label}
      </button>
    </div>
  );
}

/* ------------------------------------------------------- Switch & co */

/** Switch: an on/off indicator with its state spelled out. Display only; RoleDemo drives it. */
export function Switch({ on, label }: { on: boolean; label?: string }) {
  return (
    <span className="pv-switch" data-on={String(on)} data-pv-switch="">
      {label && <span>{label}</span>}
      <span className="pv-switch__state" data-pv-switch-state="">
        {on ? 'on' : 'off'}
      </span>
      <span className="pv-switch__track" aria-hidden="true">
        <span className="pv-switch__thumb" />
      </span>
    </span>
  );
}

/** ToggleButtons: a single-choice row of buttons (aria-pressed). */
export function ToggleButtons({ options, value, label }: { options: string[]; value: string; label: string }) {
  return (
    <div className="pv-toggles" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o} className="pv-toggle" type="button" aria-pressed={o === value} data-pv-toggle={o}>
          {o}
        </button>
      ))}
    </div>
  );
}

export interface RoleState {
  role: string;
  guard: boolean;
  rows: Array<{ label: string; value: string; warn?: boolean }>;
}

/**
 * RoleDemo: the governance kit's per-role card — pick a role, see whether the
 * relationship guard is on and what the query gets. The behavior script swaps
 * in each role's state; without script the first role shows.
 */
export function RoleDemo({ roles, flag = 'relationship_guard' }: { roles: RoleState[]; flag?: string }) {
  const first = roles[0];
  return (
    <div className="pv-roledemo" data-pv-roledemo={JSON.stringify(roles)}>
      <ToggleButtons options={roles.map((r) => r.role)} value={first.role} label="Role" />
      <div className="pv-roledemo__switch">
        <span>{flag}</span>
        <Switch on={first.guard} />
      </div>
      <dl className="pv-roledemo__rows" aria-live="polite">
        {first.rows.map((r) => (
          <div key={r.label} className="pv-roledemo__row">
            <dt>{r.label}</dt>
            <dd className="pv-roledemo__val" data-warn={r.warn ? 'true' : undefined}>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
