/**
 * The static assertions for /compare (PRO-52).
 *
 *   node site/design-system/check-page-compare.mjs
 *   node site/design-system/check-page-compare.mjs <brief.md>
 *
 * In the shape of check-page-vs-hasura.mjs and check-page-vs-starburst.mjs,
 * and asserting the nine acceptance criteria of the build issue, each one
 * because a build pass has already weakened the thing it holds in place on
 * at least one page in the register.
 *
 * The nine, each a comment on the group of checks that holds it:
 *
 *   1. No port number appears anywhere on this page. The repository
 *      publishes three numbers for one Bolt port and one of them is in the
 *      file §6 invites the reader to check. Ports live on /why/interfaces.
 *
 *   2. Every competitor cell is prose. A bare em-dash is a negative
 *      absolute with no scope, which is REQ-2031 and the shape that cost
 *      the SME eight rows.
 *
 *   3. The concession comes before the distinction in every row. §4 and
 *      §5 each open with their fit-statement Callout, above the
 *      ComparisonTable — reordering so the differences come first inverts
 *      the page.
 *
 *   4. §4's C-17 callout and §5's C-23/C-24 callout sit at full weight,
 *      in their sections, in body type. They are the page's two published
 *      restraints; demoting either to a footnote or a lighter colour
 *      removes the only thing on the page a competitor's field team
 *      cannot use against us.
 *
 *   5. §6's link to docs/competitive_analysis.md resolves on the public
 *      repository. A 404 there turns the method section into a bluff.
 *
 *   6. Two comparison cards. IMG-15 is two marks, not three — no Denodo
 *      column exists in docs/competitive_analysis.md and a card pointing
 *      at a page built on nothing is worse than no card. /vs/denodo must
 *      still resolve: it gets no card and no link from this page.
 *
 *   7. No managed-service language in any tense; the CTA labels come
 *      from the design-system ladder (REQ-2014).
 *
 *   8. node site/verify-claims.mjs stays green, plus the checks here as
 *      strings.
 *
 *   9. The five-width two-theme render pass lives in
 *      verify-page-compare.mjs, next to this file.
 *
 * The page's rendered prose is what is tested, not its source: the HTML
 * comments explain the build and have to be able to name a forbidden
 * string in order to forbid it. Tags are stripped, entities resolved and
 * whitespace collapsed first, so a phrase broken across a line wrap or
 * split by a <code> or <strong> tag is still caught.
 */

import { readFileSync, existsSync } from "node:fs";

const FILE = "site/compare.html";

const args = process.argv.slice(2);
const NO_NETWORK = args.includes("--no-network");
const briefPath = args.find((a) => !a.startsWith("--"));

/* ======================================================================
 * 1. Forbidden strings
 *
 * Each row has the string and the reason it is forbidden. The six port
 * numbers are listed verbatim — the brief's build note 3 names them and
 * criterion 1 of the acceptance list is the hard version of the same rule.
 * ====================================================================== */

const FORBIDDEN = [
  /* AC 1 — ports. The six the brief names, each one wrong on this page
   * either because the repo publishes it (5251) or because it is the one
   * our product uses (7687, 5439, 8815, 50051, 8009) and belongs on
   * /why/interfaces, not here. */
  ["5251", "AC 1. docs/competitive_analysis.md:61 publishes 5251 as a Bolt port. The listener defaults to 0 (REQ-1913). Ports belong on /why/interfaces"],
  ["7687", "AC 1. The real Neo4j Bolt port. Not this page — ports live on /why/interfaces"],
  ["5439", "AC 1. Redshift. Same rule"],
  ["8815", "AC 1. Flight SQL. Same"],
  ["50051", "AC 1. gRPC. Same"],
  ["8009", "AC 1. ADBC. Same"],

  /* AC 7 and REQ-2014. No managed service in any tense. */
  ["cloud.provisa.dev", "AC 7 / REQ-2014. Standing instruction"],
  ["managed hosting",   "AC 7 / REQ-2014"],
  ["coming soon",       "AC 7 / REQ-2014. Not even in the future tense"],
  ["start free trial",  "AC 7 / REQ-2014. The withdrawn CTA label"],
  ["start a free trial","AC 7 / REQ-2014. Same, spaced"],
  ["SaaS only",         "AC 7. The brief notes this was false about Apollo (they document offline licences); §5's fourth row has the correct form"],

  /* Brief revision 2 §1. The layer count is gone and must not come back:
   * five is unsourceable and four of our own documents disagree. */
  ["Five governance layers compile", "Brief revision 2 §1. The number is unsourceable; the §4 DENY row uses `every surface goes through one place` instead"],
  ["five governance layers",         "Same"],
  ["five layers",                    "Same, in loose form"],
  ["six layers",                     "Same. docs/marketing.md says six and docs/security.md:63 says five after enumerating six"],

  /* REQ-2032 and the SME's not-publishable row 4. "Exceeds all" was two
   * of the three false constructions the pass caught.
   *
   * The two sibling constructions "not available" and "no X" are not
   * forbidden strings here: §6 card 3 quotes them as the defects it
   * forbids, and a check that forbids them site-wide would fail on the
   * card that publishes the rule. REQ-2032 is enforced by the sweep of
   * `site/verify-claims.mjs`, which has the context to tell quotation
   * from assertion. */
  ["exceeds all",        "REQ-2032. Two of three claims using this died on the pass"],

  /* Brief revision 1 §4. "Not viable for regulated industries" was false
   * about Apollo. */
  ["not viable for regulated",       "Brief revision 1 §4. False about Apollo — they document offline licences"],
  ["no air-gap",                     "Brief revision 1 §4. Same"],

  /* The /vs/hasura card uses "no in-place upgrade path" per Hasura's own
   * documentation, so "end-of-life" must not appear on the page. */
  ["end-of-life",        "AC and §3 card 2. False — Hasura's own LTS policy puts v2 on Active LTS through December 2028"],
  ["end of life",        "Same, spaced"],

  /* "No query optimization" is one of the four constructions the brief
   * notes produced the seventeen false cells in the first pass. */
  ["no query optimization", "Brief, build note 4. One of the constructions that produced the seventeen false cells"],

  /* REQ-2032 struck these absolutes. */
  ["Neo4j has no row-level filtering",            "Brief §9. False as published — Neo4j 2026.09 documents property-based access control"],
  ["Apollo caching is not security-partitioned",  "Brief §9. False — the Router separates entity-cache entries by authorization context"],

  /* claim-audit §1.1 and §1.2 — the source counts are 72, 63, 37. */
  ["85+", "Unsupported. The pages say 72 / 63 / 37"],

  /* The three the whole site forbids as a matter of standing. */
  ["all-in-one",      "Standing instruction"],
  ["single platform", "Standing instruction"],

  /* No compliance certification name appears on any page. */
  ["SOC 2",     "No compliance certification name appears on any page"],
  ["ISO 27001", "Same"],
  ["HIPAA",     "Same"],
  ["GDPR",      "Same"],
  ["FedRAMP",   "Same"],
  ["PCI",       "Same"],
];

/* ======================================================================
 * 2. Required strings
 *
 * A page that drops one of these fails in the way the brief is written to
 * prevent. Each one carries the brief claim id and a one-line why.
 * ====================================================================== */

const REQUIRED = [
  /* §1 Hero. The spine (C-1) and the framing (C-2). */
  ["Provisa is a governed semantic layer. Federation, metrics, ontology and governance come from one model, and the engine underneath it is yours and swappable.",
   "C-1. The spine, swept sitewide (REQ-2015 to REQ-2019)"],
  ["It is not an MPP query engine, not a graph database and not a GraphQL gateway.",
   "C-2. The framing"],
  ["in two cases Provisa runs",
   "C-2. The 'runs on' hinge, cited at docs/competitive_analysis.md:62"],
  ["the thing you already operate",
   "C-2. The second half of the framing"],

  /* §2 Four categories. The row that decides (C-7) in the brief's words. */
  ["Four categories, four questions",
   "§2 H2"],
  ["The row that decides it is usually the second column.",
   "C-7. The deciding question. Verbatim"],
  ["who is allowed to see what, across all of it, and can I prove it",
   "C-7. The hinge inside C-7"],

  /* §3 ChoiceCards. C-8 and C-9. */
  ["Starburst Enterprise and Galaxy are Trino",
   "C-8. The concession that opens §3 card 1"],
  ["If you run it, keep it",
   "C-8. The hinge sentence"],
  ["an engine with access control and a model with an engine underneath it",
   "C-8. The frame"],
  ["Your v2 metadata is a file and Provisa reads it",
   "C-9. The §3 card 2 lede"],
  ["there is no in-place upgrade path from v2 to DDN",
   "C-9. Hasura's own documentation. Replaces 'end-of-life'"],
  ["v2 remains supported under their LTS policy",
   "C-9. Hasura's own LTS statement"],

  /* §4 Neo4j. The fit Callout (C-10) is first. The DENY row (C-14) is
   * verbatim. C-17 is the published restraint. */
  ["If you run Neo4j",
   "§4 H2"],
  ["Cypher is theirs and graph analytics is theirs",
   "C-10. The unhedged fit statement"],
  ["Graph Data Science 2026.09 documents centrality, community detection, similarity, path finding, node embeddings and topological link prediction",
   "C-10. The GDS roll-call"],
  ["If what you need is deep traversal or GDS, the answer is Neo4j and this page is not going to argue with you.",
   "C-10. The concession in full"],
  ["Read from Neo4j's published documentation on 14 October 2026",
   "§4 dateline. REQ-2030, in body type"],
  ["Neo4j 2026.09 (Operations Manual), Cypher 25, Graph Data Science 2026.09, the Neo4j GraphQL Library v7 and the Neo4j JDBC Driver manual",
   "§4 dateline. The products and versions"],
  ["Composite databases",
   "C-11. SME publishable list row 2"],
  ["LOAD CSV",
   "C-11. The CSV mechanism"],
  ["No REST, GraphQL or gRPC service is a governed source",
   "C-11. The scope sentence"],
  ["72 source types in one model",
   "C-12. 72 / 63 / 37"],
  ["Access control hides; it does not transform",
   "C-13. SME publishable list row 3"],
  ["Column masking is a transformation",
   "C-13. The Provisa column"],
  ["a DENY rule fails open when its criteria cannot be evaluated, which means the restriction is not applied",
   "C-14. Verbatim quotation from Neo4j's documentation. Required by REQ-2031"],
  ["Governance is compiled into the query plan before execution, at the one place every surface goes through",
   "C-14. The SME's replacement sentence verbatim. The layer count is gone"],
  ["Vector embeddings live in the graph",
   "C-15. SME publishable list row 5"],
  ["Cypher 25 vector indexes are supported, not beta",
   "C-15. The scope"],
  ["Their catalog is per-role for labels, not for property keys",
   "C-16. SME publishable list row 6 — the asymmetry only"],
  ["according to the user's access rights",
   "C-16. The documented half of the asymmetry (verbatim)"],
  ["all property keys in the database",
   "C-16. The documented other half (verbatim)"],
  ["We are not claiming that Neo4j property names leak to a role that cannot read them.",
   "C-17. The published restraint, affirmative. Full weight, in body type"],
  ["a comparison page is not the place to find out in public",
   "C-17. The second half"],

  /* §5 Apollo. The fit Callout (C-18) is first. The @connect row (C-19)
   * is verbatim. C-23/C-24 is the two-withdrawals callout. */
  ["If you run Apollo GraphOS",
   "§5 H2"],
  ["Composing GraphQL services your teams already built is theirs",
   "C-18. The unhedged fit statement"],
  ["Apollo Connectors register an HTTP/JSON API declaratively",
   "C-18. The connector concession in full"],
  ["GraphOS is built for exactly that",
   "C-18. The last sentence"],
  ["Read from Apollo's published documentation on 14 October 2026",
   "§5 dateline. REQ-2030"],
  ["GraphOS Router v2, Federation v2.12, and the Connectors",
   "§5 dateline. The components"],
  ["spec v0.4",
   "§5 dateline. The connect spec version"],
  ["GraphOS is continuously released",
   "§5 dateline. The reason it carries a date rather than a version"],
  ["The transport is the boundary, in their sentence:",
   "C-19. SME publishable list, Apollo row 2"],
  ["can only retrieve data from HTTP APIs that return JSON data and, optionally, accept a JSON body",
   "C-19. Verbatim quotation from Apollo's documentation. Required by REQ-2031"],
  ["No database, object store, file, stream or gRPC service is a connector target",
   "C-19. The scope sentence"],
  ["Authorization is field-and-type",
   "C-20. SME publishable list, Apollo row 3 — concession first"],
  ["Row-level security and column masking are layers of the plan",
   "C-20. The Provisa column"],
  ["Schema differentiation is per variant",
   "C-21. SME publishable list, Apollo row 4"],
  ["A new audience is a role, not a deployment",
   "C-21. The Provisa column"],
  ["The air-gapped thing is the router, not GraphOS",
   "C-22. The concession, unhedged"],
  ["Offline licences exist",
   "C-22. Concede the licences fully"],
  ["Self-hosted end to end, with no vendor service in the deploy path and no phone-home",
   "C-22. The Provisa column"],
  ["security-partitioned caching is not a differentiator",
   "C-23. The withdrawal. REQ-2032"],
  ["so a table or column the role cannot see is not in the prompt",
   "C-24. The mechanism clause the SME verdict restored"],
  ["the model cannot propose a table the caller may not see, because it was never shown one",
   "C-24. The failure-mode sentence"],

  /* §6 How this page is made. The three cards and the GitHub link. */
  ["How this page is made",
   "§6 H2"],
  ["A date, or it does not ship",
   "C-25. REQ-2030 card title"],
  ["A column nobody has re-read publishes nothing",
   "C-25. The brief's wording"],
  ["Their nearest capability, before our distinction",
   "C-26. REQ-2031 card title"],
  ["No bare negatives",
   "C-27. REQ-2032 card title"],
  ["We published two of them about natural-language query and both were wrong",
   "C-27. The admission. The brief's author kept it; the SME verdict kept it"],
  ["The file these rows come from is in the repository",
   "C-28. The method sentence"],

  /* §7 Where Provisa is the wrong answer. Three concessions. */
  ["Where Provisa is the wrong answer",
   "§7 H2"],
  ["Provisa does not offer one",
   "C-29. The managed-service concession, unhedged. REQ-2014"],
  ["self-hosted: your infrastructure, your cloud, or air-gapped",
   "C-29. The deployment surface, in full"],
  ["which is the only configuration some regulated buyers can accept",
   "C-29. The clause inside the concession"],
  ["no help at all if zero operations is your requirement",
   "C-29. The last sentence of the concession"],
  ["a mature one will out-run Provisa on raw analytical scale",
   "C-30. The MPP concession"],
  ["Deep traversal and graph algorithms belong in a graph store",
   "C-31. The graph concession"],

  /* §8 Conversion. */
  ["Bring us the comparison you are actually running",
   "§8 H2"],
  ["the four categories in §2 cover most of what gets compared to Provisa",
   "§8 body"],
];

/* ======================================================================
 * 3. Links and anchors
 * ====================================================================== */

const REQUIRED_HREFS = [
  ['href="/vs/starburst"', "§3 card 1 CTA"],
  ['href="/vs/hasura"',    "§3 card 2 CTA"],
  ['href="https://github.com/motleydev/provisa/blob/main/docs/competitive_analysis.md"',
   "AC 5 / C-28. The §6 GitHub link to the public repository"],
  ['href="/register"',     "AC 7 / REQ-2014. The free-licence rung"],
  ['href="#contact"',      "AC 7 / REQ-2014. The book-a-demo rung"],
];

/* AC 6, and build note 6 of the brief. /vs/denodo gets no card and no
 * link from this page. Scoped to <main> — the shared footer still links
 * it, because an unlinked page is not a deleted page and that is where it
 * resolves from. */
const FORBIDDEN_HREFS_IN_MAIN = [
  ['href="/vs/denodo"', "AC 6 and build note 6. No card and no link; the footer still resolves it"],
  ['href="/install',    "Build note 5. /install does not exist (PRO-17, PRO-40); seven links on three pages already wait on it"],
];

/* ======================================================================
 * Read and normalize
 * ====================================================================== */

const raw = readFileSync(FILE, "utf8");
const noComments = raw.replace(/<!--[\s\S]*?-->/g, " ");

const quotes = (t) =>
  t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

const entities = (t) =>
  t.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

const stripped = noComments.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ");

/* Two normalizations, because they catch different mistakes.
 *
 * `text` turns every tag into a space, so a phrase split across a line wrap is
 * still one phrase. `prose` drops inline tags without leaving a space behind
 * them, because a sentence like "returning <code>void</code> and" has no space
 * where the tag was and comparing against the brief's words needs it closed
 * up. Required strings are matched against both. */
const text = quotes(entities(stripped.replace(/<[^>]+>/g, " "))).replace(/\s+/g, " ").trim();

const prose = quotes(
  entities(
    stripped
      .replace(/<\/?(code|strong|em|span|a|mark|b|i|q)\b[^>]*>/g, "")
      .replace(/<[^>]+>/g, " ")
  )
).replace(/\s+/g, " ").trim();

const fail = [];
const pass = [];
const ok = (c, m, why) => (c ? pass.push(m) : fail.push(`${m} — ${why}`));

/* ======================================================================
 * 4. Forbidden strings
 * ====================================================================== */

for (const [needle, why] of FORBIDDEN) {
  const n = quotes(needle);
  /* Case-insensitive match for the English words; exact match for the
   * port digits. */
  const haystack = /^\d+$/.test(n) ? text : text.toLowerCase();
  const probe = /^\d+$/.test(n) ? n : n.toLowerCase();
  if (haystack.includes(probe)) fail.push(`FORBIDDEN "${needle}" — ${why}`);
  else pass.push(`absent: ${needle}`);
}

/* ======================================================================
 * 5. Required strings
 * ====================================================================== */

for (const [needle, why] of REQUIRED) {
  const n = quotes(needle);
  if (text.includes(n) || prose.includes(n)) pass.push(`present: ${needle.slice(0, 56)}…`);
  else fail.push(`MISSING "${needle}" — ${why}`);
}

/* ======================================================================
 * 6. Links and anchors
 * ====================================================================== */

for (const [needle, why] of REQUIRED_HREFS) {
  ok(noComments.includes(needle), `source carries ${needle}`, why);
}

const main = (noComments.match(/<main[\s\S]*?<\/main>/) || [""])[0];
for (const [needle, why] of FORBIDDEN_HREFS_IN_MAIN) {
  if (main.includes(needle)) fail.push(`FORBIDDEN link ${needle} in <main> — ${why}`);
  else pass.push(`no link in <main>: ${needle}`);
}

/* ======================================================================
 * 7. Section order and composition
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
  "What Provisa is, in terms of things you already run.",
  "Four categories, four questions",
  "Two comparisons in detail",
  "If you run Neo4j",
  "If you run Apollo GraphOS",
  "How this page is made",
  "Where Provisa is the wrong answer",
  "Bring us the comparison you are actually running",
  "Book a demo.",
];

const got = headings.map(quotes);
ok(
  got.length === EXPECTED_ORDER.length && EXPECTED_ORDER.every((h, i) => got[i] === h),
  "the eight sections and the contact band are in the brief's order",
  `got ${JSON.stringify(got)}`
);

const at = (h) => got.indexOf(h);
const i4 = at("If you run Neo4j");
const i5 = at("If you run Apollo GraphOS");
const i6 = at("How this page is made");

/* ======================================================================
 * 8. §4 and §5: fit callout BEFORE the table.
 *
 * AC 3 / brief build note 1. Reordering so the differences come first
 * inverts the page's argument. A source-order check is what makes it hold
 * at every width: nothing on this page is positioned, floated or
 * grid-ordered, so the document order is the paint order.
 * ====================================================================== */

for (const [i, label] of [[i4, "§4"], [i5, "§5"]]) {
  const sec = sections[i] || "";
  const calloutAt = sec.indexOf("pv-callout");
  const tableAt = sec.indexOf("<table");
  const pAt = sec.indexOf("pv-p");
  ok(calloutAt >= 0 && calloutAt < tableAt,
     `${label}'s fit Callout precedes its ComparisonTable`,
     `callout at ${calloutAt}, table at ${tableAt} — reordering inverts the page's argument`);
  ok(calloutAt >= 0 && (pAt < 0 || calloutAt < pAt),
     `${label}'s fit Callout precedes its first paragraph`,
     `callout at ${calloutAt}, paragraph at ${pAt}`);
}

/* ======================================================================
 * 9. §4 and §5: the published restraint sits at full weight.
 *
 * AC 4. Each section has a trailing Callout (C-17 and C-23/C-24). It must
 * be a pv-callout at full weight — not pv-callout--inverse, not inside a
 * pv-note or pv-p--sm. §4's leading Callout is pv-callout--get (forest
 * concession); the trailing one is the primary tone. §5 is the same.
 * ====================================================================== */

for (const [i, label, lead] of [
  [i4, "§4", "We are not claiming that Neo4j property names leak"],
  [i5, "§5", "security-partitioned caching is not a differentiator"],
]) {
  const sec = sections[i] || "";
  const callouts = [...sec.matchAll(/<div class="(pv-callout[^"]*)">/g)].map((m) => m[1].trim());
  ok(callouts.length >= 2,
     `${label} carries two Callouts (lead concession and trailing restraint)`,
     `found ${callouts.length}`);
  const trailing = callouts[callouts.length - 1];
  ok(trailing === "pv-callout",
     `${label}'s trailing Callout is at primary weight (not --inverse, not --get)`,
     `class is "${trailing}" — the restraint is this page's two credibility sentences; a lighter tone demotes it`);

  const flat = sec.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
  ok(flat.includes(lead), `${label}'s restraint carries its lead sentence`,
     `missing: ${lead}`);

  /* The restraint sentence is in a pv-callout__body, not in pv-note or
   * pv-p--sm (the two footnote shapes a softening pass reaches for).
   * The position check is on the flattened text, because tags around the
   * lead make the raw-source position hard to compare with the demotion
   * class markers. */
  const leadAt = flat.indexOf(lead);
  const flatDemo = (cls) => {
    /* Walk the raw section, flattening as we go, and record the flattened
     * offset at which a given class name appears. */
    let out = "", off = -1;
    let i = 0;
    while (i < sec.length) {
      if (sec[i] === "<") {
        const end = sec.indexOf(">", i);
        if (end < 0) break;
        const tag = sec.slice(i, end + 1);
        if (off < 0 && tag.includes(cls)) off = out.length;
        i = end + 1;
      } else {
        out += sec[i++];
      }
    }
    return off;
  };
  for (const demotion of ["pv-note", "pv-p--sm"]) {
    const d = flatDemo(demotion);
    ok(leadAt >= 0 && (d < 0 || leadAt < d),
       `${label}'s restraint is not in a ${demotion}`,
       `the lead sits at ${leadAt} and the first ${demotion} at ${d}`);
  }
}

/* ======================================================================
 * 10. Table counts.
 *
 * The brief's §2 is 4 rows, §4 is 5 rows, §5 is 4 rows. A dropped row is
 * a dropped claim. §4 says six rows in the brief's §4 outline but the
 * actual copy table has five (brief §5 Copy: five rows), because the row
 * named in the outline is the C-17 restraint callout, not a table row.
 * ====================================================================== */

const tablesIn = (s) => [...s.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => m[0]);
const bodyRows = (t) => ((t.match(/<tbody[\s\S]*?<\/tbody>/) || [""])[0].match(/<tr\b/g) || []).length;

const s2 = sections[at("Four categories, four questions")] || "";
const t2 = tablesIn(s2);
ok(t2.length === 1 && bodyRows(t2[0]) === 4,
   "§2's category map is 4 rows",
   `found ${t2.length} table(s), ${t2.length ? bodyRows(t2[0]) : 0} rows. The fourth row names the Data virtualization category and makes no Denodo claim`);

const t4 = tablesIn(sections[i4] || "");
ok(t4.length === 1 && bodyRows(t4[0]) === 5,
   "§4's Neo4j table is 5 rows",
   `found ${t4.length} table(s), ${t4.length ? bodyRows(t4[0]) : 0} rows. Every row is a dated documentation claim`);

const t5 = tablesIn(sections[i5] || "");
ok(t5.length === 1 && bodyRows(t5[0]) === 4,
   "§5's Apollo table is 4 rows",
   `found ${t5.length} table(s), ${t5.length ? bodyRows(t5[0]) : 0} rows. Every row is a dated quotation`);

/* ======================================================================
 * 11. AC 2 — every competitor cell is prose.
 *
 * Every table on the page is swept: a cell that is empty, a dash, or
 * nothing but a dash is a claim with no scope. REQ-2031.
 * ====================================================================== */

for (const [label, list] of [["§2", t2], ["§4", t4], ["§5", t5]]) {
  for (const [i, t] of list.entries()) {
    const body = (t.match(/<tbody[\s\S]*?<\/tbody>/) || [""])[0];
    for (const row of body.match(/<tr\b[\s\S]*?<\/tr>/g) || []) {
      for (const cell of [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").trim())) {
        if (/^[—–-]?$/.test(cell)) {
          const name = (row.match(/<th[^>]*>([\s\S]*?)<\/th>/) || [, "?"])[1].replace(/<[^>]+>/g, "").trim();
          fail.push(`${label} table ${i + 1}, row "${name}": the cell is a dash or empty — AC 2, a claim with no scope (REQ-2031)`);
        }
      }
    }
  }
}
if (!fail.some((f) => f.includes("is a dash or empty"))) pass.push("every table cell carries prose");

/* ======================================================================
 * 12. §3 ChoiceCards: exactly two, one with /vs/starburst and one with
 * /vs/hasura. AC 6, the brief's build note 6.
 * ====================================================================== */

const s3 = sections[at("Two comparisons in detail")] || "";
/* Match the opening of a ChoiceCard — class value that starts with
 * pv-choice, immediately followed by either a space, a quote or a
 * modifier dash. Not pv-choice__title or pv-choice__items, which are
 * children of the card. */
const cards = (s3.match(/class="pv-choice(?:[\s"]|--)/g) || []).length;
ok(cards === 2, `§3 is 2 ChoiceCards (${cards})`,
   "AC 6. Two marks, not three — /vs/denodo has no evidence base");

ok(s3.includes('href="/vs/starburst"') && s3.includes('href="/vs/hasura"'),
   "§3 cards link /vs/starburst and /vs/hasura",
   "AC 6. One each, no third");

ok(!s3.includes('href="/vs/denodo"'),
   "§3 contains no /vs/denodo link",
   "AC 6. /vs/denodo has no card and no link on this page");

/* ======================================================================
 * 13. §3 ChoiceCards: a square editorial illustration in each. IMG-15,
 * 1/1, one mark per comparison. The register entry still says three; the
 * VP owns that document. Two marks ship.
 * ====================================================================== */

const figs = (s3.match(/pv-editorial--square/g) || []).length;
ok(figs === 2, `§3 ships two square editorial illustrations (${figs})`,
   "IMG-15, one per comparison, at 1/1. The brief forbids a figure above §2");

const figPngs = (s3.match(/<img\s+[^>]*src="\/assets\/editorial\/img-15[ab]-light\.png"/g) || []).length;
ok(figPngs === 2, `§3 references both IMG-15 light PNGs (${figPngs})`);

ok(!s3.includes("pv-fig"), "no FigPanel placeholders remain in §3",
   "IMG-15 is placed; the CSS FigPanel was retired on PRO-143");

/* No figure in §1. A figure above §2 pushes the category map below
 * the fold, which is the one thing this page cannot afford. */
const s1 = sections[0] || "";
ok(!s1.includes("pv-fig") && !s1.includes("pv-editorial"), "no figure in §1",
   "a figure above §2 pushes the category map below the fold");

/* ======================================================================
 * 14. §6 and §7: three RuledCards each.
 * ====================================================================== */

const s6 = sections[i6] || "";
/* Same shape as the ChoiceCard match: the card's own class, not the
 * children __num / __title / __body. */
const RULED_CARD = /class="pv-ruled(?:[\s"]|--)/g;
const cards6 = (s6.match(RULED_CARD) || []).length;
ok(cards6 === 3, `§6 is 3 RuledCards (${cards6})`,
   "C-25, C-26, C-27 — one per REQ (2030, 2031, 2032)");

const s7 = sections[at("Where Provisa is the wrong answer")] || "";
const cards7 = (s7.match(RULED_CARD) || []).length;
ok(cards7 === 3, `§7 is 3 RuledCards (${cards7})`,
   "C-29, C-30, C-31 — three concessions, unhedged");

/* ======================================================================
 * 15. The page's §4 and §5 datelines sit in body type.
 *
 * Build note 2 / REQ-2030. A design pass that moves either into a
 * footnote breaks REQ-2030 on the page that publishes REQ-2030 as a
 * selling point. The two body paragraphs must both include "14 October
 * 2026" and must not be in a pv-note or pv-p--sm.
 * ====================================================================== */

for (const [i, label] of [[i4, "§4"], [i5, "§5"]]) {
  const sec = sections[i] || "";
  const paras = [...sec.matchAll(/<p\s+class="pv-p[^"]*">([\s\S]*?)<\/p>/g)];
  const bodyDate = paras.find((m) => m[1].includes("14 October 2026") && !m[0].includes("pv-note") && !m[0].includes("pv-p--sm"));
  ok(!!bodyDate,
     `${label}'s dateline is in body type`,
     "REQ-2030. A dateline in a pv-note or pv-p--sm demotes it below the thing it certifies");
}

/* ======================================================================
 * 16. The nav item: aria-current="page" on /compare in the header and
 * drawer, so a Compare visitor is not told they are on /vs/starburst.
 * ====================================================================== */

ok(/href="\/compare"[^>]*aria-current="page"/.test(noComments),
   "the Compare nav item is marked aria-current on /compare",
   "this page is the Compare hub; the aria-current marker belongs here, not on /vs/starburst");

/* ======================================================================
 * 17. AC 5 — the §6 GitHub link resolves on the public repository.
 *
 * The checker fetches HEAD. A 404 fails. A network error (no network, DNS
 * fails, timeout) logs a note and is not a failure in itself — the gate is
 * on a public artifact, so skipping the fetch is a weaker signal, not a
 * broken one. Pass --no-network to disable the fetch explicitly in offline
 * runs; AC 5 is still asserted as a required href above.
 *
 * The method: a GET with an Accept header that returns raw markdown. HEAD
 * on raw.githubusercontent is reliable; HEAD on the HTML view sometimes
 * returns 405.
 * ====================================================================== */

const GITHUB_URL =
  "https://github.com/motleydev/provisa/blob/main/docs/competitive_analysis.md";
const RAW_URL =
  "https://raw.githubusercontent.com/motleydev/provisa/main/docs/competitive_analysis.md";

if (!NO_NETWORK) {
  try {
    const r = await fetch(RAW_URL, { method: "HEAD", redirect: "follow" });
    if (r.status === 200) {
      pass.push(`AC 5 (network): ${RAW_URL} resolves 200`);
    } else if (r.status === 404) {
      fail.push(
        `AC 5 (network): ${RAW_URL} returned 404 — §6's method section is a bluff until the file lands on main`,
      );
    } else {
      /* 403, 429 and others are not "the file is missing", they are
       * rate-limit or forbidden-fetch states that mean nothing about the
       * page. Logged as a note, not a failure. */
      console.log(`  note  ${RAW_URL} returned ${r.status} — treated as a transport state, not a 404`);
      pass.push(`AC 5 (network): ${RAW_URL} returned ${r.status} (not a 404)`);
    }
  } catch (e) {
    console.log(`  note  ${RAW_URL} fetch failed: ${e.message} — rerun with network, or pass --no-network to acknowledge`);
    pass.push(`AC 5 (network): fetch skipped — ${e.message}`);
  }
}

/* ======================================================================
 * 18. The brief's own words, if the brief was handed to us.
 *
 * Lift code spans before stripping emphasis so a `code span` with
 * asterisks inside it does not read as emphasis. [C-N] markers and
 * [text](link) are stripped; so are the markdown bolds and italics.
 * ====================================================================== */

if (briefPath && existsSync(briefPath)) {
  const brief = readFileSync(briefPath, "utf8");

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
    /* A paragraph that is nothing but a bold label is a component
     * directive — "ComparisonTable, two columns", "Callout, first in the
     * section" — and tells the build where copy goes rather than being
     * copy. The copy it introduces is the table or callout body that
     * follows. */
    if (/^\s*\*\*[\s\S]+:\*\*\s*$/.test(t)) continue;
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

/* ======================================================================
 * Report
 * ====================================================================== */

console.log(`\n${pass.length} passed`);
for (const f of fail) console.log("  FAIL  " + f);
console.log(fail.length ? `\n${fail.length} failed` : "\nall checks passed");
process.exit(fail.length ? 1 : 0);
