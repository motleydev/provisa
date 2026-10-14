/* The struck-claim sweep, across every page in `site/`.
 *
 * `verify-home.mjs` checks the claim list against `/` alone, which is how
 * `/why/one-model` kept "85+", "six layers", "No invalid join ever runs on
 * your data" and a "62 connectors" link sitting next to a "72 connectors"
 * sentence (PRO-27). A claim is a claim on whichever page it appears, so the
 * sweep is per-page and covers all of them.
 *
 * No browser and no server: `site/` has no build step, so the served bytes are
 * the bytes on disk and a struck string is found by reading them. Run it from
 * the repo root or from `site/`:
 *
 *   node site/verify-claims.mjs
 *
 * The list itself is `site/claim-bans.mjs`, shared with `verify-home.mjs` so
 * the two cannot drift.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BANNED, findBanned, servedCopy } from "./claim-bans.mjs";

const SITE = path.dirname(fileURLToPath(import.meta.url));

/* The kit is excluded: `design-system/index.html` is the component gallery,
 * whose job is to show each component with sample copy, and `check-kit.mjs`
 * owns it. Everything else under `site/` is a page a visitor can reach. */
const SKIP_DIRS = new Set(["design-system", "assets", "functions", "node_modules"]);

/* The one documented exception, per CLAUDE.md: a page may carry a struck
 * string when the design requires it and the requirement is named here.
 *
 * REQ-2006 (Demo Provisioning) specifies the live demos page and its "Open
 * live demo" button: "The button opens a cloud.provisa.dev sandbox of that
 * demo that needs no signup", and "Opening the page warms the cloud
 * coordinator in the background". The ban on `cloud.provisa.dev` is on
 * offering the host as a *conversion* — the trial CTA withdrawn in plan
 * revision 3 — not on the demo sandbox REQ-2006 mandates. The exception is
 * scoped to that one string on that one page, and the assertion below keeps it
 * honest: the page may link the sandbox, and may not sell it. */
const EXCEPTIONS = [
  { page: "demos.html", banned: "cloud.provisa.dev", req: "REQ-2006" },
];

const results = [];
const ok = (n, c, d = "") => results.push({ n, pass: !!c, d });

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(p);
    return e.name.endsWith(".html") ? [p] : [];
  });

const pages = walk(SITE).sort();

ok("the sweep found the pages to sweep", pages.length >= 10, `${pages.length} pages`);

for (const file of pages) {
  const rel = path.relative(SITE, file);
  const src = fs.readFileSync(file, "utf8");
  const skip = EXCEPTIONS.filter((e) => e.page === rel).map((e) => e.banned);
  const hits = findBanned(src, skip);
  ok(`${rel}: no struck claim`, hits.length === 0,
    hits.map((h) => `"${h.banned}" ×${h.count} — ${h.why}`).join(" | "));
}

/* Each exception has to still be about the page it was written for. An
 * exception naming a page that no longer exists is a stale licence to ship a
 * struck claim, so it fails rather than being ignored. */
for (const e of EXCEPTIONS) {
  const file = path.join(SITE, e.page);
  ok(`exception ${e.req}: ${e.page} exists`, fs.existsSync(file));
  if (!fs.existsSync(file)) continue;
  const copy = servedCopy(fs.readFileSync(file, "utf8"));
  const used = new RegExp(e.banned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(copy);
  ok(`exception ${e.req}: ${e.page} still needs "${e.banned}"`, used,
    used ? "" : "the exception is stale — remove it");
  /* REQ-2006 covers the demo sandbox, not a sale of the host. */
  if (e.banned === "cloud.provisa.dev") {
    const sells = /free trial|start a trial|hosted service|sign ?up for/i.test(copy);
    ok(`exception ${e.req}: ${e.page} does not sell the host`, !sells,
      sells ? "the hosted conversion is withdrawn (plan revision 3)" : "");
  }
}

/* A number appearing twice on one page with two different values is the PRO-27
 * failure that no string ban catches: `/why/one-model` said "72 connectors" in
 * a sentence and "All 62 connectors" in the link under it. The reach figures
 * are fixed and reproducible — `docs/claim-audit.md` §1.1 and §1.2 — so the
 * check is that a page quoting a count of source types quotes one of them. */
const REACH = /(\d+)\s+(?:connectors|source types)/gi;
const REACH_OK = new Set(["72", "63", "37"]);
for (const file of pages) {
  const rel = path.relative(SITE, file);
  const copy = servedCopy(fs.readFileSync(file, "utf8"));
  const found = [...copy.matchAll(REACH)].map((m) => m[1]);
  const wrong = [...new Set(found.filter((n) => !REACH_OK.has(n)))];
  ok(`${rel}: every source-type count is 72, 63 or 37`, wrong.length === 0,
    wrong.length ? `${wrong.join(", ")} — claim-audit §1.1 and §1.2` : "");
}

/* The two surface counts are different things and a page carrying both has to
 * say so (REQ-2018). "Six governed surfaces" is what one English question
 * comes back on; "sixteen surfaces" is the client-facing protocol surface area
 * riding the seven listeners. */
for (const file of pages) {
  const rel = path.relative(SITE, file);
  const copy = servedCopy(fs.readFileSync(file, "utf8")).replace(/\s+/g, " ");
  const six = /six governed surfaces/i.test(copy);
  const sixteen = /sixteen surfaces/i.test(copy);
  if (!(six && sixteen)) continue;
  const said = /different count, different thing/i.test(copy);
  ok(`${rel}: distinguishes six governed surfaces from sixteen surfaces`, said,
    said ? "" : "REQ-2018 — both counts on one page without the distinguishing sentence");
}

/* Qualifier (a) of REQ-2016: six is the capability, never a count promised per
 * question, and the qualifier travels inside the spine sentence itself. So the
 * check is on the sentences that deliver — "answered on six governed surfaces",
 * "six governed surfaces answer" — not on every mention of the term. Home and
 * `/why/one-model` both refer back to "the six governed surfaces above" after
 * stating the spine with its qualifier, and that back-reference is not the
 * claim this qualifier governs. */
const UNQUALIFIED = [
  /\bon (?!up to )six governed surfaces/gi,
  /(?<!up to )six governed surfaces answer/gi,
];
for (const file of pages) {
  const rel = path.relative(SITE, file);
  const copy = servedCopy(fs.readFileSync(file, "utf8")).replace(/\s+/g, " ");
  if (!/six governed surfaces/i.test(copy)) continue;
  const bare = UNQUALIFIED.flatMap((r) => [...copy.matchAll(r)].map((m) => m[0]));
  ok(`${rel}: the spine sentence carries "up to six"`, bare.length === 0,
    bare.join(" | ") || "");
}

let fails = 0;
for (const r of results) {
  if (!r.pass) fails++;
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.d ? `  — ${r.d}` : ""}`);
}
console.log(`\n${results.length - fails}/${results.length} passed, ${fails} failed`);
console.log(`${BANNED.length} struck claims swept across ${pages.length} pages`);
process.exit(fails ? 1 : 0);
