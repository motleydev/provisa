/**
 * Render and composition checks for /vs/hasura (PRO-39).
 *
 * Re-runnable, so the acceptance criteria are a command rather than a claim in
 * a comment. Needs Playwright, which site/ deliberately does not depend on:
 *   npm i playwright && npx playwright install chromium
 *
 * Serve with serve.py, not `python3 -m http.server`. The production route is
 * extensionless and the stdlib handler 404s on /vs/hasura — it will tell you
 * the page does not exist when it does:
 *
 *   python3 site/design-system/serve.py 8731 &
 *   node site/design-system/verify-page-vs-hasura.mjs http://127.0.0.1:8731
 *
 * The five widths and both themes are the acceptance criteria's. The checks
 * that matter most are the §5 ones. §5 is the page: it has to paint after §4
 * and before §7, and its leading Callout has to carry the same visual weight
 * as §3's table — which in a browser means four measurable things, since
 * "weight" in the build note is about what a reader's eye reaches first:
 *
 *   - it paints above §5's own tables and above the Accordion;
 *   - it carries the accent rule, not a hairline;
 *   - it runs the full column, as wide as §3's table;
 *   - its copy is the page's primary text colour at no smaller a size than
 *     §3's table cells. "A lighter type colour" is named in build note 1 as
 *     one of the three ways this disclosure gets demoted, so it is measured
 *     off the painted page rather than trusted to a class.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://127.0.0.1:8731";
const URL = BASE + "/vs/hasura";
const WIDTHS = [360, 768, 1280, 1920, 2560];
const THEMES = ["light", "dark"];

const pass = [];
const fail = [];
const ok = (c, m) => (c ? pass : fail).push(m);

const browser = await chromium.launch();

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

    /* The route, not the file. /vs/hasura is indexed and must not 404 at any
     * point — this is a rebuild of a live file and the route does not move. */
    ok(res && res.status() === 200, `${at}: /vs/hasura resolves 200 (${res ? res.status() : "no response"})`);

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
        /* A scroll container is allowed to hold something wider than itself;
         * that is what it is for. Measure the container, not its content. */
        if (el.closest(".pv-table, .pv-code") && !el.classList.contains("pv-table")) continue;
        if (r.right > w + 1 || r.left < -1) out.push(el.className || el.tagName);
      }
      return out.slice(0, 5);
    });
    ok(escapees.length === 0, `${at}: nothing escapes the viewport (${escapees.join(", ") || "none"})`);

    /* ---- §5's position. The whole argument of the page. ---------------- */

    const order = await page.evaluate(() => {
      const secs = [...document.querySelectorAll("main > section")];
      const h = (s) => (s.querySelector("h1, h2")?.textContent || "").replace(/\s+/g, " ").trim();
      return secs.map((s) => ({ h: h(s), top: s.getBoundingClientRect().top + scrollY }));
    });
    const topOf = (needle) => order.find((s) => s.h.includes(needle));
    const s3 = topOf("What converts");
    const s4 = topOf("What you get that v2 did not have");
    const s5 = topOf("What does not convert");
    const s7 = topOf("When Provisa is not the answer");
    ok(s3 && s4 && s5 && s7, `${at}: §3, §4, §5 and §7 are all on the page`);
    if (s3 && s4 && s5 && s7) {
      ok(s4.top < s5.top && s5.top < s7.top,
         `${at}: §5 paints after §4 and before §7 (${Math.round(s4.top)} < ${Math.round(s5.top)} < ${Math.round(s7.top)})`);
      const between = order.filter((s) => s.top > s4.top && s.top < s5.top);
      ok(between.length === 0,
         `${at}: nothing paints between §4 and §5 (${between.map((b) => b.h).join(", ") || "none"})`);
    }

    /* ---- §5's weight, against §3's table ------------------------------ */

    const weight = await page.evaluate(() => {
      const secs = [...document.querySelectorAll("main > section")];
      const find = (needle) => secs.find((s) =>
        (s.querySelector("h2")?.textContent || "").replace(/\s+/g, " ").includes(needle));
      const sec3 = find("What converts");
      const sec5 = find("What does not convert");
      if (!sec3 || !sec5) return null;

      const callout = sec5.querySelector(".pv-callout");
      const body = callout?.querySelector(".pv-callout__body");
      const table3 = sec3.querySelector(".pv-table");
      const table5 = sec5.querySelector(".pv-table");
      const acc = sec5.querySelector(".pv-acc");
      const cell3 = sec3.querySelector(".pv-table tbody td");

      const cs = (el) => (el ? getComputedStyle(el) : null);
      const rect = (el) => (el ? el.getBoundingClientRect() : null);
      const num = (v) => parseFloat(v || "0");

      return {
        classes: callout ? callout.className : null,
        calloutTop: rect(callout)?.top + scrollY,
        calloutWidth: Math.round(rect(callout)?.width ?? 0),
        table3Width: Math.round(rect(table3)?.width ?? 0),
        table5Top: rect(table5)?.top + scrollY,
        accTop: acc ? rect(acc).top + scrollY : Infinity,
        rule: num(cs(callout)?.borderLeftWidth),
        bodySize: num(cs(body)?.fontSize),
        cellSize: num(cs(cell3)?.fontSize),
        bodyColor: cs(body)?.color,
        pageColor: cs(sec3.querySelector("h2"))?.color,
        /* The vermilion edge, which is the kit's primary Callout tone. A
         * forest or slate edge is a different, lighter statement. */
        ruleColor: cs(callout)?.borderLeftColor,
        runToken: getComputedStyle(document.documentElement).getPropertyValue("--group-run").trim(),
      };
    });

    ok(weight !== null, `${at}: §3 and §5 are both findable in the DOM`);
    if (weight) {
      ok(weight.classes === "pv-callout",
         `${at}: §5's Callout is the primary tone, unmodified ("${weight.classes}")`);
      ok(weight.calloutTop < weight.table5Top,
         `${at}: the Callout paints above §5's first table (${Math.round(weight.calloutTop)} < ${Math.round(weight.table5Top)})`);
      ok(weight.calloutTop < weight.accTop,
         `${at}: the Callout paints above the Accordion (${Math.round(weight.calloutTop)} < ${Math.round(weight.accTop)})`);
      ok(Math.abs(weight.calloutWidth - weight.table3Width) <= 2,
         `${at}: the Callout runs the full column, as wide as §3's table (${weight.calloutWidth} vs ${weight.table3Width})`);
      ok(weight.rule >= 6,
         `${at}: the Callout carries the accent rule, not a hairline (${weight.rule}px)`);
      ok(weight.bodySize >= weight.cellSize,
         `${at}: the Callout's copy is no smaller than §3's table cells (${weight.bodySize}px vs ${weight.cellSize}px)`);
      ok(weight.bodyColor === weight.pageColor,
         `${at}: the Callout's copy is the primary text colour, not a lighter one (${weight.bodyColor})`);
    }

    /* ---- the tables, measured in the DOM the browser built ------------ */

    const tables = await page.evaluate(() =>
      [...document.querySelectorAll("main .pv-table")]
        /* §2's flag table starts inside a hidden CodeTabs panel, where every
         * rect is zero. Measuring it here would report a 0px cell and say
         * nothing about how it paints; it is measured below, after its tab is
         * selected. */
        .filter((w) => w.offsetParent !== null && w.clientWidth > 0)
        .map((w) => {
        const t = w.querySelector("table");
        const cells = [...t.querySelectorAll("tbody tr")].map((tr) =>
          [...tr.querySelectorAll("td")].map((td) => td.textContent.trim()));
        return {
          rows: t.querySelectorAll("tbody tr").length,
          /* The narrowest rendered cell, so a column squeezed below readable
           * width shows up as a number rather than as an opinion. */
          narrowest: Math.min(...[...t.querySelectorAll("tbody td")]
            .map((td) => Math.round(td.getBoundingClientRect().width))),
          dashes: cells.flatMap((r) => r.filter((c) => /^[—–-]?$/.test(c))).length,
          clipped: [...t.querySelectorAll("tbody td")]
            .filter((td) => td.scrollHeight > td.clientHeight + 1).length,
        };
      }));

    /* §2's flag table is inside a CodeTabs panel that starts hidden, so it is
     * only measurable once its tab is selected; counted separately below. */
    const visibleRows = tables.map((t) => t.rows);
    ok(visibleRows.includes(18), `${at}: §3's coverage table is 18 rows (${visibleRows.join(", ")})`);
    ok(visibleRows.includes(4), `${at}: §5's outcomes table is 4 rows`);
    ok(visibleRows.includes(5), `${at}: §5's reported-and-not-converted table is 5 rows`);
    ok(tables.every((t) => t.dashes === 0), `${at}: no cell renders as a dash`);
    ok(tables.every((t) => t.clipped === 0), `${at}: no cell clips its own text`);
    ok(tables.every((t) => t.narrowest >= 90),
       `${at}: narrowest cell ${Math.min(...tables.map((t) => t.narrowest))}px`);

    /* ---- the Accordion. Seven panels, one open at a time ------------- */

    const acc = await page.evaluate(() => {
      const items = [...document.querySelectorAll(".pv-acc__item")];
      return {
        count: items.length,
        open: items.filter((i) => i.querySelector('[aria-expanded="true"]')).length,
        wired: items.every((i) => {
          const b = i.querySelector(".pv-acc__btn");
          const p = document.getElementById(b?.getAttribute("aria-controls"));
          return !!b && !!p;
        }),
      };
    });
    ok(acc.count === 7, `${at}: §5's Accordion has 7 panels (${acc.count})`);
    ok(acc.open === 1, `${at}: exactly one panel starts open (${acc.open})`);
    ok(acc.wired, `${at}: every panel button controls a panel that exists`);

    /* ---- the CodeTabs. Two tabs, and tab 2 carries the flag table ---- */

    const beforeClick = await page.evaluate(() => ({
      tabs: document.querySelectorAll(".pv-codetabs__tab").length,
      shown: [...document.querySelectorAll(".pv-codetabs__panel")].filter((p) => !p.hidden).length,
    }));
    ok(beforeClick.tabs === 2, `${at}: §2 has 2 CodeTabs (${beforeClick.tabs})`);
    ok(beforeClick.shown === 1, `${at}: exactly one CodeTabs panel shows (${beforeClick.shown})`);

    await page.click("#t-convert");
    const afterClick = await page.evaluate(() => {
      const p = document.getElementById("p-convert");
      const t = p?.querySelector("table");
      return {
        shown: !p?.hidden,
        flagRows: t ? t.querySelectorAll("tbody tr").length : 0,
        clipped: t ? [...t.querySelectorAll("tbody td")].filter((td) => td.scrollHeight > td.clientHeight + 1).length : -1,
      };
    });
    ok(afterClick.shown, `${at}: the Convert tab opens its panel`);
    ok(afterClick.flagRows === 5, `${at}: §2's flag table is 5 rows (${afterClick.flagRows})`);
    ok(afterClick.clipped === 0, `${at}: no flag-table cell clips its own text`);

    /* ---- §1's jump into the gap list has to land on something -------- */

    const jump = await page.evaluate(() => {
      const link = document.querySelector('main a[href="#gaps"]');
      const target = document.getElementById("gaps");
      return { link: !!link, target: !!target };
    });
    ok(jump.link && jump.target, `${at}: §1's #gaps jump resolves to §5 (link ${jump.link}, target ${jump.target})`);

    /* ---- the links the build notes hold back ------------------------- */

    const held = await page.evaluate(() =>
      [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href"))
        .filter((h) => h.startsWith("/compare") || h.startsWith("/install")));
    ok(held.length === 0, `${at}: no held-back link in main (${held.join(", ") || "none"})`);

    /* The nav and the drawer swap at --bp-nav, not at this page's
     * breakpoints, so read the token off the element rather than writing the
     * number out here: moving --bp-nav must not silently fail this page. */
    const nav = await page.evaluate(() => ({
      nav: getComputedStyle(document.querySelector(".pv-header__nav")).display !== "none",
      menu: getComputedStyle(document.querySelector(".pv-header__menu")).display !== "none",
      bp: parseInt(getComputedStyle(document.documentElement).getPropertyValue("--bp-nav"), 10),
    }));
    ok(nav.nav !== nav.menu, `${at}: exactly one of the nav and the menu button shows`);
    ok(width >= nav.bp ? nav.nav : nav.menu, `${at}: the right one shows for --bp-nav ${nav.bp}px`);

    ok(errors.length === 0, `${at}: no console errors (${errors.slice(0, 2).join(" | ") || "none"})`);

    await ctx.close();
  }
}

/* One keyboard and a11y pass, at one width, because the components are the
 * kit's and the kit's own pass covers them. What is new here is the page
 * composition and the seven-panel Accordion. */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "load" });

  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement.className);
  ok(first.includes("pv-skip"), `keyboard: the first Tab reaches the skip link (${first})`);

  /* Opening panel 7 closes panel 1: the kit keeps one open at a time, and the
   * disclosure in the Callout above is not affected by any of it. */
  await page.click(".pv-acc__item:nth-child(7) .pv-acc__btn");
  const afterOpen = await page.evaluate(() => {
    const items = [...document.querySelectorAll(".pv-acc__item")];
    return {
      open: items.map((i) => i.querySelector(".pv-acc__btn").getAttribute("aria-expanded")),
      seventhVisible: !document.getElementById("a-gap7").hidden,
      calloutVisible: getComputedStyle(document.querySelector("#gaps .pv-callout")).display !== "none",
    };
  });
  ok(afterOpen.open.filter((o) => o === "true").length === 1,
     `keyboard: one panel open after opening panel 7 (${afterOpen.open.join(",")})`);
  ok(afterOpen.seventhVisible, "keyboard: panel 7 is visible when opened");
  ok(afterOpen.calloutVisible, "keyboard: §5's Callout is unaffected by the Accordion");

  const named = await page.evaluate(() =>
    [...document.querySelectorAll("input, button, select, textarea")]
      .filter((el) => !el.labels?.length && !el.getAttribute("aria-label")
                      && !el.textContent.trim() && !el.getAttribute("aria-labelledby")).length);
  ok(named === 0, `a11y: every form control has an accessible name (${named} without)`);

  const captions = await page.evaluate(() =>
    [...document.querySelectorAll("main table")].filter((t) => !t.querySelector("caption")).length);
  ok(captions === 0, `a11y: every table carries a caption (${captions} without)`);

  const h1 = await page.evaluate(() => document.querySelectorAll("h1").length);
  ok(h1 === 1, `a11y: exactly one h1 (${h1})`);

  const current = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-current="page"]')]
      .map((el) => el.getAttribute("href") || el.textContent.trim()));
  ok(current.every((c) => c === "/vs/hasura" || c === "Coming from Hasura"),
     `a11y: aria-current marks this route only (${current.join(", ")})`);

  await ctx.close();
}

await browser.close();

console.log(`${pass.length} passed`);
for (const f of fail) console.log("  FAIL  " + f);
console.log(fail.length ? `\n${fail.length} failed` : "\nall checks passed");
process.exit(fail.length ? 1 : 0);
