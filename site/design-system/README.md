# Provisa design system

Editorial and quietly confident: a paper ground, ink type, one serif for headlines, hairline rules instead of boxes and shadows, and three brand colors that each carry a meaning. It was built from the Claude Design redesign of provisa.dev (direction B, "Editorial") and is the system the Astro site in `site/` renders with.

- **Tokens**: `tokens.json` (this folder) is the single source. `scripts/build-tokens.mjs` compiles it to `src/styles/tokens.css`: every token becomes a `--<name>` custom property, every type style a `.<name>` class, every font file an `@font-face`.
- **Components**: React components in `src/components/ds/`, rendered to static HTML by Astro (no client-side React). Styles in `src/styles/base.css` and `src/styles/ds.css`, class prefix `pv-`. Behavior (tabs, menu) in `src/components/ds/behaviors.ts`.
- **Living reference**: `/design-system` on the site renders every token and component from the same code.

## Voice

Write for a technical leader who has been pitched too many platforms. Plain, specific, low-hype.

- Say what it does and what it doesn't: "Not a warehouse. Not a query engine. Not a rollout. Not a lock-in."
- Lead with a fact the reader can check: "54 source types", "port 5439", "one `pip install`".
- Headlines are sentences, in sentence case, usually ending with a period: "Query the data you already have. *Replace nothing.*"
- Short sentences. No exclamation marks, no superlatives, no emoji.
- Use the product's own terms: domains, registered relationships, the six governance layers (numbered 0–5), roles, the audit row.
- Don't promise things about sales or support that the business hasn't agreed to.

## Color

Paper (`paper`) and ink (`ink`) do most of the work. The three brand colors each have a job, and the job decides where they appear:

| Token | Meaning | Use it for |
| --- | --- | --- |
| `cobalt` | Who can see | The utility bar, the primary button, layers 0–2 |
| `forest` | What they get | Links, eyebrows, section indices, active tabs, forest bands, layers 3–4 |
| `vermilion` | Whether it runs | Emphasis in display type, stat numerals, figure blocks, layer 5 |

- Body copy is `ink-body` on light grounds; secondary text is `ink-muted`. Never use a brand color for running text.
- Vermilion is for fills and type 24px and larger. Anything smaller in vermilion (eyebrows, mono labels, indices) uses `vermilion-deep`, and a vermilion band that carries white body text uses `vermilion-deep` as its ground. `vermilion` as small text fails WCAG AA; `vermilion-deep` passes on paper, surface and `vermilion-tint`.
- Tints (`cobalt-tint`, `forest-tint`, `vermilion-tint`) sit behind their own color's text, never behind another brand color.
- On ink bands use the light accents: `forest-bright` for indices and rules, `vermilion-light` for mono labels.
- Code panels use `code-ground`, or `code-ground-deep` when the panel sits on an ink band.

## Bands

A page is a stack of full-width bands (`Section`). Each band has a tone, and every component inside reads its colors from that tone, so the same card or link works on any ground.

- `paper` is the default; alternate it with `surface` (white, with `line` hairlines above and below).
- Use `forest`, `ink` and `vermilion` for one band at a time, never two dark bands in a row.
- Every page ends with the contact band: `forest` on the home page, `ink` (with the tricolor marker) on inner pages.

## Type

Three families, each with one job:

- **Source Serif 4** (with its optical-size axis) for headlines, pull paragraphs, numerals and captions. Headlines are semibold (600) with negative tracking.
- **Public Sans** for everything read as body or UI.
- **IBM Plex Mono** for code, indices, wire-protocol names and figure labels.

Use the type classes rather than setting sizes by hand: `t-display-xl` (home hero only), `t-display` (one per inner page), `t-cta`, `t-h2-xl` (home sections), `t-h2` (inner sections), `t-h3-xl` … `t-h5`, `t-serif-md`, `t-numeral`, `t-lede`, `t-body-lg` (section copy), `t-body`, `t-body-sm`, `t-fine`, `t-eyebrow`, `t-label`, `t-code`, `t-mono`. Display sizes are fluid; the `fluid-*` tokens hold the ranges. Keep running copy at or under `measure` (720px).

## Layout

- Content sits in a 1320px container (`page-max`) with `fluid-gutter` side padding.
- Home sections use the editorial grid (`Editorial`): a rail with the section index and a figure plate on the left third, content across two thirds.
- Inner sections use `SplitHeader`: eyebrow and heading on the left, body on the right. Use `Feature` for copy beside an illustration.
- Corners are square (`radius-none`). There are no shadows. Separate things with rules: a 1px `rule` opens a group, `line` hairlines divide its rows, and a thick brand-colored rule (`border-bar`, `border-block`) marks a card's category.
- Space vertically with `fluid-section-y`; space inside with the `space-*` scale.

## Components

| Group | Components |
| --- | --- |
| Actions | `Button` (primary, outline, ink), `TextLink`, `Links`, `Actions` |
| Labels | `Eyebrow`, `SectionIndex`, `Tag`, `Tags`, `Switch` |
| Chrome | `UtilityBar`, `SiteHeader`, `Breadcrumb`, `SiteFooter`, `ContactSection`, `DemoForm`, `Field`, `ApiForm` |
| Layout | `Section`, `Block`, `Editorial`, `SplitHeader`, `Feature`, `RailLayout`, `PageHero`, `Grid` |
| Content | `StatRow`, `RuleCard`, `TintCard`, `Card`, `RuleList`, `Checklist`, `Steps`, `TierList`, `DownloadList`, `Figure`, `IndustryCard`, `ResourceCard`, `Matrix`, `ComparisonTable`, `Prose` |
| Diagrams | `FigureArt`, `Stack` (+ `StackHead`, `StackRow`, `StackNode`, `StackArrow`, `StackCells`, `StackFills`, `StackNote`, `StackPanel`), `Callout`, `LayerList`, `LayerDetail`, `Legend`, `Trace`, `ProtocolList` |
| Code | `CodeBlock`, `CodeTabs` |
| Interactive | `Accordion` (native details), `Tabs`, `RoleSwitcher` |

- One primary (cobalt) button per view, for "Book a demo" or the page's one action; the outline button sits beside it.
- Every inner page opens with `PageHero` and a `Stack` diagram that summarizes the page in the brand's layer grammar: an input head, tinted rows, an ink note for the output.
- Comparison tables put Provisa last, on `forest-tint`.
- Forms always have visible labels. Placeholders are examples, never labels.

## Imagery

There is no photography and no icon set. The brand's pictures are:

- **Figure plates** (`FigureArt`): flat geometric compositions in the three colors on a 4:5 frame, labeled `FIG. 01`–`FIG. 08`, one per numbered home section, each loosely tied to its subject (six nested squares for the six layers, 54 dots for the 54 source types).
- **Block illustrations** on industry and resource cards: a brand-color field with one or two blocks cut from the other colors.
- **Product screenshots** with a hairline border and a serif italic caption (`Figure`).
- Arrows and marks are text glyphs: → for links, ↓ for downloads and flow, ✓ in code.

## Logo

Three vertical bars in cobalt, forest and vermilion, followed by "Provisa" in Source Serif 4 at regular weight (`Logo`). The bars also appear stretched as the tricolor marker above closing headlines (`Tricolor`) and in the favicon. The mark is part of the redesign; the product UI still uses the earlier "P" mark.

## Motion and states

- Hover changes color only (links to `forest` on light grounds; the primary button to `cobalt-deep`), over 0.15s. Stack rows that link shift 6px right on hover.
- Focus is a 2px outline in the current text color, offset 3px (ink on the primary button). Fields show a 2px cobalt outline.
- Nothing animates on load, and `prefers-reduced-motion` turns transitions off.
