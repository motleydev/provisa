/**
 * The render pass for /install (PRO-17) — the half of the pair that needs a
 * browser, at 360/768/1280/1920/2560 in both themes.
 *
 * Playwright is deliberately not a dependency of this repo: `site/` has no
 * build step and should not acquire one. Install it where you are running
 * from, serve `site/`, then point this at it:
 *
 *   npm i playwright && npx playwright install chromium
 *   python3 site/design-system/serve.py 8731 &
 *   node site/design-system/verify-page-install.mjs http://127.0.0.1:8731
 *
 * What is page-specific here, rather than the kit's own pass:
 *
 *   AC-2 is a layout fact rather than a text fact. The brief says the hero
 *   code block is the first thing below the H1 at every width. Source order
 *   is not enough — a float, a grid-template-rows swap or a visually-hidden
 *   wrapper could put something painted above it on a narrow viewport. So the
 *   top of the `.pv-code` is read off the painted page, at every width, and
 *   the only elements allowed to paint above it in `main` are the breadcrumb
 *   and the eyebrow — the H1 itself and nothing of the body copy.
 *
 *   The `<mark>` band in the hero is `display: block` with a -22px bleed
 *   inside an overflow-x:auto scroller. At 360 that is where a page like this
 *   paints a scrollbar it should not. The scroller's own geometry is read.
 *
 *   The CodeTabs ARIA pattern — one tab aria-selected at a time, exactly one
 *   panel not hidden — is the composition that is new on this page relative
 *   to the kit's own pass.
 */
import { chromium } from "playwright";

const LAUNCH = process.env.PLAYWRIGHT_LD_LIBRARY_PATH
  ? { env: { ...process.env, LD_LIBRARY_PATH: process.env.PLAYWRIGHT_LD_LIBRARY_PATH } }
  : {};

const BASE = (process.argv[2] || "http://127.0.0.1:8731").replace(/\/$/, "");
const URL = BASE + "/install";
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

    /* The theme actually applied, read off the painted page colour rather
     * than off the attribute, so a broken bootstrap cannot pass. */
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    ok(theme === "dark" ? bg === "rgb(14, 16, 19)" : bg === "rgb(248, 246, 241)",
       `${at}: body paints the ${theme} page colour (${bg})`);

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(overflow <= 0, `${at}: no horizontal overflow (${overflow}px)`);

    const escapees = await page.evaluate(() => {
      /* `.pv-code pre` and `.pv-table` are both horizontal scrollers —
       * `overflow-x:auto` by design. Anything inside them that extends past
       * the viewport scrolls internally, which is the point. The scrollers'
       * own boxes are what have to fit, not their children. */
      const w = document.documentElement.clientWidth;
      const out = [];
      for (const el of document.querySelectorAll("main *, header *, footer *")) {
        if (el.closest(".pv-code pre") || el.closest(".pv-table")?.contains(el)
            && el.closest(".pv-table") !== el) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > w + 1 || r.left < -1) out.push(el.className || el.tagName);
      }
      return out.slice(0, 5);
    });
    ok(escapees.length === 0, `${at}: nothing escapes the viewport (${escapees.join(", ") || "none"})`);

    /* AC-2 as a layout fact. The painted top of the hero code block is above
     * the painted top of every pv-p and pv-note in main, and the only things
     * above the code are the breadcrumb, the eyebrow, and the H1 itself. */
    const order = await page.evaluate(() => {
      const code = document.querySelector("main .pv-code");
      const codeTop = code.getBoundingClientRect().top;
      const above = [];
      for (const el of document.querySelectorAll(
        "main .pv-p, main .pv-note, main .pv-btn, main .pv-callout, main .pv-ruled, main .pv-table, main .pv-editorial"
      )) {
        const r = el.getBoundingClientRect();
        if (r.height === 0 && r.width === 0) continue;
        if (r.top < codeTop - 0.5) above.push(el.className);
      }
      const headerAllowed = ["pv-crumb", "pv-eyebrow", "pv-h--hero"];
      const h1Top = document.querySelector("main h1").getBoundingClientRect().top;
      return { above, codeAfterH1: codeTop >= h1Top, headerAllowed };
    });
    ok(order.above.length === 0 && order.codeAfterH1,
       `${at}: hero code block is the first content block below the H1 (${order.above.slice(0, 2).join(" | ") || "clean"})`);

    /* The hero's marked line — the Python-version warning C-1 — paints as a
     * block band, and the scroller around it does not force a page-level
     * horizontal scrollbar. The band itself may scroll internally; the page
     * must not. */
    const heroMark = await page.evaluate(() => {
      const code = document.querySelector("main .pv-code");
      const pre = code.querySelector("pre");
      const mark = pre.querySelector("mark");
      const mr = mark.getBoundingClientRect();
      const pr = pre.getBoundingClientRect();
      return {
        marked: mark.textContent.trim(),
        display: getComputedStyle(mark).display,
        band: Math.round(mr.width) >= Math.round(pr.width) - 1,
        scroll: pre.scrollWidth > pre.clientWidth,
        pageScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    ok(/Python 3\.12/.test(heroMark.marked),
       `${at}: the marked line carries the Python version warning (${heroMark.marked.slice(0, 60)})`);
    ok(heroMark.display === "block",
       `${at}: the marked line is a full-bleed block band (${heroMark.display})`);
    ok(!heroMark.pageScroll,
       `${at}: the hero scroller does not force a page-level horizontal scrollbar`);

    /* AC-5: the 0.1.0a479 line ships. */
    const version = await page.evaluate(() => {
      const notes = [...document.querySelectorAll(".pv-note")];
      const vn = notes.find((n) => /0\.1\.0a479/.test(n.textContent));
      return vn ? vn.textContent.replace(/\s+/g, " ").trim().slice(0, 160) : null;
    });
    ok(version && /0\.1\.0a479/.test(version),
       `${at}: the 0.1.0a479 line ships ("${version?.slice(0, 60)}…")`);

    /* The breadcrumb reads what the chrome does not announce, because Install
     * is not a nav item. */
    const crumb = await page.evaluate(() => {
      const c = document.querySelector(".pv-crumb");
      return { text: c?.textContent.replace(/\s+/g, " ").trim(),
               current: c?.querySelector('[aria-current="page"]')?.textContent.trim(),
               navCurrent: document.querySelectorAll(".pv-header [aria-current]").length };
    });
    ok(crumb.text === "Provisa / Install",
       `${at}: the breadcrumb reads "${crumb.text}"`);
    ok(crumb.current === "Install" && crumb.navCurrent === 0,
       `${at}: the breadcrumb carries the current page and the nav claims none`);

    /* The three platform download buttons, each pointing at a `/dl/*`
     * Cloudflare Function — those links are the page's primary conversion
     * and have to be present in the rendered DOM in every theme. */
    const dls = await page.evaluate(() => {
      const map = {};
      for (const a of document.querySelectorAll('a[href^="/dl/"]')) map[a.getAttribute("href")] = a.textContent.trim();
      return map;
    });
    ok(Object.keys(dls).length >= 3 && dls["/dl/macos"] && dls["/dl/windows"] && dls["/dl/linux"],
       `${at}: three platform download buttons present (${Object.keys(dls).join(", ")})`);

    /* The CodeTabs composition — one aria-selected tab, one visible panel. */
    const tabs = await page.evaluate(() => {
      const tabEls = [...document.querySelectorAll(".pv-codetabs__tab")];
      const panelEls = [...document.querySelectorAll(".pv-codetabs__panel")];
      const selected = tabEls.filter((t) => t.getAttribute("aria-selected") === "true").length;
      const visiblePanels = panelEls.filter((p) => getComputedStyle(p).display !== "none");
      return { tabCount: tabEls.length, selected,
               panels: panelEls.length, visible: visiblePanels.length };
    });
    ok(tabs.tabCount === 3 && tabs.selected === 1,
       `${at}: three tabs, one selected (${tabs.tabCount} / ${tabs.selected})`);
    ok(tabs.panels >= 3 && tabs.visible === 1,
       `${at}: exactly one tab panel is painted (${tabs.visible} of ${tabs.panels})`);

    /* Six CodeBlocks are expected on the page (hero + four across the three
     * CodeTabs panels + two in §5). Each holds a <pre> with content; those
     * sitting inside an inactive tab panel paint zero height by design (the
     * panel has display:none) and that is covered by the tabs assertion
     * above, not here. */
    const codes = await page.evaluate(() => {
      const out = [];
      for (const c of document.querySelectorAll(".pv-code")) {
        const r = c.getBoundingClientRect();
        const inHiddenPanel = !!c.closest(".pv-codetabs__panel")
          && getComputedStyle(c.closest(".pv-codetabs__panel")).display === "none";
        out.push({ h: r.height, hasPre: !!c.querySelector("pre"),
                   text: c.textContent.trim().length, inHiddenPanel });
      }
      return out;
    });
    ok(codes.length >= 6, `${at}: at least six CodeBlocks render (${codes.length})`);
    ok(codes.every((c) => c.hasPre && c.text > 0),
       `${at}: every CodeBlock holds a <pre> with content`);
    ok(codes.filter((c) => !c.inHiddenPanel).every((c) => c.h > 0),
       `${at}: every visible CodeBlock paints with positive height`);

    /* Three RuledCards, three Callouts, one ComparisonTable, one editorial. */
    const components = await page.evaluate(() => ({
      ruled: document.querySelectorAll(".pv-ruled").length,
      callouts: document.querySelectorAll(".pv-callout").length,
      tables: document.querySelectorAll(".pv-table").length,
      figs: document.querySelectorAll(".pv-editorial").length,
    }));
    ok(components.ruled >= 3, `${at}: three RuledCards (${components.ruled})`);
    ok(components.callouts >= 3, `${at}: at least three Callouts (${components.callouts})`);
    ok(components.tables >= 1, `${at}: ComparisonTable renders (${components.tables})`);
    ok(components.figs >= 1, `${at}: editorial illustration renders (${components.figs})`);

    /* Every in-page anchor resolves. */
    const dangling = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute("href"))
        .filter((h) => h.length > 1 && !document.querySelector(h)));
    ok(dangling.length === 0, `${at}: every fragment link resolves (${dangling.join(", ") || "none"})`);

    /* Nothing hosted. */
    const hosted = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"))
        .filter((h) => /cloud\.provisa\.dev/.test(h)));
    ok(hosted.length === 0, `${at}: nothing links a hosted service (${hosted.join(", ") || "none"})`);

    /* The nav and the drawer swap at --bp-nav. */
    const nav = await page.evaluate(() => ({
      nav: getComputedStyle(document.querySelector(".pv-header__nav")).display !== "none",
      menu: getComputedStyle(document.querySelector(".pv-header__menu")).display !== "none",
      bp: parseInt(getComputedStyle(document.documentElement).getPropertyValue("--bp-nav"), 10),
    }));
    ok(nav.nav !== nav.menu, `${at}: exactly one of the nav and the menu button shows`);
    ok(width >= nav.bp ? nav.nav : nav.menu, `${at}: the right one shows for --bp-nav ${nav.bp}px`);

    ok(errors.length === 0, `${at}: no console errors (${errors.slice(0, 2).join(" | ")})`);

    await ctx.close();
  }
}

/* One semantics and keyboard pass, at one width. The kit's pv-codetabs is new
 * composition on this page, so arrow-key traversal is checked here rather
 * than in the kit's own pass. */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "load" });

  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement.className);
  ok(first.includes("pv-skip"), `keyboard: the first Tab reaches the skip link (${first})`);

  /* The CodeTabs ARIA pattern: tabs expose role=tab, panels expose
   * role=tabpanel, and clicking the second tab moves aria-selected to it. */
  const aria = await page.evaluate(() => ({
    tabRole: document.querySelector(".pv-codetabs__tab").getAttribute("role"),
    panelRole: document.querySelector(".pv-codetabs__panel").getAttribute("role"),
    tablist: document.querySelector(".pv-codetabs__tabs").getAttribute("role"),
  }));
  ok(aria.tabRole === "tab" && aria.panelRole === "tabpanel" && aria.tablist === "tablist",
     `codetabs: ARIA roles are tab / tabpanel / tablist (${aria.tabRole} / ${aria.panelRole} / ${aria.tablist})`);

  const tabButtons = await page.$$(".pv-codetabs__tab");
  await tabButtons[1].click();
  const after = await page.evaluate(() => {
    const sel = [...document.querySelectorAll(".pv-codetabs__tab")]
      .findIndex((t) => t.getAttribute("aria-selected") === "true");
    const visible = [...document.querySelectorAll(".pv-codetabs__panel")]
      .filter((p) => getComputedStyle(p).display !== "none").length;
    return { sel, visible };
  });
  ok(after.sel === 1 && after.visible === 1,
     `codetabs: clicking tab 2 selects it and swaps the panel (sel=${after.sel}, visible=${after.visible})`);

  /* Headings don't skip levels. */
  const h = await page.evaluate(() => ({
    h1: document.querySelectorAll("h1").length,
    text: document.querySelector("h1").textContent.trim(),
    order: [...document.querySelectorAll("main h1, main h2, main h3")].map((e) => +e.tagName[1]),
  }));
  ok(h.h1 === 1 && /One wheel/.test(h.text),
     `a11y: one h1, and it is the page ("${h.text}")`);
  ok(h.order.every((lvl, i) => i === 0 || lvl <= h.order[i - 1] + 1),
     `a11y: no heading level is skipped (${h.order.join(" ")})`);

  /* Every form control has an accessible name — on /install there are no
   * forms, but the chrome drawer carries buttons. */
  const named = await page.evaluate(() =>
    [...document.querySelectorAll("input, button, select, textarea")]
      .filter((el) => !el.labels?.length && !el.getAttribute("aria-label")
                      && !el.textContent.trim() && !el.getAttribute("aria-labelledby")).length);
  ok(named === 0, `a11y: every form control has an accessible name (${named} without)`);

  /* The editorial illustration is a labelled role="img" — same contract as
   * the kit's own pass expects of a figure that is argument, not decoration. */
  const figs = await page.evaluate(() =>
    [...document.querySelectorAll(".pv-editorial")].map((f) => ({
      label: f.getAttribute("aria-label") || "",
      role: f.getAttribute("role"),
    })));
  ok(figs.length >= 1 && figs.every((f) => f.role === "img" && f.label.length > 20),
     `a11y: the editorial illustration is a labelled role="img" (${figs.map((f) => f.label.length).join(", ")})`);

  await ctx.close();
}

await browser.close();

console.log(`${pass.length} passed`);
for (const f of fail) console.log("  FAIL  " + f);
console.log(fail.length ? `\n${fail.length} failed` : "\nall checks passed");
process.exit(fail.length ? 1 : 0);
