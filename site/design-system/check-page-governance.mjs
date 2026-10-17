/**
 * The string and composition checks from PRO-14, as a script rather than a
 * claim in a comment.
 *
 *   node site/design-system/check-page-governance.mjs
 *   node site/design-system/check-page-governance.mjs path/to/brief-governance.md
 *
 * With the brief's path it also asserts that every block of copy in the
 * brief's §5 reaches the page word for word. That check is the point of the
 * script: every qualifier on this page was put there by the SME's verdict
 * pass and each one traces to a file and a line, so a well-meant tightening
 * in the build breaks the trace silently. The brief is the `brief-governance`
 * document on PRO-5, revision 3.
 *
 * Two string lists, because they are checked against different things:
 *
 *   COMPLIANCE   acceptance criterion 2 — "anywhere in the built page, in any
 *                casing, including in alt text and metadata". Tested against
 *                the whole file, so <meta>, aria-label and alt are covered.
 *   FORBIDDEN    tested against the rendered prose with tags stripped and
 *                entities resolved, so a phrase broken across a line wrap or
 *                split by a <code> or <strong> tag is still caught.
 *
 * The HTML comments are stripped from both before testing: they are the
 * build's reasoning, and they have to be able to name a forbidden string in
 * order to say it is forbidden.
 */

import { readFileSync, existsSync } from "node:fs";

const FILE = "site/why/governance.html";

/* Acceptance criterion 2. §10's heading is "We hold no certifications" and
 * that is the page's credibility; a named certification anywhere on it, in
 * any casing or any attribute, contradicts the heading. */
const COMPLIANCE = [
  "HIPAA", "FedRAMP", "SOC 2", "SOC2", "PCI-DSS", "PCI", "ISO 27001", "GDPR",
];

const FORBIDDEN = [
  ["six layers",            "Five compiled, plus an approval hook. Six rows, five layers"],
  ["6 layers",              "Same"],
  ["/api/sql/compile",      "The route does not exist. It is POST /data/compile and it takes GraphQL"],
  ["/sql/compile",          "Same"],
  ["SQLite control plane",  "Backwards. embedded_pg is the default from the desktop install up"],
  ["no invalid join",       "The guard is governance policy with two documented bypasses, both named"],
  ["never runs on your data", "Same"],
  ["In development",        "A per-group marker generated from any one open requirement. §10 publishes the ratio instead"],
  ["coming soon",           "SaaS is not offered"],
  ["managed hosting",       "Same"],
  ["cloud.provisa.dev",     "Same. The kit's header carried it; PRO-2 plan revision 3 withdrew the trial"],
  ["all-in-one",            "Off the brand pages by standing instruction"],
  ["single platform",       "Same"],
];

/* The disclosures and the four corrections revision 3 exists for. A page that
 * drops one of these fails in the way the brief is written to prevent. */
const REQUIRED = [
  ["POST /data/compile",                  "C-3. The route, and it takes GraphQL"],
  ["POST /data/sql/explain",              "C-3b. A different thing from C-3; the page must not merge them"],
  ["Five layers compiled into the statement", "§3 heading. Five, not six"],
  ["An ABAC callout, outside the plan",   "§3. The hook's row, and why it is not a layer"],
  ["designed and not built",              "C-9. Public-column publishing is unbuilt, so it is not counted"],
  ["It has two bypasses",                 "C-11. AC 7 — the disclosure, in the same section as the claim"],
  ["ignore-relationships",                "C-11. The first bypass, named"],
  ["either one alone does nothing",       "C-11. The second bypass, named"],
  ["skipped for GraphQL",                 "C-11. The third case the SME insisted on publishing"],
  ["unbypassable",                        "C-12. The high-security formulation that replaced the absolute"],
  ["PostgreSQL control plane",            "C-17. The qualifier travels with the claim"],
  ["from the desktop install up",         "C-17. PRO-6 §4 correction 1 — the guarantee holds out of the box"],
  ["SQLite is a selectable control-plane store", "C-17. The setting that would take the guarantee away"],
  ["the tables themselves are there today", "C-18. Claim the tables, not the reports"],
  ["HashiCorp Vault Transit",             "C-20. Four providers ship, not three"],
  ["We hold no certifications",           "C-22. §10's heading, verbatim"],
  ["There is no managed service to buy today", "C-29. Self-hosted only, stated rather than implied"],
  ["0.1.0a479",                           "C-28. The version, published because publishing it is the point"],
  ["1,599 requirements complete",         "C-28. Dated, denominator dropped — the two figures that reconcile across both ledgers"],
  ["84 in progress",                      "C-28. In-progress count, which agrees across both ledgers"],
  ["counted on 14 October 2026",          "C-28. The counted-on date — a statement about a day, not a promise about a state"],
];

/* AC 5. The Lineage page is Phase 2 and does not exist; a dead evidence link
 * is worse than no evidence link for this reader. Scoped to <main>, which is
 * where the brief holds it back — the footer is shared chrome. */
const FORBIDDEN_HREFS = [
  ['href="/why/lineage', "Phase 2. The link must not ship before the page does"],
];

const raw = readFileSync(FILE, "utf8");
const noComments = raw.replace(/<!--[\s\S]*?-->/g, " ");

const text = noComments
  .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&quot;/g, '"').replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const fail = [];
const pass = [];

for (const needle of COMPLIANCE) {
  if (noComments.toLowerCase().includes(needle.toLowerCase()))
    fail.push(`COMPLIANCE STRING "${needle}" is in the built page — acceptance criterion 2`);
  else pass.push(`absent from the whole file, attributes included: ${needle}`);
}

for (const [needle, why] of FORBIDDEN) {
  if (text.toLowerCase().includes(needle.toLowerCase())) fail.push(`FORBIDDEN "${needle}" — ${why}`);
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

/* "Available" is forbidden as a badge or a column, not as a word, so it is
 * checked structurally: no cell, chip or card title may be the bare marker. */
const markers = [...noComments.matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/g)]
  .concat([...noComments.matchAll(/class="pv-chip[^"]*"[^>]*>([\s\S]*?)</g)])
  .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
  .filter((t) => /^(available|in development)$/i.test(t));
if (markers.length === 0) pass.push("no Available / In development marker in any cell or chip");
else fail.push(`${markers.length} cell or chip carries a generated group marker: ${markers.join(", ")}`);

/* --- composition -------------------------------------------------------
 * The acceptance criteria that are about structure rather than about words. */

const count = (re) => (noComments.match(re) || []).length;

const layers = [...noComments.matchAll(/<div class="pv-layer pv-layer--detail([^"]*)"/g)]
  .map((m) => m[1].trim());
const idxs = [...noComments.matchAll(/<span class="pv-layer__idx">([^<]*)<\/span>/g)].map((m) => m[1]);

/* AC 3. Six rows: layers 0-4 in the trio, then the hook in slate, unnumbered. */
if (layers.length === 6) pass.push("§3 is six LayerRows");
else fail.push(`§3 must be six LayerRows, found ${layers.length}`);

const tones = layers.map((c) => c.replace("pv-layer--", "") || "see");
const WANT = ["see", "see", "get", "get", "run", "outside"];
if (String(tones) === String(WANT)) pass.push(`§3 tones are ${WANT.join(" ")}`);
else fail.push(`§3 tones must be ${WANT.join(" ")}, found ${tones.join(" ") || "none"}`);

if (String(idxs) === String(["00", "01", "02", "03", "04"]))
  pass.push("§3 numbers 00-04 with no gap, and the hook has no index");
else fail.push(`§3 must number 00-04 and leave the hook unnumbered, found ${idxs.join(" ")}`);

/* AC 4. Three tabs, new in revision 3. */
const tabs = count(/role="tab"/g);
if (tabs === 3) pass.push("§2 is three tabs");
else fail.push(`§2 must be three tabs, found ${tabs}`);

/* The gallery inventory the brief names. */
for (const [what, n, re] of [
  ["Callouts", 5, /class="pv-callout"/g],
  ["LayerRows", 6, /class="pv-layer pv-layer--detail/g],
  ["RuledCards", 9, /class="pv-ruled /g],
  ["ComparisonTables", 2, /<table\b/g],
  ["FigPanels", 2, /class="pv-fig /g],
  ["h1", 1, /<h1\b/g],
]) {
  const got = count(re);
  if (got === n) pass.push(`${n} ${what}`);
  else fail.push(`expected ${n} ${what}, found ${got}`);
}

/* AC 7, the structural half. A disclosure must not be marked up as something
 * quieter than the claim it qualifies: §3's footnote is .pv-note, which is
 * the body colour by construction, and §8's qualifier is a Callout in the
 * same column as the three cards rather than small print under them. The
 * painted weight is measured in verify-page-governance.mjs. */
if (noComments.includes('class="pv-note"')) pass.push("§3's footnote is a .pv-note, not small print");
else fail.push("§3's footnote must be a .pv-note — AC 7");
if (/pv-callout[\s\S]*?That immutability is enforced by/.test(noComments))
  pass.push("§8's qualifier is a Callout, not a footnote");
else fail.push("§8's qualifier must be a Callout at the cards' weight — AC 7");

/* No page-level CSS. The page composes the kit; a <style> block here is how a
 * design system stops being one. */
if (!/<style[\s>]/.test(noComments)) pass.push("no page-level CSS");
else fail.push("the page carries a <style> block; put the rule in the kit instead");

/* --- the brief's own words --------------------------------------------- */

const briefPath = process.argv[2];
if (briefPath && existsSync(briefPath)) {
  const brief = readFileSync(briefPath, "utf8");
  const quotes = (t) => t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

  /* Inline tags come out without leaving a space behind them, or "every
   * <code>SELECT</code>," gains one before the comma and the comparison then
   * fails on the markup rather than on the words. */
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
      .replace(/\[C-\d+[a-z]?\]/g, " ")
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
      if (c.length >= 40 && !c.includes("→")) blocks.push(c);
    }
  }
  for (const para of copy.split(/\n\s*\n/)) {
    const t = para.trimStart();
    if (t.startsWith("|") || t.startsWith("#") || t.startsWith("```")) continue;
    if (/^\*\*(Section label|Figure|Alt|Breadcrumb|Eyebrow|Tab \d|Acceptance criterion)/.test(t)) continue;
    const m = /^\s*\*\*[^*]+:\*\*\s*([\s\S]+)/.exec(para);
    const b = unmd(m ? m[1] : para);
    if (b.length >= 40 && !b.includes("→")) blocks.push(b);
  }

  /* The two blocks the build notes take off the page, each with the note that
   * authorises it. Listed rather than silently skipped, so removing a third
   * one shows up as a failure. */
  const WITHDRAWN = [
    ["What we can give your assessor is the per-requirement traceability matrix",
     "build note 2 — the CSV is not served from the site or from a stable docs URL, raised on PRO-14"],
  ];

  for (const b of blocks) {
    const withdrawn = WITHDRAWN.find(([frag]) => b.includes(frag));
    if (withdrawn) {
      if (prose.includes(withdrawn[0]))
        fail.push(`WITHDRAWN copy is still on the page: ${withdrawn[0].slice(0, 50)}…`);
      else pass.push(`withdrawn by ${withdrawn[1]}`);
      continue;
    }
    if (prose.includes(b)) { pass.push("verbatim: " + b.slice(0, 48) + "…"); continue; }
    let lo = 0, hi = b.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (prose.includes(b.slice(0, mid))) lo = mid; else hi = mid - 1;
    }
    fail.push(`NOT VERBATIM after ${lo} chars: …${b.slice(Math.max(0, lo - 60), lo + 60)}…`);
  }
  console.log(`${blocks.length} copy blocks checked against ${briefPath}`);
}

console.log(`${pass.length} passed`);
for (const f of fail) console.log("  FAIL  " + f);
console.log(fail.length ? `\n${fail.length} failed` : "\nall checks passed");
process.exit(fail.length ? 1 : 0);
