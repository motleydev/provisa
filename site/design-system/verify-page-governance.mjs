/**
 * Render and composition checks for /why/governance (PRO-14).
 *
 * Re-runnable, so the acceptance criteria are a command rather than a claim in
 * a comment. Needs Playwright, which site/ deliberately does not depend on:
 *   npm i playwright && npx playwright install chromium
 *
 *   python3 -m http.server 8731 --directory site &
 *   node site/design-system/verify-page-governance.mjs http://127.0.0.1:8731
 *
 * The five widths and both themes are acceptance criterion 1. The check that
 * matters most is acceptance criterion 7, disclosure parity: this page's
 * argument only works if the disclosure is as prominent as the claim, so the
 * three disclosures are measured against the claims they qualify — painted
 * font size and painted colour, in both themes, at every width — rather than
 * eyeballed. Demoting one visually is the one way to break this page.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://127.0.0.1:8731";
const URL = BASE + "/why/governance.html";
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
        if (el.closest(".pv-table, .pv-code, .pv-codetabs__tabs")
            && !el.classList.contains("pv-table")
            && !el.classList.contains("pv-codetabs__tabs")) continue;
        if (r.right > w + 1 || r.left < -1) out.push(el.className || el.tagName);
      }
      return out.slice(0, 5);
    });
    ok(escapees.length === 0, `${at}: nothing escapes the viewport (${escapees.join(", ") || "none"})`);

    /* AC 3. Six LayerRows, 0-4 in the trio and the hook in slate with no
     * index, measured off the painted left rule rather than off the class —
     * four distinct rule colours in the order the brief sets, and the hook's
     * outside the three. */
    const rows = await page.evaluate(() => {
      const px = (el) => getComputedStyle(el);
      return [...document.querySelectorAll(".pv-layer--detail")].map((el) => ({
        rule: px(el).borderLeftColor,
        tint: px(el).backgroundColor,
        idx: el.querySelector(".pv-layer__idx")?.textContent.trim() ?? null,
        titleLeft: Math.round(el.querySelector(".pv-layer__title").getBoundingClientRect().left),
        titleSize: px(el.querySelector(".pv-layer__title")).fontSize,
        descSize: px(el.querySelector(".pv-layer__desc")).fontSize,
        descColor: px(el.querySelector(".pv-layer__desc")).color,
        clipped: el.scrollHeight > el.clientHeight + 1,
      }));
    });
    ok(rows.length === 6, `${at}: six LayerRows (${rows.length})`);
    ok(rows.map((r) => r.idx).join("|") === "00|01|02|03|04|",
       `${at}: 00-04 with no gap and the hook unnumbered (${rows.map((r) => r.idx ?? "—").join(" ")})`);
    ok(rows[0].rule === rows[1].rule && rows[2].rule === rows[3].rule,
       `${at}: layers 0-1 share a rule colour and 2-3 share another`);
    ok(new Set(rows.map((r) => r.rule)).size === 4,
       `${at}: four distinct rule colours across the six rows (${new Set(rows.map((r) => r.rule)).size})`);
    ok(![rows[0], rows[2], rows[4]].some((r) => r.rule === rows[5].rule),
       `${at}: the hook's rule is outside the trio (${rows[5].rule})`);
    ok(new Set(rows.map((r) => r.titleLeft)).size === 1,
       `${at}: every row's title sits on one line, numbered or not (${[...new Set(rows.map((r) => r.titleLeft))].join(", ")})`);
    ok(rows.every((r) => !r.clipped), `${at}: no LayerRow clips its own text`);

    /* AC 7, measured. The hook's row is the quietest colour on the page and
     * must still be the same type as the five above it. */
    ok(new Set(rows.map((r) => r.titleSize)).size === 1 &&
       new Set(rows.map((r) => r.descSize)).size === 1 &&
       new Set(rows.map((r) => r.descColor)).size === 1,
       `${at}: the hook's row is the same type and colour as the five layers`);

    /* AC 7. §3's footnote against the LayerRow descriptions it qualifies, and
     * §8's callout against the three cards it qualifies. Same colour, and no
     * smaller — a disclosure set in --text-muted or at --type-caption is the
     * failure the brief names. */
    const parity = await page.evaluate(() => {
      const n = (s) => parseFloat(s);
      const g = (el) => { const c = getComputedStyle(el); return { size: n(c.fontSize), color: c.color }; };
      /* Painted contrast against the element's own background, so "not
       * demoted" is measured rather than asserted as colour equality — a
       * disclosure may be stronger than the claim, only never weaker. */
      const lin = (c) => (c /= 255, c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      const lum = (s) => { const [r, gg, b] = s.match(/\d+(\.\d+)?/g).map(Number);
                           return 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b); };
      const bgOf = (el) => {
        for (let e = el; e; e = e.parentElement) {
          const c = getComputedStyle(e).backgroundColor;
          if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c;
        }
        return "rgb(255,255,255)";
      };
      const contrast = (el) => {
        const a = lum(getComputedStyle(el).color), b = lum(bgOf(el));
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      };
      const gc = (el) => ({ ...g(el), contrast: contrast(el) });

      const note = gc(document.querySelector(".pv-note"));
      const desc = gc(document.querySelector(".pv-layer__desc"));
      const callouts = [...document.querySelectorAll(".pv-callout")];
      const qualifier = callouts.find((c) => c.textContent.includes("That immutability is enforced by"));
      const cards = [...document.querySelectorAll("#audit .pv-ruled__body")];
      /* §5 card 1 is the bypass disclosure; cards 2 and 3 are the claims it
       * sits beside. All three must be one row of one grid at one weight. */
      const joins = [...document.querySelectorAll("#join-guard .pv-ruled")];
      return {
        note, desc,
        qualifier: gc(qualifier.querySelector(".pv-callout__body")),
        card: gc(cards[0]),
        joinSizes: joins.map((c) => n(getComputedStyle(c.querySelector(".pv-ruled__body")).fontSize)),
        joinColors: joins.map((c) => getComputedStyle(c.querySelector(".pv-ruled__body")).color),
        joinTops: joins.map((c) => Math.round(c.getBoundingClientRect().top + scrollY)),
        joinTitleSizes: joins.map((c) => n(getComputedStyle(c.querySelector(".pv-ruled__title")).fontSize)),
      };
    });
    /* "At the same weight" means never weaker. Mono sets smaller at the same
     * nominal size, so the footnote is allowed 2.5px of that and no colour
     * loss at all; the §8 qualifier is a Callout, whose body is --text-primary
     * and so stronger than the --text-body of the cards — which is fine, and
     * the reverse is not. */
    ok(parity.note.color === parity.desc.color && parity.note.size >= parity.desc.size - 2.5,
       `${at}: §3's footnote is the colour of the layers it qualifies (${parity.note.size}px ${parity.note.color} vs ${parity.desc.size}px ${parity.desc.color})`);
    ok(parity.qualifier.size >= parity.card.size && parity.qualifier.contrast >= parity.card.contrast - 0.01,
       `${at}: §8's qualifier is no quieter than the three cards (${parity.qualifier.size}px at ${parity.qualifier.contrast.toFixed(2)}:1 vs ${parity.card.size}px at ${parity.card.contrast.toFixed(2)}:1)`);
    ok(parity.joinSizes.length === 3 && new Set(parity.joinSizes).size === 1
       && new Set(parity.joinColors).size === 1 && new Set(parity.joinTitleSizes).size === 1,
       `${at}: §5's bypass card is the weight of the two beside it`);
    /* 996px is what pv-grid--3 needs for three columns (3x300 + 2x48); the
     * container reaches it from 1076px of viewport. Below that the grid is
     * allowed to wrap, and the bypass card is first either way. */
    ok(width < 1076 || new Set(parity.joinTops).size === 1,
       `${at}: §5's three cards are one row, so the bypasses are not below the fold of the claim (${[...new Set(parity.joinTops)].join(", ")})`);

    /* AC 4. Three tabs, one panel visible, and the panel the tab names. */
    const tabs = await page.evaluate(() => {
      const t = [...document.querySelectorAll('[role="tab"]')];
      const p = [...document.querySelectorAll('[role="tabpanel"]')];
      return {
        tabs: t.length,
        selected: t.filter((x) => x.getAttribute("aria-selected") === "true").length,
        visible: p.filter((x) => !x.hidden).length,
        wires: t.map((x) => x.querySelector(".pv-codetabs__wire").textContent.trim()),
      };
    });
    ok(tabs.tabs === 3, `${at}: three tabs (${tabs.tabs})`);
    ok(tabs.selected === 1 && tabs.visible === 1, `${at}: exactly one tab selected and one panel shown`);
    ok(tabs.wires.join(" ") === "SQL POST /data/compile POST /data/sql/explain",
       `${at}: the two routes are named and not merged (${tabs.wires.join(" | ")})`);

    /* AC 2, in the DOM the browser built rather than in the source — alt text,
     * aria-label and <meta> included. */
    const compliance = await page.evaluate(() => {
      const names = ["hipaa", "fedramp", "soc 2", "soc2", "pci", "iso 27001", "gdpr"];
      const hay = (document.documentElement.outerHTML + " " +
        [...document.querySelectorAll("[aria-label], [alt], meta[content], [title]")]
          .map((el) => (el.getAttribute("aria-label") || "") + " " + (el.getAttribute("alt") || "") +
                       " " + (el.getAttribute("content") || "") + " " + (el.getAttribute("title") || ""))
          .join(" ")).toLowerCase();
      return names.filter((n) => hay.includes(n));
    });
    ok(compliance.length === 0, `${at}: no certification name in the rendered page (${compliance.join(", ") || "none"})`);

    /* AC 5 and 6. Neither held-back link is in <main>. */
    const held = await page.evaluate(() =>
      [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href"))
        .filter((h) => h.includes("/why/lineage") || h.includes("traceability_matrix")));
    ok(held.length === 0, `${at}: no dead evidence link (${held.join(", ") || "none"})`);

    /* One primary action on the page. The header's is chrome. */
    const primaries = await page.evaluate(() =>
      [...document.querySelectorAll("main .pv-btn")]
        .filter((b) => !b.className.includes("--secondary") && !b.className.includes("--inverse")).length);
    ok(primaries === 1, `${at}: one primary action in <main> (${primaries})`);

    /* Every in-page anchor resolves. #contact is the header's own target. */
    const dangling = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute("href"))
        .filter((h) => h.length > 1 && !document.querySelector(h)));
    ok(dangling.length === 0, `${at}: every fragment link resolves (${dangling.join(", ") || "none"})`);

    /* The nav and the drawer swap at --bp-nav, read off the element rather
     * than restated here — the token moved from 1280px to 1300px when the
     * header's secondary action became the free licence. */
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

/* One keyboard and semantics pass, at one width: the components are the kit's
 * and the kit's own pass covers them. What is new here is the composition. */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "load" });

  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement.className);
  ok(first.includes("pv-skip"), `keyboard: the first Tab reaches the skip link (${first})`);

  /* The tabs move on Arrow, which is what makes the third tab reachable. */
  await page.click("#t-asked");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  const onThird = await page.evaluate(() => document.activeElement.id);
  ok(onThird === "t-explain", `keyboard: Arrow reaches the third tab (${onThird})`);
  const shown = await page.evaluate(() => document.querySelector("#p-explain").hidden === false);
  ok(shown, "keyboard: the third panel shows when its tab is selected");

  const named = await page.evaluate(() =>
    [...document.querySelectorAll("input, button, select, textarea")]
      .filter((el) => !el.labels?.length && !el.getAttribute("aria-label")
                      && !el.textContent.trim() && !el.getAttribute("aria-labelledby")).length);
  ok(named === 0, `a11y: every form control has an accessible name (${named} without)`);

  const captions = await page.evaluate(() =>
    [...document.querySelectorAll("table")].filter((t) => !t.querySelector("caption")).length);
  ok(captions === 0, `a11y: both tables carry a caption (${captions} without)`);

  const figs = await page.evaluate(() =>
    [...document.querySelectorAll(".pv-fig")].map((f) => f.getAttribute("aria-label") || ""));
  ok(figs.length === 2 && figs.every((a) => a.length > 40),
     `a11y: both figures carry real alt text (${figs.length})`);

  const h = await page.evaluate(() => ({
    h1: document.querySelectorAll("h1").length,
    order: [...document.querySelectorAll("main h1, main h2, main h3")].map((e) => +e.tagName[1]),
  }));
  ok(h.h1 === 1, `a11y: exactly one h1 (${h.h1})`);
  ok(h.order.every((lvl, i) => i === 0 || lvl <= h.order[i - 1] + 1),
     "a11y: no heading level is skipped");

  await ctx.close();
}

await browser.close();

console.log(`${pass.length} passed`);
for (const f of fail) console.log("  FAIL  " + f);
console.log(fail.length ? `\n${fail.length} failed` : "\nall checks passed");
process.exit(fail.length ? 1 : 0);
