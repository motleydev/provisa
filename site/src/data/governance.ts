/** The six governance layers, shared by the home and governance pages. */
import type { LayerGroup, Tone } from '../components/ds';

/** The style guide's grouping: who can see (0–2), what they get (3–4), whether it runs (5). */
export const LAYER_GROUPS: LayerGroup[] = [
  { name: 'Who can see', range: '0 – 2', tone: 'cobalt' },
  { name: 'What they get', range: '3 – 4', tone: 'forest' },
  { name: 'Whether it runs', range: '5', tone: 'vermilion' },
];

export interface Layer {
  title: string;
  /** Home page one-liner. */
  short: string;
  /** Governance page title, where it differs. */
  long: string;
  /** Governance page copy (HTML). */
  body: string;
  group: number;
  tone: Tone;
}

export const LAYERS: Layer[] = [
  {
    title: 'Introspection filtering',
    long: 'Introspection filtering',
    short: 'Schema browsers only ever see what the role is allowed to see.',
    body: 'Schema browsers only ever see what the role is allowed to see. A hidden table is not a table the user can discover and then be denied; it is absent from the catalog they are handed.',
    group: 0,
    tone: 'cobalt',
  },
  {
    title: 'Public access',
    long: 'Public access',
    short: 'Anonymous surface is explicit, never accidental.',
    body: 'The anonymous surface is declared explicitly. Nothing becomes publicly readable as a side effect of registering it.',
    group: 0,
    tone: 'cobalt',
  },
  {
    title: 'Domain access',
    long: 'Domain access',
    short: 'Roles reach only the domains registered to them.',
    body: 'Roles reach only the domains registered to them. Domains are the coarse boundary the finer layers operate inside.',
    group: 0,
    tone: 'cobalt',
  },
  {
    title: 'Row-level security',
    long: 'Row-level security',
    short: 'Per-table, per-role WHERE injection — inherited recursively.',
    body: 'Per-table, per-role <code>WHERE</code> injection, inherited recursively — a view over a governed table carries the predicate of everything beneath it, and so does a materialized view built on that view.',
    group: 1,
    tone: 'forest',
  },
  {
    title: 'Column visibility & masking',
    long: 'Column visibility and masking',
    short: 'Regex, constant, or truncate masking with role-based bypass.',
    body: 'Columns are visible, hidden, or masked per role. Masking is regex, constant, or truncation, with an explicit role-based bypass where a privileged role genuinely needs the raw value.',
    group: 1,
    tone: 'forest',
  },
  {
    title: 'Predicate guard & approval',
    long: 'Predicate guard and approval',
    short: 'Pre-execution ABAC hook over webhook, gRPC, or unix socket.',
    body: 'A pre-execution ABAC hook over webhook, gRPC, or unix socket. The plan is offered to your own decision service before it runs, which is where request-time context — a ticket number, a break-glass approval, a time window — enters the decision.',
    group: 2,
    tone: 'vermilion',
  },
];

export const PLAN_OUT = 'One compiled plan, policy already inside it — plus the audit row';
