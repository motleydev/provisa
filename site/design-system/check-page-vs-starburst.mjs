/**
 * The string checks from PRO-16, as a script rather than a claim in a comment.
 *
 *   node site/design-system/check-page-vs-starburst.mjs
 *
 * Every entry is a string the vs Starburst page must not contain, with the
 * reason it is forbidden. Four of them were published as fact in revision 2
 * and are false; the rest are standing instructions or unsupported numbers.
 *
 * The page's rendered prose is what is tested, not its source: the HTML
 * comments explain the build and are allowed to name the forbidden form in
 * order to say it is forbidden. Tags are stripped, entities resolved and
 * whitespace collapsed first, so a phrase broken across a line wrap or split
 * by a <code> or <strong> tag is still caught — which is the only way this
 * check is worth running.
 */

import { readFileSync, existsSync } from "node:fs";

const FILE = "site/vs/starburst.html";

const FORBIDDEN = [
  ["no per-role schema",   "Wrong. Trino's access control filters SHOW listings. The real gap is information_schema"],
  ["returns what the query asks", "Same row. Wrong for the same reason"],
  ["no REST",              "Their own concepts page says coordinators communicate with clients using a REST API"],
  ["no JSON:API",          "Same. Only the qualified form — no JSON:API resource surface — is publishable"],
  ["Kubernetes-only",      "Wrong. Starburst Admin is Ansible for bare metal and VMs"],
  ["no VM",                "Same. Starburst Admin's supported path is bare metal and VMs"],
  ["no laptop",            "Same. docs.starburst.io publishes a Docker try-it path"],
  ["no governed result cache", "Wrong. Galaxy's result cache is on by default on new AWS clusters"],
  ["no result cache",      "Same"],
  ["not uniform across",   "Their docs state no connector-type limitation and we have not tested one"],
  ["not applied uniformly", "Same"],
  ["no subscription",      "Galaxy has Kafka streaming ingest, GA"],
  ["no streaming support", "Same"],
  ["no domain model",      "Galaxy has data products as an access-control entity"],
  ["operationally heavy",  "An undefended pejorative, on the page whose credibility rests on conceding first"],
  ["six layers",           "Five compiled, plus an approval hook"],
  ["6 layers",             "Same"],
  ["sub-100ms",            "No measured number on any page"],
  ["85+",                  "Unsupported"],
  ["all-in-one",           "Standing instruction"],
  ["single platform",      "Standing instruction"],
  ["coming soon",          "Standing instruction"],
  ["cloud.provisa.dev",    "Standing instruction. The kit's header and ContactBand carry it; this page does not"],
  ["SOC 2",                "No compliance certification name appears on any page"],
  ["ISO 27001",            "Same"],
  ["HIPAA",                "Same"],
  ["GDPR",                 "Same"],
  ["FedRAMP",              "Same"],
  ["PCI",                  "Same"],
];

/* Two forbidden substrings are allowed inside a longer approved phrase, and
 * only there. Checked by subtracting the approved phrase before testing for
 * the bare one, so the bare form still fails anywhere else on the page.
 *
 *   "no JSON:API resource surface" — the qualifier is the whole point. It is
 *   the unqualified "no JSON:API" that their own concepts page falsifies.
 *
 *   “no per-role schema”, in curly quotes — §5 quotes the struck claim in
 *   order to say the honest version is narrower than it was. The SME wrote
 *   that sentence; the quotation marks are what make it a reference to the
 *   wrong wording rather than a use of it. Straight quotes do not count,
 *   because a cell that reached for them would be making the claim. */
const QUALIFIED = [
  "no JSON:API resource surface",
  "\u201cno per-role schema\u201d",
];

/* Claims that must be present. A page that drops one of these fails in the way
 * the whole brief is written to prevent. */
const REQUIRED = [
  ["Starburst Enterprise 482-e.3 LTS", "§9. An undated competitor claim is this page's failure mode"],
  ["as documented in October 2026",    "§9. The dateline is not optional and not a placeholder"],
  ["481-e is the current STS",         "§9, the SME's wording verbatim"],
  ["Their documentation describes no", "§5 and §6. The form every competitor negative must take"],
  ["Its documentation describes no partitioning", "§4 result caching, new in revision 3"],
  ["Provisa has no CBO at all",        "§2 card 01. The concession the SME found too small"],
  ["we have no public reference customers yet", "§2 card 04"],
  ["Provisa does not offer one",       "§2 card 03, the managed-service concession"],
  ["Five layers compiled into the statement", "§4. Five, not six"],
  ["Trino-protocol coordinator",       "§1, §4, §8. Never \"Starburst\" as a supported engine"],
  ["-- @provisa cache=true",           "C-24. The row is worthless to a SQL reader without the opt-in form"],
  ["3.13 is not supported",            "C-22, one of the three qualifiers"],
  ["Not Linux aarch64",                "C-22, the second"],
  ["embedded tier runs on DuckDB",     "C-22, the third"],
  ["in high-security mode it is not bypassable", "C-17. The absolute cannot ship without this"],
  ["PostgreSQL control plane",         "C-18. The qualifier travels with the claim"],
];

/* Links the build notes hold back until the pages they point at exist.
 *
 * Scoped to <main>, which is where the instruction bites: the brief holds back
 * /compare in §10 and /why/no-lock-in in §4. The footer is shared chrome,
 * identical on every rebuilt page, and /why/no-lock-in resolves today — a
 * check that failed on it would be asking this one page to fork the footer. */
const FORBIDDEN_HREFS = [
  ['href="/compare', "The hub does not exist yet; the intended order has vs Starburst ahead of it"],
  ['href="/why/no-lock-in', "Phase 2. Omitted until it exists"],
];

const raw = readFileSync(FILE, "utf8");

/* Strip the comments first — they are the build's reasoning, not the page's
 * prose, and they have to be able to name a forbidden string to forbid it. */
const noComments = raw.replace(/<!--[\s\S]*?-->/g, " ");

const text = noComments
  .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&quot;/g, '"').replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
  .replace(/\s+/g, " ")
  .trim();

let subtracted = text;
for (const phrase of QUALIFIED) subtracted = subtracted.split(phrase).join(" ");

const fail = [];
const pass = [];

for (const [needle, why] of FORBIDDEN) {
  const hay = QUALIFIED.some((q) => q.includes(needle)) ? subtracted : text;
  if (hay.toLowerCase().includes(needle.toLowerCase())) fail.push(`FORBIDDEN "${needle}" — ${why}`);
  else pass.push(`absent: ${needle}`);
}

for (const [needle, why] of REQUIRED) {
  if (text.includes(needle)) pass.push(`present: ${needle}`);
  else fail.push(`MISSING "${needle}" — ${why}`);
}

const main = (noComments.match(/<main[\s\S]*?<\/main>/) || [""])[0];
for (const [needle, why] of FORBIDDEN_HREFS) {
  if (main.includes(needle)) fail.push(`FORBIDDEN link ${needle} in <main> — ${why}`);
  else pass.push(`no link in <main>: ${needle}`);
}

/* Structure: the row counts the acceptance criteria name, and the two things
 * that must not be in a competitor column. */
const tables = [...noComments.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => m[0]);
const rows = tables.map((t) => (t.match(/<tr\b/g) || []).length - 1);

if (tables.length === 2) pass.push("two ComparisonTables");
else fail.push(`expected 2 ComparisonTables, found ${tables.length}`);

if (rows[0] === 8) pass.push("§4 is 8 rows");
else fail.push(`§4 must be 8 rows (result caching is new in revision 3), found ${rows[0]}`);

if (rows[1] === 6) pass.push("§6 is 6 rows");
else fail.push(`§6 must be 6 rows, found ${rows[1]}`);

/* No Starburst cell may be a dash. An em-dash in a competitor column is a
 * negative absolute with no scope, which is what four of the wrong rows were. */
for (const [i, t] of tables.entries()) {
  /* tbody only. The header row's corner cell is legitimately empty. */
  const body = (t.match(/<tbody[\s\S]*?<\/tbody>/) || [""])[0];
  for (const row of body.match(/<tr\b[\s\S]*?<\/tr>/g) || []) {
    const cells = [...row.matchAll(/<td(?![^>]*data-highlight)[^>]*>([\s\S]*?)<\/td>/g)].map((m) =>
      m[1].replace(/<[^>]+>/g, "").trim());
    for (const cell of cells) {
      if (/^[—–-]?$/.test(cell)) {
        const label = (row.match(/<th[^>]*>([\s\S]*?)<\/th>/) || [, "?"])[1].replace(/<[^>]+>/g, "").trim();
        fail.push(`table ${i + 1}, row "${label}": the Starburst cell is a dash or empty`);
      }
    }
  }
}
if (!fail.some((f) => f.includes("is a dash"))) pass.push("every Starburst cell carries prose");

/* §2's four conceded cards must precede the first comparison table. This is a
 * source-order check, which is what makes it hold at every width: nothing on
 * the page is positioned, floated or grid-ordered. */
const firstTable = noComments.indexOf("<table");
const cards = [...noComments.matchAll(/class="pv-ruled"/g)].map((m) => m.index);
if (cards.length === 4) pass.push("four RuledCards");
else fail.push(`§2 must be 4 RuledCards, found ${cards.length}`);
if (cards.length && cards[cards.length - 1] < firstTable) pass.push("§2 precedes the first table in source order");
else fail.push("a conceded card falls after the first comparison table");

/* No figure above the fold — there is no slot for a /vs/* page, and a FigPanel
 * in the hero pushes the first conceded card below it. */
if (!noComments.includes("pv-fig")) pass.push("no FigPanel on the page");
else fail.push("a FigPanel is on the page; the image-register has no /vs/* slot");

/* The brief's own words, if the brief was handed to us. Normalising has to
 * drop inline tags without leaving a space behind them — replacing every tag
 * with a space puts one before the full stop in "their <code>SHOW TABLES</code>."
 * and the comparison then fails on the markup rather than on the words. */
const briefPath = process.argv[2];
if (briefPath && existsSync(briefPath)) {
  const brief = readFileSync(briefPath, "utf8");
  const quotes = (t) => t.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"');

  const prose = quotes(
    noComments
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/?(code|strong|em|span|a|mark|b|i)\b[^>]*>/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&quot;/g, '"').replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
  ).replace(/\s+/g, " ").trim();

  const unmd = (t) =>
    quotes(t)
      .replace(/\[C-\d+\]/g, " ")
      .replace(/\*\*([^*]*)\*\*/g, "$1")
      .replace(/\*([^*]*)\*/g, "$1")
      .replace(/`/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const copy = brief.split("## 5. Copy")[1].split("## 6. Claims")[0];
  const blocks = [];

  for (const line of copy.split("\n")) {
    if (!line.startsWith("|") || /^\|\s*-+/.test(line)) continue;
    for (const cell of line.replace(/^\||\|$/g, "").split(" | ")) {
      const c = unmd(cell);
      /* An arrow is a link directive — "label → /target" — not prose. */
      if (c.length >= 40 && !c.includes("\u2192")) blocks.push(c);
    }
  }
  for (const para of copy.split(/\n\s*\n/)) {
    const t = para.trimStart();
    if (t.startsWith("|") || t.startsWith("#") || t.startsWith("```")) continue;
    const m = /^\s*\*\*[^*]+:\*\*\s*([\s\S]+)/.exec(para);
    const b = unmd(m ? m[1] : para);
    if (b.length >= 40 && !b.startsWith("Section label") && !b.includes("\u2192")) blocks.push(b);
  }

  for (const b of blocks) {
    if (prose.includes(b)) { pass.push("verbatim: " + b.slice(0, 48) + "\u2026"); continue; }
    /* Bisect for the longest matching prefix, so the report points at the word
     * the page diverges on rather than at the whole cell. */
    let lo = 0, hi = b.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (prose.includes(b.slice(0, mid))) lo = mid; else hi = mid - 1;
    }
    fail.push(`NOT VERBATIM after ${lo} chars: \u2026${b.slice(Math.max(0, lo - 50), lo + 50)}\u2026`);
  }
  console.log(`${blocks.length} copy blocks checked against ${briefPath}`);
}

console.log(`${pass.length} passed`);
for (const f of fail) console.log("  FAIL  " + f);
console.log(fail.length ? `\n${fail.length} failed` : "\nall checks passed");
process.exit(fail.length ? 1 : 0);
