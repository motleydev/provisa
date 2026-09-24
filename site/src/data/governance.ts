import type { LayerDetailItem, LayerSummary } from '../components/ds';

type Brand = 'cobalt' | 'forest' | 'vermilion';

/** The three groups the six layers fall into, one brand color each. */
export const LAYER_GROUPS: Array<{ name: string; range: string; tone: Brand }> = [
  { name: 'Who can see', range: '0 – 2', tone: 'cobalt' },
  { name: 'What they get', range: '3 – 4', tone: 'forest' },
  { name: 'Whether it runs', range: '5', tone: 'vermilion' },
];

const layers: Array<{ group: 0 | 1 | 2; title: string; short: string; body: string }> = [
  {
    group: 0,
    title: 'Introspection filtering',
    short: 'Schema browsers only ever see what the role is allowed to see.',
    body: 'Schema browsers only ever see what the role is allowed to see. A hidden table is not a table the user can discover and then be denied; it is absent from the catalog they are handed.',
  },
  {
    group: 0,
    title: 'Public access',
    short: 'Anonymous surface is explicit, never accidental.',
    body: 'The anonymous surface is declared explicitly. Nothing becomes publicly readable as a side effect of registering it.',
  },
  {
    group: 0,
    title: 'Domain access',
    short: 'Roles reach only the domains registered to them.',
    body: 'Roles reach only the domains registered to them. Domains are the coarse boundary the finer layers operate inside.',
  },
  {
    group: 1,
    title: 'Row-level security',
    short: 'Per-table, per-role `WHERE` injection — inherited recursively.',
    body: 'Per-table, per-role `WHERE` injection, inherited recursively — a view over a governed table carries the predicate of everything beneath it, and so does a materialized view built on that view.',
  },
  {
    group: 1,
    title: 'Column visibility and masking',
    short: 'Regex, constant, or truncate masking with role-based bypass.',
    body: 'Columns are visible, hidden, or masked per role. Masking is regex, constant, or truncation, with an explicit role-based bypass where a privileged role genuinely needs the raw value.',
  },
  {
    group: 2,
    title: 'Predicate guard and approval',
    short: 'Pre-execution ABAC hook over webhook, gRPC, or unix socket.',
    body: 'A pre-execution ABAC hook over webhook, gRPC, or unix socket. The plan is offered to your own decision service before it runs, which is where request-time context — a ticket number, a break-glass approval, a time window — enters the decision.',
  },
];

export const LAYER_SUMMARIES: LayerSummary[] = layers.map((l) => ({ title: l.title, desc: l.short }));

export const LAYER_DETAILS: LayerDetailItem[] = layers.map((l) => ({
  title: l.title,
  body: l.body,
  group: LAYER_GROUPS[l.group].name,
  tone: LAYER_GROUPS[l.group].tone,
}));
