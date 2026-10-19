/**
 * The render pass for /pricing (PRO-93) — the half of the pair that needs
 * a browser, at 360/768/1280/1920/2560 in both themes.
 *
 *   python3 site/design-system/serve.py 8731 &
 *   node site/design-system/verify-page-pricing.mjs http://127.0.0.1:8731
 *
 * The static-source checks live in check-page-pricing.mjs and cover the
 * SME verdict (PRO-88 against the editions-brief rev 2). What is here is
 * what only a rendered page can prove:
 *
 *   The editions table serves. One row per edition — Community,
 *   Enterprise, Vertical packages — four columns at every width, nothing
 *   escaping the table panel.
 *
 *   The two licence sentences the verdict required adjacent (C-17)
 *   render adjacent on the page — a wrapping or stack regression would
 *   put a code block between them.
 *
 *   /pricing is not in the main nav (plan rev 2 freezes it at six items),
 *   so no header or drawer item marks itself current on this page.
 *   The footer's /pricing/ Editions link marks itself current.
 */
import { chromium } from "playwright";

const LAUNCH = process.env.PLAYWRIGHT_LD_LIBRARY_PATH
  ? { env: { ...process.env, LD_LIBRARY_PATH: process.env.PLAYWRIGHT_LD_LIBRARY_PATH } }
  : {};

const BASE = (process.argv[2] || "http://127.0.0.1:8731").replace(/\/$/, "");
const URL = BASE + "/pricing/";
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

    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    ok(theme === "dark" ? bg === "rgb(14, 16, 19)" : bg === "rgb(248, 246, 241)",
       `${at}: body paints the ${theme} page colour (${bg})`);

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(overflow <= 0, `${at}: no horizontal overflow (${overflow}px)`);

    /* .pv-table and .pv-code have overflow-x:auto; everything else lives
     * inside the viewport. */
    const escapees = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      const out = [];
      for (const el of document.querySelectorAll("main *, header *, footer *")) {
        if (el.closest(".pv-table") || el.closest(".pv-code")) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > w + 1 || r.left < -1) out.push(el.className || el.tagName);
      }
      return out.slice(0, 5);
    });
    ok(escapees.length === 0, `${at}: nothing escapes the viewport (${escapees.join(", ") || "none"})`);

    /* The editions table — three rows, four columns, every cell has prose. */
    const table = await page.evaluate(() => {
      const t = document.querySelector("#editions .pv-table table");
      if (!t) return { present: false };
      const headers = [...t.querySelectorAll("thead th")].map((th) => th.textContent.trim());
      const rows = [...t.querySelectorAll("tbody tr")].map((tr) =>
        [...tr.children].map((c) => c.textContent.replace(/\s+/g, " ").trim()));
      return { present: true, headers, rows,
               panel: Math.round(t.getBoundingClientRect().width) };
    });
    ok(table.present, `${at}: the editions table is present`);
    ok(table.present && table.headers.length === 4,
       `${at}: the editions table has 4 columns (${table.present ? table.headers.length : "n/a"})`);
    ok(table.present && table.rows.length === 3,
       `${at}: the editions table has 3 rows (${table.present ? table.rows.length : "n/a"})`);
    ok(table.present && table.rows.every((r) => r.every((c) => c.length > 0)),
       `${at}: every cell in the editions table carries prose`);
    ok(table.present && table.panel > 0,
       `${at}: the editions table panel paints (${table.present ? table.panel : "n/a"}px)`);
    ok(table.present && table.rows.map((r) => r[0]).join("|") === "Community|Enterprise|Vertical packages",
       `${at}: the three editions rows are Community, Enterprise, Vertical packages`);

    /* The §4 Licensing section lists all four facts as RuledCards. */
    const facts = await page.evaluate(() =>
      [...document.querySelectorAll("#licensing .pv-ruled .pv-ruled__title")]
        .map((e) => e.textContent.trim()));
    ok(facts.length === 4 && facts.join("|") === "Licence|Change Licence|Change Date|Additional Use Grant",
       `${at}: §4 Licensing is Licence · Change Licence · Change Date · Additional Use Grant (${facts.join(" · ") || "none"})`);

    /* C-17 — the two sentences are rendered in the same section, with no
     * code block between them. */
    const adj = await page.evaluate(() => {
      const sec = document.querySelector("#registration-vs-production");
      if (!sec) return { ok: false };
      const txt = sec.textContent.replace(/\s+/g, " ");
      const a = txt.indexOf("registration record");
      const b = txt.indexOf("grant production rights");
      return { ok: a >= 0 && b >= 0, delta: b - a };
    });
    ok(adj.ok && adj.delta > 0 && adj.delta < 160,
       `${at}: C-17's two sentences render adjacent (${adj.delta}px apart in text)`);

    /* StatStrip-free page — no numeric claims in the hero. The brief rev
     * 2 decision is "editions, no numbers". */
    const stats = await page.evaluate(() => document.querySelector(".pv-stats"));
    ok(stats === null, `${at}: no StatStrip (brief rev 2: editions, no numbers)`);

    /* Measure. Every paragraph is capped at --measure. */
    const measure = await page.evaluate(() => {
      const ps = [...document.querySelectorAll("main .pv-p")];
      if (!ps.length) return { cap: 0, widest: 0, n: 0 };
      const cap = parseFloat(getComputedStyle(ps[0]).maxWidth);
      const widest = Math.max(...ps.map((p) => p.getBoundingClientRect().width));
      return { cap, widest, n: ps.length };
    });
    ok(measure.n > 0 && measure.widest <= measure.cap + 1,
       `${at}: nothing running follows the container past the measure (${Math.round(measure.widest)}px of ${Math.round(measure.cap)}px)`);

    /* Breadcrumb: Provisa / Editions and licensing. /pricing is not in
     * the main nav, so no header-nav item carries aria-current="page". */
    const crumb = await page.evaluate(() => {
      const c = document.querySelector(".pv-crumb");
      return {
        text: c?.textContent.replace(/\s+/g, " ").trim(),
        current: c?.querySelector('[aria-current="page"]')?.textContent.trim(),
        navCurrent: [...document.querySelectorAll(".pv-header__nav [aria-current]")]
          .map((a) => a.getAttribute("href")),
        footerCurrent: [...document.querySelectorAll(".pv-footer [aria-current]")]
          .map((a) => a.getAttribute("href")),
      };
    });
    ok(crumb.text === "Provisa / Editions and licensing",
       `${at}: the breadcrumb reads "${crumb.text}"`);
    ok(crumb.current === "Editions and licensing",
       `${at}: the breadcrumb carries the current page`);
    ok(crumb.navCurrent.length === 0,
       `${at}: no main-nav item marks itself current (plan rev 2: pricing is not in the nav; got ${crumb.navCurrent.join(", ") || "none"})`);
    ok(crumb.footerCurrent.includes("/pricing/"),
       `${at}: the footer /pricing/ Editions link marks itself current`);

    /* Every in-page anchor resolves. */
    const dangling = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute("href"))
        .filter((h) => h.length > 1 && !document.querySelector(h)));
    ok(dangling.length === 0, `${at}: every fragment link resolves (${dangling.join(", ") || "none"})`);

    /* The nav and the drawer swap at --bp-nav. */
    const nav = await page.evaluate(() => ({
      nav: getComputedStyle(document.querySelector(".pv-header__nav")).display !== "none",
      menu: getComputedStyle(document.querySelector(".pv-header__menu")).display !== "none",
      bp: parseInt(getComputedStyle(document.documentElement).getPropertyValue("--bp-nav"), 10),
    }));
    ok(nav.nav !== nav.menu, `${at}: exactly one of the nav and the menu button shows`);
    ok(width >= nav.bp ? nav.nav : nav.menu, `${at}: the right one shows for --bp-nav ${nav.bp}px`);

    /* No hosted conversion anywhere on the page. */
    const hosted = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"))
        .filter((h) => /cloud\.provisa\.dev/.test(h)));
    ok(hosted.length === 0, `${at}: nothing links a hosted service (${hosted.join(", ") || "none"})`);

    ok(errors.length === 0, `${at}: no console errors (${errors.slice(0, 2).join(" | ")})`);

    await ctx.close();
  }
}

/* One semantics and keyboard pass at 1280px — the components are the kit's
 * and the kit's own pass covers them. */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "load" });

  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement.className);
  ok(first.includes("pv-skip"), `keyboard: the first Tab reaches the skip link (${first})`);

  const h = await page.evaluate(() => ({
    h1: document.querySelectorAll("h1").length,
    text: document.querySelector("h1").textContent.replace(/\s+/g, " ").trim(),
    order: [...document.querySelectorAll("main h1, main h2, main h3")].map((e) => +e.tagName[1]),
  }));
  ok(h.h1 === 1 && /^Two editions/.test(h.text),
     `a11y: one h1, and it is the page ("${h.text}")`);
  ok(h.order.every((lvl, i) => i === 0 || lvl <= h.order[i - 1] + 1),
     `a11y: no heading level is skipped (${h.order.join(" ")})`);

  const named = await page.evaluate(() =>
    [...document.querySelectorAll("input, button, select, textarea")]
      .filter((el) => !el.labels?.length && !el.getAttribute("aria-label")
                      && !el.textContent.trim() && !el.getAttribute("aria-labelledby")).length);
  ok(named === 0, `a11y: every form control has an accessible name (${named} without)`);

  await ctx.close();
}

await browser.close();

console.log(`${pass.length} passed`);
for (const f of fail) console.log("  FAIL  " + f);
console.log(fail.length ? `\n${fail.length} failed` : "\nall checks passed");
process.exit(fail.length ? 1 : 0);
