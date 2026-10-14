/* Browser checks for the design system — the half of PRO-3's acceptance that
 * check-contrast.mjs cannot cover: the header composition, light and dark, the
 * five verified widths, the nav breakpoint, and a keyboard pass.
 *
 * Playwright is not a dependency of this repo, because site/ has no build step.
 * Install it where you are running from, serve site/, then point this at it:
 *
 *   npm i playwright && npx playwright install chromium
 *   python3 -m http.server 8731 --directory site &
 *   node site/design-system/verify-ui.mjs http://127.0.0.1:8731
 *
 * Run it after touching the header, the drawer, the theme wiring or --bp-nav.
 * It exits non-zero on the first failing assertion class, and prints one
 * PASS/FAIL line per check so a failure says which check and with what numbers.
 *
 * PLAYWRIGHT_LD_LIBRARY_PATH is an escape hatch for distros with no FHS lib dir
 * (NixOS): set it to a prefix holding chromium's shared libraries and it is
 * passed to the browser process alone. Exporting LD_LIBRARY_PATH globally
 * instead would swap glibc under every other binary on the box.
 */
import { chromium } from "playwright";

const LAUNCH = process.env.PLAYWRIGHT_LD_LIBRARY_PATH
  ? { env: { ...process.env, LD_LIBRARY_PATH: process.env.PLAYWRIGHT_LD_LIBRARY_PATH } }
  : {};

const ORIGIN = (process.argv[2] || "http://127.0.0.1:8731").replace(/\/$/, "");
const WIDTHS = [360, 768, 1279, 1280, 1920, 2560];
const results = [];
const ok = (n, c, d = "") => results.push({ n, pass: !!c, d });

async function fetchText(p) {
  const r = await fetch(ORIGIN + p);
  if (!r.ok) throw new Error(`${p} -> ${r.status}`);
  return r.text();
}

/* A realistic composed page: the chrome a real page gets, plus enough body to
 * exercise the container. Served through <base> so relative asset URLs and the
 * stylesheets resolve against the dev server. */
async function composedPage() {
  const head = await fetchText("/design-system/partials/head.html");
  const utility = await fetchText("/design-system/partials/utility-bar.html");
  const header = await fetchText("/design-system/partials/site-header.html");
  const footer = await fetchText("/design-system/partials/site-footer.html");
  const accordion = await fetchText("/design-system/partials/accordion.html");
  const tabs = await fetchText("/design-system/partials/code-tabs.html");
  const sw = await fetchText("/design-system/partials/switch.html");
  const form = await fetchText("/design-system/partials/demo-form.html");
  const skip = await fetchText("/design-system/partials/skip-link.html");
  return `<!doctype html><html lang="en"><head><base href="${ORIGIN}/">
${head}</head><body>
${skip}
${utility}
${header}
<main id="main">
  <section class="pv-section"><div class="pv-container pv-stack">
    <h1 class="pv-h pv-h--page">Composed page</h1>
    <p class="pv-p">Body copy to give the container something to measure against.</p>
    ${accordion}${tabs}${sw}${form}
  </div></section>
</main>
${footer}
</body></html>`;
}

const COMPOSED_URL = `${ORIGIN}/__verify/composed.html`;

/* page.setContent lands on an opaque origin, where localStorage throws
 * SecurityError. Fulfil a real same-origin URL instead, so the theme
 * persistence under test behaves as it does in production. */
async function openComposed(ctx, html) {
  const page = await ctx.newPage();
  await page.route(COMPOSED_URL, (route) =>
    route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html }));
  return page;
}

const browser = await chromium.launch(LAUNCH);
const HTML = await composedPage();

/* ---- 1. the delta: markup assertions ------------------------------- */
{
  const ctx = await browser.newContext();
  const page = await openComposed(ctx, HTML);
  await page.goto(COMPOSED_URL, { waitUntil: "load" });
  await page.waitForTimeout(300);

  const nav = await page.$$eval(".pv-header__nav a", (as) => as.map((a) => a.textContent.trim()));
  ok("header nav is the six v1 items",
    JSON.stringify(nav) === JSON.stringify(["Platform", "Governance", "Industries", "Interfaces", "Sources", "Compare"]),
    nav.join(" · "));
  ok("no Insights link anywhere in the chrome",
    !(await page.$$eval("a", (as) => as.some((a) => /insights/i.test(a.textContent)))));

  const drawerNav = await page.$$eval(".pv-drawer__nav a", (as) => as.map((a) => a.textContent.trim()));
  ok("drawer nav matches the header nav", JSON.stringify(drawerNav) === JSON.stringify(nav));

  ok("theme toggle is in the header actions",
    (await page.$$(".pv-header__actions .pv-theme")).length === 1);
  ok("theme toggle is in the drawer",
    (await page.$$(".pv-drawer .pv-theme")).length === 1);
  const btns = await page.$$eval(".pv-header__actions .pv-theme button",
    (bs) => bs.map((b) => b.dataset.themeSet));
  ok("toggle is two-state light/dark, no auto",
    JSON.stringify(btns) === JSON.stringify(["light", "dark"]), btns.join(","));

  const utilText = (await page.$eval(".pv-utility", (e) => e.textContent)).replace(/\s+/g, " ").trim();
  ok("utility bar carries no hosted-service notice", !/hosted service|free trial today/i.test(utilText), utilText);
  const utilLinks = await page.$$eval(".pv-utility a", (as) => as.map((a) => a.textContent.trim()));
  ok("utility bar is Docs / Support / Register",
    utilLinks.length === 3 && /docs/i.test(utilLinks[0]) && /support/i.test(utilLinks[1]) && /register/i.test(utilLinks[2]),
    utilLinks.join(" · "));

  ok("drawer carries the utility items",
    (await page.$$eval(".pv-drawer__utility a", (as) => as.length)) === 3);

  const footLinks = await page.$$eval(".pv-footer__col a", (as) => as.map((a) => a.textContent.trim()));
  ok("footer carries an Editions link", footLinks.some((t) => /^editions$/i.test(t)));
  const editionsHref = await page.$eval('.pv-footer__col a[href="/pricing/"]', (a) => a.getAttribute("href"))
    .catch(() => null);
  ok("Editions points at /pricing/", editionsHref === "/pricing/", String(editionsHref));

  await ctx.close();
}

/* ---- 2. light is the unconditional default ------------------------- */
for (const scheme of ["dark", "light", "no-preference"]) {
  const ctx = await browser.newContext({ colorScheme: scheme === "no-preference" ? "no-preference" : scheme });
  const page = await openComposed(ctx, HTML);
  await page.goto(COMPOSED_URL, { waitUntil: "load" });
  await page.waitForTimeout(250);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const stored = await page.evaluate(() => localStorage.getItem("provisa-theme"));
  // light page surface is #f8f6f1
  ok(`OS prefers ${scheme}: first visit still paints light`,
    bg === "rgb(248, 246, 241)", bg);
  ok(`OS prefers ${scheme}: nothing persisted without a click`, stored === null, String(stored));
  await ctx.close();
}

/* ---- 3. the toggle, persistence, and no flash ---------------------- */
{
  const ctx = await browser.newContext({ colorScheme: "dark" });
  const page = await openComposed(ctx, HTML);
  await page.goto(COMPOSED_URL, { waitUntil: "load" });
  await page.waitForTimeout(250);
  await page.click('.pv-header__actions .pv-theme button[data-theme-set="dark"]');
  await page.waitForTimeout(120);
  let bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok("clicking dark paints the dark page", bg === "rgb(14, 16, 19)", bg);
  ok("dark is persisted", (await page.evaluate(() => localStorage.getItem("provisa-theme"))) === "dark");
  ok("aria-pressed follows the choice",
    (await page.$eval('.pv-header__actions .pv-theme button[data-theme-set="dark"]',
      (b) => b.getAttribute("aria-pressed"))) === "true");

  // No flash of the wrong theme: read the body colour on the first frame.
  await page.reload({ waitUntil: "commit" });
  const firstFrame = await page.evaluate(() => new Promise((res) => {
    requestAnimationFrame(() => res(getComputedStyle(document.body).backgroundColor));
  }));
  ok("no flash: first frame after reload is already dark", firstFrame === "rgb(14, 16, 19)", firstFrame);

  await page.click('.pv-header__actions .pv-theme button[data-theme-set="light"]');
  await page.waitForTimeout(120);
  bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok("clicking light returns to the default", bg === "rgb(248, 246, 241)", bg);
  ok("light is persisted", (await page.evaluate(() => localStorage.getItem("provisa-theme"))) === "light");
  await ctx.close();
}

/* ---- 4. five widths x two themes: overflow + console --------------- */
for (const theme of ["light", "dark"]) {
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await openComposed(ctx, HTML);
    const errs = [];
    page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    page.on("pageerror", (e) => errs.push(String(e)));
    await page.addInitScript((t) => { try { localStorage.setItem("provisa-theme", t); } catch {} }, theme);
    await page.goto(COMPOSED_URL, { waitUntil: "load" });
    await page.waitForTimeout(350);

    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(`${theme} ${w}px: no horizontal overflow`, over <= 0, `scrollWidth-clientWidth=${over}`);

    // Which elements, if any, stick out past the viewport.
    const culprits = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const out = [];
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
          out.push(`${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]}@${Math.round(r.left)}..${Math.round(r.right)}`);
        }
      }
      return out.slice(0, 5);
    });
    ok(`${theme} ${w}px: nothing escapes the viewport`, culprits.length === 0, culprits.join(" "));
    ok(`${theme} ${w}px: no console errors`, errs.length === 0, errs.slice(0, 2).join(" | "));

    const menuVisible = await page.isVisible(".pv-header__menu");
    const navVisible = await page.isVisible(".pv-header__nav");
    const wantMenu = w < 1280;
    ok(`${theme} ${w}px: ${wantMenu ? "menu button" : "nav"} is the one shown`,
      menuVisible === wantMenu && navVisible === !wantMenu,
      `menu=${menuVisible} nav=${navVisible}`);
    await ctx.close();
  }
}

/* ---- 5. the nav breakpoint, measured ------------------------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await openComposed(ctx, HTML);
  await page.goto(COMPOSED_URL, { waitUntil: "load" });
  await page.waitForTimeout(350);
  // Natural width of the header row's three clusters plus its gaps and gutter.
  const need = await page.evaluate(() => {
    const inner = document.querySelector(".pv-header__inner");
    const cs = getComputedStyle(inner);
    const gap = parseFloat(cs.columnGap) || 0;
    const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const nav = document.querySelector(".pv-header__nav");
    const navW = Array.from(nav.children).reduce((s, a) => s + a.getBoundingClientRect().width, 0)
      + (parseFloat(getComputedStyle(nav).columnGap) || 0) * (nav.children.length - 1);
    const wordmark = document.querySelector(".pv-header__inner > .pv-wordmark").getBoundingClientRect().width;
    const actions = document.querySelector(".pv-header__actions").getBoundingClientRect().width;
    return { navW, wordmark, actions, gap, pad,
      total: Math.ceil(wordmark + navW + actions + gap * 2 + pad) };
  });
  const BP = await page.evaluate(() =>
    parseInt(getComputedStyle(document.documentElement).getPropertyValue("--bp-nav"), 10));
  ok("measured header row fits inside --bp-nav",
    need.total <= BP,
    `needs ${need.total}px (wordmark ${Math.round(need.wordmark)} + nav ${Math.round(need.navW)} + actions ${Math.round(need.actions)} + gaps ${need.gap * 2} + gutter ${need.pad}); --bp-nav is ${BP}px`);
  results.push({ n: "MEASUREMENT", pass: true, d: JSON.stringify({ ...need, bp: BP }) });
  await ctx.close();

  /* The guard that would have caught the 1040px breakpoint: sweep the widths
   * around it and assert the nav never overlaps the actions cluster. The kit
   * clipped its nav with overflow:hidden; ours has no overflow:hidden, so the
   * same mistake shows up as overlapping text instead. */
  const bad = [];
  for (let w = 960; w <= 1600; w += 20) {
    const c = await browser.newContext({ viewport: { width: w, height: 800 } });
    const pg = await openComposed(c, HTML);
    await pg.goto(COMPOSED_URL, { waitUntil: "load" });
    await pg.waitForTimeout(90);
    const r = await pg.evaluate(() => {
      const nav = document.querySelector(".pv-header__nav");
      const act = document.querySelector(".pv-header__actions");
      if (getComputedStyle(nav).display === "none") return null;
      return +(nav.lastElementChild.getBoundingClientRect().right
             - act.getBoundingClientRect().left).toFixed(1);
    });
    if (r !== null && r > 0) bad.push(`${w}px:+${r}`);
    await c.close();
  }
  ok("no width between 960 and 1600 overlaps the nav and the actions",
    bad.length === 0, bad.slice(0, 6).join(" "));
}

/* ---- 6. keyboard pass ---------------------------------------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await openComposed(ctx, HTML);
  await page.goto(COMPOSED_URL, { waitUntil: "load" });
  await page.waitForTimeout(350);

  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement.className);
  ok("first Tab reaches the skip link", /pv-skip/.test(first), first);

  // Drawer: open with the keyboard, trap, escape, focus return.
  await page.focus(".pv-header__menu");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  ok("drawer opens from the keyboard", await page.isVisible("#pv-drawer.is-open"));
  ok("menu button reports expanded",
    (await page.$eval(".pv-header__menu", (b) => b.getAttribute("aria-expanded"))) === "true");

  const insideAfterTabs = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    insideAfterTabs.push(await page.evaluate(() =>
      !!document.activeElement.closest("#pv-drawer")));
  }
  ok("Tab stays inside the open drawer", insideAfterTabs.every(Boolean),
    `${insideAfterTabs.filter(Boolean).length}/14 inside`);

  const insideBack = [];
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Shift+Tab");
    insideBack.push(await page.evaluate(() => !!document.activeElement.closest("#pv-drawer")));
  }
  ok("Shift+Tab stays inside the open drawer", insideBack.every(Boolean),
    `${insideBack.filter(Boolean).length}/6 inside`);

  // The toggle inside the drawer must not dismiss it.
  await page.click('.pv-drawer .pv-theme button[data-theme-set="dark"]');
  await page.waitForTimeout(150);
  ok("the drawer's theme toggle does not close the drawer",
    await page.isVisible("#pv-drawer.is-open"));
  ok("the drawer's toggle actually themes the page",
    (await page.evaluate(() => getComputedStyle(document.body).backgroundColor)) === "rgb(14, 16, 19)");

  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  ok("Escape closes the drawer", !(await page.isVisible("#pv-drawer.is-open")));
  ok("focus returns to the menu button",
    (await page.evaluate(() => document.activeElement.className)).includes("pv-header__menu"));
  ok("page scrolling is restored",
    (await page.evaluate(() => document.body.style.overflow)) !== "hidden");

  /* A drawer link closes it on the way out. The link is real, so cancel only
   * the navigation: preventDefault does not stop propagation, so the delegated
   * close handler on document still runs — the behaviour under test. */
  await page.focus(".pv-header__menu");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  await page.evaluate(() => document.addEventListener(
    "click", (e) => { if (e.target.closest("a")) e.preventDefault(); }, { capture: true }));
  await page.click(".pv-drawer__nav a:first-child");
  await page.waitForTimeout(200);
  ok("a drawer nav link closes the drawer", !(await page.isVisible("#pv-drawer.is-open")));
  ok("the drawer link test did not navigate away", page.url() === COMPOSED_URL, page.url());

  // Accordion, tabs, switch.
  const accBtn = await page.$(".pv-acc__btn");
  if (accBtn) {
    await accBtn.focus();
    const before = await accBtn.getAttribute("aria-expanded");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(150);
    const after = await accBtn.getAttribute("aria-expanded");
    ok("accordion toggles on Enter", before !== after, `${before} -> ${after}`);
  } else ok("accordion toggles on Enter", false, "no .pv-acc__btn in the composed page");

  const tab = await page.$(".pv-codetabs__tab");
  if (tab) {
    await tab.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(120);
    const moved = await page.evaluate(() =>
      document.activeElement.classList.contains("pv-codetabs__tab") &&
      document.activeElement.getAttribute("aria-selected") === "true");
    ok("code tabs move on ArrowRight", moved);
    await page.keyboard.press("End");
    await page.waitForTimeout(120);
    ok("code tabs honour End", await page.evaluate(() => {
      const all = [...document.querySelectorAll(".pv-codetabs__tab")];
      return document.activeElement === all[all.length - 1];
    }));
  } else ok("code tabs move on ArrowRight", false, "no tabs in the composed page");

  const swEl = await page.$('[role="switch"]');
  if (swEl) {
    await swEl.focus();
    const before = await swEl.getAttribute("aria-checked");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(120);
    ok("switch flips on Enter", (await swEl.getAttribute("aria-checked")) !== before);
  } else ok("switch flips on Enter", false, "no role=switch in the composed page");

  // Every form control has an accessible name.
  const unnamed = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("input,select,textarea")) {
      const byLabel = el.labels && el.labels.length > 0;
      const name = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.title;
      if (!byLabel && !name) out.push(el.outerHTML.slice(0, 70));
    }
    return out;
  });
  ok("every form control has an accessible name", unnamed.length === 0, unnamed.join(" | "));

  // The focus ring is actually drawn.
  await page.focus(".pv-header__menu");
  const ring = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector(".pv-header__menu"), null);
    return cs.outlineStyle + " " + cs.outlineWidth;
  });
  ok("a focus ring is drawn on :focus-visible", !/none/.test(ring), ring);
  await ctx.close();
}

/* ---- 7. the gallery still renders every partial -------------------- */
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.addInitScript((t) => { try { localStorage.setItem("provisa-theme", t); } catch {} }, theme);
  await page.goto(`${ORIGIN}/design-system/`, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  const items = await page.$$eval(".gal-item", (e) => e.length);
  const failed = await page.$$eval(".gal-err", (e) => e.map((x) => x.textContent.trim()).slice(0, 4));
  ok(`gallery ${theme}: specimens rendered`, items >= 30, `${items} items`);
  ok(`gallery ${theme}: no partial failed to load`, failed.length === 0, failed.join(" | "));
  ok(`gallery ${theme}: no console errors`, errs.length === 0, errs.slice(0, 2).join(" | "));
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(`gallery ${theme}: no horizontal overflow`, over <= 0, `${over}`);
  await ctx.close();
}

/* ---- 8. the self-hosted fonts actually resolve --------------------- */
{
  const ctx = await browser.newContext();
  const page = await openComposed(ctx, HTML);
  const fontReqs = [];
  page.on("response", (r) => { if (/\.woff2?$/.test(r.url())) fontReqs.push([r.url().split("/").pop(), r.status()]); });
  await page.goto(COMPOSED_URL, { waitUntil: "load" });
  await page.waitForTimeout(800);
  ok("no Google Fonts request", !(await page.evaluate(() =>
    [...document.querySelectorAll("link")].some((l) => /fonts\.googleapis|fonts\.gstatic/.test(l.href)))));
  ok("self-hosted webfonts load", fontReqs.length > 0 && fontReqs.every(([, s]) => s === 200),
    fontReqs.map(([f, s]) => `${f}:${s}`).join(" "));
  const fams = await page.evaluate(() => ({
    body: getComputedStyle(document.body).fontFamily,
    h1: getComputedStyle(document.querySelector(".pv-h--page")).fontFamily,
  }));
  ok("body is Public Sans, display is Source Serif 4",
    /Public Sans/.test(fams.body) && /Source Serif/.test(fams.h1), JSON.stringify(fams));
  ok("no Inter or JetBrains Mono left", !/Inter|JetBrains/.test(fams.body + fams.h1));
  await ctx.close();
}

await browser.close();

/* ---- report -------------------------------------------------------- */
let fails = 0;
let checks = 0;
for (const r of results) {
  if (r.n === "MEASUREMENT") { console.log(`\n   measurement: ${r.d}\n`); continue; }
  checks++;
  if (!r.pass) fails++;
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.d ? `  — ${r.d}` : ""}`);
}
console.log(`\n${checks - fails}/${checks} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
