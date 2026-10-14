# Provisa website design system

The HTML-and-CSS port of the `Provisa Website.html` UI kit attached to PRO-2 —
a self-contained React bundle (namespace `ProvisaDesignSystem_af580e`) holding
30 components, a token set, three webfonts and three sample pages. Everything
the rebrand needs out of it is here, so nobody has to unpack the 2.6 MB
attachment again.

Open `/design-system/` on a running site to see every component rendered.

## Files

| File | What it is |
| --- | --- |
| `tokens.css` | The kit's raw palette, type and layout scales verbatim, plus the alias layer both themes flip on. |
| `fonts.css` | The three webfonts, self-hosted from `/assets/fonts/`. No Google Fonts link. |
| `provisa.css` | Every component. Reads the alias layer and nothing else. |
| `provisa.js` | Theme toggle, mobile drawer, accordion, code tabs, switch, toggle buttons. Progressive enhancement over markup that renders without it. |
| `partials/` | One copy-pasteable HTML fragment per component, plus `head.html`. |
| `index.html` | The component gallery. Fetches each partial, so it can never drift from them. |
| `check-contrast.mjs` | Parses `tokens.css` and asserts WCAG AA on 63 colour pairs in both themes. |
| `verify-ui.mjs` | 103 browser assertions: header composition, both themes, the verified widths, the nav breakpoint, a keyboard pass. Needs Playwright. |

A page includes `partials/head.html` and then composes partials. There is no
build step; `site/` stays static HTML and CSS, as it was.

## What the kit decides

**Palette.** Ink `#16181d` on paper `#f8f6f1`, with a brand trio of cobalt
`#2451d8`, forest `#0f6b4f` and vermilion `#e24a1f`. The kit labels this
"palette option 1". Forest is the link and eyebrow colour, cobalt is the
primary action, vermilion is emphasis. Governance content has its own
three-colour semantic: cobalt for who can see, forest for what they get,
vermilion for whether it runs.

**Type.** Source Serif 4 at 600 for display, Public Sans for UI and body, IBM
Plex Mono for code, indices and labels. Fluid display scale: hero
`clamp(44px, 6.6vw, 96px)`, h2 `clamp(34px, 4vw, 58px)`, body 16.5px/1.65.

**Shape and motion.** `--radius: 0` — square everywhere. 1px hairline rules do
the work that borders and shadows do elsewhere. One transition in the whole kit
(the switch knob). No shadows.

**Layout.** 1320px container, 40px gutter, 76px header, section rhythm
`clamp(72px, 9vw, 136px)`.

This is an editorial, print-derived system, not a SaaS-card system. The visual
devices are figure panels (`FIG. 01`), numbered section labels, ruled cards and
comparison tables.

## Components

All 30, each with a partial under `partials/`.

| Group | Components |
| --- | --- |
| Actions | `Button`, `TextLink` |
| Brand | `Wordmark`, `BrandBars`, `FigPanel` |
| Content | `Heading`, `Emph`, `Eyebrow`, `SectionLabel`, `Callout`, `RuledCard`, `TileCard`, `ChoiceCard`, `StatStrip` |
| Data | `CodeBlock`, `CodeTabs`, `ComparisonTable`, `LayerRow`, `Chip` |
| Disclosure | `Accordion` |
| Forms | `Input`, `Textarea`, `DemoForm`, `SubscribeField`, `Switch`, `ToggleButtons` |
| Navigation | `SiteHeader`, `UtilityBar`, `SiteFooter`, `Breadcrumb` |

Plus the layout wrappers the kit's sample pages were built from, which the kit
kept outside its component list: `partials/section.html` (the band wrapper and
the rail grid) and `partials/contact-band.html`.

`SiteHeader` carries the nav `Platform · Governance · Industries · Interfaces ·
Sources · Compare`, then the theme toggle, a `Start free trial` text link to
cloud.provisa.dev, and a `Book a demo` button. `UtilityBar` carries Docs,
Support and Register. `SiteFooter` carries three columns — Platform, Compare,
Get started — plus a subscribe field.

Three of those differ from the kit, on instruction from [PRO-2](/PRO/issues/PRO-2)'s
plan revisions rather than by retuning:

- **Six nav items, not seven.** Insights is out of v1 and has no route, so it is
  not built as a dead link (revision 2). The drawer carries the same six.
- **No hosted-service notice in the utility bar.** We do not offer a managed
  service, so the site does not advertise one (revision 3). The kit led the
  strip with one; the strip is now Docs · Support · Register, right-aligned.
- **An Editions link in the footer**, at the top of Get started, pointing at
  `/pricing/` (revision 2).

The theme toggle is also new: it sits right of the nav on desktop, as the first
item in the actions cluster, and in the drawer on mobile.

## The six gaps, closed

Numbered as [PRO-3](/PRO/issues/PRO-3) numbers them.

~~**1. Rewire the token layer.**~~ **Closed.** The kit's 158 raw-token `var()`
calls are now 0: no rule in `provisa.css` reads `--ink`, `--paper`, `--forest`,
`--gray-700` or `--rule`, and no colour is written as a literal. The two values
that escaped the token layer are gone too — `'#fff'` is `--text-on-color`, and
the header's `rgba(248,246,241,0.96)` is `--surface-header`, which is
`color-mix(in srgb, var(--surface-page) 96%, transparent)` and so flips with the
theme.

~~**2. Ship light and dark.**~~ **Closed.** Both themes are first-class and
contrast-checked, light is the unconditional default, the toggle persists a
choice, and there is no flash of the wrong theme. See **Light and dark** below.

~~**3. Build the mobile header.**~~ **Closed.** A menu button, a drawer, a focus
trap and escape-to-close, at a measured breakpoint. See **The mobile header**
below.

~~**4. Make the gutter fluid.**~~ **Closed.** `--gutter` is
`clamp(20px, 5vw, 40px)`, threaded through `.pv-container`, which is the only
thing that applies it. 20px a side on a 360px phone, the kit's 40px from 800px
up.

~~**5. Decide superwide.**~~ **Decided.** The container grows once, to 1560px,
and prose never follows it. See **Superwide: the decision** below.

~~**6. Accessibility basics.**~~ **Closed.** A single `:focus-visible` ring on
the alias layer, flipped to `--focus-ring-inverse` on dark and brand bands;
`partials/skip-link.html`; and a `prefers-reduced-motion` block. The keyboard
pass is in `verify-ui.mjs`, not a one-off manual check.

Everything else stayed fluid: 42 `clamp()` calls and 19 `auto-fit`/`minmax()`
grids survive the port, and the system has exactly one media query.

### Light and dark

`color-scheme` carries the theme, so there is no theming media query and the
dark values are not a second copy of the alias list. Each alias is declared
once:

```css
--surface-page: var(--paper);                        /* no light-dark() support */
--surface-page: light-dark(var(--paper), var(--ink-deep));
```

**Light is the unconditional default.** `:root { color-scheme: light }`, and
there is no `prefers-color-scheme` rule anywhere in the system. A first-time
visitor sees the light brand whatever their OS is set to; dark is reached only
through the header toggle and persists from then on ([PRO-2](/PRO/issues/PRO-2)
plan revision 2, which overrode the original `prefers-color-scheme` default).

`[data-theme=dark]` and `[data-theme=light]` are the toggle's overrides, written
to `localStorage` under `provisa-theme`. The inline bootstrap in
`partials/head.html` sets the attribute before first paint, so there is no flash
of the wrong theme — verified by reading the body colour on the first animation
frame after a reload.

Two consequences of light being unconditional:

- **The toggle has two states, not three.** There is no "auto" to hand back,
  because there is no OS-following mode to return to; choosing light again is
  how a visitor returns to the default.
- **Nothing is persisted until a click.** Loading a page does not write
  `provisa-theme`, so a later change to the default still reaches a visitor who
  never touched the toggle.

**Changing the default** is the one `color-scheme` line on `:root` in
`tokens.css`: `light` (current), `dark`, or `light dark` to follow the OS. If
you move it back to `light dark`, give the toggle its third `auto` state back —
`DEFAULT` in `provisa.js` and the buttons in `partials/theme-toggle.html`.

The raw palette does not flip. Only the aliases do, so the system stays one
palette rather than becoming two.

#### The dark values

Nine of them are new colours; the rest re-point to the kit's own dark-surface
ramp (`--ink-deep`, `--on-ink-1/2/3`, `--ink-rule`) which the kit already had
for its ink bands.

| Alias | Light | Dark | Why this value |
| --- | --- | --- | --- |
| `--surface-page` | `#f8f6f1` | `#0e1013` | The kit's `--ink-deep`. |
| `--surface-band` | `#ffffff` | `#16181d` | A band lifts off the page in both. |
| `--surface-inverse` | `#16181d` | `#f8f6f1` | Inverse means "opposite of the page", so it swaps. |
| `--surface-sunken` | `#ece9e1` | `#20242b` | `--ink-sunken`, the dark answer to `--sand`. |
| `--surface-input` | `#ffffff` | `#1b1e24` | `--ink-input`; a field reads as a recess, not a light patch. |
| `--surface-code` | `#16181d` | `#16181d` | Code does not invert. A terminal is ink in both themes. |
| `--text-body` | `#40454d` | `#c9c7c1` | 8.93:1 light, 11.27:1 dark. |
| `--text-link` | `#0f6b4f` | `#8fc2b0` | Forest is 1.8:1 on a dark page; the kit's `--mint` is 9.54:1. |
| `--text-emphasis` | `#e24a1f` | `#f0b49f` | The kit's `--vermilion-on-dark`. |
| `--action-primary` | `#2451d8` | `#3d66e8` | Cobalt raised so white on it is 4.92:1. |
| `--action-primary-hover` | `#1a3fb0` | `#2f56d4` | Darkens on hover in both themes; lightening would drop the label under AA. |
| `--border-hairline` | `#dcd8ce` | `#2c3037` | 1.32:1 light, 1.44:1 dark — the same whisper. |
| `--group-see` | `#2451d8` | `#8fa8f5` | |
| `--group-get` | `#0f6b4f` | `#8fc2b0` | |
| `--group-run` | `#e24a1f` | `#f0b49f` | |
| `--group-*-tint` | `#e3eafc` `#dff1e9` `#fde6dc` | `#1a2033` `#11201a` `#2a1610` | Each tint is its hue pulled toward the page, in whichever direction the page is. |
| `--fig-bg-see/get/run` | `#2451d8` `#0f6b4f` `#e24a1f` | `#1b3ea8` `#0b5340` `#b03a16` | Figure grounds go **down** in dark, not up, so near-white geometry and the `FIG.` label keep their contrast. |

Five colours exist because WCAG needs them and the kit has no equivalent. They
are additions to the palette, not retunings of it — every kit value is
untouched:

| Token | Value | Exists because |
| --- | --- | --- |
| `--vermilion-text` | `#b83612` | The kit's vermilion is 3.72:1 on paper. Fine for display (AA Large), under AA for the 13px Callout label and the LayerRow index. Display emphasis still uses the kit's vermilion; `--text-emphasis-small` and `--group-run-text` use this. |
| `--gray-350` | `#9aa0a8` | `--gray-500` is 4.2:1 on ink, used for 13px code comments. This is 6.74:1. |
| `--text-on-brand-alt-2` → `--mint-2` | `#cfe8dd` | `--forest-on-2` is 4.18:1 on a forest band, used for the 13px SectionLabel index. `--mint-2` is 5.02:1. |
| `--fig-label-run` | `#0e1013` light | White on the kit's vermilion is 4.01:1, under AA for the 11px `FIG.` label. Ink on it is 4.75:1. White again in dark, where the ground is darker. |
| `--switch-edge` | ink / `--on-ink-1` | The kit's off track is 1.9:1 against paper, so the control had no visible boundary. A 1px edge on the track and the knob gives it one. |

**Contrast is checked, not asserted.** `node site/design-system/check-contrast.mjs`
parses `tokens.css`, resolves every alias for both themes and tests 63 pairs:
4.5:1 for text under 24px, 3:1 for display and for control boundaries, 1.2:1
for hairlines and illustrative figure geometry, which carry no information on
their own and are measured rather than waived. 126/126 pass. Run it after
touching any value in `tokens.css`.

### The mobile header

The kit's nav was a fixed 76px row with `overflow: hidden`, `flexWrap: wrap`
and `paddingTop: 27`, so its seven items were clipped rather than collapsed.

Below `--bp-nav` the nav and the actions are replaced by a menu button, and
`#pv-drawer` takes over the viewport. The drawer carries the six nav links, the
two calls to action, the theme toggle and the utility items. It traps Tab and
Shift+Tab, closes on Escape and on any link inside it — but not on the theme
toggle, which is a button and is handled before the close rule — returns focus
to the menu button, restores page scrolling, and closes itself if a resize
crosses the breakpoint.

This is the only media query in the system. A six-item nav plus a toggle is not
something `clamp()` can express.

**`--bp-nav` is 1280px, and that number is measured.** The row's natural width
is 1258px: wordmark 119 + nav 566 + actions 396 + 2×48 gap + 80 gutter. A width
sweep in Chromium puts the last nav link's right edge past the actions cluster's
left edge everywhere below 1220px, and the kit's 48px gap is only intact from
1260px — so 1280px is the next clean value above that, and it leaves 71px of
separation.

It was 1040px, which was the figure for the kit's seven items with no toggle.
Dropping Insights bought back one 15px label and the toggle spent rather more
than that, so at 1040–1210px the nav overlapped the actions: the kit's clipping
bug in a new form, and harder to spot, because this port has no
`overflow: hidden` to hide it. `verify-ui.mjs` now sweeps 960–1600px and asserts
the two never overlap, so whoever adds the seventh nav item hears it from a test
rather than from a screenshot.

Two places hold the number and must change together: the `--bp-nav` token and
the two `@media` bounds in `provisa.css`, written out as 1279px/1280px because a
media query cannot read a custom property. `provisa.js` reads the token off the
element, so it cannot drift.

### Superwide: the decision

**The container grows once, to 1560px, and prose never follows it.**

```css
--container: clamp(1320px, 61vw, 1560px);
--measure:   68ch;
```

Nothing changes between 1320px and about 2160px — the kit's measure is the
kit's measure, and that is where almost everyone is. Past that the container
widens to 1560px and stops, which it reaches at 2557px. The crossover is
expressed in `vw`, so there is no breakpoint and no jump.

The alternatives were rejected on the system's own terms. Letting the container
keep growing turns an editorial page into a 2000px line of text. Leaving it at
1320px puts a postage stamp in the middle of a 5K display: 52% of the viewport
is margin. A 240px step is enough to make the page look sized for the screen,
and `--measure` means it buys width for grids, tables and figures rather than
for line length — on a 2560px screen a `.pv-p` is still about 68 characters
wide, the same read as on a laptop.

Verified at 2560px in both themes.

## Verification

Both checks are scripts, so they are re-runnable rather than a claim in a
comment. Run the site locally and open `/design-system/` to look at it:

```sh
python3 -m http.server 8731 --directory site &

node site/design-system/check-contrast.mjs            # 126/126
node site/design-system/verify-ui.mjs http://127.0.0.1:8731   # 103/103
```

`verify-ui.mjs` needs Playwright, which is deliberately not a dependency of this
repo — `site/` has no build step and should not acquire one. Install it wherever
you are running from: `npm i playwright && npx playwright install chromium`.

- **Contrast.** `check-contrast.mjs` parses `tokens.css`, resolves every alias
  for both themes and tests 63 pairs. 126/126.
- **The header composition.** Six nav items and no Insights link; the toggle in
  both the header and the drawer, two-state; the utility bar carrying no
  hosted-service notice; the Editions link pointing at `/pricing/`.
- **Light as the unconditional default.** With the OS set to dark, to light and
  to no-preference, a first visit paints `#f8f6f1` and writes nothing to
  storage. Clicking dark paints `#0e1013` and persists; a reload is already dark
  on the first animation frame, which is the no-flash check; clicking light
  returns to the default.
- **Widths.** 360, 768, 1279, 1280, 1920 and 2560, in both themes: no horizontal
  overflow, no element escaping the viewport, no console errors, and the right
  one of the nav and the menu button showing. 1279 and 1280 are there to pin
  both sides of `--bp-nav`.
- **The breakpoint.** The header row's natural width is measured and asserted to
  fit inside `--bp-nav`, and 960–1600px is swept to assert the nav never
  overlaps the actions cluster. This is the check that caught 1040px.
- **Keyboard.** The first Tab reaches the skip link; the drawer opens on Enter,
  traps focus both ways, closes on Escape and returns focus, restores scrolling,
  and closes on a nav link but not on the theme toggle; the accordion opens and
  closes on Enter; the code tabs move on Arrow and honour End; the switch flips
  on Enter; every form control has an accessible name; the focus ring is drawn.
- **Fonts.** No Google Fonts request, the self-hosted woff2 files all return
  200, body resolves to Public Sans and display to Source Serif 4, and no Inter
  or JetBrains Mono survives.
- **The gallery.** Every specimen renders in both themes with no failed partial
  fetch and no overflow.
- **Source picker.** `scripts/gen-site-source-picker.mjs` and its test are
  byte-identical to `HEAD`, and re-running the generator rewrites
  `site/index.html` and `site/why/sources.html` with no diff — so the markers
  still parse and the output has not moved. The design system styles the seven
  class names it emits (`.picker`, `.picker-cat`, `.picker-row`,
  `.picker-mark`, `.picker-tile`, `.picker-name`, `.picker-sub`) and all seven
  are present in `provisa.css`; it does not emit them. Renaming one here without
  changing the generator breaks the picker.

Two layouts had to change to clear 360px, both because the kit's own version
overflowed:

- `RailGrid` was an auto-fit grid with `grid-column: span 2` on the body, which
  resolves to one column plus an implicit second on a phone and overflowed the
  viewport by 24px. It is now flex with a 1:2 grow ratio — same proportions,
  wraps where there is no room.
- `LayerRow`'s list variant used `minmax(0, 1fr)` tracks, which let a cell
  shrink below its own longest word. The title and description now share the
  row at the kit's 1:1.4 ratio and stack when they no longer fit.

## Not covered here

Page content and page layout. Those come one page at a time from the Content
Manager. Editorial images are a separate process — `FigPanel` is the
placeholder wherever a figure belongs; see the `image-register` document on
[PRO-2](/PRO/issues/PRO-2).

### The kit has no labelled schematic

Worth knowing before a page asks for one. `FigPanel` is a capable geometric
primitive — `.pv-fig__s` shapes positioned with `--l/--t/--w/--h`, as squares,
dots or bars, in any of the see/get/run tones, plus `--rings`, `__lines` and
`__dots` fields — but every shape is an empty `<i>`, and the only text-bearing
child in the whole component is `.pv-fig__label`, the `FIG. 01` corner caption.
The panel is a single `role="img"` with one `aria-label`.

So the kit can draw a diagram but cannot label one. Anything needing named
nodes or named edges — the region/manifest diagram `/why/data-residency` will
want (plan revision 3) is exactly this shape — needs a new component, not a
`FigPanel` variant. The smallest version consistent with the system would be a
positioned node that carries a mono label and an accessible name, plus a ruled
connector; it would reuse the existing tones, hairline and mono scale and add no
new tokens. Nothing is built, because there is no spec yet.
