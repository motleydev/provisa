# \_styleguide

Living style guide for the Provisa design system. The leading underscore is a convention: keep this folder out of the production site build (Cloudflare Pages, Wrangler, etc. can ignore it) and use it locally as a design reference.

Open `_styleguide/index.html` directly in a browser, or serve it (any static server will do — a live server is preferred because the component cards iframe in React + Babel from a CDN).

```sh
# from the site root
npx http-server . -o /_styleguide/
# or
python3 -m http.server 8000
# then visit http://localhost:8000/_styleguide/
```

## What's here

- `index.html` — the single-page guide: foundations (colors, type, spacing, brand), the component gallery, and a tokens reference.
- `styles.css` — the design-system entry point. Imports `tokens/*`.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `base.css`. Semantic aliases live in `colors.css`.
- `guidelines/` — the 15 specimen cards, one HTML each. Loaded into `index.html` via `<iframe>` so they stay self-contained.
- `components/` — one live card per component group (`actions`, `brand`, `content`, `data`, `disclosure`, `forms`, `navigation`). Each card renders the React primitives from `_ds_bundle.js`.
- `_ds_bundle.js` — the prebuilt design-system bundle. Component cards read `window.ProvisaDesignSystem_af580e` from it.

## Where it comes from

Everything in this folder is a copy from the Provisa Design System source (`../` in the parent design-system repo — `styles.css`, `tokens/`, `guidelines/`, `components/<group>/<group>.card.html`, `_ds_bundle.js`). Nothing was invented for the style guide; it just stitches the specimens into one page.

## Updating

When the design system changes:

1. Re-copy `styles.css`, `tokens/*`, and `_ds_bundle.js` from the design-system source.
2. Re-copy any changed `guidelines/*.html` and `components/<group>/<group>.card.html` files.
3. If a new specimen or component group was added, add a card entry (title, subtitle, iframe height) inside the matching `<section>` in `index.html`.

The iframe heights in `index.html` are hand-tuned to each specimen's `@dsCard viewport="WxH"` header comment.

## Not shipped

This directory is not part of the deployed marketing site. Reference it during design work; keep production builds pointed at the top-level `index.html` and its own `styles.css`.
