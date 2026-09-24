/** Site-wide copy and links: header, utility bar, closing band, footer. */
import type { FooterColumn, NavLink } from '../components/ds';

export const SITE_URL = 'https://provisa.dev';

export const LINKS = {
  cloud: 'https://cloud.provisa.dev',
  sandbox: 'https://sandbox.provisa.dev/register?invite=eca0374b-fce8-45bd-8347-5f9d6e7931c3',
  docs: '/docs/',
  download: '/#download',
  register: '/register',
  privacy: '/privacy',
  terms: '/terms',
  support: 'mailto:support@provisa.dev',
  license: 'mailto:license@provisa.dev',
  privacyMail: 'mailto:privacy@provisa.dev',
} as const;

/** Primary nav: the live site's home-page sections, plus Compare and Docs. */
export const NAV: NavLink[] = [
  { label: 'Interfaces', href: '/#interfaces' },
  { label: 'Governance', href: '/#governance' },
  { label: 'Sources', href: '/#sources' },
  { label: 'Compare', href: '/vs/starburst' },
  { label: 'Deploy', href: '/#deploy' },
  { label: 'Docs', href: LINKS.docs },
];

export const HEADER_SECONDARY: NavLink = { label: 'Download', href: LINKS.download };
export const HEADER_CTA: NavLink = { label: 'Start free trial', href: LINKS.cloud };

export const UTILITY = {
  message: 'The hosted service is live —',
  link: { label: 'start a free trial today', href: LINKS.cloud },
  links: [
    { label: 'Docs', href: LINKS.docs },
    { label: 'Support', href: LINKS.support },
    { label: 'Register (free license)', href: LINKS.register },
  ],
};

export const FOOTER_BLURB =
  'The Active Semantic Layer. Business Source License 1.1 — non-production use (including evaluation) is free forever, for any size organization. Production use is also free for organizations that, together with their affiliates, have under 100 employees and contractors and under $1M in annual revenue, budget, or expenditures; others need a <a href="mailto:license@provisa.dev">commercial license</a> for production use.';

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
    ],
  },
];

export const LEGAL: NavLink[] = [
  { label: 'Privacy', href: LINKS.privacy },
  { label: 'Terms', href: LINKS.terms },
];

/** The closing band on every page (the live home page's closing section). */
export const CONTACT = {
  title: 'Describe your data and govern it in the same act.',
  sub: 'One governed path for analytical, application, and human data movement.',
  links: [
    { label: 'Start a free trial', href: LINKS.cloud },
    { label: 'Try it on your data', href: LINKS.sandbox },
    { label: 'Download', href: LINKS.download },
  ],
};

export const SIGNUP = {
  title: 'Keep me posted',
  lead: 'Want the release notes? Get new features and platform updates by email — no waiting required, the hosted service is already open.',
  fine: 'Product updates only. No spam, unsubscribe anytime. We only ask for your name and email — see the <a href="/privacy">privacy policy</a> and <a href="/terms">terms</a>.',
};

/** Hero buttons on inner pages. */
export const INNER_CTAS = {
  primary: { label: 'Start a free trial', href: LINKS.cloud },
  secondary: { label: 'Download', href: LINKS.download },
};
