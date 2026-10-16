/**
 * Render and composition checks for /vs/starburst (PRO-16).
 *
 * Re-runnable, so the acceptance criteria are a command rather than a claim in
 * a comment. Needs Playwright, which site/ deliberately does not depend on:
 *   npm i playwright && npx playwright install chromium
 *
 *   python3 -m http.server 8731 --directory site &
 *   node site/design-system/verify-page-vs-starburst.mjs http://127.0.0.1:8731
 *
 * The five widths and both themes are the acceptance criteria's. The ordering
 * check is the one that matters most: §2's four conceded cards must paint
 * above the first comparison table at every width, because a comparison page
 * that claims eight of eight is read as eight of zero.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://127.0.0.1:8731";
const URL = BASE + "/vs/starburst.html";
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

    await page.goto(URL, { waitUntil: "load" });

    /* The theme actually applied, read off the painted page colour rather than
     * off the attribute, so a broken bootstrap cannot pass. */
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    ok(theme === "dark" ? bg === "rgb(14, 16, 19)" : bg === "rgb(248, 246, 241)",
       `${at}: body paints the ${theme} page colour (${bg})`);

    /* No horizontal overflow, and nothing escaping the viewport. */
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

    /* AC 2. The four conceded cards paint above the first comparison table. */
    const geom = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".pv-ruled")].map((el) => el.getBoundingClientRect().bottom + scrollY);
      const table = document.querySelector(".pv-table").getBoundingClientRect().top + scrollY;
      return { cards, table };
    });
    ok(geom.cards.length === 4, `${at}: four conceded cards (${geom.cards.length})`);
    ok(Math.max(...geom.cards) < geom.table,
       `${at}: every conceded card ends above the first table (${Math.round(Math.max(...geom.cards))} < ${Math.round(geom.table)})`);

    /* AC 5. Nothing above the first conceded card but the hero. */
    const aboveFold = await page.evaluate(() => {
      const firstCard = document.querySelector(".pv-ruled").getBoundingClientRect().top + scrollY;
      return [...document.querySelectorAll(".pv-fig, img, svg:not(.pv-wordmark svg)")]
        .filter((el) => el.getBoundingClientRect().top + scrollY < firstCard)
        .map((el) => el.tagName + "." + el.className).slice(0, 4);
    });
    ok(aboveFold.length === 0, `${at}: no figure above the first conceded card (${aboveFold.join(", ") || "none"})`);

    /* AC 3. The tables, measured in the DOM the browser built. */
    const tables = await page.evaluate(() =>
      [...document.querySelectorAll(".pv-table")].map((w) => {
        const t = w.querySelector("table");
        const cells = [...t.querySelectorAll("tbody tr")].map((tr) =>
          [...tr.querySelectorAll("td")].map((td) => td.textContent.trim()));
        return {
          rows: t.querySelectorAll("tbody tr").length,
          scrolls: t.scrollWidth > w.clientWidth + 1,
          /* The narrowest rendered competitor cell, so a column squeezed below
           * readable width shows up as a number rather than as an opinion. */
          narrowest: Math.min(...[...t.querySelectorAll("tbody td:not([data-highlight])")]
            .map((td) => Math.round(td.getBoundingClientRect().width))),
          dashes: cells.flatMap((r) => r.filter((c) => /^[—–-]?$/.test(c))).length,
          clipped: [...t.querySelectorAll("tbody td")]
            .filter((td) => td.scrollHeight > td.clientHeight + 1).length,
        };
      }));
    ok(tables.length === 2, `${at}: two comparison tables (${tables.length})`);
    ok(tables[0].rows === 8, `${at}: §4 is 8 rows (${tables[0].rows})`);
    ok(tables[1].rows === 6, `${at}: §6 is 6 rows (${tables[1].rows})`);
    ok(tables.every((t) => t.dashes === 0), `${at}: no cell renders as a dash`);
    ok(tables.every((t) => t.clipped === 0), `${at}: no cell clips its own text`);
    ok(tables.every((t) => t.narrowest >= 90),
       `${at}: narrowest competitor cell ${Math.min(...tables.map((t) => t.narrowest))}px`);

    /* AC 6. The two held-back links, in <main>, which is where the brief holds
     * them back: /compare in §10 and /why/no-lock-in in §4. The footer is
     * shared chrome and keeps its entry; see the note on it in the page. */
    const held = await page.evaluate(() =>
      [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href"))
        .filter((h) => h.startsWith("/compare") || h.startsWith("/why/no-lock-in")));
    ok(held.length === 0, `${at}: no held-back link (${held.join(", ") || "none"})`);

    /* AC 4. The dateline is on the page and is not a placeholder. */
    const dateline = await page.evaluate(() => {
      const el = [...document.querySelectorAll(".pv-callout")]
        .find((c) => c.querySelector(".pv-callout__label")?.textContent.trim() === "DATELINE");
      return el ? el.textContent.replace(/\s+/g, " ").trim() : null;
    });
    ok(dateline && dateline.includes("482-e.4 LTS") && dateline.includes("October 2026")
       && dateline.includes("483-e is the current STS"),
       `${at}: the dateline ships with both products and the version pair`);

    /* The nav and the drawer swap at --bp-nav, not at this page's breakpoints,
     * so read the token off the element rather than writing the number out
     * here: moving --bp-nav must not silently fail this page. */
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

/* One keyboard pass, at one width, because the components are the kit's and
 * the kit's own pass covers them. What is new here is the page composition. */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement.className);
  ok(first.includes("pv-skip"), `keyboard: the first Tab reaches the skip link (${first})`);
  const named = await page.evaluate(() =>
    [...document.querySelectorAll("input, button, select, textarea")]
      .filter((el) => !el.labels?.length && !el.getAttribute("aria-label")
                      && !el.textContent.trim() && !el.getAttribute("aria-labelledby")).length);
  ok(named === 0, `keyboard: every form control has an accessible name (${named} without)`);
  const captions = await page.evaluate(() =>
    [...document.querySelectorAll("table")].filter((t) => !t.querySelector("caption")).length);
  ok(captions === 0, `a11y: both tables carry a caption (${captions} without)`);
  const h1 = await page.evaluate(() => document.querySelectorAll("h1").length);
  ok(h1 === 1, `a11y: exactly one h1 (${h1})`);
  await ctx.close();
}

await browser.close();

console.log(`${pass.length} passed`);
for (const f of fail) console.log("  FAIL  " + f);
console.log(fail.length ? `\n${fail.length} failed` : "\nall checks passed");
process.exit(fail.length ? 1 : 0);
