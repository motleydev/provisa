/**
 * Static assertions for /pricing (PRO-93).
 *
 *   node site/design-system/check-page-pricing.mjs
 *
 * Each check is one of the SME verdicts on PRO-88 against the editions-brief
 * revision 2, held here so a later pass cannot restore the thing the verdict
 * struck without this file turning red.
 *
 * The page's rendered prose is what is tested, not its source: the HTML
 * comments carry the verdict IDs and are allowed to name a forbidden phrase
 * in order to say it is forbidden. Tags are stripped, entities resolved and
 * whitespace collapsed first, so a phrase broken across a line wrap or split
 * by a <code> or <em> tag is still caught.
 */

import { readFileSync } from "node:fs";

const FILE = "site/pricing/index.html";

/* ======================================================================
 * 1. Forbidden strings
 *
 * Each entry carries the verdict id and the reason the form is wrong.
 * ====================================================================== */

const FORBIDDEN = [
  /* C-1 (pass/reword). The brief's "Three ways to run Provisa" overstated
   * the SKU table: vertical packages are config artifacts, not a way to
   * run Provisa. */
  ["Three ways to run Provisa",
   "C-1. docs/marketing.md calls vertical packages 'Config artifacts (any tier)' — not a way to run"],
  ["three ways to run",
   "C-1. Same, loose form"],

  /* C-4 (pass). "your cloud" is the brief's phrase; the published term in
   * docs/marketing.md:15 is "private cloud". */
  ["your cloud",
   "C-4. docs/marketing.md:15 publishes 'private cloud'"],

  /* C-5 (pass/reword). The brief said "any regulated deployment" which is
   * wider than the licence allows — a regulated organisation under the
   * thresholds may run Community. */
  ["any regulated deployment",
   "C-5. A regulated organisation under the thresholds may run Community"],

  /* C-9 (fail). The brief said "open-source core". LICENSE:39-41 is
   * explicit: BSL is not an Open Source license. A procurement reviewer
   * who reads the licence notice and finds this on the page stops
   * trusting it. */
  ["open-source core",
   "C-9. LICENSE:39-41 — BSL is not Open Source. Use 'Community edition' or 'source-available core'"],
  ["open source core",
   "C-9. Same, spaced"],

  /* C-13 (pass as fact; remove from copy). "Not Apache 2.0" is a correction
   * to an internal doc (docs/marketing.md:24), not buyer-facing copy. The
   * string "Apache 2" is also on site/claim-bans.mjs for the whole site. */
  ["Not Apache 2.0",
   "C-13. A correction to an internal doc, not buyer content. docs/marketing.md:24 is the proposal pile"],

  /* C-17 (pass/reword). "registration artifact" is internal jargon. The
   * verdict wording is "registration record". */
  ["registration artifact",
   "C-17. Internal jargon. Use 'registration record'"],

  /* C-18 (pass/reword). "on every protocol" overstates REQ-1137, which
   * skips protocols with no safe out-of-band channel. */
  ["on every protocol",
   "C-18. REQ-1137 skips protocols with no safe out-of-band channel — use 'on every supported interface'"],

  /* C-20 (pass/reword). "not offered" reads as a permanent position;
   * docs/competitive_analysis.md says "not currently offered". */
  ["not offered",
   "C-20. docs/competitive_analysis.md says 'not currently offered'"],

  /* Standing site bans that would be caught by verify-claims.mjs anyway —
   * duplicated here so a /pricing-scoped change gets a scoped error. */
  ["cloud.provisa.dev",       "Standing instruction (plan rev 3)"],
  ["Apache 2",                "Standing instruction (LICENSE:30, GPL v2.0 or later)"],
  ["coming soon",             "Standing instruction (claim-bans)"],
  ["in development",          "Standing instruction (claim-bans)"],
  ["managed hosting",         "Standing instruction (claim-bans)"],
  ["all-in-one",              "Standing instruction"],
  ["single platform",         "Standing instruction"],
  ["SOC 2",                   "No compliance certification name appears on any page"],
  ["ISO 27001",               "Same"],
  ["HIPAA",                   "Same"],
  ["GDPR",                    "Same"],
  ["FedRAMP",                 "Same"],
  ["PCI",                     "Same"],
];

/* ======================================================================
 * 2. Required strings
 * ====================================================================== */

const REQUIRED = [
  /* C-1 — the headline the verdict prescribes. */
  ["Two editions, plus vertical packages. The governance is in both editions.",
   "C-1. Verdict wording, replacing the brief's 'Three ways to run Provisa'"],

  /* C-2 (pass). Community is self-hosted. docs/marketing.md:13. */
  ["Self-hosted",
   "C-2. docs/marketing.md:13 CE Delivery"],

  /* C-4 (pass). The published Enterprise delivery term, air-gapped named. */
  ["private cloud",
   "C-4. docs/marketing.md:15 Enterprise Delivery"],
  ["air-gapped",
   "C-4. docs/deployment.md:12,:24"],

  /* C-5 (pass/reword). Verdict wording for the Enterprise 'For' cell. */
  ["Organisations above the use grant, and regulated enterprises that need SLA and support.",
   "C-5. Verdict wording for Enterprise target"],

  /* C-6 and C-7 (pass). Vertical packages are config artifacts; the four
   * priority verticals from docs/marketing.md:75-78. */
  ["Configuration artifacts, install on either edition.",
   "C-6. docs/marketing.md:16 'Config artifacts (any tier)'"],
  ["Cybersecurity, financial services, healthcare, government.",
   "C-7. docs/marketing.md:75-78 priority verticals"],

  /* C-8 (pass). The not-paywalled governance claim. */
  ["Governance is not the upsell",
   "C-8. docs/marketing.md:7,:22"],

  /* C-9 — the SME's required replacement for "open-source core". */
  ["in the Community edition",
   "C-9. Verdict replacement for the struck 'open-source core' wording"],

  /* C-10 (pass/reword). All four Enterprise adds and the price qualifier. */
  ["SLA guarantees, dedicated support, advanced audit logging and compliance reporting",
   "C-10. docs/marketing.md:22 — all four, or none"],
  ["Priced by contract",
   "C-10. docs/marketing.md:15; SME page-level note 2"],

  /* C-11 (pass). BSL 1.1, source-available. */
  ["Business Source License 1.1",
   "C-11. LICENSE:1; README.md:424"],
  ["is not an Open Source license",
   "C-11. LICENSE:39-41"],

  /* C-12 (pass, fix citation). GPL v2.0 or later, LICENSE:30. */
  ["GNU General Public License, version 2.0",
   "C-12. LICENSE:30 (brief cited :33, which is the contact line)"],
  ["LICENSE:30",
   "C-12. Fixed citation"],

  /* C-14 (pass, fix citation). Change Date, LICENSE:27-29. */
  ["fourth anniversary",
   "C-14. LICENSE:27-29 (brief cited :98, which is MariaDB's covenant)"],
  ["LICENSE:27-29",
   "C-14. Fixed citation"],

  /* C-15 (pass/reword). Fiscal-year qualifier, with its Affiliates. */
  ["in its most recently completed fiscal year",
   "C-15. The qualifier the licence has; procurement will ask which year"],
  ["Affiliates",
   "C-15. The defined term, capitalised"],
  ["fewer than 100 employees and contractors",
   "C-15. LICENSE:13-16, the published threshold"],
  ["less than",
   "C-15. LICENSE:17 wording"],
  ["USD 1,000,000",
   "C-15. The published numeric form"],

  /* C-16 (pass). 90 days thereafter. */
  ["90 days",
   "C-16. LICENSE:23-24 grace clause"],

  /* C-17 — the verdict's replacement sentence, verbatim. */
  ["The free licence file is a registration record. It does not grant production rights; the BSL does.",
   "C-17. Verdict wording, replacing 'registration artifact'"],

  /* C-18 — the four REQ ids and the fixed phrase. */
  ["REQ-1138",
   "C-18. Offline Ed25519 verification"],
  ["REQ-1139",
   "C-18. machine_id binding"],
  ["REQ-1136",
   "C-18. 30-day expiry"],
  ["REQ-1137",
   "C-18. Non-fatal notice; never gates or degrades"],
  ["on every supported interface",
   "C-18. Replaces 'on every protocol'"],

  /* C-19 (pass). The Licensor-published alternative-licensing address,
   * LICENSE:49-63 is the body of the clause; LICENSE:32-33 is the address. */
  ["kennethstott@gmail.com",
   "C-19 / page-level note 1. LICENSE:32-33 publishes this as the alternative-licensing contact"],

  /* C-20 (pass/reword). "not currently offered". */
  ["not currently offered",
   "C-20. docs/competitive_analysis.md 'SaaS / Managed Option' row"],
];

/* ======================================================================
 * 3. Required links and anchors
 * ====================================================================== */

const REQUIRED_HREFS = [
  ['href="/register"',                        "The register-for-a-free-licence rung"],
  ['href="#contact"',                         "The talk-to-us target the SME required (page-level note 1)"],
  ['href="/industries"',                      "The vertical packages row destination"],
  ['href="mailto:kennethstott@gmail.com"',    "LICENSE:32-33 alternative-licensing contact as fallback"],
  ['href="https://provisa.dev/docs"',         "The docs link in the utility bar and footer"],
];

/* The /pricing/ footer link marks the current page. */
const REQUIRED_CURRENT = /href="\/pricing\/"[^>]*aria-current="page"/;

/* ======================================================================
 * 4. Read and normalize
 * ====================================================================== */

const raw = readFileSync(FILE, "utf8");
const noComments = raw.replace(/<!--[\s\S]*?-->/g, " ");

const quotes = (t) =>
  t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

const entities = (t) =>
  t.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
   .replace(/&mdash;/g, "—").replace(/&ndash;/g, "–").replace(/&hellip;/g, "…")
   .replace(/&rarr;/g, "→").replace(/&copy;/g, "©");

const stripped = noComments.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ");

/* Two normalizations, because they catch different mistakes.
 *
 * `text` turns every tag into a space, so a phrase split across a line wrap
 * is still one phrase. `prose` drops inline tags without leaving a space
 * behind them, because a sentence like "returning <code>void</code> and"
 * has no space where the tag was and comparing against the brief's words
 * needs it closed up. Required strings are matched against both. */
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
 * 5. Forbidden strings
 * ====================================================================== */

for (const [needle, why] of FORBIDDEN) {
  const n = quotes(needle);
  if (text.toLowerCase().includes(n.toLowerCase())) fail.push(`FORBIDDEN "${needle}" — ${why}`);
  else pass.push(`absent: ${needle}`);
}

/* ======================================================================
 * 6. Required strings
 * ====================================================================== */

for (const [needle, why] of REQUIRED) {
  const n = quotes(needle);
  if (text.includes(n) || prose.includes(n)) pass.push(`present: ${needle.slice(0, 56)}…`);
  else fail.push(`MISSING "${needle}" — ${why}`);
}

/* ======================================================================
 * 7. Links and anchors
 * ====================================================================== */

for (const [needle, why] of REQUIRED_HREFS) {
  ok(noComments.includes(needle), `source carries ${needle}`, why);
}

ok(REQUIRED_CURRENT.test(noComments),
   `the footer /pricing/ link is marked aria-current on this page`,
   "a visitor on /pricing is not told they are elsewhere");

/* ======================================================================
 * 8. The editions table has 3 rows, 4 columns.
 * ====================================================================== */

const tables = [...noComments.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => m[0]);
ok(tables.length === 1, `the page carries one table`, `found ${tables.length}`);

if (tables[0]) {
  const t = tables[0];
  const headRow = (t.match(/<thead[\s\S]*?<\/thead>/) || [""])[0];
  const headerCount = (headRow.match(/<th\b/g) || []).length;
  ok(headerCount === 4, `the editions table is 4 columns`, `found ${headerCount}`);

  const bodyRows = ((t.match(/<tbody[\s\S]*?<\/tbody>/) || [""])[0].match(/<tr\b/g) || []).length;
  ok(bodyRows === 3, `the editions table is 3 rows`, `found ${bodyRows} — the three rows are Community, Enterprise, Vertical packages`);

  const bodyText = (t.match(/<tbody[\s\S]*?<\/tbody>/) || [""])[0]
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  for (const row of ["Community", "Enterprise", "Vertical packages"]) {
    ok(bodyText.includes(row), `the editions table carries the ${row} row`,
       "the SME verdict's three-row table is required");
  }
}

/* ======================================================================
 * 9. The §4 four published facts are present as RuledCards.
 * ====================================================================== */

const licensing = (noComments.match(/<section[^>]*id="licensing"[\s\S]*?<\/section>/) || [""])[0];
const RULED = /class="pv-ruled(?:[\s"]|--)/g;
const licensingCards = (licensing.match(RULED) || []).length;
ok(licensingCards === 4, `§4 Licensing is 4 RuledCards`,
   `found ${licensingCards} — Licence, Change Licence, Change Date, Additional Use Grant`);

/* ======================================================================
 * 10. The registration-vs-production callout and its two sentences are
 *     adjacent — the verdict's C-17 required them next to each other
 *     because conflating them is how a reader would be misled.
 * ====================================================================== */

const regProd = (noComments.match(/<section[^>]*id="registration-vs-production"[\s\S]*?<\/section>/) || [""])[0];
const regProdText = regProd.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const regIdx = regProdText.indexOf("registration record");
const prodIdx = regProdText.indexOf("grant production rights");
ok(regIdx >= 0 && prodIdx >= 0 && prodIdx - regIdx > 0 && prodIdx - regIdx < 120,
   `the two licensing sentences are adjacent in §5`,
   "C-17 requires 'registration record' and 'does not grant production rights' adjacent");

/* ======================================================================
 * 11. Compliance names: scoped scan of the whole page.
 * ====================================================================== */

for (const name of ["SOC 2", "ISO 27001", "HIPAA", "GDPR", "FedRAMP", "PCI"]) {
  ok(!text.toUpperCase().includes(name.toUpperCase()),
     `no mention of ${name}`,
     "no compliance certification name appears on any page");
}

/* ======================================================================
 * 12. The pricing page is not in the main nav — it has no
 *     aria-current="page" in .pv-header__nav or .pv-drawer__nav.
 *     (A sibling check: /pricing/ is marked aria-current only in the
 *     footer's Get started column.)
 * ====================================================================== */

for (const navRe of [
  /<nav[^>]*class="pv-header__nav"[\s\S]*?<\/nav>/,
  /<nav[^>]*class="pv-drawer__nav"[\s\S]*?<\/nav>/,
]) {
  const nav = (noComments.match(navRe) || [""])[0];
  ok(!/aria-current="page"/.test(nav),
     `no main-nav item is marked current — /pricing is not in the primary nav`,
     "the brief's six nav items (plan rev 2) do not include pricing");
}

/* ======================================================================
 * Report
 * ====================================================================== */

console.log(`\n${pass.length} passed`);
for (const f of fail) console.log("  FAIL  " + f);
console.log(fail.length ? `\n${fail.length} failed` : "\nall checks passed");
process.exit(fail.length ? 1 : 0);
