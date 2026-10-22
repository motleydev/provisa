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
 *   The editorial figures. Both IMG-08a (four descriptions → one model) and
 *   IMG-08b (five rings closing on the compiled plan) are placed as editorial
 *   PNGs with light and dark variants. The verify step confirms the images
 *   load, carry the labelled role=img contract, and keep their declared
 *   aspect ratio under the layout — rather than reasoning about shape
 *   geometry that now lives inside the PNG.
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

    /* Both editorial figures load, carry a labelled role=img, and keep the
     * declared aspect ratio. Shape-level geometry is now inside the PNG, so
     * the browser check verifies the image renders rather than reasoning
     * about painted shapes.
     *
     * Each figure ships a light <img> and a dark one and the kit puts
     * display:none on whichever the theme is not showing. A lazy image is only
     * fetched once it has a box inside the viewport, so for IMG-08b — which is
     * loading="lazy" and sits near the foot of the page — a plain naturalWidth
     * read after load reports a PNG that is on disk as missing: in light it has
     * not been scrolled to, and in dark the light variant has no box at all and
     * is never fetched however far you scroll. So the figure is brought into
     * view and the variant the theme actually displays is decoded before
     * anything is read, and that variant is the one the load assertion is
     * about. The light <img> stays the one the src and alt assertions read: it
     * is the labelled one, the dark variant is aria-hidden with an empty alt
     * (PRO-154). */
    const figs = await page.evaluate(async () => {
      const out = [];
      for (const f of document.querySelectorAll(".pv-editorial")) {
        f.scrollIntoView({ block: "center" });
        const shown = [...f.querySelectorAll("img")]
          .filter((i) => getComputedStyle(i).display !== "none");
        /* decode() rejects when the PNG itself fails to load, which is the
         * failure this check exists to report — it is recorded and asserted
         * on below rather than thrown out of the evaluate. */
        const decoded = await Promise.all(shown.map((i) => i.decode().then(() => true, () => false)));
        const fr = f.getBoundingClientRect();
        const img = f.querySelector(".pv-editorial__img--light");
        const ratio = fr.height > 0 ? fr.width / fr.height : 0;
        out.push({
          w: fr.width, h: fr.height, ratio,
          role: f.getAttribute("role"),
          label: f.getAttribute("aria-label") || "",
          src: img?.getAttribute("src") || "",
          alt: img?.getAttribute("alt") || "",
          variants: shown.length,
          shownSrc: shown.map((i) => i.getAttribute("src")).join(" "),
          loaded: shown.length === 1 && decoded[0]
                  && shown[0].complete && shown[0].naturalWidth > 0,
          wide: f.classList.contains("pv-editorial--wide"),
          square: f.classList.contains("pv-editorial--square"),
        });
      }
      return out;
    });
    ok(figs.length === 2, `${at}: both editorial figures render (${figs.length})`);
    ok(figs.every((f) => f.w > 0 && f.h > 0), `${at}: neither figure collapses`);
    ok(figs.every((f) => f.role === "img" && f.label.length > 30),
       `${at}: both figures carry a labelled role="img"`);
    ok(figs.every((f) => /^\/assets\/editorial\/img-08[ab]-light\.png$/.test(f.src)),
       `${at}: both figures reference an IMG-08 light PNG (${figs.map((f) => f.src).join(", ")})`);
    ok(figs.every((f) => f.variants === 1),
       `${at}: each figure displays one theme variant (${figs.map((f) => f.variants).join(", ")})`);
    ok(figs.every((f) => f.shownSrc.endsWith(`-${theme}.png`)),
       `${at}: the variant on display is the ${theme} PNG (${figs.map((f) => f.shownSrc).join(", ")})`);
    ok(figs.every((f) => f.loaded),
       `${at}: both editorial PNGs load (${figs.map((f) => `${f.shownSrc}:${f.loaded}`).join(", ")})`);
    ok(figs.every((f) => f.alt === f.label),
       `${at}: each <img> alt mirrors its figure's aria-label`);
    /* Both figures ship at 4:5 (no --wide, no --square modifier). */
    ok(figs.every((f) => !f.wide && !f.square && Math.abs(f.ratio - 4 / 5) < 0.02),
       `${at}: both figures keep the 4:5 aspect ratio (${figs.map((f) => f.ratio.toFixed(2)).join(", ")})`);

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
    [...document.querySelectorAll(".pv-editorial")].map((f) => ({
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
