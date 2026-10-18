/**
 * The static assertions for /vs/hasura (PRO-39).
 *
 *   node site/design-system/check-page-vs-hasura.mjs
 *   node site/design-system/check-page-vs-hasura.mjs <brief.md>
 *
 * Three things live here, each an acceptance criterion on PRO-39 rather than a
 * claim in a comment:
 *
 *   1. The strings the page may not contain. This page is read by former
 *      Hasura contacts and ex-Hasura sales engineers — people who still talk
 *      to people who work there — so no claim about Hasura ships that is not
 *      sourced to Hasura's own dated documentation, and nothing on the page
 *      characterises another company's priorities, commitment or pricing
 *      intent. `WIP` and `❌` are quoted tokens from a table with no legend;
 *      glossing either is a claim about intent, which is why "work in
 *      progress" and "roadmap" are forbidden here and not merely discouraged.
 *
 *   2. §5's position and weight. §5 sits immediately after §4 and before §7,
 *      and its leading Callout carries the same visual weight as §3's table.
 *      The gap list is the page's credibility, not its small print: a reader
 *      who finds the row-filter gap themselves has caught us, and a reader who
 *      reads it from us has been told. This is an SME position on the record —
 *      hold it against any pressure to soften it.
 *
 *   3. The allowlist file name. A CLI export writes `allow_list.yaml`;
 *      `allowlist` is the metadata API's key for the same section. Only one of
 *      them is in the directory §2 converts, and a reader who greps their
 *      export for the wrong one finds nothing and concludes our gap list is
 *      approximate. A design pass that "tidies" the file name to match the
 *      section key beside it reintroduces the defect and looks like a typo fix
 *      on the way past, so the literal is asserted and the tidy form forbidden.
 *
 * The page's rendered prose is what is tested, not its source: the HTML
 * comments explain the build and have to be able to name a forbidden string in
 * order to forbid it. Tags are stripped, entities resolved and whitespace
 * collapsed first, so a phrase broken across a line wrap or split by a <code>
 * or <strong> tag is still caught — which is the only way this check is worth
 * running.
 *
 * Claims about the Hasura v2 importer belong to the published material the
 * app's owner maintains (docs, README, CHANGELOG, release notes). The site
 * does not install, import or run the converter, and this checker does not
 * either; a release gate on the artifact belongs with its owner, not here.
 */

import { readFileSync, existsSync } from "node:fs";

const FILE = "site/vs/hasura.html";

const args = process.argv.slice(2);
const briefPath = args.find((a) => !a.startsWith("--"));

/* ======================================================================
 * 1. Forbidden strings
 * ====================================================================== */

const FORBIDDEN = [
  /* Build note 5: no claim about Hasura that is not sourced to Hasura's own
   * dated documentation, and no characterisation of their intent. */
  ["end-of-life",     "§9. Not merely unverified — false. Hasura's own docs put v2.50 on Active LTS planned through December 2028"],
  ["end of life",     "Same claim, spaced"],
  ["little attention","A claim about another company's priorities. We have no source and cannot get one"],
  ["cloud-first",     "Same, about their pricing intent"],
  ["abandoned",       "Same"],
  ["work in progress","A gloss on the `WIP` cell. The table has no legend, so expanding the token is a claim about intent"],
  ["not finished yet","Same gloss"],
  ["on the roadmap",  "Same gloss"],
  ["roadmap",         "Same. The bare noun is how the gloss gets back in"],
  ["cloud.provisa.dev", "Standing instruction. The kit's header and ContactBand carry it; this page does not"],

  /* The framings the claim set rejected outright. */
  ["migrate either way", "Claim-set §5 rejects all three premises. Two are claims about another company's intent"],
  ["have to migrate",    "Same framing"],

  /* Revision 4's three corrections. Each was wrong on the page, and each is
   * the kind of wrong a later compression pass puts back. */
  ["Rate limits that travel", "The rate does not travel. mapper.py:258 divides by 60 and rounds with a floor of 1, silently"],
  ["Simple cases convert",    "mapper.py:637-663 converts every tracked function identically. There is no such classifier"],
  ["complex ones need manual work", "Same. docs/import.md:92 is where the vague version lives and is a source correction"],
  ["this gap is loud",        "Panel 1. Loud on the import tab, silent on the command line — the typing pass runs from the preview endpoint only"],

  /* Build note 8. The file is `allow_list.yaml`, with the underscore. */
  ["allowlist.yaml", "The CLI export writes `allow_list.yaml`. Tidying the file name to match the section key beside it is the defect the SME caught"],

  /* Struck site-wide, repeated locally because this page is the one whose
   * argument is that it is exact about its own limits. */
  ["85+",          "Unsupported. The pages say 72 / 63 / 37"],
  ["six layers",   "Five compiled, plus an approval hook"],
  ["6 layers",     "Same"],
  ["coming soon",  "Standing instruction. There is no managed service in any tense"],
  ["managed hosting", "Same"],
  ["all-in-one",   "Standing instruction"],
  ["single platform", "Standing instruction"],
  ["SOC 2",        "No compliance certification name appears on any page"],
  ["ISO 27001",    "Same"],
  ["HIPAA",        "Same"],
  ["GDPR",         "Same"],
  ["FedRAMP",      "Same"],
  ["PCI",          "Same"],
];

/* ======================================================================
 * 2. Required strings
 *
 * A page that drops one of these fails in the way the brief is written to
 * prevent. Several are adverse about our own converter, which is the point:
 * the gap list is why anyone believes the rest of the document.
 * ====================================================================== */

const REQUIRED = [
  ["Row filters that traverse a relationship are not converted, and the converter does not tell you.",
   "§5's leading sentence. C-3, adverse and published. PRO-13 is open and unassigned"],
  ["it does not warn",
   "§1 Emph. The gap is above the fold or the page has no argument"],
  ["This is a migration with a review step in the middle",
   "§1 Emph, the hoisted posture. The SME calls it the best sentence in the brief"],
  ["start at what does not convert",
   "§1 Emph's jump link into the gap list, label included"],
  ["Not for a filter that traverses a relationship.",
   "§3's row-filter qualifier. Claim-set §1 forbids that row without the disclosure beside it"],
  ["The role imports with no row restriction at all",
   "§5 failure mode 1. A rule that reduces to TRUE is discarded"],
  ["A rule exists on the role and restricts nothing",
   "§5 failure mode 2"],
  ["review every role's row rules against your v2 permissions before the deployment serves traffic",
   "C-30. The claim set's requirement, not the page's choice"],
  ["EXISTS (SELECT 1 FROM public.project WHERE owner_id = current_setting('provisa.user_id'))",
   "C-30's other half. The disclosure without the rewrite shape is not actionable"],

  ["allow_list.yaml",
   "Build note 8. The file in a CLI export, with the underscore"],
  ["[allowlist] [allow_list.yaml] allowlist is present in the export and is not converted",
   "§5's CodeBlock. The verbatim warning line, so there is nothing left to grep for"],

  ["from the command line it is not warned about at all",
   "Panel 1. The SME ran the CLI against a columns: \"*\" export: two warnings, neither about the wildcard, exit 0"],
  ["the untyped column is refused when you apply",
   "Panel 1's other half. core/repositories/table.py:575-578, REQ-1426"],
  ["the import divides by 60 and rounds, with a floor of one",
   "Panel 6. REQ-2033 states the arithmetic"],
  ["arrives serving 60",
   "Panel 6. 10 requests a minute arrives six times looser"],
  ["arrives held to 120",
   "Panel 6. 150 a minute arrives tighter, which is the case REQ-2033 added"],
  ["Query complexity and query time convert exactly",
   "§4 card 3 and Panel 6. The dimensions that do convert, named, so the rate sentence is not read as the whole story"],
  ["re-read the rate on every throttled role",
   "§4 card 3. The instruction, not the reassurance"],
  ["lands declared as returning void and visible to org_admin alone",
   "Panel 5. mapper.py:637-663. The old copy implied a classifier the code does not have"],

  ["Currently, there is no in-place upgrade path from Hasura v2 to Hasura DDN.",
   "§8. Verbatim from hasura.io/docs/3.0/upgrade/guide/, read 2026-10-14"],
  ["Hasura v2 is still supported and will be maintained according to our LTS policy",
   "§8. The SME calls this the highest-value sentence available to the page"],
  ["v2.50 as Active LTS planned through December 2028",
   "§8. The sentence that makes the end-of-life claim false rather than unverified"],
  ["WIP",
   "§8. Quoted, not glossed"],
  ["❌",
   "§8. Same — the Cron Trigger cell is a token from a table with no legend"],
  ["Read from Hasura's published documentation on 14 October 2026.",
   "§8's dateline. An undated competitor claim is this page's failure mode"],
  ["This page makes no argument that you have to move.",
   "§8. The page's whole posture toward this reader"],

  ["which is the only configuration some regulated buyers can accept",
   "§7 card 1. C-50, one clause inside the concession and no quantified claim from it"],
  ["Provisa does not offer one",
   "§7 card 1. The managed-service concession, unhedged (REQ-2014)"],
  ["there is no version of it that is not",
   "§7 card 1's last sentence. The concession keeps it"],
  ["checked against the new schema rather than guaranteed by it",
   "§7 card 2. Already at the limit of the evidence — the SME's answer to the strength question was \"not at all\""],

  ["hasura metadata export",
   "§2 tab 1. The command that writes the directory tab 2 converts"],
  ["python -m provisa.hasura_v2 ./metadata -o config.yaml",
   "§2 tab 2. The page's primary command path; the two commands have to compose"],
  ["python -m provisa.hasura_v2 ./metadata --dry-run",
   "§6"],
  ["Dry run: validation passed.",
   "§6. C-37, quoted from a run"],
  ["Admin → Import Hasura Config",
   "§2. The only surface that reads a consolidated metadata-API document"],
  ["The converter reads a metadata directory",
   "§2 tab 2. The CLI takes one positional directory and calls parse_metadata_dir unconditionally"],
  ["Import warnings (3):",
   "§6 callout. The summary is countable, which is what sizes the review"],
  ["a [relationships] warning",
   "§6 callout. One of the two things to check every time"],

  ["Five governance layers compile into one query plan before execution",
   "§4 card 2. Five, not six, plus an approval hook that is not one of them"],
  ["72 source types",
   "§4 card 4. The reproducible figure"],
  ["The same model answers GraphQL, SQL and Cypher",
   "§4 card 1. claim-audit §5.1c keeps the three-language form where the claim is about query languages"],
];

/* ======================================================================
 * 3. Links the build notes hold back
 *
 * Scoped to <main>, which is where the instruction bites. The footer is shared
 * chrome, identical on every rebuilt page, and a check that failed on it would
 * be asking this one page to fork the footer.
 * ====================================================================== */

const FORBIDDEN_HREFS = [
  ['href="/compare', "Build note 3. The hub does not exist yet"],
  ['href="/install', "Build note 2. PRO-17 — it does not exist, and seven links on three pages already wait on it"],
];

/* ====================================================================== */

const raw = readFileSync(FILE, "utf8");
const noComments = raw.replace(/<!--[\s\S]*?-->/g, " ");

const quotes = (t) =>
  t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

const entities = (t) =>
  t.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

/* Two normalizations, because they catch different mistakes.
 *
 * `text` turns every tag into a space, so a phrase split across a line wrap is
 * still one phrase. `prose` drops inline tags without leaving a space behind
 * them, because a sentence like "returning <code>void</code> and" has no space
 * where the tag was and comparing against the brief's words needs it closed
 * up. Required strings are matched against both. */
const stripped = noComments.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ");

const text = quotes(entities(stripped.replace(/<[^>]+>/g, " "))).replace(/\s+/g, " ").trim();

const prose = quotes(
  entities(
    stripped
      .replace(/<\/?(code|strong|em|span|a|mark|b|i)\b[^>]*>/g, "")
      .replace(/<[^>]+>/g, " ")
  )
).replace(/\s+/g, " ").trim();

const fail = [];
const pass = [];
const ok = (c, m, why) => (c ? pass.push(m) : fail.push(`${m} — ${why}`));

for (const [needle, why] of FORBIDDEN) {
  const n = quotes(needle).toLowerCase();
  if (text.toLowerCase().includes(n)) fail.push(`FORBIDDEN "${needle}" — ${why}`);
  else pass.push(`absent: ${needle}`);
}

for (const [needle, why] of REQUIRED) {
  const n = quotes(needle);
  if (text.includes(n) || prose.includes(n)) pass.push(`present: ${needle.slice(0, 56)}`);
  else fail.push(`MISSING "${needle}" — ${why}`);
}

/* The anchor the §1 jump link resolves to, and the href itself, are both in
 * the source rather than in the prose. */
for (const [needle, why] of [
  ['id="gaps"', "§5's anchor. §1's Emph links into it and a jump that lands nowhere is worse than no jump"],
  ['href="#gaps"', "§1's Emph. The anchor and the link are both asserted, because either one alone is a dead jump"],
  ['href="/register"', "§9's primary CTA. REQ-2014 rung 1"],
  ['href="#contact"', "§9's secondary. REQ-2014 rung 2"],
]) {
  ok(noComments.includes(needle), `source carries ${needle}`, why);
}

const main = (noComments.match(/<main[\s\S]*?<\/main>/) || [""])[0];
for (const [needle, why] of FORBIDDEN_HREFS) {
  if (main.includes(needle)) fail.push(`FORBIDDEN link ${needle} in <main> — ${why}`);
  else pass.push(`no link in <main>: ${needle}`);
}

/* ======================================================================
 * Section order. §5 sits immediately after §4 and before §7.
 *
 * A source-order check, which is what makes it hold at every width: nothing on
 * this page is positioned, floated or grid-ordered, so the document order is
 * the paint order. Moving §5 below §7 reverses the page's argument.
 * ====================================================================== */

const sections = noComments
  .split(/<section\b/)
  .slice(1)
  .map((s) => "<section" + s.split("</section>")[0]);

const headings = sections.map((s) => {
  const h = /<h[12][^>]*>([\s\S]*?)<\/h[12]>/.exec(s);
  return h ? h[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "(none)";
});

const EXPECTED_ORDER = [
  "Your v2 metadata is a file. Provisa reads it.",
  "Run it",
  "What converts",
  "What you get that v2 did not have",
  "What does not convert",
  "Preview before you apply",
  "When Provisa is not the answer",
  "v2 and DDN, in Hasura's own words",
  "Try it on your own metadata",
  "Book a demo.",
];

const got = headings.map(quotes);
ok(
  got.length === EXPECTED_ORDER.length && EXPECTED_ORDER.every((h, i) => got[i] === h),
  "the nine sections and the contact band are in the brief's order",
  `got ${JSON.stringify(got)}`
);

const at = (h) => got.indexOf(h);
const i4 = at("What you get that v2 did not have");
const i5 = at("What does not convert");
const i7 = at("When Provisa is not the answer");
ok(i4 >= 0 && i5 === i4 + 1,
   "§5 sits immediately after §4",
   `§4 at ${i4}, §5 at ${i5}. Nothing goes between them`);
ok(i5 >= 0 && i7 > i5,
   "§5 sits before §7",
   `§5 at ${i5}, §7 at ${i7}. Moving §5 below §7 reverses the page's argument`);

/* ======================================================================
 * §5's weight. The leading Callout carries the same visual weight as §3's
 * table, which here means four testable things.
 * ====================================================================== */

const s3 = sections[at("What converts")] || "";
const s5 = sections[i5] || "";

/* (a) Same section treatment. §3 is where the brief sets the bar, so the two
 * are compared rather than a class being written out here: a design pass that
 * bands or tightens one has to do the same to the other. */
const sectionClass = (s) => (/<section[^>]*class="([^"]*)"/.exec(s) || [, ""])[1].trim();
ok(sectionClass(s3) === sectionClass(s5),
   `§5 takes the same section treatment as §3 ("${sectionClass(s5)}")`,
   `§3 is "${sectionClass(s3)}" and §5 is "${sectionClass(s5)}" — pv-section--tight and a band are not the same weight`);

/* (b) The lead is the kit's Callout at the primary vermilion tone. --inverse,
 * --get and --outside are all lighter; so is anything that is not a Callout. */
const firstCallout = /<div class="([^"]*pv-callout[^"]*)"/.exec(s5);
ok(firstCallout && firstCallout[1].trim() === "pv-callout",
   "§5's leading Callout carries the primary weight class",
   `class is "${firstCallout ? firstCallout[1] : "(no callout in §5)"}" — --inverse, --get and --outside are lighter tones`);

/* (c) It is first: before §5's first table, its first accordion and its first
 * paragraph. A disclosure a reader meets after the coverage tables is a
 * disclosure they have already had the chance to catch us on. */
const calloutAt = s5.indexOf("pv-callout");
for (const [marker, label] of [["<table", "table"], ["pv-acc", "accordion"], ["pv-p", "paragraph"]]) {
  const m = s5.indexOf(marker);
  ok(calloutAt >= 0 && (m < 0 || calloutAt < m),
     `the Callout precedes §5's first ${label}`,
     `callout at ${calloutAt}, ${label} at ${m}`);
}

/* (d) Not demoted into small print. The disclosure sentence is in a
 * pv-callout__body, and not in pv-p--sm, pv-note or an accordion panel —
 * which are the three shapes a softening pass reaches for. */
const LEAD = "Row filters that traverse a relationship are not converted";
const flat = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");

const calloutBody = (s5.match(/<span class="pv-callout__body">[\s\S]*?<\/span>/) || [""])[0];
ok(flat(calloutBody).includes(LEAD),
   "the disclosure is the Callout's body",
   "the lead sentence is not inside §5's pv-callout__body");

/* The three shapes a softening pass reaches for, measured by position rather
 * than by parsing: the lead sentence has to come before §5's first small-print
 * class and before the Accordion starts. A disclosure that has moved into
 * either has moved behind them in the source too. */
const leadAt = s5.indexOf("Row filters that traverse");
for (const demotion of ["pv-note", "pv-p--sm", "pv-acc"]) {
  const d = s5.indexOf(demotion);
  ok(leadAt >= 0 && (d < 0 || leadAt < d),
     `the disclosure is not in a ${demotion}`,
     `the lead sits at ${leadAt} and the first ${demotion} at ${d} — ${demotion} is the footnote treatment build note 1 forbids`);
}

/* ======================================================================
 * Structure. The counts the brief's section outline names.
 * ====================================================================== */

const tablesIn = (s) => [...s.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => m[0]);
const bodyRows = (t) => ((t.match(/<tbody[\s\S]*?<\/tbody>/) || [""])[0].match(/<tr\b/g) || []).length;

const t3 = tablesIn(s3);
ok(t3.length === 1 && bodyRows(t3[0]) === 18,
   "§3's coverage table is 18 rows",
   `found ${t3.length} table(s), ${t3.length ? bodyRows(t3[0]) : 0} rows. Every row is cited; a dropped row is a dropped claim`);

const t5 = tablesIn(s5);
ok(t5.length === 2, `§5 carries two tables (${t5.length})`,
   "the row-filter outcomes and the five reported sections are both tables");
if (t5.length === 2) {
  ok(bodyRows(t5[0]) === 4, `§5's outcomes table is 4 rows (${bodyRows(t5[0])})`,
     "one correct case and three outcomes, none of them an error");
  ok(bodyRows(t5[1]) === 5, `§5's reported-and-not-converted table is 5 rows (${bodyRows(t5[1])})`,
     "parser.py:61-69 is the one table both readers share, and it has five keys");
}

const s2 = sections[at("Run it")] || "";
const t2 = tablesIn(s2);
ok(t2.length === 1 && bodyRows(t2[0]) === 5,
   "§2's flag table is 5 rows",
   `found ${t2.length} table(s), ${t2.length ? bodyRows(t2[0]) : 0} rows. C-5 matched --help cell for cell`);

const accItems = (s5.match(/pv-acc__item/g) || []).length;
ok(accItems === 6, `§5's Accordion has 6 panels (${accItems})`,
   "five, plus the per-minute rate conversion");

const tabs = (s2.match(/pv-codetabs__tab\b/g) || []).length;
ok(tabs === 2, `§2 has 2 CodeTabs (${tabs})`,
   "Export then Convert. Tab 1 writes the directory tab 2 reads");

const cards4 = ((sections[i4] || "").match(/class="pv-ruled"/g) || []).length;
ok(cards4 === 4, `§4 is 4 RuledCards (${cards4})`, "four, each cited, no absolutes");
const cards7 = ((sections[i7] || "").match(/class="pv-ruled"/g) || []).length;
ok(cards7 === 2, `§7 is 2 RuledCards (${cards7})`, "two, conceded, unhedged");

/* No figure. The image-register has no slot for a /vs/* page — IMG-15 covers
 * the Compare hub — and a FigPanel above the fold pushes §5 down the page,
 * which is the one thing this page cannot afford. */
ok(!noComments.includes("pv-fig"), "no FigPanel on the page",
   "the image-register has no /vs/* slot, and a figure above the fold pushes §5 down");

/* A cell that is a dash is a claim with no scope. Checked on both of §5's
 * tables and on §3's, where an em-dash would be a coverage statement nobody
 * wrote. */
for (const [label, list] of [["§3", t3], ["§5", t5], ["§2", t2]]) {
  for (const [i, t] of list.entries()) {
    const body = (t.match(/<tbody[\s\S]*?<\/tbody>/) || [""])[0];
    for (const row of body.match(/<tr\b[\s\S]*?<\/tr>/g) || []) {
      for (const cell of [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").trim())) {
        if (/^[—–-]?$/.test(cell)) {
          const name = (row.match(/<th[^>]*>([\s\S]*?)<\/th>/) || [, "?"])[1].replace(/<[^>]+>/g, "").trim();
          fail.push(`${label} table ${i + 1}, row "${name}": the cell is a dash or empty — a claim with no scope`);
        }
      }
    }
  }
}
if (!fail.some((f) => f.includes("is a dash"))) pass.push("every table cell carries prose");

/* ======================================================================
 * 4. The brief's own words, if the brief was handed to us.
 * ====================================================================== */

if (briefPath && existsSync(briefPath)) {
  const brief = readFileSync(briefPath, "utf8");

  /* Code spans are lifted out before emphasis is stripped and put back after.
   * Without that, an asterisk inside a span reads as emphasis, and the one
   * brief cell that is a SQL comment — the `unsupported op: id` cell in §5's
   * outcomes table — loses the comment markers that are the whole point of it.
   * The check would then fail on its own markdown handling and report it as a
   * page defect. */
  const unmd = (t) => {
    const spans = [];
    const held = quotes(t).replace(/`([^`]*)`/g, (_, s) => {
      spans.push(s);
      return `@@${spans.length - 1}@@`;
    });
    return held
      .replace(/\[C-\d+\]/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/\*\*([^*]*)\*\*/g, "$1")
      .replace(/\*([^*]*)\*/g, "$1")
      .replace(/@@(\d+)@@/g, (_, i) => spans[Number(i)])
      .replace(/\s+/g, " ")
      .trim();
  };

  const copy = brief.split("## 5. Copy")[1]?.split("## 6. Claims")[0] || "";
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
    /* A paragraph that is nothing but a bold label is a component directive —
     * "ComparisonTable, two columns", "Callout, primary weight, first in the
     * section" — and tells the build where copy goes rather than being copy.
     * The copy it introduces is the table or the callout body that follows. */
    if (/^\s*\*\*[\s\S]+:\*\*\s*$/.test(t)) continue;
    /* The label is matched on the `**…:**` pair non-greedily rather than on
     * `[^*]+`, because one panel title contains an asterisk of its own —
     * `columns: "*"` — and a label class that forbids one drops that panel's
     * body from the comparison entirely. */
    const m = /^\s*\*\*([\s\S]+?):\*\*\s*([\s\S]+)/.exec(para);
    const b = unmd(m ? m[2] : para);
    if (b.length >= 40 && !b.includes("→")) blocks.push(b);
  }

  for (const b of blocks) {
    if (prose.includes(b) || text.includes(b)) { pass.push("verbatim: " + b.slice(0, 48) + "…"); continue; }
    let lo = 0, hi = b.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (prose.includes(b.slice(0, mid))) lo = mid; else hi = mid - 1;
    }
    fail.push(`NOT VERBATIM after ${lo} chars: …${b.slice(Math.max(0, lo - 50), lo + 50)}…`);
  }
  console.log(`\n${blocks.length} copy blocks checked against ${briefPath}`);
}

console.log(`\n${pass.length} passed`);
for (const f of fail) console.log("  FAIL  " + f);
console.log(fail.length ? `\n${fail.length} failed` : "\nall checks passed");
process.exit(fail.length ? 1 : 0);
