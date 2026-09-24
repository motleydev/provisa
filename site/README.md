# provisa.dev — Astro site

The provisa.dev marketing site, rebuilt in Astro on the Provisa design system from the Claude Design redesign (direction B, "Editorial"). It replaces the framework-free site in `kenstott/provisa/site` page for page, at the same URLs, and keeps its Cloudflare Pages Functions (mailing list, license registration, download redirects).

## Commands

Requires Node 22.12+.

```bash
npm install
npm run dev          # tokens + dev server at http://localhost:4321
npm run build        # tokens → type check → static build in dist/ → internal link check
npm run preview      # serve dist/
```

With Functions and a local D1 (forms work end to end; email sending needs `RESEND_API_KEY`):

```bash
npx wrangler d1 execute provisa-subscribers --local --file=schema.sql
npm run build && npx wrangler pages dev
```

## Layout

```text
site/
  design-system/        The design system's source: tokens.json, fonts, brand book (README.md)
  scripts/
    build-tokens.mjs    tokens.json → src/styles/tokens.css, fonts → public/fonts/
    check-links.mjs     fails the build on a broken internal link or #anchor
  src/
    components/ds/      design-system components (React, rendered to static HTML)
    styles/             tokens.css (generated), base.css, ds.css
    scripts/            forms.ts (JSON form posts), downloads.ts (marks the visitor's OS)
    layouts/            BaseLayout.astro: head, utility bar, header, contact band, footer
    data/               copy that more than one page uses: nav, footer, home, layers, sources
    pages/              one file per URL (see below)
    assets/             product screenshots (optimized to AVIF/WebP at build)
  public/               favicon, og.png, _headers, robots.txt, styles.css for confirm pages
  functions/            Cloudflare Pages Functions (unchanged, plus api/demo.js)
  schema.sql            D1 schema: subscribers, license_registrations, demo_requests
  wrangler.jsonc        Pages project config; output dir is dist/
  deploy.sh             build and deploy to Cloudflare Pages
```

Pages and where their content came from:

| URL | Source |
| --- | --- |
| `/` | Home design (Home B v2, "Trace one query" flow), code samples from the live site |
| `/why/governance`, `/why/active-semantic-layer`, `/why/interfaces`, `/why/materialized-views`, `/vs/starburst` | Their Claude Design pages (live copy rewritten in the new tone during the design sessions) |
| `/why/sources`, `/why/catalog`, `/why/no-lock-in`, `/vs/denodo`, `/vs/hasura` | Live copy, verbatim, composed with the same components |
| `/register`, `/privacy`, `/terms` | Live copy and form fields, verbatim |
| `/404`, `/design-system` | New (both `noindex`) |

## Design system

`design-system/tokens.json` is the only place a color, size or font is defined. Change a value there and run `npm run tokens` (the dev and build scripts do it for you). Components never hard-code colors: each band (`Section tone=…`) sets a handful of role variables that its components read, so the same card works on paper, white, forest, cobalt, ink and vermilion. The rules for using all of this are in `design-system/README.md`; every token and component renders at `/design-system`.

Accessibility choices that differ from the prototype:

- `vermilion` fails WCAG AA for small text, so small vermilion text and white-on-vermilion bands use `vermilion-deep`.
- Small labels on forest use `on-forest-muted` (5.0:1) instead of the prototype's 4.2:1 green.
- Form fields have visible labels and a 3:1 border; placeholders are examples only.

## Deploy

Cloudflare Pages project `provisa-dev`, output directory `dist/`, with `functions/` beside `wrangler.jsonc`.

```bash
./deploy.sh              # production
./deploy.sh --preview    # preview branch
DOCS_DIR=../docs_site ./deploy.sh   # after `mkdocs build` at the repo root   # also ship a separately built MkDocs site at /docs/
```

Before the first deploy of this site:

1. Apply the schema to the production D1 once. It adds the `demo_requests` table and leaves existing tables alone:
   `npx wrangler d1 execute provisa-subscribers --remote --file=schema.sql`
2. Optionally set `DEMO_NOTIFY_TO` (plain variable) to where demo requests should be emailed. It defaults to `license@provisa.dev` and needs the existing `RESEND_API_KEY` secret.

The "Deploy Site" workflow (`.github/workflows/docs.yml`) builds this site into `site/dist/`, builds MkDocs into `site/dist/docs/`, and deploys `site/` with wrangler, on every push to `main` that touches `site/**` or the docs.

`/docs/`, `/api/*` and `/dl/*` are served by MkDocs and the Functions, not by Astro; the link checker skips them.
