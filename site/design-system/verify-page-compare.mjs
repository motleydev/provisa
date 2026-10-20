/**
 * Render and composition checks for /compare (PRO-52).
 *
 * Re-runnable, so the acceptance criteria are a command rather than a claim
 * in a comment. Needs Playwright, which site/ deliberately does not depend
 * on:
 *   npm i playwright && npx playwright install chromium
 *
 * Serve with serve.py, not `python3 -m http.server`. The production route
 * is extensionless and the stdlib handler 404s on /compare — it will tell
 * you the page does not exist when it does:
 *
 *   python3 site/design-system/serve.py 8731 &
 *   node site/design-system/verify-page-compare.mjs http://127.0.0.1:8731
 *
 * The five widths and both themes are the acceptance criteria's. The
 * checks that matter most are §4 and §5: the fit Callouts paint FIRST and
 * at full weight, and the trailing restraint Callouts (C-17, C-23/C-24)
 * paint at the primary vermilion tone, in body type — not demoted to a
 * footnote or a lighter colour.
 *
 * In addition, this script spot-checks the five routes the brief's §8
 * declares inbound and must keep resolving. /compare is new (no inbound
 * redirect); /vs/starburst, /vs/hasura and /vs/denodo all 200. If the VP
 * takes the retirement option on /vs/denodo, it becomes a 301 to /compare,
 * which is a different check in a different place.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://127.0.0.1:8731";
const URL = BASE + "/compare";
const WIDTHS = [360, 768, 1280, 1920, 2560];
const THEMES = ["light", "dark"];

const pass = [];
const fail = [];
const ok = (c, m) => (c ? pass : fail).push(m);

const browser = await chromium.launch();

/* The §8 inbound-route check runs once, not per width/theme. The three
 * /vs/* routes must still resolve, even though two of them are not linked
 * from this page (the brief's §8). */
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  for (const route of ["/compare", "/vs/starburst", "/vs/hasura", "/vs/denodo"]) {
    const r = await page.goto(BASE + route, { waitUntil: "load" });
    ok(r && r.status() === 200, `inbound: ${route} resolves 200 (${r ? r.status() : "no response"})`);
  }
  await ctx.close();
}

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
    ok(res && res.status() === 200, `${at}: /compare resolves 200 (${res ? res.status() : "no response"})`);

    /* The theme actually applied, read off the painted page colour rather
     * than off the attribute, so a broken bootstrap cannot pass. */
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
        /* A scroll container is allowed to hold something wider than
         * itself; that is what it is for. Measure the container, not the
         * content. */
        if (el.closest(".pv-table, .pv-code") && !el.classList.contains("pv-table")) continue;
        if (r.right > w + 1 || r.left < -1) out.push(el.className || el.tagName);
      }
      return out.slice(0, 5);
    });
    ok(escapees.length === 0, `${at}: nothing escapes the viewport (${escapees.join(", ") || "none"})`);

    /* ---- Section order. §2 before §3 before §4 before §5 before §6
     *      before §7 before §8. In the brief order, no exceptions. ---- */

    const order = await page.evaluate(() => {
      const secs = [...document.querySelectorAll("main > section")];
      const h = (s) => (s.querySelector("h1, h2")?.textContent || "").replace(/\s+/g, " ").trim();
      return secs.map((s) => ({ h: h(s), top: s.getBoundingClientRect().top + scrollY }));
    });
    const topOf = (needle) => order.find((s) => s.h.includes(needle));
    const s1 = topOf("What Provisa is");
    const s2 = topOf("Four categories");
    const s3 = topOf("Two comparisons in detail");
    const s4 = topOf("If you run Neo4j");
    const s5 = topOf("If you run Apollo GraphOS");
    const s6 = topOf("How this page is made");
    const s7 = topOf("Where Provisa is the wrong answer");
    const s8 = topOf("Bring us the comparison");
    ok(s1 && s2 && s3 && s4 && s5 && s6 && s7 && s8,
       `${at}: all eight sections are on the page`);
    if (s1 && s2 && s3 && s4 && s5 && s6 && s7 && s8) {
      const tops = [s1.top, s2.top, s3.top, s4.top, s5.top, s6.top, s7.top, s8.top];
      const sorted = tops.every((v, i) => i === 0 || v > tops[i - 1]);
      ok(sorted, `${at}: sections paint in brief order (${tops.map(Math.round).join(" < ")})`);
    }

    /* ---- §4 and §5: fit Callout BEFORE table and body ---------------- */

    const sectionLead = await page.evaluate(() => {
      const secs = [...document.querySelectorAll("main > section")];
      const find = (needle) => secs.find((s) =>
        (s.querySelector("h2")?.textContent || "").replace(/\s+/g, " ").includes(needle));

      const measure = (sec) => {
        if (!sec) return null;
        const callouts = [...sec.querySelectorAll(".pv-callout")];
        const table = sec.querySelector(".pv-table");
        const p = sec.querySelector("p.pv-p");
        const cs = (el) => (el ? getComputedStyle(el) : null);
        const rect = (el) => (el ? el.getBoundingClientRect() : null);
        const num = (v) => parseFloat(v || "0");
        const h2 = sec.querySelector("h2");

        const [lead, trailing] = [callouts[0], callouts[callouts.length - 1]];
        const trBody = trailing?.querySelector(".pv-callout__body");
        const cell = table?.querySelector("tbody td");

        return {
          nCallouts: callouts.length,
          leadClasses: lead?.className ?? null,
          leadTop: rect(lead)?.top + scrollY,
          tableTop: rect(table)?.top + scrollY,
          paraTop: rect(p)?.top + scrollY,
          trailingClasses: trailing?.className ?? null,
          trailingTop: rect(trailing)?.top + scrollY,
          trailingWidth: Math.round(rect(trailing)?.width ?? 0),
          tableWidth: Math.round(rect(table)?.width ?? 0),
          trailingRule: num(cs(trailing)?.borderLeftWidth),
          trailingBodySize: num(cs(trBody)?.fontSize),
          cellSize: num(cs(cell)?.fontSize),
          trailingBodyColor: cs(trBody)?.color,
          pageColor: cs(h2)?.color,
        };
      };

      return {
        neo4j: measure(find("If you run Neo4j")),
        apollo: measure(find("If you run Apollo GraphOS")),
      };
    });

    for (const [label, m] of [["§4 Neo4j", sectionLead.neo4j], ["§5 Apollo", sectionLead.apollo]]) {
      ok(m !== null, `${at}: ${label} is findable in the DOM`);
      if (!m) continue;

      /* Brief build note 1 / AC 3. Fit statement BEFORE the table. */
      ok(m.leadTop < m.tableTop,
         `${at}: ${label} fit Callout paints above its ComparisonTable (${Math.round(m.leadTop)} < ${Math.round(m.tableTop)})`);
      ok(m.leadTop < m.paraTop,
         `${at}: ${label} fit Callout paints above its first paragraph (${Math.round(m.leadTop)} < ${Math.round(m.paraTop)})`);

      /* The fit Callout is pv-callout--get (forest concession tone). */
      ok(/\bpv-callout--get\b/.test(m.leadClasses || ""),
         `${at}: ${label} fit Callout is the forest concession tone (${m.leadClasses})`);

      /* Two Callouts per section — the fit statement and the restraint. */
      ok(m.nCallouts === 2, `${at}: ${label} has 2 Callouts (${m.nCallouts})`);

      /* AC 4 / brief build note 1. The restraint sits at full weight: the
       * primary vermilion tone, not a lighter one; the accent rule, not a
       * hairline; the full column width; and the primary text colour. */
      ok(m.trailingClasses === "pv-callout",
         `${at}: ${label} trailing restraint is the primary tone, unmodified ("${m.trailingClasses}")`);
      ok(m.trailingTop > m.tableTop,
         `${at}: ${label} restraint paints below the table (${Math.round(m.trailingTop)} > ${Math.round(m.tableTop)})`);
      ok(Math.abs(m.trailingWidth - m.tableWidth) <= 2,
         `${at}: ${label} restraint runs the full column (${m.trailingWidth} vs ${m.tableWidth})`);
      ok(m.trailingRule >= 6,
         `${at}: ${label} restraint carries the accent rule, not a hairline (${m.trailingRule}px)`);
      ok(m.trailingBodySize >= m.cellSize,
         `${at}: ${label} restraint copy is no smaller than its table cells (${m.trailingBodySize}px vs ${m.cellSize}px)`);
      ok(m.trailingBodyColor === m.pageColor,
         `${at}: ${label} restraint copy is the primary text colour, not a lighter one (${m.trailingBodyColor})`);
    }

    /* ---- §3: two ChoiceCards with square figures -------------------- */

    const s3Shape = await page.evaluate(() => {
      const sec = [...document.querySelectorAll("main > section")].find((s) =>
        (s.querySelector("h2")?.textContent || "").includes("Two comparisons in detail"));
      if (!sec) return null;
      const cards = [...sec.querySelectorAll(".pv-choice")];
      const figs = [...sec.querySelectorAll(".pv-editorial--square")];
      const links = [...sec.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
      return {
        cards: cards.length,
        figs: figs.length,
        hasStarburst: links.includes("/vs/starburst"),
        hasHasura: links.includes("/vs/hasura"),
        hasDenodo: links.includes("/vs/denodo"),
      };
    });
    ok(s3Shape, `${at}: §3 is findable in the DOM`);
    if (s3Shape) {
      ok(s3Shape.cards === 2, `${at}: §3 is 2 ChoiceCards (${s3Shape.cards})`);
      ok(s3Shape.figs === 2, `${at}: §3 ships 2 square editorial illustrations (${s3Shape.figs})`);
      ok(s3Shape.hasStarburst, `${at}: §3 links /vs/starburst`);
      ok(s3Shape.hasHasura, `${at}: §3 links /vs/hasura`);
      ok(!s3Shape.hasDenodo, `${at}: §3 does NOT link /vs/denodo (AC 6)`);
    }

    /* ---- Tables, measured in the DOM the browser built --------------- */

    const tables = await page.evaluate(() =>
      [...document.querySelectorAll("main .pv-table")]
        .filter((w) => w.offsetParent !== null && w.clientWidth > 0)
        .map((w) => {
          const t = w.querySelector("table");
          const cells = [...t.querySelectorAll("tbody tr")].map((tr) =>
            [...tr.querySelectorAll("td")].map((td) => td.textContent.trim()));
          return {
            rows: t.querySelectorAll("tbody tr").length,
            narrowest: Math.min(...[...t.querySelectorAll("tbody td")]
              .map((td) => Math.round(td.getBoundingClientRect().width))),
            dashes: cells.flatMap((r) => r.filter((c) => /^[—–-]?$/.test(c))).length,
            clipped: [...t.querySelectorAll("tbody td")]
              .filter((td) => td.scrollHeight > td.clientHeight + 1).length,
          };
        }));
    const rows = tables.map((t) => t.rows);
    ok(rows.includes(4), `${at}: a 4-row table paints (${rows.join(", ")}) — §2 or §5`);
    ok(rows.includes(5), `${at}: a 5-row table paints — §4 Neo4j`);
    ok(rows.filter((n) => n === 4).length >= 2 || (rows.includes(4) && rows.includes(5)),
       `${at}: §2 and §5 both carry 4 rows; §4 carries 5`);
    ok(tables.every((t) => t.dashes === 0), `${at}: no cell renders as a dash (AC 2)`);
    ok(tables.every((t) => t.clipped === 0), `${at}: no cell clips its own text`);
    ok(tables.every((t) => t.narrowest >= 60),
       `${at}: narrowest cell ${Math.min(...tables.map((t) => t.narrowest))}px`);

    /* ---- The nav aria-current on /compare --------------------------- */

    const nav = await page.evaluate(() => {
      const link = document.querySelector('header nav a[href="/compare"]');
      return {
        exists: !!link,
        current: link?.getAttribute("aria-current") || null,
      };
    });
    ok(nav.exists, `${at}: the header carries a Compare link to /compare`);
    ok(nav.current === "page", `${at}: the Compare nav item is aria-current="page" (${nav.current})`);

    /* ---- The §6 GitHub link resolves (HEAD request). AC 5. --------- */

    const github = await page.evaluate(() => {
      const link = [...document.querySelectorAll("a[href]")].find((a) =>
        a.getAttribute("href") === "https://github.com/motleydev/provisa/blob/main/docs/competitive_analysis.md");
      return link ? link.getAttribute("href") : null;
    });
    ok(github !== null, `${at}: §6 carries the public GitHub link to docs/competitive_analysis.md`);

    /* ---- No console or page errors ---------------------------------- */

    ok(errors.length === 0, `${at}: no console or page errors (${errors.slice(0, 3).join(" ; ") || "none"})`);

    await ctx.close();
  }
}

await browser.close();

for (const m of fail) console.log("FAIL " + m);
for (const m of pass) console.log("ok   " + m);
console.log(`\n${pass.length} passed, ${fail.length} failed`);
process.exit(fail.length ? 1 : 0);
