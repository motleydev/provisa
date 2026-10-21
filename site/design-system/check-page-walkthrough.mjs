/**
 * Composition checks for the slide layer, the master gallery and the three
 * briefing decks (PRO-150). No browser, no server: `site/` has no build step,
 * so the served bytes are the bytes on disk.
 *
 *   node site/design-system/check-page-walkthrough.mjs
 *
 * This is the half of the pair that needs nothing installed, on the split
 * `site/design-system/README.md` describes. `verify-page-walkthrough.mjs` is
 * the browser half, and it owns everything that needs layout: the keyboard
 * pass, hash sync, the reduced-motion end state, both themes.
 *
 * Six things are asserted here:
 *
 *   1. The gallery is on the kit, with the same chrome every other page
 *      carries and none of the pre-rebrand chrome.
 *   2. All eleven masters exist in the stylesheet and all eleven are rendered
 *      on the gallery. A master that is specified but never shown is a master
 *      nobody has looked at.
 *   3. The slide layer reads the alias layer and nothing else. The raw
 *      palette is off limits to a component, and a deck is a component.
 *   4. The controller is progressive enhancement, not a requirement: the
 *      pre-enter state that hides a reveal is gated behind data-motion, so a
 *      page with JavaScript off can never render a blank slide.
 *   5. Each of the three decks carries one slide per source slide plus the
 *      one close slide this site adds, in order, each slide on exactly one
 *      master, and each deck ends on M10 with a reachable demo form. The
 *      slide counts are the contract the redesign page's content tables cite,
 *      so a slide quietly dropped or doubled fails here.
 *   6. Nothing on the four pages points at a route that does not exist, and
 *      no page repeats an element id — two demo forms on one page is the easy
 *      way to ship a label pointing at the wrong field.
 */

import { readFileSync, existsSync } from "node:fs";

const GALLERY = "site/walkthrough/masters.html";
const INDEX = "site/walkthrough/index.html";
const CSS = "site/design-system/walkthrough.css";
const JS = "site/design-system/walkthrough.js";
const TOKENS = "site/design-system/tokens.css";

const strip = (src) => src.replace(/<!--[\s\S]*?-->/g, " ");
const read = (p) => readFileSync(p, "utf8");

const raw = read(GALLERY);
const noComments = strip(raw);
const head = (noComments.match(/<head[\s\S]*?<\/head>/) || [""])[0];
const main = (noComments.match(/<main[\s\S]*?<\/main>/) || [""])[0];
const css = read(CSS);
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, " ");
const js = read(JS);

const fail = [];
const pass = [];
const ok = (c, m) => (c ? pass : fail).push(m);
const count = (s, re) => (s.match(re) || []).length;

/* The eleven masters, in the order the plan numbers them. The number is part
 * of the contract: the Notion redesign page cites a master by M-number, so a
 * rename here without a rename there is a broken reference. M11 was not in the
 * original ten — walkthrough.css says why it is. */
const MASTERS = [
  ["M1", "cover"],
  ["M2", "divider"],
  ["M3", "statement"],
  ["M4", "columns"],
  ["M5", "ruled"],
  ["M6", "figure"],
  ["M7", "compare"],
  ["M8", "stats"],
  ["M9", "triad"],
  ["M10", "close"],
  ["M11", "bands"],
];
const MASTER_CLASSES = new Set(MASTERS.map(([, m]) => `pv-sl--${m}`));

/* The three decks, with the slide count of the PowerPoint each was
 * transcribed from. `extra` is the close slide this site adds, which the
 * source decks do not have: they end on the decision, because in a meeting
 * the ask is spoken. */
const DECKS = [
  { file: "site/walkthrough/ciso.html", route: "ciso", accent: "run", source: 19, extra: 1 },
  { file: "site/walkthrough/cto.html", route: "cto", accent: "see", source: 18, extra: 1 },
  { file: "site/walkthrough/executive.html", route: "executive", accent: "get", source: 13, extra: 1 },
];

/* --- 1. the chrome is the kit's ---------------------------------------- */

const CHROME = [
  ['href="/design-system/fonts.css"', "the self-hosted webfonts"],
  ['href="/design-system/tokens.css"', "the token layer"],
  ['href="/design-system/provisa.css"', "the components"],
  ['href="/design-system/walkthrough.css"', "the slide layer"],
  ['src="/design-system/provisa.js"', "the toggle, the drawer and the accordion"],
  ['localStorage.getItem("provisa-theme")', "the inline theme bootstrap, before first paint"],
  ['class="pv-skip"', "the skip link"],
  ['class="pv-utility"', "the utility bar"],
  ['class="pv-header"', "the site header"],
  ['class="pv-drawer"', "the mobile drawer"],
  ['class="pv-footer"', "SiteFooter"],
  ['class="pv-crumb"', "the breadcrumb, which is what says where you are"],
];
for (const [needle, why] of CHROME) {
  ok(noComments.includes(needle), needle + (noComments.includes(needle) ? "" : ` MISSING — ${why}`));
}

const OLD_CHROME = [
  ["styles.css", "the pre-kit stylesheet"],
  ["fonts.googleapis.com", "the kit self-hosts its three webfonts"],
  ['href="/#download"', "the old Download CTA; the ladder is /install and /register"],
  ['class="nav"', "the old header"],
  ["brand-mark", "the inline SVG wordmark; the kit's is BrandBars"],
];
for (const [needle, why] of OLD_CHROME) {
  ok(!noComments.includes(needle), `${needle} is gone` + (noComments.includes(needle) ? ` — FOUND: ${why}` : ""));
}

ok(/<link rel="canonical" href="https:\/\/provisa\.dev\/walkthrough\/masters">/.test(head),
   "the canonical is the extensionless route");

/* The gallery is not one of the six spine entries, so nothing in the chrome
 * may claim to be the current page. */
for (const [where, re] of [["header", /<nav class="pv-header__nav"[\s\S]*?<\/nav>/],
                           ["drawer", /<nav class="pv-drawer__nav"[\s\S]*?<\/nav>/]]) {
  const nav = (noComments.match(re) || [""])[0];
  const items = [...nav.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map((m) => m[2].trim());
  ok(String(items) === String(["Platform", "Governance", "Industries", "Interfaces", "Sources", "Compare"]),
     `the ${where} carries the six nav items (${items.join(" · ") || "none"})`);
  ok(!/aria-current/.test(nav), `the ${where} marks no current page — the gallery is not a nav item`);
}

/* --- 2. all eleven masters, specified and shown ------------------------ */

for (const [num, master] of MASTERS) {
  ok(cssNoComments.includes(`.pv-sl--${master}`),
     `${num} .pv-sl--${master} is in the stylesheet`);
  ok(new RegExp(`class="pv-slide__canvas pv-sl--${master}"`).test(noComments),
     `${num} .pv-sl--${master} is rendered on the gallery`);
  ok(new RegExp(`<b>${num}</b>`).test(main),
     `${num} is labelled on its plate — the Notion page cites masters by number`);
}

const plates = count(main, /class="pv-plate"/g);
ok(plates === MASTERS.length,
   `the gallery shows exactly the eleven masters and nothing else (${plates})`);

/* Every plate is the deck's own markup, not a one-off: a frame, a canvas, and
 * an accent on the deck. A plate that renders a slide some other way is a
 * second slide system. */
const canvases = count(main, /class="pv-slide__canvas /g);
const frames = count(main, /<section class="pv-slide">/g);
ok(canvases === plates && frames === plates,
   `each plate is one .pv-slide frame around one .pv-slide__canvas (${frames}/${canvases})`);
const accents = [...main.matchAll(/data-accent="([a-z]+)"/g)].map((m) => m[1]);
ok(accents.length === plates && accents.every((a) => ["see", "get", "run"].includes(a)),
   `every plate declares an accent from the governance triad (${[...new Set(accents)].join(" · ")})`);

/* --- 3. the slide layer reads the alias layer only --------------------- */

/* The raw palette's names, taken from tokens.css §1 rather than retyped, so
 * this cannot drift from the file it is policing. */
const tokens = read(TOKENS);
/* The section banner, not the summary at the top of the file: the file's own
 * header lists all three layers in order, so a lazy match from "1. RAW
 * PALETTE" to "3. ALIASES" would capture the header and no declarations. The
 * banner is the one that carries the em dash. */
const rawBlock = (tokens.match(/1\. RAW PALETTE —[\s\S]*?2\. TYPE \+ LAYOUT/) || [""])[0];
const rawNames = [...rawBlock.matchAll(/^--([a-z0-9-]+):/gm)].map((m) => m[1]);
ok(rawNames.length > 20, `the raw palette was found in tokens.css (${rawNames.length} names)`);

const leaked = rawNames.filter((n) => new RegExp(`var\\(--${n}\\)`).test(cssNoComments));
/* --ink is the one exception, and it is deliberate: the triad cards carry the
 * kit's light-only tints in both themes, so the ink on them has to be the ink
 * those tints were contrast-checked against rather than the theme's. The
 * comment at .pv-sl__card--see in walkthrough.css carries the reason. */
const allowed = new Set(["ink"]);
const offenders = leaked.filter((n) => !allowed.has(n));
ok(offenders.length === 0,
   `the slide layer reads no raw palette value${offenders.length ? ` — found var(--${offenders.join("), var(--")})` : ""}`);
ok(leaked.includes("ink") ? /tints are light-theme values/.test(css) : true,
   "the one raw value the slide layer reads carries the comment that justifies it");

/* No hardcoded colour, and no radius: --radius is 0 and the system is square. */
ok(!/#[0-9a-f]{3,8}\b/i.test(cssNoComments), "the slide layer hardcodes no colour");
ok(!/border-radius/.test(cssNoComments), "the slide layer sets no radius — the system is square");
ok(!/box-shadow/.test(cssNoComments), "the slide layer casts no shadow");

/* --- 4. the controller is enhancement, not a requirement --------------- */

/* The pre-enter state is what hides a reveal before it plays. Every rule that
 * sets one must be gated behind data-motion, which only the controller sets,
 * so JavaScript off can never leave a slide blank. */
const hiders = [...cssNoComments.matchAll(/^([^{}]*\[data-state="idle"\][^{}]*)\{/gm)].map((m) => m[1]);
ok(hiders.length > 0, `the stylesheet carries a pre-enter state (${hiders.length} selectors)`);
ok(hiders.every((s) => s.includes('[data-motion="on"]')),
   "every pre-enter rule is gated behind data-motion, so JavaScript off renders the slide");

ok(/\.pv-deck\[data-walkthrough\]/.test(js),
   "the controller only attaches to a deck that opts in with data-walkthrough");
ok(/params\.get\("view"\) === "page"/.test(js),
   "?view=page returns before the controller is built — the escape hatch is real");
ok(/aria-current/.test(js), "the rail marks the current slide");
ok(/"ArrowRight"/.test(js) && /"Home"/.test(js) && /"End"/.test(js),
   "the keyboard pass covers stepping and both ends");
ok(/aria-checked", "false"/.test(js), "autoplay starts off");

/* The gallery is a contact sheet, not a deck: it must not opt into the
 * controller, or eleven plates would each try to become a walkthrough. */
ok(!/data-walkthrough/.test(noComments),
   "the gallery does not opt into the controller — it is plates, not a deck");

/* --- 5. the three decks ------------------------------------------------ */

for (const deck of DECKS) {
  const name = deck.route;
  ok(existsSync(deck.file), `${name}: the deck exists at ${deck.file}`);
  if (!existsSync(deck.file)) continue;

  const src = strip(read(deck.file));
  const dmain = (src.match(/<main[\s\S]*?<\/main>/) || [""])[0];
  const dhead = (src.match(/<head[\s\S]*?<\/head>/) || [""])[0];

  /* Every chrome element except the breadcrumb. A deck page's content is a
   * full-viewport canvas, and a crumb has nowhere to sit above it that is not
   * inside the first slide; the way back is the header, the footer's
   * walkthrough link and the close slide, all of which are asserted. */
  for (const [needle, why] of CHROME.filter(([n]) => n !== 'class="pv-crumb"')) {
    ok(src.includes(needle), `${name}: ${needle}` + (src.includes(needle) ? "" : ` MISSING — ${why}`));
  }
  ok(src.includes('src="/design-system/walkthrough.js"'),
     `${name}: the controller is loaded`);
  ok(new RegExp(`<link rel="canonical" href="https://provisa\\.dev/walkthrough/${name}">`).test(dhead),
     `${name}: the canonical is the extensionless route`);

  /* One deck per page, opted in, accented off the governance triad. */
  const decks = count(dmain, /class="pv-deck"/g);
  ok(decks === 1, `${name}: the page carries exactly one deck (${decks})`);
  ok(new RegExp(`<div class="pv-deck" data-walkthrough data-accent="${deck.accent}">`).test(dmain),
     `${name}: the deck opts in and leads with ${deck.accent}`);

  /* One slide per source slide, plus the close slide this site adds. */
  const expected = deck.source + deck.extra;
  const ids = [...dmain.matchAll(/<section class="pv-slide" id="(s-\d\d)">/g)].map((m) => m[1]);
  ok(ids.length === expected,
     `${name}: ${expected} slides — ${deck.source} from the source deck plus ${deck.extra} close (${ids.length})`);
  const wanted = Array.from({ length: expected }, (_, i) => "s-" + String(i + 1).padStart(2, "0"));
  ok(String(ids) === String(wanted),
     `${name}: the slide ids run s-01 to ${wanted[wanted.length - 1]} in document order`);

  /* Each slide is one canvas on exactly one master. A canvas carrying two
   * master classes is two layouts fighting; one carrying none is a slide
   * nobody designed. */
  const canvasClasses = [...dmain.matchAll(/class="pv-slide__canvas ([^"]+)"/g)].map((m) => m[1].trim().split(/\s+/));
  ok(canvasClasses.length === expected,
     `${name}: every slide frame holds one canvas (${canvasClasses.length}/${expected})`);
  const bad = canvasClasses.filter((cs) => cs.filter((c) => MASTER_CLASSES.has(c)).length !== 1);
  ok(bad.length === 0,
     `${name}: every canvas is on exactly one master${bad.length ? ` — found ${bad.map((c) => c.join("+")).join(", ")}` : ""}`);

  /* The deck ends on the close, and the close is where the CTA is. */
  const last = dmain.slice(dmain.lastIndexOf(`id="${wanted[wanted.length - 1]}"`));
  ok(/pv-sl--close/.test(last), `${name}: the last slide is M10, the close`);
  ok(/action="\/api\/demo"/.test(last), `${name}: the close slide carries the demo form`);

  /* The rail's halfway CTA and the header's button both target #contact, so
   * the page has to have one. */
  ok(/id="contact"/.test(dmain), `${name}: #contact exists for the rail CTA and the header button`);

  /* Autoplay, the page-mode link and the rail are the controller's, not the
   * page's: a deck that hand-rolled them would drift from the other two. */
  ok(!/class="pv-rail"/.test(dmain) && !/pv-deck__bar/.test(dmain),
     `${name}: the rail and the control bar come from the controller, not the markup`);
}

/* --- the front door links all three, and the gallery ------------------- */

const index = strip(read(INDEX));
for (const deck of DECKS) {
  ok(new RegExp(`href="/walkthrough/${deck.route}"`).test(index),
     `the front door links the ${deck.route} briefing`);
}
ok(/href="\/walkthrough\/masters"/.test(index), "the front door links the master gallery");

/* --- 6. routes resolve, and no page repeats an id --------------------- */

const PAGES = [INDEX, GALLERY, ...DECKS.map((d) => d.file)];

/* Cloudflare Pages serves `/x` from `x.html` and `/x/` from `x/index.html`.
 * Anything else — a mailto, a full URL, a bare fragment — is not this
 * checker's business. */
const resolves = (href) => {
  const path = href.replace(/[?#].*$/, "");
  if (path === "" || path === "/") return existsSync("site/index.html");
  const rel = "site" + path;
  return existsSync(rel) || existsSync(rel + ".html") ||
         existsSync(rel.replace(/\/$/, "") + "/index.html");
};

for (const page of PAGES) {
  const src = strip(read(page));
  const ids = [...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  ok(dupes.length === 0,
     `${page}: every element id is unique${dupes.length ? ` — repeated: ${dupes.join(", ")}` : ""}`);

  const hrefs = [...src.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
  const broken = [...new Set(hrefs.filter(
    (h) => !h.startsWith("//") && !resolves(h)))];
  ok(broken.length === 0,
     `${page}: every internal route resolves${broken.length ? ` — missing: ${broken.join(", ")}` : ""}`);

  /* A fragment link has to have something to land on, on this page. */
  const frags = [...new Set([...src.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]))];
  const missing = frags.filter((f) => !new RegExp(`\\sid="${f}"`).test(src));
  ok(missing.length === 0,
     `${page}: every fragment link has a target${missing.length ? ` — missing: #${missing.join(", #")}` : ""}`);

  /* Every page in the walkthrough carries the way back into it. */
  ok(/href="\/walkthrough\/"/.test(src) || page === INDEX,
     `${page}: links back to the walkthrough's front door`);
}

/* --- report ----------------------------------------------------------- */

console.log(`${pass.length} passed`);
for (const f of fail) console.log("  FAIL  " + f);
console.log(fail.length ? `\n${fail.length} failed` : "\nall checks passed");
process.exit(fail.length ? 1 : 0);
