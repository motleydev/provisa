/* Browser checks for the new Home page at `/` — PRO-10's acceptance criteria,
 * as a script rather than a claim in a comment.
 *
 * Covers: the five verified widths in both themes, the five inbound anchor ids
 * and where they actually land under the sticky header, the components §4 of
 * `brief-home` names for each section, the two FigPanel slots standing in for
 * images, and the claim-regression strings the SME struck.
 *
 * Playwright is not a dependency of this repo, because site/ has no build
 * step. Install it where you are running from, serve site/, then point this
 * at it:
 *
 *   npm i playwright && npx playwright install chromium
 *   python3 -m http.server 8731 --directory site &
 *   node site/verify-home.mjs http://127.0.0.1:8731
 *
 * PLAYWRIGHT_LD_LIBRARY_PATH is the same escape hatch verify-ui.mjs documents:
 * a prefix holding chromium's shared libraries, passed to the browser process
 * alone rather than exported over every binary on the box.
 */
import { chromium } from "playwright";
import { BANNED, servedCopy } from "./claim-bans.mjs";

const LAUNCH = process.env.PLAYWRIGHT_LD_LIBRARY_PATH
  ? { env: { ...process.env, LD_LIBRARY_PATH: process.env.PLAYWRIGHT_LD_LIBRARY_PATH } }
  : {};

const ORIGIN = (process.argv[2] || "http://127.0.0.1:8731").replace(/\/$/, "");
const WIDTHS = [360, 768, 1280, 1920, 2560];
const THEMES = ["light", "dark"];
const results = [];
const ok = (n, c, d = "") => results.push({ n, pass: !!c, d });

/* The five ids that exist on the current home page and are linked from
 * outside it. A fragment cannot be redirected server-side, so each one has to
 * be a real id on the section that links out to wherever its content went. */
const ANCHORS = ["governance", "interfaces", "sources", "deploy", "download"];

/* The struck claims now live in `claim-bans.mjs`, shared with
 * `verify-claims.mjs`, which sweeps the same list across every page in
 * `site/` — this file only ever scanned `/`, which is how `/why/one-model`
 * kept "85+" and "six layers" (PRO-27). Add a ban there, not here.
 *
 * `Starburst` is deliberately not in that list even though PRO-10 names it:
 * the ban is on naming Starburst as the coordinator you already run, and the
 * page says "the Trino-protocol coordinator you already operate" instead. The
 * one occurrence left is the SiteFooter's link to /vs/starburst, which is the
 * comparison page itself. Checked separately, below. */

const browser = await chromium.launch(LAUNCH);

/* ---- the source, once ------------------------------------------------ */

const res = await fetch(ORIGIN + "/");
ok("/ serves 200", res.status === 200, String(res.status));
const src = await res.text();

/* Comments excluded, as in the sweep: a struck claim inside an HTML comment is
 * not copy anyone is served, and the comments on this page quote the struck
 * strings in order to name the rule. */
const copy = servedCopy(src);
for (const [s, why] of BANNED) {
  const n = (copy.match(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) || []).length;
  ok(`struck claim absent: ${s}`, n === 0, n ? `${n}× — ${why}` : "");
}

/* The only Starburst left may be the comparison link, not an engine claim. */
const starburst = [...src.matchAll(/.{40}starburst.{20}/gis)].map((m) => m[0].replace(/\s+/g, " "));
ok("Starburst appears only as the /vs/starburst link",
  starburst.every((c) => /vs\/starburst|vs Starburst/.test(c)), starburst.join(" | ") || "none");

ok("no product screenshot on the page",
  !/<img[^>]+src="[^"]*(screenshot|shot-0)/i.test(src));

/* ---- the composed page in a browser ---------------------------------- */

for (const theme of THEMES) {
  /* Above --bp-nav, which is 1300px: below it the header's theme toggle is in
   * the drawer rather than the actions cluster, and the click that switches
   * this pass to dark would time out on a hidden button. The widths sweep
   * below sets its own viewport per width. */
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(ORIGIN + "/");
  if (theme === "dark") {
    await page.click('[data-theme-set="dark"]');
    await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
  }

  const paper = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok(`${theme}: page paints the ${theme} ground`,
    theme === "dark" ? paper === "rgb(14, 16, 19)" : paper === "rgb(248, 246, 241)", paper);

  /* The components §4 names, per section. A section that lost its component
   * is the failure this catches — not a missing class somewhere on the page. */
  const counts = await page.evaluate(() => ({
    hero: document.querySelectorAll(".pv-h--hero").length,
    emph: document.querySelectorAll(".pv-emph").length,
    stats: document.querySelectorAll(".pv-stats").length,
    statItems: document.querySelectorAll(".pv-stats__item").length,
    layers: document.querySelectorAll(".pv-layer").length,
    layersUnnumbered: [...document.querySelectorAll(".pv-layer")]
      .filter((r) => !r.querySelector(".pv-layer__idx")).length,
    callouts: document.querySelectorAll(".pv-callout").length,
    choices: document.querySelectorAll(".pv-choice").length,
    codetabs: document.querySelectorAll(".pv-codetabs").length,
    tabs: document.querySelectorAll('.pv-codetabs__tab[role="tab"]').length,
    tables: document.querySelectorAll(".pv-table").length,
    chips: document.querySelectorAll(".pv-chip").length,
    ruled: document.querySelectorAll(".pv-ruled").length,
    code: document.querySelectorAll(".pv-code").length,
    figs: document.querySelectorAll(".pv-fig").length,
    links: document.querySelectorAll(".pv-link").length,
    buttons: document.querySelectorAll(".pv-btn").length,
  }));
  ok(`${theme}: hero Heading + Emph`, counts.hero === 1 && counts.emph >= 1, JSON.stringify(counts.hero));
  ok(`${theme}: two StatStrips, 4 then 3 figures`,
    counts.stats === 2 && counts.statItems === 7, `${counts.stats} strips, ${counts.statItems} items`);
  ok(`${theme}: LayerRow ×6, one of them unnumbered`,
    counts.layers === 6 && counts.layersUnnumbered === 1,
    `${counts.layers} rows, ${counts.layersUnnumbered} unnumbered`);
  ok(`${theme}: ChoiceCard ×3`, counts.choices === 3, String(counts.choices));
  /* Six tabs, not three: §5 is the spine position and shows the six surfaces
   * one English question comes back on (PRO-26, claim-audit §5.1b). */
  ok(`${theme}: CodeTabs with six governed surfaces`,
    counts.codetabs === 1 && counts.tabs === 6, `${counts.codetabs} / ${counts.tabs}`);
  ok(`${theme}: two ComparisonTables with Chips`,
    counts.tables === 2 && counts.chips >= 10, `${counts.tables} tables, ${counts.chips} chips`);
  ok(`${theme}: RuledCard ×7 (3 reach + 4 deploy)`, counts.ruled === 7, String(counts.ruled));
  ok(`${theme}: Callouts present`, counts.callouts >= 5, String(counts.callouts));
  ok(`${theme}: FigPanel ×4 and no screenshot`, counts.figs === 4, String(counts.figs));

  /* The anchors. Present is not enough — the header is sticky, so the check
   * is whether the section's own top clears it after the jump. */
  for (const id of ANCHORS) {
    const found = await page.$(`#${id}`);
    ok(`${theme}: #${id} exists`, !!found);
    if (!found) continue;
    await page.evaluate((i) => { window.location.hash = ""; window.scrollTo(0, 0); window.location.hash = i; }, id);
    await page.waitForTimeout(80);
    const geom = await page.evaluate((i) => {
      const r = document.getElementById(i).getBoundingClientRect();
      const h = document.querySelector(".pv-header").getBoundingClientRect();
      return { top: Math.round(r.top), headerBottom: Math.round(h.bottom) };
    }, id);
    ok(`${theme}: #${id} lands clear of the sticky header`,
      geom.top >= geom.headerBottom - 1, `top ${geom.top}, header bottom ${geom.headerBottom}`);
  }

  /* The conversions. Three, one per buyer path, and none of them hosted. */
  const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
  ok(`${theme}: nothing links to a hosted service`,
    !hrefs.some((h) => /cloud\.provisa\.dev/.test(h)));
  ok(`${theme}: the download conversion points at /install`, hrefs.includes("/install"));
  ok(`${theme}: the free-licence conversion points at /register`,
    hrefs.some((h) => /^\/register/.test(h)));
  ok(`${theme}: the demo form posts to /api/demo`,
    (await page.$$eval('form[action="/api/demo"]', (f) => f.length)) === 1);
  ok(`${theme}: #contact exists for the chrome's Support and Book a demo`,
    !!(await page.$("#contact")));

  /* Links out to pages that do not exist yet are omitted, not left at a 404
   * (brief §8). These four are Phase 2 and 3. */
  for (const dead of ["/why/one-model", "/why/sources.html#", "/why/no-lock-in", "/pricing"]) {
    const inMain = await page.$$eval(`main a[href*="${dead.replace('#', '')}"]`, (as) => as.length);
    ok(`${theme}: no body link to ${dead.replace('#', '')}`, inMain === 0, String(inMain));
  }

  ok(`${theme}: the utility bar carries no hosted-service notice`,
    !/hosted service|free trial/i.test(
      (await page.$eval(".pv-utility", (e) => e.textContent)).replace(/\s+/g, " ")));

  /* The widths. No horizontal overflow, and nothing escaping the viewport
   * except inside something that is meant to scroll sideways: ComparisonTable
   * has a 640px min-width and scrolls under it on purpose, because a
   * comparison read down one column is not a comparison. So the check is
   * whether an element is wider than the viewport *and* has no horizontally
   * scrollable ancestor — which is the real bug, a page a phone can pan. */
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(60);
    const m = await page.evaluate(() => {
      const d = document.documentElement;
      const limit = d.clientWidth + 1;
      const escapes = [];
      let widest = 0;
      for (const el of document.querySelectorAll("main *, header *, footer *")) {
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.right <= limit) continue;
        let a = el.parentElement, scrolls = false;
        while (a && !scrolls) {
          const ox = getComputedStyle(a).overflowX;
          scrolls = ox === "auto" || ox === "scroll";
          a = a.parentElement;
        }
        if (scrolls) continue;
        widest = Math.max(widest, Math.round(r.right));
        escapes.push(`${el.tagName}.${String(el.className).split(" ")[0]}@${Math.round(r.right)}`);
      }
      return { scroll: d.scrollWidth, client: d.clientWidth, widest, escapes: escapes.slice(0, 4) };
    });
    ok(`${theme} @${w}: the page itself does not scroll sideways`,
      m.scroll <= m.client + 1, `scrollWidth ${m.scroll} vs ${m.client}`);
    ok(`${theme} @${w}: nothing escapes the viewport outside a scroller`,
      m.escapes.length === 0, m.escapes.join(" "));
  }

  ok(`${theme}: no console or page errors`, errors.length === 0, errors.slice(0, 3).join(" | "));
  await ctx.close();
}

await browser.close();

/* ---- report ---------------------------------------------------------- */
let fails = 0;
for (const r of results) {
  if (!r.pass) fails++;
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.d ? `  — ${r.d}` : ""}`);
}
console.log(`\n${results.length - fails}/${results.length} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
