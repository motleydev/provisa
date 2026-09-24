# provisa.dev — Astro site

The provisa.dev marketing site, built with Astro on the Provisa style guide in [`_styleguide/`](_styleguide/). It carries the previous framework-free site's content page for page, at the same URLs, and keeps its Cloudflare Pages Functions (mailing list, license registration, download redirects).

## Commands

Requires Node 22.12+.

```bash
npm install
npm run dev          # dev server at http://localhost:4321
npm run build        # type check → static build in dist/ → internal link and #anchor check
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
  _styleguide/          The style guide (design reference; not deployed). Its tokens/ are the site's tokens.
  scripts/
    check-links.mjs     fails the build on a broken internal link or #anchor
  src/
    components/ds/      the component library (React, rendered to static HTML)
    styles/             site.css imports the style guide's tokens, then fonts, base and components
    scripts/            forms.ts (JSON form posts), downloads.ts (marks the visitor's OS)
    layouts/            BaseLayout.astro: head, utility bar, header, closing band, footer
    data/               copy used by more than one page, or easier to keep as data
    pages/              one file per URL
    assets/             product screenshots (optimized to AVIF/WebP at build)
  public/               fonts, favicon, og.png, _headers, robots.txt, styles.css and assets/ (legacy URLs)
  functions/            Cloudflare Pages Functions (unchanged)
  schema.sql            D1 schema: subscribers, license_registrations
  wrangler.jsonc        Pages project config; output dir is dist/
  deploy.sh             build and deploy to Cloudflare Pages
```

## The style guide is the source

- **Tokens.** `src/styles/site.css` imports `_styleguide/tokens/colors.css`, `typography.css`, `spacing.css` and `base.css` directly. Re-copying the style guide from the design system restyles the site; nothing in `src/` defines a brand color or type size of its own.
- **Additions** live in `src/styles/site-tokens.css` and are limited to accessibility fixes the style guide lacks: `--vermilion-text` (#bf3a14) for vermilion text under 24px, which fails WCAG AA in plain `--vermilion`; `--field-border` for 3:1 input borders; and a 20px gutter on phones.
- **Fonts.** The style guide loads Source Serif 4, Public Sans and IBM Plex Mono from Google Fonts; the site self-hosts the same families and weights from `public/fonts/` (OFL) under the same family names.
- **Components** in `src/components/ds/` use the style guide's names and props — `Button`, `TextLink`, `Wordmark`, `BrandBars`, `FigPanel`, `Eyebrow`, `SectionLabel`, `Heading`, `Emph`, `RuledCard`, `Callout`, `ChoiceCard`, `StatStrip`, `TileCard`, `Chip`, `CodeBlock`, `CodeTabs`, `ComparisonTable`, `LayerRow`, `Accordion`, `Input`, `Textarea`, `SubscribeField`, `Switch`, `ToggleButtons`, `UtilityBar`, `SiteHeader`, `Breadcrumb`, `SiteFooter` — and the page kits' layouts: `Sec`, `RailGrid`, `ContactBand`, `HeroCTAs`, plus the kits' hero pattern as `PageHero` and `HeroStack`. The style guide writes them with inline styles for its live cards; here the same values are classes (`src/styles/components.css`), so hover, focus and narrow screens work with no client-side React. `behaviors.ts` adds the little interactivity there is (code tabs, the mobile menu, the governance role switcher); accordions are native `<details>`.
- **Site additions** the live content needed, built from the same parts: `ItemList` (the ChoiceCard's square-marker rows), `Chapter` (long-form sections), `LayerDetail` and `Legend` (from the governance kit), `LayerList`, `SourceGrid`, `DownloadList`, `SignupForm`, `RoleDemo`, `Disclosure`, `Prose`.
- **Deliberate differences from the style guide:** form fields have visible labels (the style guide's DemoForm uses placeholders only); the footer has no subscribe field because the mailing list needs a name as well as an email, so the signup form sits in the closing band on every page; below 1080px the header nav folds into a Menu disclosure.

## Pages

| URL | Content |
| --- | --- |
| `/` | The live home page, section for section, laid out with the home kit (numbered `RailGrid` sections with figure plates). All anchors kept: `#interfaces`, `#governance`, `#sources`, `#analytics`, `#distribution`, `#download`, `#dl-macos`, `#dl-windows`, `#dl-linux`, `#deploy`, `#faq`, `#signup`. |
| `/why/*`, `/vs/*` | The live pages, verbatim, laid out with the governance and compare kits. Anchors `#the-53` (sources) and `#promote-config` (no-lock-in) kept. |
| `/register`, `/privacy`, `/terms` | Live copy and form fields, verbatim. `#register` and `#the-software` kept. |
| `/404` | New (`noindex`). |

Every text block inside `<main>` on the live pages is present on the matching page here. Added text is limited to design elements: section numbers and figure labels, hero diagrams that summarize the page, the governance kit's group names ("Who can see", "What they get", "Whether it runs") and its audit-table example, and a few eyebrows.

`/assets/*.png`, `/styles.css` and `/favicon.svg` from the previous site are still served at their old URLs.

## Deploy

Cloudflare Pages project `provisa-dev`, output directory `dist/`, with `functions/` beside `wrangler.jsonc`. The "Deploy Site" workflow (`.github/workflows/docs.yml`) builds this site into `site/dist/`, builds MkDocs into `site/dist/docs/`, and deploys with wrangler on every push to `main` that touches `site/**` or the docs.

```bash
./deploy.sh              # production
./deploy.sh --preview    # preview branch
DOCS_DIR=../docs_site ./deploy.sh   # after `mkdocs build` at the repo root, also ship /docs/
```

`/docs/`, `/api/*` and `/dl/*` are served by MkDocs and the Functions, not by Astro; the link checker skips them.
