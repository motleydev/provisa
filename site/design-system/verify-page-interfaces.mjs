/**
 * Render and composition checks for /why/interfaces (PRO-11).
 *
 * Re-runnable, so the acceptance criteria are a command rather than a claim in
 * a comment. Needs Playwright, which site/ deliberately does not depend on:
 *   npm i playwright && npx playwright install chromium
 *
 *   python3 -m http.server 8731 --directory site &
 *   node site/design-system/verify-page-interfaces.mjs http://127.0.0.1:8731
 */
import { chromium, devices } from "playwright";

const ORIGIN = process.argv[2] || "http://127.0.0.1:8731";
const URL = `${ORIGIN}/why/interfaces`;
const WIDTHS = [360, 768, 1280, 1920, 2560];

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? `  — ${detail}` : ""}`); }
};
const head = (s) => console.log(`\n${s}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));

const res = await page.goto(URL, { waitUntil: "load" });
ok("the route serves the page", res.status() === 200, `status ${res.status()}`);

/* ---- 1. the §2 matrix: seven rows, four columns, Default intact ---- */
head("§2 the matrix");
const matrix = await page.$$eval(".pv-table table", (ts) => {
  const t = ts[0];
  return {
    cols: [...t.querySelectorAll("thead th")].map((th) => th.textContent.trim()),
    rows: [...t.querySelectorAll("tbody tr")].map((tr) => ({
      listener: tr.querySelector("th").textContent.trim(),
      def: tr.children[1].textContent.replace(/\s+/g, " ").trim(),
    })),
  };
});
ok("four columns, Listener · Default · Carries · What connects",
  JSON.stringify(matrix.cols) === JSON.stringify(["Listener", "Default", "Carries", "What connects"]),
  matrix.cols.join(" · "));
ok("seven listener rows", matrix.rows.length === 7, `${matrix.rows.length} rows`);
ok("the seven listeners, in brief order",
  JSON.stringify(matrix.rows.map((r) => r.listener)) === JSON.stringify(
    ["HTTP", "gRPC", "Arrow Flight", "pgwire", "Bolt", "Airport", "MCP"]),
  matrix.rows.map((r) => r.listener).join(", "));
ok("three listeners are on by default, four are off",
  matrix.rows.filter((r) => /^on,/.test(r.def)).length === 3
  && matrix.rows.filter((r) => /^off until/.test(r.def)).length === 4,
  matrix.rows.map((r) => `${r.listener}=${r.def}`).join(" | "));
ok("every default cell carries its port or says there is none",
  matrix.rows.every((r) => /8000|50051|8815|5439|7687|8009|off until you set a port$/.test(r.def)));

const notes = await page.$$eval(".pv-table", (ts) => {
  const after = [];
  let n = ts[0].parentElement.nextElementSibling;
  while (n) { after.push(n.textContent.replace(/\s+/g, " ").trim()); n = n.nextElementSibling; }
  return after.join(" ");
});
ok("footnote 1: the sixteenth surface is the outbound Kafka stream",
  /sixteenth goes the other way/.test(notes) && /Kafka topic/.test(notes));
ok("footnote 2: product default against deployment convention",
  /settings_catalog\.py/.test(notes) && /not\s+product defaults/.test(notes),
  notes.slice(0, 160));

/* ---- 2. §5a is on the page, as its own two-route table -------------- */
head("§5a compile and explain");
const routes = await page.$$eval(".pv-table table", (ts) =>
  [...ts[1].querySelectorAll("tbody tr")].map((tr) =>
    [...tr.children].map((c) => c.textContent.replace(/\s+/g, " ").trim())));
ok("a second ComparisonTable with two rows", routes.length === 2);
ok("compile takes a GraphQL document",
  routes[0][1] === "POST /data/compile" && /GraphQL document/.test(routes[0][2]),
  routes[0]?.join(" | "));
ok("explain takes SQL", routes[1][1] === "POST /data/sql/explain" && routes[1][2] === "SQL",
  routes[1]?.join(" | "));

/* ---- 3. the components the brief asks for -------------------------- */
head("components");
const counts = await page.evaluate(() => ({
  tables: document.querySelectorAll(".pv-table").length,
  callouts: document.querySelectorAll(".pv-callout").length,
  calloutGet: document.querySelectorAll(".pv-callout--get").length,
  accPanels: document.querySelectorAll(".pv-acc__item").length,
  tabs: document.querySelectorAll(".pv-codetabs__tab").length,
  panels: document.querySelectorAll(".pv-codetabs__panel").length,
  ruled: document.querySelectorAll(".pv-ruled").length,
  figs: document.querySelectorAll(".pv-fig").length,
  mainBtns: document.querySelectorAll("main .pv-btn").length,
  links: document.querySelectorAll("main .pv-link").length,
  h1: document.querySelectorAll("h1").length,
  emph: document.querySelectorAll(".pv-emph").length,
  seclabels: document.querySelectorAll(".pv-seclabel").length,
}));
ok("ComparisonTable ×2 on the page", counts.tables === 2, `${counts.tables}`);
ok("Callout ×3 — two in §3, one in §7", counts.callouts === 3, `${counts.callouts}`);
ok("§3's first callout is the forest tone", counts.calloutGet === 1);
ok("Accordion panels, one per surface in the brief", counts.accPanels === 13, `${counts.accPanels}`);
ok("CodeTabs has four tabs and four panels", counts.tabs === 4 && counts.panels === 4,
  `${counts.tabs} tabs / ${counts.panels} panels`);
ok("RuledCard ×5 — two in §6, three in §8", counts.ruled === 5, `${counts.ruled}`);
ok("one FigPanel, the IMG-07 placeholder", counts.figs === 1);
ok("exactly one h1", counts.h1 === 1);
ok("Emph is used in the hero", counts.emph >= 1);
ok("seven section labels", counts.seclabels === 7, `${counts.seclabels}`);

/* ---- 4. every code block sets the port it then connects to --------- */
head("§5 the snippets, which are the point of the page");
const code = await page.$$eval(".pv-codetabs__panel pre", (ps) => ps.map((p) => p.textContent));
ok("psql: sets PROVISA_PGWIRE_PORT before it connects",
  /PROVISA_PGWIRE_PORT=5439/.test(code[0])
  && code[0].indexOf("PROVISA_PGWIRE_PORT") < code[0].indexOf("psql \"postgresql"));
ok("psql: the comment saying the listener has no default port survives",
  /no default port/.test(code[0]) && /Helm chart and installer set/.test(code[0]));
ok("bolt: names PROVISA_BOLT_PORT and the 7687 convention",
  /PROVISA_BOLT_PORT/.test(code[1]) && /7687 is the convention/.test(code[1]));
ok("flight: says it is on by default, on 8815",
  /on by default, on 8815/.test(code[2]));
ok("graphql: the HTTP surface, with a bearer token", /Bearer \$TOKEN/.test(code[3]));
const comments = await page.$$eval(".pv-codetabs__panel .pv-code__c", (cs) => cs.length);
ok("the comment lines are marked up as comments, not dropped", comments >= 5, `${comments}`);

/* ---- 5. links out -------------------------------------------------- */
head("links out");
const hrefs = await page.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href")));
ok("primary conversion is /install", hrefs.includes("/install"));
ok("secondary conversion is /register", hrefs.includes("/register"));
ok("nothing in the page body points at the trial host",
  !hrefs.some((h) => /cloud\./.test(h)), hrefs.filter((h) => /cloud\./.test(h)).join(", "));
ok("no link to a Phase 2 page that is not built",
  !hrefs.some((h) => /\/vs\/hasura|one-model/.test(h)),
  hrefs.filter((h) => /\/vs\/hasura|one-model/.test(h)).join(", "));
ok("Book a demo reaches the demo form on this page",
  hrefs.includes("#contact-demo") && await page.$("#contact-demo") !== null);
ok("no product screenshot", (await page.$$("main img")).length === 0);

/* ---- 6. the accordion and the tabs work by keyboard ---------------- */
head("keyboard");
await page.focus(".pv-acc__item:nth-child(2) .pv-acc__btn");
await page.keyboard.press("Enter");
ok("a closed panel opens on Enter",
  await page.getAttribute(".pv-acc__item:nth-child(2) .pv-acc__btn", "aria-expanded") === "true");
await page.focus("#t-psql");
await page.keyboard.press("ArrowRight");
ok("Arrow moves along the tablist",
  await page.getAttribute("#t-neo4j", "aria-selected") === "true");
await page.keyboard.press("End");
ok("End reaches the last tab",
  await page.getAttribute("#t-graphql", "aria-selected") === "true");

/* ---- 7. five widths, both themes ----------------------------------- */
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
      const t = document.querySelector(".pv-table");
      return {
        docScroll: d.scrollWidth - d.clientWidth,
        escaped: [...new Set(wide)].slice(0, 4),
        /* The matrix keeps four columns at every width; under the kit's 640px
         * table floor it scrolls inside its own container rather than
         * reflowing, which is the kit's decision and not a page overflow. */
        matrixScrolls: t.scrollWidth > t.clientWidth,
        matrixCols: t.querySelectorAll("thead th").length,
      };
    });
    ok(`${w}px: the page does not scroll sideways`, m.docScroll <= 0,
      `${m.docScroll}px over; ${m.escaped.join(", ")}`);
    ok(`${w}px: the matrix still has four columns`, m.matrixCols === 4);
    if (w === 360) ok("360px: the matrix scrolls inside its own container", m.matrixScrolls);
    if (w >= 768) ok(`${w}px: the matrix fits without scrolling`, !m.matrixScrolls);
  }
}

/* ---- 8. a phone, as a phone ---------------------------------------- */
head("iPhone 13, portrait");
const phone = await browser.newContext({ ...devices["iPhone 13"] });
const pp = await phone.newPage();
await pp.goto(URL, { waitUntil: "load" });
ok("the menu button is the one shown", await pp.isVisible(".pv-header__menu")
  && !(await pp.isVisible(".pv-header__nav")));
await pp.click(".pv-header__menu");
ok("the drawer opens", await pp.isVisible("#pv-drawer.is-open"));
ok("the drawer marks Interfaces as the current page",
  await pp.getAttribute('.pv-drawer__nav a[aria-current="page"]', "href") === "/why/interfaces");
await phone.close();

head("console");
ok("no console errors and no page errors", errors.length === 0, errors.slice(0, 3).join(" | "));

console.log(`\n${pass}/${pass + fail} checks pass`);
await browser.close();
process.exit(fail ? 1 : 0);
