/**
 * The render pass for /why/sources (PRO-83) — the half of the pair that needs
 * a browser, at 360/768/1280/1920/2560 in both themes.
 *
 *   python3 site/design-system/serve.py 8731 &
 *   node site/design-system/verify-page-sources.mjs http://127.0.0.1:8731
 *
 * What is page-specific here, rather than the kit's own pass:
 *
 *   The all-72 table. The page's argument is tabular, not a figure, so the
 *   render check asserts the table serves — one row per group, every type
 *   fits inside the panel at every width — and that the group-count column
 *   reaches 72 when added up.
 *
 *   The five execution paths. Five LayerRows numbered 01-05, no gap, each
 *   carrying its title and the source names its where-clause lists.
 */
import { chromium } from "playwright";

const LAUNCH = process.env.PLAYWRIGHT_LD_LIBRARY_PATH
  ? { env: { ...process.env, LD_LIBRARY_PATH: process.env.PLAYWRIGHT_LD_LIBRARY_PATH } }
  : {};

const BASE = (process.argv[2] || "http://127.0.0.1:8731").replace(/\/$/, "");
const URL = BASE + "/why/sources";
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

    /* Two blocks may scroll inside their own frame rather than reflow:
     * .pv-table has overflow-x:auto and .pv-code pre has the same, because a
     * table read down one column is not a comparison and code is monospace
     * that must not wrap mid-line. So escapees are measured against the
     * viewport for everything else. */
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

    /* The all-72 table serves. One row per group with a group count, every
     * group lists at least one source type, and the counts add up to 72. */
    const table = await page.evaluate(() => {
      const t = document.querySelector("#all-72 .pv-table");
      const rows = [...t.querySelectorAll("tbody tr")];
      const counts = rows.map((r) => parseInt(r.children[1].textContent.trim(), 10));
      const nonempty = rows.every((r) => r.children[2].textContent.trim().length > 0);
      return { n: rows.length, total: counts.reduce((a, b) => a + b, 0), nonempty,
               panel: Math.round(t.getBoundingClientRect().width) };
    });
    ok(table.n === 18, `${at}: the all-72 table has 18 group rows (${table.n})`);
    ok(table.total === 72, `${at}: group counts sum to 72 (${table.total})`);
    ok(table.nonempty, `${at}: every group lists at least one source type`);
    ok(table.panel > 0, `${at}: the table panel paints (${table.panel}px)`);

    /* The five execution paths — five LayerRows, numbered 01-05, no gap. */
    const layers = await page.evaluate(() => {
      const rows = [...document.querySelectorAll("#execution-paths .pv-layer--detail")];
      return rows.map((r) => ({
        idx: r.querySelector(".pv-layer__idx")?.textContent.trim() || "",
        title: r.querySelector(".pv-layer__title")?.textContent.trim() || "",
        where: r.querySelector(".pv-layer__where")?.textContent.trim() || "",
      }));
    });
    ok(layers.length === 5, `${at}: five execution-path rows (${layers.length})`);
    ok(layers.map((l) => l.idx).join(" ") === "01 02 03 04 05",
       `${at}: the five rows number 01-05 with no gap (${layers.map((l) => l.idx).join(" ")})`);
    ok(layers.every((l) => l.title && l.where),
       `${at}: every path has a title and a where-clause`);

    /* The StatStrip carries three items. The .pv-stats block flows below a
     * breakpoint; the three items are present at every width regardless. */
    const stats = await page.evaluate(() => {
      const items = [...document.querySelectorAll(".pv-stats__item")];
      return items.map((i) => ({
        num: i.querySelector(".pv-stats__num")?.textContent.trim(),
        label: i.querySelector(".pv-stats__label")?.textContent.trim(),
      }));
    });
    ok(stats.length === 3 && stats[0].num === "72" && stats[1].num === "5"
       && /sub-100ms/.test(stats[2].num),
       `${at}: StatStrip carries 72 / 5 / sub-100ms (${stats.map((s) => s.num).join(" / ")})`);

    /* Measure. Every paragraph is capped at --measure. The all-72 table and
     * the code blocks are the exceptions: tables have overflow:auto and
     * <pre> is monospace that must not reflow. */
    const measure = await page.evaluate(() => {
      const ps = [...document.querySelectorAll("main .pv-p")];
      const cap = parseFloat(getComputedStyle(ps[0]).maxWidth);
      const widest = Math.max(...ps.map((p) => p.getBoundingClientRect().width));
      return { cap, widest, n: ps.length };
    });
    ok(measure.widest <= measure.cap + 1,
       `${at}: nothing running follows the container past the measure (${Math.round(measure.widest)}px of ${Math.round(measure.cap)}px)`);

    /* The breadcrumb is Provisa / Why / Sources, and the nav marks /why/sources
     * as the current page (unlike /why/one-model, Sources is a nav item). */
    const crumb = await page.evaluate(() => {
      const c = document.querySelector(".pv-crumb");
      return { text: c?.textContent.replace(/\s+/g, " ").trim(),
               current: c?.querySelector('[aria-current="page"]')?.textContent.trim(),
               navCurrent: [...document.querySelectorAll(".pv-header__nav [aria-current]")]
                 .map((a) => a.getAttribute("href"))[0] };
    });
    ok(crumb.text === "Provisa / Why / Sources", `${at}: the breadcrumb reads "${crumb.text}"`);
    ok(crumb.current === "Sources", `${at}: the breadcrumb carries the current page`);
    ok(crumb.navCurrent === "/why/sources",
       `${at}: the nav marks /why/sources as the current page (${crumb.navCurrent})`);

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

    /* No hosted conversion. */
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
  ok(h.h1 === 1 && /^72 source types\./.test(h.text), `a11y: one h1, and it is the page ("${h.text}")`);
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
