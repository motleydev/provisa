/**
 * The render pass for /why/one-model (PRO-28) — the half of the pair that needs
 * a browser, at 360/768/1280/1920/2560 in both themes.
 *
 * Playwright is deliberately not a dependency of this repo: `site/` has no
 * build step and should not acquire one. Install it where you are running from,
 * serve `site/`, then point this at it:
 *
 *   npm i playwright && npx playwright install chromium
 *   python3 site/design-system/serve.py 8731 &
 *   node site/design-system/verify-page-one-model.mjs http://127.0.0.1:8731
 *
 * `serve.py` rather than `http.server`: the pass requests `/why/one-model`, the
 * extensionless production route Home's new TextLink and the canonical both
 * name, and the stdlib handler 404s on it (REQ-2024).
 *
 * PLAYWRIGHT_LD_LIBRARY_PATH is the escape hatch `verify-ui.mjs` documents: a
 * prefix holding chromium's shared libraries, passed to the browser process
 * alone rather than exported over every binary on the box. On a sandbox with no
 * system browser libraries, `python3 site/design-system/browser-deps.py` builds
 * one.
 *
 * What is page-specific here, rather than the kit's own pass:
 *
 *   The measure. This page is argument and nothing else — no table, no card
 *   grid, no code block to take width off a paragraph. So the one way it can
 *   render badly is a paragraph that follows the container out to 1560px, and
 *   that is measured at every width rather than inferred from the CSS (which
 *   `check-kit.mjs` already reads).
 *
 *   The rings figure. It draws five rings because five layers are compiled
 *   into the plan; the approval hook sits outside the plan and is not drawn.
 *   `pv-fig--rings` sizes its rings with `:nth-of-type`, and the kit's own
 *   history here is a figure that silently rendered one fewer ring than it was
 *   given — so the five are measured as five distinct painted widths closing
 *   on the vermilion core, not counted in the markup.
 */
import { chromium } from "playwright";

const LAUNCH = process.env.PLAYWRIGHT_LD_LIBRARY_PATH
  ? { env: { ...process.env, LD_LIBRARY_PATH: process.env.PLAYWRIGHT_LD_LIBRARY_PATH } }
  : {};

const BASE = (process.argv[2] || "http://127.0.0.1:8731").replace(/\/$/, "");
const URL = BASE + "/why/one-model";
const WIDTHS = [360, 768, 1280, 1920, 2560];
const THEMES = ["light", "dark"];

const pass = [];
const fail = [];
const ok = (c, m) => (c ? pass : fail).push(m);

const browser = await chromium.launch(LAUNCH);

for (const theme of THEMES) {
  for (const width of WIDTHS) {
    const at = `${width}px ${theme}`;
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    await ctx.addInitScript(`try{localStorage.setItem("provisa-theme",${JSON.stringify(theme)})}catch(e){}`);
    const page = await ctx.newPage();

    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));

    const res = await page.goto(URL, { waitUntil: "load" });
    ok(res.status() === 200, `${at}: the page serves 200 (${res.status()})`);

    /* The theme actually applied, read off the painted page colour rather than
     * off the attribute, so a broken bootstrap cannot pass. */
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    ok(theme === "dark" ? bg === "rgb(14, 16, 19)" : bg === "rgb(248, 246, 241)",
       `${at}: body paints the ${theme} page colour (${bg})`);

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(overflow <= 0, `${at}: no horizontal overflow (${overflow}px)`);

    const escapees = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      const out = [];
      for (const el of document.querySelectorAll("main *, header *, footer *")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > w + 1 || r.left < -1) out.push(el.className || el.tagName);
      }
      return out.slice(0, 5);
    });
    ok(escapees.length === 0, `${at}: nothing escapes the viewport (${escapees.join(", ") || "none"})`);

    /* The measure. Every paragraph is capped at --measure, which is 68ch — so
     * the assertion is against the resolved max-width rather than a pixel
     * number restated here, and the widest paragraph is reported so a page
     * that starts setting long lines says by how much. */
    const measure = await page.evaluate(() => {
      /* §6's prose is in a Callout, which caps nothing of its own — it carries
       * .pv-measure for that, and is measured here with the paragraphs. */
      const ps = [...document.querySelectorAll("main .pv-p, main .pv-callout")];
      const cap = parseFloat(getComputedStyle(document.querySelector("main .pv-p")).maxWidth);
      const widest = Math.max(...ps.map((p) => p.getBoundingClientRect().width));
      return { cap, widest, n: ps.length };
    });
    ok(measure.n >= 10, `${at}: the page's argument is ${measure.n} capped blocks`);
    ok(measure.widest <= measure.cap + 1,
       `${at}: nothing running follows the container past the measure (${Math.round(measure.widest)}px of ${Math.round(measure.cap)}px)`);

    /* Both figures paint, and neither clips its own geometry. */
    const figs = await page.evaluate(() => {
      const out = [];
      for (const f of document.querySelectorAll(".pv-fig")) {
        const fr = f.getBoundingClientRect();
        const shapes = [...f.querySelectorAll(".pv-fig__s")].map((s) => {
          const r = s.getBoundingClientRect();
          return { w: r.width, h: r.height, bg: getComputedStyle(s).backgroundColor,
                   out: r.right > fr.right + 1 || r.left < fr.left - 1
                        || r.bottom > fr.bottom + 1 || r.top < fr.top - 1 };
        });
        out.push({ w: fr.width, h: fr.height, rings: f.classList.contains("pv-fig--rings"), shapes });
      }
      return out;
    });
    ok(figs.length === 2, `${at}: both FigPanels render (${figs.length})`);
    ok(figs.every((f) => f.w > 0 && f.h > 0), `${at}: neither figure collapses`);
    ok(figs.every((f) => f.shapes.every((s) => !s.out)),
       `${at}: no figure shape escapes its own panel`);

    /* The five rings, measured. Five painted widths, each smaller than the
     * last, and the core a colour the others are not — the kit's nth-child bug
     * rendered one fewer ring and lost the vermilion core, so this is the check
     * that a five-ring figure is five rings. */
    const rings = figs.find((f) => f.rings);
    const widths = rings.shapes.map((s) => Math.round(s.w));
    ok(rings.shapes.length === 5 && widths.every((w) => w > 0),
       `${at}: five rings paint (${widths.join(" > ")})`);
    ok(widths.every((w, i) => i === 0 || w < widths[i - 1]),
       `${at}: each ring is inside the one before it (${widths.join(" > ")})`);
    ok(!rings.shapes.slice(0, 4).some((s) => s.bg === rings.shapes[4].bg),
       `${at}: the core is a colour no outer ring is (${rings.shapes[4].bg})`);

    /* The breadcrumb is what says where you are, since One model is not a nav
     * item and so nothing in the header is current. */
    const crumb = await page.evaluate(() => {
      const c = document.querySelector(".pv-crumb");
      return { text: c?.textContent.replace(/\s+/g, " ").trim(),
               current: c?.querySelector('[aria-current="page"]')?.textContent.trim(),
               navCurrent: document.querySelectorAll(".pv-header [aria-current]").length };
    });
    ok(crumb.text === "Provisa / One model", `${at}: the breadcrumb reads "${crumb.text}"`);
    ok(crumb.current === "One model" && crumb.navCurrent === 0,
       `${at}: the breadcrumb carries the current page and the nav claims none`);

    /* Inline links are underlined at the sentence's own size, which is what
     * makes a link inside a paragraph visible without a rule under it. */
    const inline = await page.evaluate(() => {
      const ls = [...document.querySelectorAll("main .pv-link--inline")];
      return ls.map((a) => {
        const c = getComputedStyle(a);
        const p = getComputedStyle(a.closest("p"));
        return { deco: c.textDecorationLine, size: c.fontSize === p.fontSize,
                 colour: c.color !== p.color };
      });
    });
    ok(inline.length === 3, `${at}: three inline cross-links (${inline.length})`);
    ok(inline.every((l) => l.deco.includes("underline") && l.size && l.colour),
       `${at}: each is underlined, at the sentence's size, in the link colour`);

    /* Every in-page anchor resolves — #contact is the chrome's own target, and
     * the four section ids are the old page's h2 anchors. */
    const dangling = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute("href"))
        .filter((h) => h.length > 1 && !document.querySelector(h)));
    ok(dangling.length === 0, `${at}: every fragment link resolves (${dangling.join(", ") || "none"})`);

    /* The four inbound section anchors land clear of the sticky header. A
     * fragment cannot be redirected, so #federation has to arrive readable. */
    for (const id of ["federation", "metrics", "ontology", "governance"]) {
      const geom = await page.evaluate((i) => {
        location.hash = "";
        scrollTo(0, 0);
        location.hash = i;
        const r = document.getElementById(i).getBoundingClientRect();
        const h = document.querySelector(".pv-header").getBoundingClientRect();
        return { top: Math.round(r.top), headerBottom: Math.round(h.bottom) };
      }, id);
      ok(geom.top >= geom.headerBottom - 1,
         `${at}: #${id} lands clear of the sticky header (top ${geom.top}, header bottom ${geom.headerBottom})`);
    }
    await page.evaluate(() => { location.hash = ""; scrollTo(0, 0); });

    /* The nav and the drawer swap at --bp-nav, read off the element rather than
     * restated here. */
    const nav = await page.evaluate(() => ({
      nav: getComputedStyle(document.querySelector(".pv-header__nav")).display !== "none",
      menu: getComputedStyle(document.querySelector(".pv-header__menu")).display !== "none",
      bp: parseInt(getComputedStyle(document.documentElement).getPropertyValue("--bp-nav"), 10),
    }));
    ok(nav.nav !== nav.menu, `${at}: exactly one of the nav and the menu button shows`);
    ok(width >= nav.bp ? nav.nav : nav.menu, `${at}: the right one shows for --bp-nav ${nav.bp}px`);

    /* No hosted conversion, in either theme's rendered DOM. */
    const hosted = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"))
        .filter((h) => /cloud\.provisa\.dev/.test(h)));
    ok(hosted.length === 0, `${at}: nothing links a hosted service (${hosted.join(", ") || "none"})`);

    ok(errors.length === 0, `${at}: no console errors (${errors.slice(0, 2).join(" | ")})`);

    await ctx.close();
  }
}

/* One semantics and keyboard pass, at one width: the components are the kit's
 * and the kit's own pass covers them. What is new here is the composition. */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "load" });

  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement.className);
  ok(first.includes("pv-skip"), `keyboard: the first Tab reaches the skip link (${first})`);

  /* 1280px is under --bp-nav (1300px), so this width is the drawer's. */
  await page.focus(".pv-header__menu");
  await page.keyboard.press("Enter");
  const open = await page.evaluate(() => ({
    expanded: document.querySelector(".pv-header__menu").getAttribute("aria-expanded"),
    hidden: document.querySelector(".pv-drawer").getAttribute("aria-hidden"),
  }));
  ok(open.expanded === "true" && open.hidden !== "true", "keyboard: Enter opens the drawer");
  await page.keyboard.press("Escape");
  const closed = await page.evaluate(() => ({
    expanded: document.querySelector(".pv-header__menu").getAttribute("aria-expanded"),
    focused: document.activeElement.className,
    overflow: getComputedStyle(document.body).overflow,
  }));
  ok(closed.expanded === "false" && closed.focused.includes("pv-header__menu"),
     "keyboard: Escape closes it and returns focus to the menu button");
  ok(closed.overflow !== "hidden", "keyboard: closing restores page scrolling");

  /* The toggle persists a choice, which is the only way to reach dark. The
   * drawer's copy is the one that is visible at this width, and clicking it
   * must not close the drawer — a toggle is not a nav link. */
  await page.focus(".pv-header__menu");
  await page.keyboard.press("Enter");
  await page.click('.pv-drawer [data-theme-set="dark"]');
  const dark = await page.evaluate(() => ({
    bg: getComputedStyle(document.body).backgroundColor,
    stored: localStorage.getItem("provisa-theme"),
    open: document.querySelector(".pv-header__menu").getAttribute("aria-expanded"),
  }));
  ok(dark.bg === "rgb(14, 16, 19)" && dark.stored === "dark",
     `toggle: dark paints and persists (${dark.bg}, ${dark.stored})`);
  ok(dark.open === "true", "toggle: the drawer stays open on the toggle, which is a button and not a link");
  await page.keyboard.press("Escape");

  /* And the header's own copy, above the breakpoint, back to the default. */
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.click('.pv-header .pv-theme [data-theme-set="light"]');
  const light = await page.evaluate(() => ({
    bg: getComputedStyle(document.body).backgroundColor,
    stored: localStorage.getItem("provisa-theme"),
  }));
  ok(light.bg === "rgb(248, 246, 241)" && light.stored === "light",
     `toggle: the header's copy returns to the default (${light.bg}, ${light.stored})`);
  await page.setViewportSize({ width: 1280, height: 900 });

  const named = await page.evaluate(() =>
    [...document.querySelectorAll("input, button, select, textarea")]
      .filter((el) => !el.labels?.length && !el.getAttribute("aria-label")
                      && !el.textContent.trim() && !el.getAttribute("aria-labelledby")).length);
  ok(named === 0, `a11y: every form control has an accessible name (${named} without)`);

  const h = await page.evaluate(() => ({
    h1: document.querySelectorAll("h1").length,
    text: document.querySelector("h1").textContent.trim(),
    order: [...document.querySelectorAll("main h1, main h2, main h3")].map((e) => +e.tagName[1]),
  }));
  ok(h.h1 === 1 && h.text === "One model.", `a11y: one h1, and it is the page (${h.h1}, "${h.text}")`);
  ok(h.order.every((lvl, i) => i === 0 || lvl <= h.order[i - 1] + 1),
     `a11y: no heading level is skipped (${h.order.join(" ")})`);

  const figs = await page.evaluate(() =>
    [...document.querySelectorAll(".pv-fig")].map((f) => ({
      label: f.getAttribute("aria-label") || "",
      role: f.getAttribute("role"),
    })));
  ok(figs.length === 2 && figs.every((f) => f.role === "img" && f.label.length > 40),
     `a11y: both figures are one labelled role="img" (${figs.map((f) => f.label.length).join(", ")})`);

  await ctx.close();
}

await browser.close();

console.log(`${pass.length} passed`);
for (const f of fail) console.log("  FAIL  " + f);
console.log(fail.length ? `\n${fail.length} failed` : "\nall checks passed");
process.exit(fail.length ? 1 : 0);
