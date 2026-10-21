/**
 * Render checks for the three briefing walkthroughs (PRO-150).
 *
 * The browser half of the pair. `check-page-walkthrough.mjs` owns the bytes on
 * disk — slide counts, masters, chrome, routes — and everything here needs
 * layout, which is to say: needs to know whether the slide actually fits.
 *
 * Needs Playwright, which site/ deliberately does not depend on:
 *   npm i playwright && npx playwright install chromium
 *   node site/design-system/verify-page-walkthrough.mjs
 *
 * Unlike the other verify-page-*.mjs, this one serves site/ itself from
 * node:http when no base URL is given, so the browser half of the slide layer
 * needs a browser and nothing else. Pass a base URL to point it at a server
 * you are already running.
 *
 * The check that matters most is overflow. A slide canvas is a 16:9 box with
 * overflow:hidden, so a slide with one line too many does not break the
 * layout — it silently clips a sentence, and the deck looks fine. Every slide
 * in all three decks is measured at the reference 1920x1080 and at two
 * smaller viewports, in both themes, and anything whose content is taller
 * than its canvas fails by name. That is the one failure mode a reviewer
 * cannot catch by scrolling past.
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const DECKS = ["ciso", "cto", "executive"];
const VIEWPORTS = [
  { w: 1920, h: 1080, name: "1920x1080 — the reference canvas" },
  { w: 1440, h: 900, name: "1440x900 — a laptop" },
  { w: 1280, h: 720, name: "1280x720 — the small end of deck mode" },
];
const THEMES = ["light", "dark"];

const pass = [];
const fail = [];
const ok = (c, m) => (c ? pass : fail).push(m);

/* ---- the server ------------------------------------------------------- */

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

/* Extensionless first, the way Cloudflare Pages serves the production route,
 * because every canonical and every internal href on these pages is
 * extensionless and a server that only honoured `.html` would be testing a
 * site nobody visits. */
const candidates = (p) => {
  const clean = normalize(p).replace(/^(\.\.[/\\])+/, "").replace(/^\//, "");
  if (clean === "" || clean.endsWith("/")) return [join("site", clean, "index.html")];
  return [join("site", clean), join("site", clean + ".html"), join("site", clean, "index.html")];
};

let base = process.argv[2];
let server = null;
if (!base) {
  server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    for (const file of candidates(decodeURIComponent(url.pathname))) {
      try {
        if (!(await stat(file)).isFile()) continue;
        res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
        res.end(await readFile(file));
        return;
      } catch {
        /* Next candidate. A miss here is a 404 below, not an error. */
      }
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
}

/* ---- the browser ------------------------------------------------------ */

const browser = await chromium.launch();

const consoleErrors = [];

async function open(path, { width, height, theme = "light", reducedMotion = "no-preference" } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion,
    colorScheme: theme === "dark" ? "dark" : "light",
  });
  await context.addInitScript((t) => {
    try {
      localStorage.setItem("provisa-theme", t);
    } catch {
      /* Storage disabled is the light default, which is what the page does. */
    }
  }, theme);
  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`${path} — ${m.text()}`);
  });
  page.on("pageerror", (e) => consoleErrors.push(`${path} — ${e.message}`));
  await page.goto(base + path, { waitUntil: "load" });
  return { context, page };
}

/* ---- 1. nothing is clipped ------------------------------------------- */

/* A canvas is overflow:hidden, so a slide that does not fit loses a sentence
 * without complaining. The measurement is the canvas's own scroll height
 * against its client height; 2px of tolerance absorbs subpixel rounding on a
 * fractional --u, and nothing more. */
const TOLERANCE = 2;

for (const deck of DECKS) {
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      const { context, page } = await open(`/walkthrough/${deck}`, { width: vp.w, height: vp.h, theme });

      const mode = await page.getAttribute(".pv-deck", "data-mode");
      ok(mode === "deck", `${deck} @ ${vp.w} ${theme}: the controller put the deck in deck mode (${mode})`);

      /* A slide has to fit the viewport it is in, not the viewport the deck
       * would have had on its own. The deck sits under a utility bar and a
       * sticky header, so a slide sized at a bare 100svh puts its own footer
       * below the fold — which is exactly what the first export showed. */
      const fit = await page.locator(".pv-slide").first().evaluate((el) => ({
        bottom: Math.round(el.getBoundingClientRect().bottom),
        viewport: window.innerHeight,
      }));
      ok(fit.bottom <= fit.viewport + TOLERANCE,
         `${deck} @ ${vp.w} ${theme}: the first slide ends inside the viewport (${fit.bottom} of ${fit.viewport})`);

      /* Every slide is visited rather than measured in place: the slides are
       * in a scroll-snap container and a slide that has never been scrolled
       * to still lays out, but the reveal only settles once it has entered,
       * and a clipped line can hide behind a pre-enter clip-path. */
      const slides = await page.locator(".pv-slide").count();
      const clipped = [];
      const wrongRatio = [];
      for (let i = 0; i < slides; i++) {
        const slide = page.locator(".pv-slide").nth(i);
        await slide.evaluate((el) => el.scrollIntoView({ block: "start" }));
        await page.waitForTimeout(40);
        const m = await slide.locator(".pv-slide__canvas").evaluate((el) => {
          /* scrollHeight alone is not enough. Most masters centre their rows
           * with align-content, so content that does not fit overflows the
           * top as well as the bottom, and a scroll height never sees what
           * sits above the top edge. The measurement is the union box of the
           * canvas's own children against its padding box, which catches an
           * overflow in either direction. */
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          const inner = {
            top: r.top + parseFloat(cs.paddingTop),
            bottom: r.bottom - parseFloat(cs.paddingBottom),
            left: r.left + parseFloat(cs.paddingLeft),
            right: r.right - parseFloat(cs.paddingRight),
          };
          /* Every descendant, not just the direct children. A Schematic's
           * nodes are absolutely positioned, so one that sits past the end of
           * its frame does not grow the frame's box and a child-only
           * measurement never sees it — which is how the first export shipped
           * a node hanging off the bottom of its own figure. Anything inside
           * a clipping ancestor is skipped: FigPanel draws shapes that are
           * meant to be cropped by their panel, and that is design, not
           * overflow. */
          let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity;
          const clipped = new WeakSet();
          for (const node of el.querySelectorAll("*")) {
            const ns = getComputedStyle(node);
            if (ns.display === "none" || ns.visibility === "hidden") continue;
            if (node.parentElement !== el && clipped.has(node.parentElement)) {
              clipped.add(node);
              continue;
            }
            if (ns.overflow !== "visible") clipped.add(node);
            const cr = node.getBoundingClientRect();
            if (cr.width === 0 && cr.height === 0) continue;
            top = Math.min(top, cr.top);
            bottom = Math.max(bottom, cr.bottom);
            left = Math.min(left, cr.left);
            right = Math.max(right, cr.right);
          }
          const over = (a, b) => Math.max(0, Math.round(a - b));
          return {
            id: el.closest(".pv-slide").id,
            over: over(inner.top, top) + over(bottom, inner.bottom),
            wide: over(inner.left, left) + over(right, inner.right),
            ratio: el.clientWidth / el.clientHeight,
          };
        });
        if (m.over > TOLERANCE || m.wide > TOLERANCE) clipped.push(`${m.id} (+${m.over}h +${m.wide}w)`);
        if (Math.abs(m.ratio - 16 / 9) > 0.02) wrongRatio.push(`${m.id} (${m.ratio.toFixed(3)})`);
      }
      ok(clipped.length === 0,
         `${deck} @ ${vp.w} ${theme}: no slide clips its content${clipped.length ? ` — ${clipped.join(", ")}` : ` (${slides} slides)`}`);
      ok(wrongRatio.length === 0,
         `${deck} @ ${vp.w} ${theme}: every canvas is 16:9${wrongRatio.length ? ` — ${wrongRatio.join(", ")}` : ""}`);

      await context.close();
    }
  }
}

/* ---- 2. the keyboard pass -------------------------------------------- */

for (const deck of DECKS) {
  const { context, page } = await open(`/walkthrough/${deck}`, { width: 1920, height: 1080 });
  const total = await page.locator(".pv-slide").count();
  const current = () => page.locator(".pv-rail__link[aria-current='true']").getAttribute("aria-label");

  ok((await current()) === "Slide 1", `${deck}: the rail opens on slide 1`);

  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(120);
  ok((await current()) === "Slide 2", `${deck}: ArrowRight steps to slide 2`);

  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(120);
  ok((await current()) === "Slide 1", `${deck}: ArrowLeft steps back`);

  await page.keyboard.press("End");
  await page.waitForTimeout(160);
  ok((await current()) === `Slide ${total}`, `${deck}: End jumps to the last slide (${total})`);

  /* The CTA is the deck's own ask, and it is not allowed to appear on slide
   * two. It arrives once the visitor is past halfway and stays. */
  ok(!(await page.locator(".pv-rail__cta").isHidden()),
     `${deck}: the rail CTA is showing at the end of the deck`);

  await page.keyboard.press("Home");
  await page.waitForTimeout(160);
  ok((await current()) === "Slide 1", `${deck}: Home jumps back to the first slide`);
  ok(await page.locator(".pv-rail__cta").isHidden(),
     `${deck}: the rail CTA is hidden on slide 1 — the ask comes after the argument`);

  /* Focus lands on the slide's own heading, so a keyboard reader arrives
   * where a sighted reader's eye does. */
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(120);
  const focused = await page.evaluate(() => {
    const el = document.activeElement;
    return { tag: el.tagName.toLowerCase(), inSlide: !!el.closest(".pv-slide") };
  });
  ok(/^h[1-3]$/.test(focused.tag) && focused.inSlide,
     `${deck}: stepping moves focus to the new slide's heading (${focused.tag})`);

  /* Autoplay is off on load, every load. */
  ok((await page.locator(".pv-deck__bar [role='switch']").getAttribute("aria-checked")) === "false",
     `${deck}: autoplay is off on load`);

  /* The fit check above measures the deck as it loads. This measures it after
   * a reader has used it, which is a different thing and was broken: stepping
   * scrolled the document as well as the deck, the utility bar rolled off the
   * top, and the deck — sized against chrome that included that bar — came up
   * its height short, so a band of the contact section sat under every slide
   * with the deck's own footer row over it. The deck fills the space under the
   * sticky header, and nothing below the deck is on screen. */
  const settled = await page.evaluate(() => {
    const d = document.querySelector(".pv-deck").getBoundingClientRect();
    const next = document.querySelector(".pv-contact").getBoundingClientRect();
    const header = document.querySelector(".pv-header").getBoundingClientRect();
    return {
      gap: Math.round(window.innerHeight - d.bottom),
      underHeader: Math.round(d.top - header.bottom),
      nextTop: Math.round(next.top),
      viewport: window.innerHeight,
    };
  });
  ok(Math.abs(settled.gap) <= TOLERANCE,
     `${deck}: after stepping the deck still reaches the foot of the viewport (${settled.gap}px short)`);
  ok(settled.underHeader >= -TOLERANCE,
     `${deck}: after stepping the deck still starts below the sticky header (${settled.underHeader}px)`);
  ok(settled.nextTop >= settled.viewport - TOLERANCE,
     `${deck}: after stepping nothing below the deck is on screen (contact section at ${settled.nextTop} of ${settled.viewport})`);

  await context.close();
}

/* ---- 3. a slide is addressable --------------------------------------- */

for (const deck of DECKS) {
  const { context, page } = await open(`/walkthrough/${deck}#s-07`, { width: 1920, height: 1080 });
  await page.waitForTimeout(200);
  const label = await page.locator(".pv-rail__link[aria-current='true']").getAttribute("aria-label");
  ok(label === "Slide 7", `${deck}: #s-07 opens on the seventh slide (${label})`);

  /* And stepping rewrites the hash, so what is in the address bar is what a
   * seller would paste. */
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(160);
  const hash = await page.evaluate(() => location.hash);
  ok(hash === "#s-08", `${deck}: stepping updates the hash (${hash})`);
  await context.close();
}

/* ---- 4. the article is the baseline ---------------------------------- */

for (const deck of DECKS) {
  const { context, page } = await open(`/walkthrough/${deck}?view=page`, { width: 1280, height: 900 });
  const mode = await page.getAttribute(".pv-deck", "data-mode");
  ok(mode === "page", `${deck}: ?view=page renders the article (${mode})`);
  ok((await page.locator(".pv-rail").count()) === 0,
     `${deck}: the article has no rail — the controller returned before building one`);
  ok((await page.locator(".pv-deck").getAttribute("data-motion")) === null,
     `${deck}: the article declares no motion, so nothing is pre-hidden`);

  /* Every slide's heading is visible in the article, which is the claim that
   * JavaScript off is a readable page rather than a blank one. */
  const headings = await page.locator(".pv-slide h2").count();
  const slides = await page.locator(".pv-slide").count();
  ok(headings >= slides - 1,
     `${deck}: the article shows a heading per slide (${headings} for ${slides}; M3 carries none)`);

  const hidden = await page.locator(".pv-slide__canvas").evaluateAll(
    (els) => els.filter((el) => el.getBoundingClientRect().height < 40).length);
  ok(hidden === 0, `${deck}: no slide renders empty in the article (${hidden} collapsed)`);
  await context.close();
}

/* ---- 5. reduced motion lands the end state --------------------------- */

for (const deck of DECKS) {
  const { context, page } = await open(`/walkthrough/${deck}`, {
    width: 1920, height: 1080, reducedMotion: "reduce",
  });
  await page.waitForTimeout(120);
  /* The kit's global block collapses every duration to 0.01ms, so the end
   * state is what paints. The test is that nothing is still mid-reveal: no
   * clipped heading, no collapsed rule. */
  const mid = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll(".pv-slide[data-state] .pv-sl__h2, .pv-slide[data-state] .pv-sl__display")) {
      const clip = getComputedStyle(el).clipPath;
      if (clip && clip !== "none" && !/inset\(0(px)?( 0(px)?){0,3}\)/.test(clip.replace(/\s+/g, " "))) {
        if (el.closest(".pv-slide").dataset.state === "enter") out.push(clip);
      }
    }
    return out;
  });
  ok(mid.length === 0,
     `${deck}: under reduced motion an entered slide is in its end state${mid.length ? ` — ${mid.join(", ")}` : ""}`);
  await context.close();
}

/* ---- 6. the close slide can be used --------------------------------- */

for (const deck of DECKS) {
  const { context, page } = await open(`/walkthrough/${deck}`, { width: 1920, height: 1080 });
  await page.keyboard.press("End");
  await page.waitForTimeout(200);
  const form = page.locator(".pv-slide__canvas.pv-sl--close form.pv-form");
  ok(await form.isVisible(), `${deck}: the close slide's demo form is visible`);
  const email = form.locator("input[type='email']");
  await email.click();
  await page.keyboard.type("someone@example.com");
  ok((await email.inputValue()) === "someone@example.com",
     `${deck}: the close slide's email field takes input — the click zone does not swallow it`);

  /* Typing in a field must not step the deck. */
  const label = await page.locator(".pv-rail__link[aria-current='true']").getAttribute("aria-label");
  const total = await page.locator(".pv-slide").count();
  ok(label === `Slide ${total}`, `${deck}: typing in the form does not step the deck (${label})`);
  await context.close();
}

/* ---- 7. the front door and the gallery render ------------------------ */

for (const path of ["/walkthrough/", "/walkthrough/masters"]) {
  for (const theme of THEMES) {
    const { context, page } = await open(path, { width: 1440, height: 900, theme });
    const h1 = (await page.locator("h1").first().textContent()) || "";
    ok(h1.trim().length > 0, `${path} ${theme}: the page has a title (${h1.trim().slice(0, 40)}…)`);
    const wide = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(wide <= 2, `${path} ${theme}: nothing overflows the viewport horizontally (${wide}px)`);
    await context.close();
  }
}

/* The gallery's eleven plates all draw. A plate that collapsed would be a
 * master nobody can see, which is the thing the gallery exists to prevent. */
{
  const { context, page } = await open("/walkthrough/masters", { width: 1440, height: 900 });
  const plates = await page.locator(".pv-plate .pv-slide__canvas").evaluateAll(
    (els) => els.map((el) => Math.round(el.getBoundingClientRect().height)));
  ok(plates.length === 11, `the gallery draws eleven plates (${plates.length})`);
  ok(plates.every((h) => h > 100), `every plate has a drawn canvas (${Math.min(...plates)}px smallest)`);
  await context.close();
}

/* ---- 8. nothing threw ------------------------------------------------ */

ok(consoleErrors.length === 0,
   `no page logged a console error${consoleErrors.length ? ` — ${consoleErrors.slice(0, 5).join(" | ")}` : ""}`);

/* ---- report ---------------------------------------------------------- */

await browser.close();
if (server) server.close();

console.log(`${pass.length} passed`);
for (const f of fail) console.log("  FAIL  " + f);
console.log(fail.length ? `\n${fail.length} failed` : "\nall checks passed");
process.exit(fail.length ? 1 : 0);
