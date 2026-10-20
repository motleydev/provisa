/**
 * Render checks for /platform (PRO-15).
 *
 * Re-runnable, so the acceptance criteria are a command rather than a claim in
 * a comment. Needs Playwright, which site/ deliberately does not depend on:
 *   npm i playwright && npx playwright install chromium
 *
 *   python3 -m http.server 8731 --directory site &
 *   node site/design-system/verify-page-platform.mjs http://127.0.0.1:8731
 *
 * The composition and string checks are the no-dependency half, in
 * check-page-platform.py. This half is the part that needs a layout engine:
 * the five widths in both themes, §6 reading as one comparison at every one of
 * them, the tabs and the accordion by keyboard, and the figure placeholders.
 *
 * PLAYWRIGHT_LD_LIBRARY_PATH is the escape hatch verify-ui.mjs documents, for
 * distros with no FHS lib dir: set it to a prefix holding chromium's shared
 * libraries and it is passed to the browser process alone.
 */
import { chromium, devices } from "playwright";

const LAUNCH = process.env.PLAYWRIGHT_LD_LIBRARY_PATH
  ? { env: { ...process.env, LD_LIBRARY_PATH: process.env.PLAYWRIGHT_LD_LIBRARY_PATH } }
  : {};

const ORIGIN = (process.argv[2] || "http://127.0.0.1:8731").replace(/\/$/, "");
const URL = `${ORIGIN}/platform/`;
const WIDTHS = [360, 768, 1280, 1920, 2560];

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? `  — ${detail}` : ""}`); }
};
const head = (s) => console.log(`\n${s}`);

const browser = await chromium.launch(LAUNCH);
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));

const res = await page.goto(URL, { waitUntil: "load" });
ok("the route serves the page", res.status() === 200, `status ${res.status()}`);

/* ---- 1. the page is built from the kit and nothing else ------------- */
head("the kit");
const drift = await page.evaluate(() => {
  const own = [...document.styleSheets].filter((s) => !s.href).length;
  const inline = [...document.querySelectorAll("[style]")]
    .map((el) => `${el.tagName}.${el.className}: ${el.getAttribute("style")}`);
  const classes = new Set();
  for (const el of document.querySelectorAll("*")) for (const c of el.classList) classes.add(c);
  return { own, inline, classes: [...classes].filter((c) => !/^(pv-|picker)/.test(c)) };
});
ok("no page-local stylesheet", drift.own === 0, `${drift.own} <style> blocks`);
ok("no inline style on any element", drift.inline.length === 0,
  drift.inline.slice(0, 3).join(" | "));
ok("every class on the page is a kit class", drift.classes.length === 0, drift.classes.join(", "));

/* ---- 2. §3's three tabs, and the third one on the page surface ------ */
head("§3 the tabs");
const tabs = await page.$$eval(".pv-codetabs__tab", (bs) => bs.map((b) => ({
  lang: b.querySelector(".pv-codetabs__lang").textContent.trim(),
  wire: b.querySelector(".pv-codetabs__wire").textContent.trim(),
  on: b.getAttribute("aria-selected") === "true",
})));
ok("three tabs — Ask, Compile only, What comes back",
  JSON.stringify(tabs.map((t) => t.lang)) === JSON.stringify(["Ask", "Compile only", "What comes back"]),
  tabs.map((t) => t.lang).join(" · "));
ok("tab 2 names the route it posts to", tabs[1].wire === "POST /data/compile", tabs[1].wire);
ok("tab 3 names the object it describes", tabs[2].wire === "enforcement", tabs[2].wire);
ok("only the first panel is visible at load",
  await page.isVisible("#p-ask") && !(await page.isVisible("#p-back")));

await page.click("#t-back");
ok("tab 3 opens on click", await page.isVisible("#p-back"));
const panel3 = await page.evaluate(() => {
  const el = document.querySelector("#p-back");
  const t = el.querySelector(".pv-table table");
  const page_bg = getComputedStyle(document.body).backgroundColor;
  return {
    bg: getComputedStyle(el).backgroundColor,
    pageBg: page_bg,
    tabsBg: getComputedStyle(document.querySelector(".pv-codetabs__tabs")).backgroundColor,
    rows: [...t.querySelectorAll("tbody tr")].map((tr) => tr.querySelector("th").textContent.trim()),
    hasPre: !!el.querySelector("pre"),
    overflows: el.scrollWidth > el.clientWidth,
  };
});
ok("tab 3 carries a table, not a code block", panel3.rows.length === 6 && !panel3.hasPre,
  `${panel3.rows.length} rows, pre=${panel3.hasPre}`);
ok("tab 3's six fields are the enforcement object's",
  JSON.stringify(panel3.rows) === JSON.stringify(["rls_filters_applied", "columns_excluded",
    "masking_applied", "schema_scope", "ceiling_applied", "route"]),
  panel3.rows.join(", "));
ok("tab 3's panel takes the page surface so the table is readable",
  panel3.bg === panel3.pageBg, `panel ${panel3.bg} vs page ${panel3.pageBg}`);
ok("the tablist stays ink", panel3.tabsBg !== panel3.pageBg, panel3.tabsBg);

/* ---- 3. §6 reads as one comparison, at every width ----------------- */
head("§6 the centrepiece");
const six = await page.evaluate(() => {
  const t = [...document.querySelectorAll(".pv-table table")][1];
  return {
    tables: document.querySelectorAll(".pv-table").length,
    cols: [...t.querySelectorAll("thead th")].map((th) => th.textContent.trim()),
    rows: [...t.querySelectorAll("tbody tr")].map((tr) => ({
      placement: tr.querySelector("th").textContent.trim(),
      push: tr.children[1].textContent.replace(/\s+/g, " ").trim(),
      names: tr.children[2].textContent.replace(/\s+/g, " ").trim(),
    })),
  };
});
ok("three tables on the page: the fields, the split, the engines", six.tables === 3, `${six.tables}`);
ok("the split is one table with three columns",
  JSON.stringify(six.cols) === JSON.stringify(["Placement", "What is pushed down", "Source types"]),
  six.cols.join(" · "));
ok("three rows — live+aggregates, live+predicates, replicated", six.rows.length === 3,
  `${six.rows.length}`);
ok("row 1 is live with aggregates pushed down",
  six.rows[0].placement === "Live, in place" && six.rows[0].push === "Predicates and aggregates");
ok("row 2 is live with predicates only",
  six.rows[1].placement === "Live, in place"
  && /^Predicates only\. Aggregates run above the source$/.test(six.rows[1].push));
ok("row 3 is the concession, and it names what gets copied",
  six.rows[2].placement === "Read and replicated"
  && /Provisa lands a copy the engine can query/.test(six.rows[2].push)
  && six.rows[2].names.split("·").length === 23,
  `${six.rows[2].names.split("·").length} names`);
ok("row 1 names twenty source types", six.rows[0].names.split("·").length === 20,
  `${six.rows[0].names.split("·").length}`);
ok("row 2 names eleven source types", six.rows[1].names.split("·").length === 11,
  `${six.rows[1].names.split("·").length}`);

/* ---- 4. five widths, both themes ----------------------------------- */
for (const theme of ["light", "dark"]) {
  head(`${theme}: five widths`);
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await page.waitForTimeout(60);
    const m = await page.evaluate(() => {
      const d = document.documentElement;
      const wide = [...document.querySelectorAll("body *")]
        .filter((el) => el.getBoundingClientRect().right > d.clientWidth + 1
          && getComputedStyle(el).position !== "fixed")
        .map((el) => `${el.className || el.tagName}`);
      const split = [...document.querySelectorAll(".pv-table")][1];
      const t = split.querySelector("table");
      const bodyRows = [...t.querySelectorAll("tbody tr")];
      /* One comparison means: still one table, still three columns, and the
       * three placements still sit in one column of one grid — which is what
       * a <table> cannot stop being. Under the kit's 640px floor it scrolls
       * inside its own container rather than reflowing, which is the kit's
       * decision and not a page overflow. */
      return {
        docScroll: d.scrollWidth - d.clientWidth,
        escaped: [...new Set(wide)].slice(0, 4),
        tables: document.querySelectorAll(".pv-table").length,
        cols: t.querySelectorAll("thead th").length,
        rows: bodyRows.length,
        sameX: new Set(bodyRows.map((tr) => Math.round(tr.querySelector("th").getBoundingClientRect().left))).size,
        splitScrolls: split.scrollWidth > split.clientWidth,
        heroFig: (() => {
          const f = document.querySelector(".pv-editorial--wide").getBoundingClientRect();
          return Math.abs(f.width / f.height - 16 / 9) < 0.05;
        })(),
        bodyBg: getComputedStyle(document.body).backgroundColor,
      };
    });
    ok(`${w}px: the page does not scroll sideways`, m.docScroll <= 0,
      `${m.docScroll}px over; ${m.escaped.join(", ")}`);
    ok(`${w}px: the split is still one table of three columns and three rows`,
      m.tables === 3 && m.cols === 3 && m.rows === 3, `${m.cols} cols, ${m.rows} rows`);
    ok(`${w}px: the three placements share one column`, m.sameX === 1, `${m.sameX} left edges`);
    ok(`${w}px: IMG-03 holds 16/9`, m.heroFig);
    if (w < 640) ok(`${w}px: the split scrolls inside its own container`, m.splitScrolls);
    else ok(`${w}px: the split fits without scrolling`, !m.splitScrolls);
    ok(`${w}px: the ${theme} page colour is in force`,
      theme === "dark" ? m.bodyBg === "rgb(14, 16, 19)" : m.bodyBg === "rgb(248, 246, 241)", m.bodyBg);
  }
}
await page.setViewportSize({ width: 1280, height: 900 });
await page.evaluate(() => document.documentElement.removeAttribute("data-theme"));

/* ---- 5. keyboard --------------------------------------------------- */
head("keyboard");
await page.focus("#t-ask");
await page.keyboard.press("ArrowRight");
ok("Arrow moves along the tablist",
  await page.getAttribute("#t-compile", "aria-selected") === "true");
await page.keyboard.press("End");
ok("End reaches the field-name tab", await page.getAttribute("#t-back", "aria-selected") === "true");
await page.keyboard.press("Home");
ok("Home returns to the first tab", await page.getAttribute("#t-ask", "aria-selected") === "true");
await page.focus(".pv-acc__item:nth-child(3) .pv-acc__btn");
await page.keyboard.press("Enter");
ok("a closed freshness panel opens on Enter",
  await page.getAttribute(".pv-acc__item:nth-child(3) .pv-acc__btn", "aria-expanded") === "true");
ok("one accordion panel is open at a time",
  await page.$$eval(".pv-acc__btn", (bs) =>
    bs.filter((b) => b.getAttribute("aria-expanded") === "true").length) === 1);
const ring = await page.evaluate(() => {
  const el = document.querySelector("#p-back");
  return getComputedStyle(el).getPropertyValue("background-color");
});
ok("the prose panel resolves a background rather than inheriting the ink", !!ring);

/* ---- 6. the figures ------------------------------------------------ */
head("figures");
const figs = await page.$$eval(".pv-editorial", (fs) => fs.map((f) => {
  const r = f.getBoundingClientRect();
  const img = f.querySelector("img");
  return {
    ratio: r.width / r.height,
    wide: f.classList.contains("pv-editorial--wide"),
    square: f.classList.contains("pv-editorial--square"),
    src: img?.getAttribute("src") || "",
    alt: img?.getAttribute("alt") || "",
    loaded: !!img && img.complete && img.naturalWidth > 0,
    label: f.getAttribute("aria-label") || "",
    role: f.getAttribute("role"),
  };
}));
ok("two editorial figures", figs.length === 2, `${figs.length}`);
ok("IMG-03 is 16/9", figs[0].wide && Math.abs(figs[0].ratio - 16 / 9) < 0.05, figs[0].ratio.toFixed(3));
ok("IMG-04 is 4/5", !figs[1].wide && !figs[1].square
  && Math.abs(figs[1].ratio - 4 / 5) < 0.05, figs[1].ratio.toFixed(3));
ok("IMG-03's PNG is referenced and loads",
  figs[0].src === "/assets/editorial/img-03-light.png" && figs[0].loaded, `${figs[0].src}:${figs[0].loaded}`);
ok("IMG-04's PNG is referenced and loads",
  figs[1].src === "/assets/editorial/img-04-light.png" && figs[1].loaded, `${figs[1].src}:${figs[1].loaded}`);
ok("both figures carry the brief's alt text",
  /registered sources at the bottom/.test(figs[0].alt) && /four deployment shapes/.test(figs[1].alt));
ok("both are role=img with an accessible name",
  figs.every((f) => f.role === "img" && f.label.length > 30));
ok("each <img>'s alt mirrors its figure's aria-label",
  figs.every((f) => f.alt === f.label));

/* ---- 7. a phone, as a phone ---------------------------------------- */
head("iPhone 13, portrait");
const phone = await browser.newContext({ ...devices["iPhone 13"] });
const pp = await phone.newPage();
await pp.goto(URL, { waitUntil: "load" });
ok("the menu button is the one shown", await pp.isVisible(".pv-header__menu")
  && !(await pp.isVisible(".pv-header__nav")));
await pp.click(".pv-header__menu");
ok("the drawer opens", await pp.isVisible("#pv-drawer.is-open"));
ok("the drawer marks Platform as the current page",
  await pp.getAttribute('.pv-drawer__nav a[aria-current="page"]', "href") === "/platform");
await pp.keyboard.press("Escape");
ok("Escape closes it", !(await pp.isVisible("#pv-drawer.is-open")));
ok("the split still reads as one table on a phone",
  await pp.evaluate(() => {
    const t = [...document.querySelectorAll(".pv-table table")][1];
    return t.querySelectorAll("thead th").length === 3 && t.querySelectorAll("tbody tr").length === 3;
  }));
await phone.close();

head("console");
ok("no console errors and no page errors", errors.length === 0, errors.slice(0, 3).join(" | "));

console.log(`\n${pass}/${pass + fail} checks pass`);
await browser.close();
process.exit(fail ? 1 : 0);
