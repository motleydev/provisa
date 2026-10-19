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
 * route only belongs here if a page for it is actually owed.
 *
 *   /industries/healthcare   linked from the Industries hub (PRO-94). PRO-86
 *                            cleared the brief; the vertical page is owed as
 *                            a sibling site task.
 *   /industries/government   same shape.
 *   /platform/views.html  footer, Platform column.
 *   /platform/catalog.html
 *   /docs                 pre-rebrand pages only: demos, privacy, terms,
 *                         register, vs/denodo, vs/hasura and the why/ pages
 *                         not yet rebuilt. The ported chrome links
 *                         https://provisa.dev/docs instead, so this entry
 *                         goes when those pages are rebuilt. */
const PENDING = new Set([
  "/industries/healthcare",
  "/industries/government",
  "/platform/views",
  "/platform/catalog",
  "/docs",
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
 * /pricing/ is the exception, and only because verify-ui.mjs asserts that
 * exact string on the footer's Editions link. Reconcile the two together. */
const CANON_EXCEPT = new Set(["/", "/pricing/"]);
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
