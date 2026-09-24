import type { FooterColumn, NavLink } from '../components/ds';

export const SITE_URL = 'https://provisa.dev';

export const LINKS = {
  cloud: 'https://cloud.provisa.dev',
  sandbox: 'https://sandbox.provisa.dev/register?invite=eca0374b-fce8-45bd-8347-5f9d6e7931c3',
  docs: '/docs/',
  register: '/register',
  privacy: '/privacy',
  terms: '/terms',
  support: 'mailto:support@provisa.dev',
  license: 'mailto:license@provisa.dev',
  privacyMail: 'mailto:privacy@provisa.dev',
  contact: '#contact',
  download: '/#download',
} as const;

export const NAV: NavLink[] = [
  { label: 'Platform', href: '/#platform' },
  { label: 'Governance', href: '/why/governance' },
  { label: 'Industries', href: '/#industries' },
  { label: 'Interfaces', href: '/why/interfaces' },
  { label: 'Sources', href: '/why/sources' },
  { label: 'Insights', href: '/#resources' },
  { label: 'Compare', href: '/vs/starburst' },
];

export const UTILITY = {
  message: 'The hosted service is live —',
  cta: { label: 'start a free trial today', href: LINKS.cloud },
  links: [
    { label: 'Docs', href: LINKS.docs },
    { label: 'Support', href: LINKS.support },
    { label: 'Register (free license)', href: LINKS.register },
  ],
};

export const FOOTER_NOTE =
  'The Active Semantic Layer. Business Source License 1.1 — non-production use (including evaluation) is free forever, for any size organization. Production use is also free for organizations that, together with their affiliates, have under 100 employees and contractors and under $1M in annual revenue, budget, or expenditures; others need a [commercial license](mailto:license@provisa.dev) for production use.';

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Active Semantic Layer', href: '/why/active-semantic-layer' },
      { label: 'Interfaces', href: '/why/interfaces' },
      { label: 'Governance', href: '/why/governance' },
      { label: 'Sources', href: '/why/sources' },
      { label: 'Materialized views', href: '/why/materialized-views' },
      { label: 'Catalog', href: '/why/catalog' },
      { label: 'No lock-in', href: '/why/no-lock-in' },
    ],
  },
  {
    title: 'Compare',
    links: [
      { label: 'vs Starburst', href: '/vs/starburst' },
      { label: 'vs Denodo', href: '/vs/denodo' },
      { label: 'Coming from Hasura', href: '/vs/hasura' },
    ],
  },
  {
    title: 'Get started',
    links: [
      { label: 'Docs', href: LINKS.docs },
      { label: 'Download', href: LINKS.download },
      { label: 'Register (free license)', href: LINKS.register },
      { label: 'Support', href: LINKS.support },
      { label: 'Book a demo', href: LINKS.contact },
    ],
  },
];

export const SUBSCRIBE = {
  title: 'Keep me posted',
  text: 'Want the release notes? Get new features and platform updates by email.',
  fine: 'Product updates only. No spam, unsubscribe anytime. See the [privacy policy](/privacy).',
  endpoint: '/api/subscribe',
};

export const LEGAL: NavLink[] = [
  { label: 'Privacy', href: LINKS.privacy },
  { label: 'Terms', href: LINKS.terms },
];

/** Links under the closing headline of every contact band. */
export const CONTACT_LINKS = [
  { label: 'Start a free trial', href: LINKS.cloud },
  { label: 'Try it on your data', href: LINKS.sandbox },
  { label: 'Download', href: LINKS.download },
];

export const INNER_CONTACT = {
  title: 'Describe your data and govern it in the same act.',
  lead: 'One governed path for analytical, application, and human data movement.',
};
