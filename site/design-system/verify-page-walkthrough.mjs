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
  await settleViewport(page);
  return { context, page };
}

/* Wait for 100svh to agree with the viewport this context asked for.
 *
 * Headless Chromium applies an emulated viewport through the devtools
 * protocol, and the small-viewport unit can still be reporting the real window
 * for a frame or two after load — 1233px where innerHeight is already 1080.
 * A deck sized at calc(100svh - chrome) measured in that window looks 153px
 * too tall, and the page is not wrong: on a real browser a change in svh
 * fires a resize, which the controller already re-measures on. Without this
 * wait the geometry assertions below pass or fail on how fast the emulation
 * landed, which is the kind of flake that gets a suite ignored. */
async function settleViewport(page) {
  await page.waitForFunction(() => {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:100svh;pointer-events:none;visibility:hidden";
    document.body.append(probe);
    const svh = probe.getBoundingClientRect().height;
    probe.remove();
    return Math.abs(svh - window.innerHeight) <= 1;
  }, null, { timeout: 5000 });
  /* And one frame for the controller's resize handler to have run. */
  await page.evaluate(() => new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r))));
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
      /* Reduced motion for the overflow pass, which is a geometry question and
       * not a motion one: every duration collapses to 0.01ms, so a slide is in
       * its finished state the moment it reaches the stage and the measurement
       * never catches a rule mid-draw. Sections 2 and 5 exercise the motion. */
      const { context, page } = await open(`/walkthrough/${deck}`, {
        width: vp.w, height: vp.h, theme, reducedMotion: "reduce",
      });

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

      /* The stage holds one slide and the rest are visibility:hidden, so every
       * slide is brought to the stage by its own tab before it is measured.
       * A hidden slide still lays out, but the measurement below skips hidden
       * nodes by design — a figure's shapes among them — so measuring one off
       * the stage would be measuring an empty box. */
      const slides = await page.locator(".pv-slide").count();
      const tabs = await page.locator(".pv-tabs__tab").count();
      ok(tabs === slides, `${deck} @ ${vp.w} ${theme}: one tab per slide (${tabs} of ${slides})`);

      const clipped = [];
      const wrongRatio = [];
      for (let i = 0; i < slides; i++) {
        const slide = page.locator(".pv-slide").nth(i);
        await page.locator(".pv-tabs__tab").nth(i).click();
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

      /* One slide on the stage, and it is the one the strip says. Two visible
       * slides would mean a wipe that never finished parking the one it
       * replaced — which on the close slide is an inverse band over paper.
       * The parking is the wipe's own animationend, so the wait is for that
       * event to have been delivered rather than for a number of frames a
       * headless browser is free not to produce. */
      let parked = true;
      try {
        await page.waitForFunction(
          () => !document.querySelector('.pv-slide[data-show="out"]'), null, { timeout: 2000 });
      } catch {
        parked = false;
      }
      ok(parked, `${deck} @ ${vp.w} ${theme}: the wipe parked the slide it replaced`);

      let onStage = true;
      try {
        await page.waitForFunction(() => {
          const shown = [...document.querySelectorAll(".pv-slide")]
            .filter((el) => getComputedStyle(el).visibility === "visible");
          const tab = document.querySelector(".pv-tabs__tab[aria-selected='true']");
          return shown.length === 1 && tab && shown[0].id === tab.getAttribute("aria-controls");
        }, null, { timeout: 2000 });
      } catch {
        onStage = false;
      }
      const stage = onStage ? null : await page.evaluate(() => {
        const tab = document.querySelector(".pv-tabs__tab[aria-selected='true']");
        return {
          shown: [...document.querySelectorAll(".pv-slide")]
            .filter((el) => getComputedStyle(el).visibility === "visible")
            .map((el) => `${el.id}[show=${el.dataset.show} state=${el.dataset.state}]`),
          says: tab ? tab.getAttribute("aria-controls") : null,
        };
      });
      ok(onStage,
         `${deck} @ ${vp.w} ${theme}: one slide on the stage, the one the strip marks` +
         (stage ? ` — ${stage.shown.join(", ")} / ${stage.says}` : ""));

      /* And nothing in deck mode scrolls — neither the stage nor the document
       * behind it. The long scroll is ?view=page's job. */
      const scrollers = await page.evaluate(() => {
        const d = document.querySelector(".pv-deck");
        const r = document.documentElement;
        return {
          deck: d.scrollHeight - d.clientHeight,
          root: r.scrollHeight - r.clientHeight,
          rootOverflow: getComputedStyle(r).overflow,
        };
      });
      ok(scrollers.deck <= TOLERANCE,
         `${deck} @ ${vp.w} ${theme}: the stage has nothing to scroll (${scrollers.deck}px over)`);
      ok(scrollers.rootOverflow === "hidden",
         `${deck} @ ${vp.w} ${theme}: the document cannot be scrolled in deck mode (${scrollers.rootOverflow})`);

      await context.close();
    }
  }
}

/* ---- 2. the keyboard pass -------------------------------------------- */

for (const deck of DECKS) {
  const { context, page } = await open(`/walkthrough/${deck}`, { width: 1920, height: 1080 });
  const total = await page.locator(".pv-slide").count();
  /* Which slide the strip says is on the stage, by the panel its selected tab
   * controls. The tab's own text is the index, and its accessible name
   * carries the slide's title. */
  const current = () =>
    page.locator(".pv-tabs__tab[aria-selected='true']").getAttribute("aria-controls");
  const id = (n) => "s-" + String(n).padStart(2, "0");

  ok((await current()) === id(1), `${deck}: the strip opens on slide 1`);

  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(320);
  ok((await current()) === id(2), `${deck}: ArrowRight steps to slide 2`);

  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(320);
  ok((await current()) === id(1), `${deck}: ArrowLeft steps back`);

  await page.keyboard.press("End");
  await page.waitForTimeout(320);
  ok((await current()) === id(total), `${deck}: End jumps to the last slide (${total})`);

  /* The CTA is the deck's own ask, and it is not allowed to appear on slide
   * two: it arrives once the visitor is past halfway, and goes again on the
   * close slide, where the form it jumps to is the slide a reader is looking
   * at. A button that scrolls you to where you already are is worse than no
   * button. */
  ok(await page.locator(".pv-tabs__cta").isHidden(),
     `${deck}: the strip CTA is gone on the close slide — the form is already on screen`);

  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(320);
  ok(!(await page.locator(".pv-tabs__cta").isHidden()),
     `${deck}: the strip CTA is showing on the slide before the close`);

  /* And it jumps to the close slide, which is where the form is. */
  const target = await page.locator(".pv-tabs__cta").getAttribute("href");
  ok(target === "#" + id(total),
     `${deck}: the strip CTA jumps to the close slide (${target})`);
  await page.locator(".pv-tabs__cta").click();
  await page.waitForTimeout(320);
  ok((await current()) === id(total),
     `${deck}: clicking it puts the close slide on the stage`);

  await page.keyboard.press("Home");
  await page.waitForTimeout(320);
  ok((await current()) === id(1), `${deck}: Home jumps back to the first slide`);
  ok(await page.locator(".pv-tabs__cta").isHidden(),
     `${deck}: the strip CTA is hidden on slide 1 — the ask comes after the argument`);

  /* A tab is a jump, and it keeps focus where a tab set keeps it: on the tab,
   * so the arrow keys carry on working from there. The slide behind it is the
   * panel, reachable by Tab, which is the pattern assistive technology knows
   * how to walk. */
  await page.locator(".pv-tabs__tab").nth(4).click();
  await page.waitForTimeout(320);
  const afterTab = await page.evaluate(() => {
    const el = document.activeElement;
    return {
      onTab: el.classList.contains("pv-tabs__tab"),
      selected: el.getAttribute("aria-selected"),
      shown: [...document.querySelectorAll(".pv-slide")]
        .filter((s) => getComputedStyle(s).visibility === "visible").map((s) => s.id),
    };
  });
  ok((await current()) === id(5), `${deck}: clicking the fifth tab puts slide 5 on the stage`);
  ok(afterTab.onTab && afterTab.selected === "true",
     `${deck}: focus stays on the tab that was clicked`);
  ok(afterTab.shown.length === 1 && afterTab.shown[0] === id(5),
     `${deck}: the wipe parked the slide it replaced (${afterTab.shown.join(", ")})`);

  /* Arrow keys from inside the strip select as they move and keep focus on
   * the strip — automatic activation, because the panel is the content. */
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(320);
  const stepped = await page.evaluate(() => ({
    onTab: document.activeElement.classList.contains("pv-tabs__tab"),
    label: document.activeElement.getAttribute("aria-controls"),
  }));
  ok(stepped.onTab && stepped.label === id(6),
     `${deck}: an arrow key inside the strip moves the selection and keeps focus there (${stepped.label})`);

  /* Stepping from outside the strip lands focus on the slide's own heading,
   * so a keyboard reader arrives where a sighted reader's eye does. The deck
   * itself takes focus first, because the assertions above left it on a tab
   * and a step from there is the tab-set behaviour, not this one. */
  await page.locator(".pv-deck").evaluate((el) => el.focus());
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(320);
  const focused = await page.evaluate(() => {
    const el = document.activeElement;
    return { tag: el.tagName.toLowerCase(), inSlide: !!el.closest(".pv-slide") };
  });
  ok(/^h[1-3]$/.test(focused.tag) && focused.inSlide,
     `${deck}: stepping moves focus to the new slide's heading (${focused.tag})`);

  /* The strip wears the briefing's accent. It only can while it is inside the
   * deck, which is where the see/get/run custom properties are declared — as a
   * sibling above the deck it inherited the page's ink instead and every deck
   * had the same black tab, which is the one thing three accented briefings
   * must not look like. */
  const accent = await page.evaluate(() => {
    const deckEl = document.querySelector(".pv-deck");
    const probe = document.createElement("span");
    probe.style.cssText = "color:var(--accent-text);position:absolute;visibility:hidden";
    deckEl.append(probe);
    const want = getComputedStyle(probe).color;
    probe.remove();
    const cs = getComputedStyle(document.querySelector(".pv-tabs__tab[aria-selected='true']"));
    return { want, got: cs.color, rule: cs.borderBottomColor, ink: getComputedStyle(document.body).color };
  });
  ok(accent.got === accent.want && accent.rule !== accent.ink,
     `${deck}: the selected tab is the deck's accent, not the page's ink (${accent.got} / want ${accent.want})`);

  /* Autoplay is off on load, every load. */
  ok((await page.locator(".pv-deck__bar [role='switch']").getAttribute("aria-checked")) === "false",
     `${deck}: autoplay is off on load`);

  /* The fit check above measures the deck as it loads. This measures it after
   * a reader has used it, which is a different thing and was broken once:
   * stepping scrolled the document as well as the deck, the utility bar rolled
   * off the top, and the deck — sized against chrome that included that bar —
   * came up its height short, so a band of the contact section sat under every
   * slide with the deck's own footer row over it. The stage fills the space
   * under the strip, and nothing below the deck is on screen. */
  const settled = await page.evaluate(() => {
    const d = document.querySelector(".pv-deck").getBoundingClientRect();
    const next = document.querySelector(".pv-contact").getBoundingClientRect();
    const strip = document.querySelector(".pv-tabs").getBoundingClientRect();
    const header = document.querySelector(".pv-header").getBoundingClientRect();
    const slide = document.querySelector('.pv-slide[data-show="on"]').getBoundingClientRect();
    return {
      gap: Math.round(window.innerHeight - d.bottom),
      slideUnderStrip: Math.round(slide.top - strip.bottom),
      slideFoot: Math.round(window.innerHeight - slide.bottom),
      deckUnderHeader: Math.round(d.top - header.bottom),
      nextTop: Math.round(next.top),
      viewport: window.innerHeight,
    };
  });
  ok(Math.abs(settled.gap) <= TOLERANCE,
     `${deck}: after stepping the deck still reaches the foot of the viewport (${settled.gap}px short)`);
  ok(Math.abs(settled.slideUnderStrip) <= TOLERANCE && Math.abs(settled.slideFoot) <= TOLERANCE,
     `${deck}: after stepping the stage is exactly the room under the strip (${settled.slideUnderStrip}px below it, ${settled.slideFoot}px above the fold)`);
  ok(settled.deckUnderHeader >= -TOLERANCE,
     `${deck}: the deck starts below the sticky header rather than under it (${settled.deckUnderHeader}px)`);
  ok(settled.nextTop >= settled.viewport - TOLERANCE,
     `${deck}: after stepping nothing below the deck is on screen (contact section at ${settled.nextTop} of ${settled.viewport})`);

  await context.close();
}

/* ---- 3. a slide is addressable --------------------------------------- */

for (const deck of DECKS) {
  const { context, page } = await open(`/walkthrough/${deck}#s-07`, { width: 1920, height: 1080 });
  await page.waitForTimeout(200);
  const label = await page.locator(".pv-tabs__tab[aria-selected='true']").getAttribute("aria-controls");
  ok(label === "s-07", `${deck}: #s-07 opens on the seventh slide (${label})`);

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
  ok((await page.locator(".pv-tabs").count()) === 0,
     `${deck}: the article has no tab strip — the controller returned before building one`);
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

  /* And the article is the rendering that scrolls. Deck mode holds the
   * document at its top and hides the root's overflow; page mode must undo
   * both, or ?view=page would be a deck with its controls missing. */
  const article = await page.evaluate(() => ({
    deckMode: document.documentElement.dataset.deckMode,
    overflow: getComputedStyle(document.documentElement).overflow,
    scrollable: document.documentElement.scrollHeight - document.documentElement.clientHeight,
  }));
  ok(article.deckMode === undefined && article.overflow !== "hidden" && article.scrollable > 1000,
     `${deck}: the article scrolls (${article.scrollable}px of it, root overflow ${article.overflow})`);
  await context.close();
}

/* ---- 5. reduced motion lands the end state --------------------------- */

for (const deck of DECKS) {
  const { context, page } = await open(`/walkthrough/${deck}`, {
    width: 1920, height: 1080, reducedMotion: "reduce",
  });
  /* Two frames: a transition collapsed to 0.01ms still needs a frame to land,
   * and the reveal starts from the pre-enter state on purpose. */
  await page.evaluate(() => new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r))));
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

  /* The wipe is an animation rather than a transition, and the kit's block
   * collapses both, so the arriving slide has to be fully uncovered too — a
   * slide left at inset(0 0 0 100%) would be a blank stage. */
  await page.keyboard.press("ArrowRight");
  /* The wipe's own timing, read through the Web Animations API rather than
   * guessed at with a wait: the question is whether the kit's block collapsed
   * this animation's duration, and the answer is a number the browser will
   * hand over. Waiting for the animation to exist is the only timing here, and
   * it is a condition rather than a clock. */
  await page.waitForFunction(() => {
    const el = document.querySelector('.pv-slide[data-show="on"]');
    return el && el.getAnimations().length > 0;
  }, null, { timeout: 2000 });
  const arrived = await page.evaluate(async () => {
    const el = document.querySelector('.pv-slide[data-show="on"]');
    const durations = el.getAnimations().map((a) => a.effect.getComputedTiming().duration);
    await Promise.all(el.getAnimations().map((a) => a.finished.catch(() => {})));
    return { id: el.id, durations, clip: getComputedStyle(el).clipPath.replace(/\s+/g, " ") };
  });
  /* inset(0px 0px 0px 0%) and inset(0px) are the same end state; the browser
   * keeps whichever unit the keyframe was written in. */
  ok(arrived.id === "s-02" && arrived.durations.every((d) => d <= 1) &&
     (arrived.clip === "none" || /^inset\((0px|0%)( (0px|0%)){0,3}\)$/.test(arrived.clip)),
     `${deck}: under reduced motion the next slide arrives uncovered at once (${arrived.id}, ${arrived.durations.join("/")}ms, ${arrived.clip})`);
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
  const label = await page.locator(".pv-tabs__tab[aria-selected='true']").getAttribute("aria-controls");
  const total = await page.locator(".pv-slide").count();
  ok(label === "s-" + String(total).padStart(2, "0"),
     `${deck}: typing in the form does not step the deck (${label})`);
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
