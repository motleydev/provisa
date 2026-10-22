#!/usr/bin/env node
/**
 * Two static checks on the kit itself, both of which exist because a build
 * found the defect by reading the CSS rather than by looking at a page
 * (no browser can start in the build sandbox, so verify-ui.mjs cannot run).
 *
 *   node site/design-system/check-kit.mjs
 *   node site/design-system/check-kit.mjs --quiet   failures only
 *
 * 1. LINKS. Every internal href in the partials and in every built page
 *    resolves to a file that will actually be served, under Cloudflare Pages'
 *    resolution rules (see wrangler.jsonc: site/ is the asset root):
 *
 *      /a/b.html   → site/a/b.html
 *      /a/b        → site/a/b.html, else site/a/b/index.html
 *      /a/         → site/a/index.html
 *      /           → site/index.html
 *
 *    _redirects is honoured for exact-path rules. This check is here because
 *    the primary nav shipped on three pages with /vs/ in it and /vs/index.html
 *    does not exist (PRO-3, found while building PRO-16): the chrome is a
 *    partial that pages inline, so one dead href becomes N dead hrefs and
 *    nothing in the suite noticed.
 *
 * 2. MEASURE. Every running-prose class carries a max-width of --measure.
 *    The superwide decision in README.md is that a wider container widens the
 *    grid and the figures and never the line length, and a prose class with
 *    no cap silently opts out of it the moment its grid collapses to one
 *    track while the container is still wide.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DS = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(DS, "..");
const quiet = process.argv.includes("--quiet");
const results = [];
const ok = (name, pass, detail = "") => results.push({ name, pass, detail });

/* ---- 1. links -------------------------------------------------------- */

const htmlFiles = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "assets" || e.name === "functions" || e.name === "node_modules") continue;
      htmlFiles(p, acc);
    } else if (e.name.endsWith(".html")) acc.push(p);
  }
  return acc;
};

/* _redirects, exact paths only. A splat or placeholder rule would need the
 * real matcher; none exists today, so one is not written speculatively. */
const redirects = new Map();
const redirectsFile = path.join(SITE, "_redirects");
if (fs.existsSync(redirectsFile)) {
  for (const line of fs.readFileSync(redirectsFile, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const [from, to] = t.split(/\s+/);
    if (from && to && !from.includes("*") && !from.includes(":")) redirects.set(from, to);
  }
}

/* Routes the programme has linked but not built. Each one is a page someone
 * owes, not a typo, so the check records it rather than failing on it — and a
 * dead href that is not on this list fails, which is the point.
 *
 * Delete an entry when its page lands. Do not add one to silence a check: a
 * route only belongs here if a page for it is actually owed. */
const PENDING = new Set([
]);

/* Only count a regular file — Cloudflare Pages serves files, not bare
 * directories. Before this guard an href like /industries resolved to the
 * directory the moment site/industries/ existed, even with no index.html in
 * it, which hid the owed hub from PENDING as soon as the first child page
 * landed (PRO-89). */
const exists = (rel) => {
  const p = path.join(SITE, rel);
  try { return fs.statSync(p).isFile(); } catch { return false; }
};

const resolves = (href, seen = new Set()) => {
  if (seen.has(href)) return false;
  seen.add(href);
  if (redirects.has(href)) return resolves(redirects.get(href), seen);
  const clean = href.replace(/[?#].*$/, "");
  if (clean === "" || clean === "/") return exists("index.html");
  const rel = clean.replace(/^\//, "");
  if (clean.endsWith("/")) return exists(rel + "index.html");
  return exists(rel) || exists(rel + ".html") || exists(path.join(rel, "index.html"));
};

const pages = htmlFiles(SITE);
const dead = [];
const pendingSeen = new Map();
for (const file of pages) {
  const src = fs.readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "");
  for (const m of src.matchAll(/\bhref="([^"]+)"/g)) {
    const href = m[1];
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    if (href.startsWith("/api/") || href.startsWith("/dl/")) continue; // Pages Functions
    if (resolves(href)) continue;
    if (PENDING.has(href.replace(/[?#].*$/, ""))) {
      pendingSeen.set(href, (pendingSeen.get(href) || 0) + 1);
      continue;
    }
    dead.push(`${path.relative(SITE, file)} → ${href}`);
  }
}
ok("every internal href resolves, or is a route the programme owes",
   dead.length === 0,
   dead.length ? `${dead.length} dead: ${[...new Set(dead)].join(", ")}` : `${pages.length} files`);

/* Every page in site/ declares an extensionless <link rel="canonical">, so the
 * shared chrome links the canonical form and nothing else: /why/governance,
 * never /why/governance.html and never /governance/. The chrome is the one
 * place this is worth enforcing — it is inlined into every page, so a
 * non-canonical href there is a non-canonical href everywhere.
 *
 * /pricing/ is the one such exception, and only because verify-ui.mjs asserts
 * that exact string on the footer's Editions link. /walkthrough/ is the
 * second, and only because that is the canonical the hub itself declares
 * (site/walkthrough/index.html's <link rel="canonical">); the footer's link
 * matches that string. Reconcile both when the hubs reconcile. */
const CANON_EXCEPT = new Set(["/", "/pricing/", "/walkthrough/"]);
const offenders = [];
for (const file of htmlFiles(path.join(DS, "partials"))) {
  const src = fs.readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "");
  for (const m of src.matchAll(/\bhref="(\/[^"]*)"/g)) {
    const href = m[1];
    if (CANON_EXCEPT.has(href) || href.startsWith("/api/") || href.startsWith("/dl/")) continue;
    if (/\.html($|[?#])/.test(href) || /\/($|[?#])/.test(href))
      offenders.push(`${path.basename(file)} → ${href}`);
  }
}
ok("the chrome links canonical routes only",
   offenders.length === 0, offenders.join(", ") || "no .html and no directory form");

/* Not an assertion — the owed routes, with how many links are already waiting
 * on each, so the cost of leaving one unbuilt is visible. */
const owed = [...pendingSeen.entries()].sort((a, b) => b[1] - a[1]);
ok("MEASUREMENT", true, owed.map(([h, n]) => `${h} ×${n}`).join(", ") || "none");
const unused = [...PENDING].filter((p) => !pendingSeen.has(p));
ok("no stale entry in PENDING", unused.length === 0,
   unused.length ? `nothing links these any more: ${unused.join(", ")}` : `${PENDING.size} routes, all still linked`);

/* ---- 2. the measure -------------------------------------------------- */

const css = fs.readFileSync(path.join(DS, "provisa.css"), "utf8");

/* Every class that sets running prose, with the declaration that caps it.
 * --measure is 68ch, so each cap is 68 characters at whatever size the class
 * sets — the measure's unit is the character, not the pixel, and a smaller
 * class therefore lands at a smaller pixel width on purpose.
 *
 * .pv-choice__items li caps a grid track rather than itself, because the row
 * carries the hairline between items and that rule has to span the card.
 * Anything added here that is prose belongs in this list. */
const CAPPED = [
  [".pv-p", "max-width", "var(--measure)"],
  [".pv-note", "max-width", "var(--measure)"],
  [".pv-measure", "max-width", "var(--measure)"],
  [".pv-h--lede", "max-width", "var(--measure)"],
  [".pv-ruled__body", "max-width", "var(--measure)"],
  [".pv-layer__desc", "max-width", "var(--measure)"],
  [".pv-schem__desc", "max-width", "var(--measure)"],
  [".pv-choice__items li", "grid-template-columns", "20px minmax(0,var(--measure))"],
];

for (const [sel, prop, want] of CAPPED) {
  /* The declaration block whose selector list starts with this selector. */
  const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = css.match(new RegExp(`(^|\\})\\s*${esc}\\s*(,[^{]*)?\\{([^}]*)\\}`, "m"));
  const found = block && block[3].match(new RegExp(`${prop}\\s*:\\s*([^;]+)`));
  ok(`${sel} caps its prose at the measure`,
     !!found && found[1].trim().replace(/\s+/g, " ") === want,
     found ? found[1].trim() : block ? `no ${prop}` : "selector not found");
}

/* ---- 3. one footer markup ships -------------------------------------- *
 * The kit ships one footer — site/design-system/partials/site-footer.html —
 * inlined into every page under site/, with `<footer class="pv-footer">` and
 * the shape the partial declares (brand blurb, three link columns, Keep me
 * posted, a ruled bottom row). PRO-152 collapsed three variants onto that
 * one: a second `.pv-footer` on /use-cases that reused the prefix with
 * different internals (`.pv-footer__nav`, `.pv-footer__heading`), and the
 * pre-rebrand `<footer class="footer">` on seven pages.
 *
 * This check keeps it collapsed. It fails when any page carries a footer
 * markup other than the kit's — the pre-rebrand class, the alternative
 * `.pv-footer__nav`/`.pv-footer__heading` shape, or more than one <footer>
 * element — and it fails when any page is missing the kit's footer
 * altogether. A fourth variant cannot land quietly. */
const FOOTER_FORBIDDEN = [
  /* `footer` as a bare space-delimited class token on a <footer>, not the
   * substring inside `pv-footer`. The character class before and after the
   * token restricts the match to `class="footer"`, `class="footer foo"` and
   * `class="foo footer"`, which is what the pre-rebrand chrome shipped. */
  [/<footer\b[^>]*\bclass="(?:[^"]*\s)?footer(?:\s[^"]*)?"/, '<footer class="footer"> — the pre-rebrand chrome'],
  [/\bpv-footer__nav\b/, "pv-footer__nav — the deprecated /use-cases shape"],
  [/\bpv-footer__heading\b/, "pv-footer__heading — the deprecated /use-cases shape"],
];
const footerOffenders = [];
const footerMissing = [];
const footerDuplicates = [];
for (const file of pages) {
  if (file.startsWith(path.join(DS, "partials") + path.sep)) continue;
  if (file.startsWith(DS + path.sep)) continue;
  const src = fs.readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "");
  for (const [re, label] of FOOTER_FORBIDDEN)
    if (re.test(src)) footerOffenders.push(`${path.relative(SITE, file)} → ${label}`);
  const footers = src.match(/<footer\b/g) || [];
  if (footers.length === 0) footerMissing.push(path.relative(SITE, file));
  else if (footers.length > 1) footerDuplicates.push(`${path.relative(SITE, file)} (${footers.length})`);
  else if (!/<footer\b[^>]*class="pv-footer"/.test(src))
    footerOffenders.push(`${path.relative(SITE, file)} → footer is not <footer class="pv-footer">`);
}
ok("every page ships the kit's footer, and only the kit's footer",
   footerOffenders.length === 0 && footerMissing.length === 0 && footerDuplicates.length === 0,
   [
     footerOffenders.length ? `forbidden markup: ${footerOffenders.join(", ")}` : "",
     footerMissing.length ? `no <footer>: ${footerMissing.join(", ")}` : "",
     footerDuplicates.length ? `multiple <footer>s: ${footerDuplicates.join(", ")}` : "",
   ].filter(Boolean).join("; ") || `${pages.length - htmlFiles(path.join(DS)).length} pages carry one <footer class="pv-footer">`);

/* ---- 4. editorial image theme swap ---------------------------------- *
 * Each editorial figure ships a light and a dark <img> that swap on the
 * site's [data-theme] toggle. The CSS below is what makes the swap happen;
 * if any of these three rules disappears, dark-theme users see light PNGs
 * (or vice versa) regardless of the toggle. */
const EDITORIAL_SWAP_RULES = [
  /\.pv-editorial__img--dark\s*\{[^}]*display\s*:\s*none/,
  /:root\[data-theme="dark"\]\s+\.pv-editorial__img--light\s*\{[^}]*display\s*:\s*none/,
  /:root\[data-theme="dark"\]\s+\.pv-editorial__img--dark\s*\{[^}]*display\s*:\s*block/,
];
for (const re of EDITORIAL_SWAP_RULES) {
  ok(`provisa.css carries ${re.source}`, re.test(css));
}

/* ---- report ---------------------------------------------------------- */

let failed = 0;
let counted = 0;
for (const r of results) {
  if (r.name === "MEASUREMENT") {
    if (!quiet) console.log(`note  routes owed: ${r.detail}`);
    continue;
  }
  counted++;
  if (!r.pass) failed++;
  if (quiet && r.pass) continue;
  console.log(`${r.pass ? "ok  " : "FAIL"}  ${r.name}${r.detail ? `  —  ${r.detail}` : ""}`);
}
console.log(`\n${counted - failed}/${counted} passed`);
process.exit(failed ? 1 : 0);
