/**
 * The string, anchor and composition checks for `/` (PRO-10), as a script
 * rather than a claim in a comment.
 *
 *   node site/design-system/check-page-home.mjs
 *
 * Home is the only built page whose single evidence pass was a Playwright
 * render (`site/verify-home.mjs`). This script is the no-browser half, so
 * Home has the same split as Platform, Interfaces, Governance and
 * vs/Starburst: a server-free checker that runs in CI without a Chromium
 * download, plus the composition pass that still needs a running browser.
 *
 * Three things get asserted here, in the order the issue's acceptance
 * criteria list them:
 *
 *   1. The five anchor ids — `governance`, `interfaces`, `sources`, `deploy`,
 *      `download` — are present on the right sections. A fragment cannot be
 *      redirected server-side, so a design pass that renames one silently
 *      breaks every inbound link to it (no 404, no error, nothing to notice).
 *
 *   2. Required claim strings from `brief-home` on PRO-5 revision 3 — the
 *      sentences the SME's verdict pass on PRO-6 required verbatim or near-
 *      verbatim. Each one carries the brief claim id it belongs to.
 *
 *   3. The CTA rule — "Get a free licence" always resolves to `/register`
 *      and nothing on the page links to `cloud.provisa.dev`. Site-wide the
 *      ban is already enforced by `site/verify-claims.mjs`, and the home
 *      page's CTA ladder is REQ-2014. This script makes the Home-specific
 *      half local to Home.
 *
 * The sweep for the full struck-claim list is `site/verify-claims.mjs` using
 * the shared `site/claim-bans.mjs`; what runs here is in addition to that.
 */

import { readFileSync, existsSync } from "node:fs";
import { BANNED, findBanned, servedCopy } from "../claim-bans.mjs";

const FILE = "site/index.html";

/* AC 2 — the five anchor ids and the section they belong to. The pair is
 * asserted so a future refactor cannot move one onto the wrong block (an id
 * that lives but on a section the inbound link does not want is as broken as
 * a missing one). Each is matched against the opening tag of its section
 * rather than the raw string, so a stray `id="deploy"` in a code sample or on
 * a child element would not count. */
const ANCHORS = [
  ["governance", /<section[^>]*id="governance"/,  "§3 — anchor id governance"],
  ["interfaces", /<section[^>]*id="interfaces"/,  "§6 — anchor id interfaces"],
  ["sources",    /<section[^>]*id="sources"/,     "§7 — anchor id sources"],
  ["deploy",     /<section[^>]*id="deploy"/,      "§9 — anchor id deploy"],
  ["download",   /id="download"/,                 "§9 install block — anchor id download (inner div)"],
];

/* The required claim strings. Each row is `[needle, brief-claim-id, why]`.
 *
 * These are not editorial preferences — every one of them is a sentence the
 * SME's verdict pass on PRO-6 recorded as the audited form of a claim. A
 * well-meant tightening in the build breaks the trace silently; the strings
 * below name the trace in text. */
const REQUIRED = [
  ["Federation, metrics, ontology and governance from one model. Nothing to keep in sync.",
   "C-1",   "Hero positioning line, under the H1 since PRO-191 (the H1 is now the drift line)"],
  ["A catalog tells an agent what it should do.",
   "C-2",   "Hero standfirst — the enforce-versus-advise sentence"],
  ["Provisa enforces what it can do.",
   "C-2",   "Hero standfirst — the second half, which the audit says must be above the fold"],
  ["up to six governed surfaces",
   "C-3",   "Qualifier 1 of claim-audit §5.1b — six is the capability, not a count per question"],
  ["compiled into the statement before it runs — not checked around the result",
   "C-3",   "The enforce-versus-advise frame, in the hero"],
  ["Five of the six below are compiled into the plan. The sixth runs before it.",
   "C-3",   "§3 lede — the shape of the hook row, before the table"],
  ["Objects outside a role are absent",
   "C-3a",  "Layer 0 — introspection filtering"],
  ["is rejected at compiler validation",
   "C-3b",  "Layer 1 — domain access"],
  ["injected into every",
   "C-3c",  "Layer 2 — row-level security, the WHERE injection"],
  ["Invisible columns stripped and",
   "C-3d",  "Layer 3 — column visibility and masking"],
  ["refused in",
   "C-3e",  "Layer 4 — predicate guard, at parse time"],
  ["Before execution — approval hook",
   "C-3f",  "The sixth row, external callout; new in revision 3"],
  ["Not part of the plan; a decision taken on it",
   "C-3f",  "Why the hook sits beside the layers, not among them"],
  ["designed and not built",
   "C-4",   "Public-column publishing is unbuilt and not counted"],
  ["Every join in SQL and Cypher must",
   "C-6",   "The high-security formulation, never the absolute form"],
  ["not bypassable, by anyone",
   "C-6",   "The specific wording, including the bypass-granted-by-mistake"],
  ["72 source types",
   "C-7",   "The reach figure, reproducible by one command"],
  ["63 reachable",
   "C-7",   "Same strip, second figure"],
  ["37 read live with no copy",
   "C-7",   "Same strip, third figure — the one that matters"],
  ["Of the 72, 66 are data systems",
   "C-7a",  "The breakdown the audit says we disclose first"],
  ["Seven listeners. Sixteen surfaces.",
   "C-8",   "§6 heading — the structural number corrects the old 'five listeners, nine ways in'"],
  ["each binding its own port",
   "C-8",   "What makes the number seven and not fewer"],
  ["pgwire, Bolt, Airport and MCP are off",
   "C-8",   "The four listeners that start closed, named"],
  ["governed change stream",
   "C-8a",  "The sixteenth surface is outbound, which is why it is footnoted not counted"],
  ["Python client",
   "C-8b",  "The surface revision 1 dropped from the HTTP row"],
  ["32 engine keys",
   "C-9",   "The engine-key count, reproducible from engine_kinds()"],
  ["pip install \"provisa[embedded]\"",
   "C-11",  "The install command, in both §4 Card 1 and §9's code block"],
  ["Python 3.12",
   "C-11",  "Qualifier 1 of C-11 — must sit beside the command, not in a footnote"],
  ["no Docker, no JVM, no root",
   "C-11",  "The three constraints together, in §4 Card 1"],
  ["Hasura v2",
   "C-12",  "The import claim, in §4 Card 2"],
  ["PostgreSQL control plane",
   "C-13",  "The qualifier on the audit-log claim"],
  ["from the desktop install up",
   "C-13",  "PRO-6 §4 correction 1 — the guarantee holds out of the box"],
  ["key held in your own KMS",
   "C-13a", "The envelope-encryption claim"],
  ["never phones home",
   "C-13a", "The no-call-home half of the same card"],
  ["joins between tables",
   "C-14",  "Cypher relationships, after the tabs"],
  ["psql, DBeaver, Tableau, Superset",
   "C-15",  "The pgwire row — the four named clients"],
  ["Neo4j Browser, Bloom, cypher-shell",
   "C-16",  "The Bolt row — the three named clients"],
  ["Flight SQL",
   "C-17",  "Arrow Flight carries Flight SQL, ADBC and JDBC"],
  ["JDBC",
   "C-17",  "The JDBC name, which moves results as Arrow over Flight"],
  ["ADBC",
   "C-17",  "The third one on the Flight row"],
  ["DuckDB attaches to Provisa as a catalog",
   "C-17a", "Airport — its own listener (new in revision 3; not on Flight)"],
  ["streamable HTTP",
   "C-17b", "MCP — its own listener, not a path on the API port"],
  ["proto generated per role",
   "C-18",  "gRPC — showing only that role's tables and columns"],
  ["registered commands reach GraphQL, pgwire SQL and REST",
   "C-19",  "Command invocation differs from governance — the explicit list of surfaces"],
  ["PostgreSQL, MySQL, MariaDB",
   "C-20",  "The 19 live-with-aggregate-pushdown sources, named"],
  ["MongoDB, Cassandra, Redis",
   "C-21",  "The live-predicates-only row"],
  ["read in place on a Trino engine",
   "C-23",  "The five federated sources, named — no measured number"],
  ["governed join across the inventories you already have",
   "C-23a", "The scope argument from plan revision 3 (new in revision 3)"],
  ["one canonical",
   "C-24",  "One statement, translated to the target dialect — governance in the compiler"],
  ["how much reaches live",
   "C-24a", "What changes with the engine, the honest formulation"],
  ["cross-source join runs without",
   "C-25",  "The six federating engines, the behaviour summary"],
  ["Partial federators",
   "C-26",  "The five warehouse engines — not full federators"],
  ["pre-named for twenty databases",
   "C-27",  "The SQLAlchemy row — structural sentence, not a 21 count"],
  ["Trino-protocol coordinator you already operate",
   "C-28",  "Never 'Starburst' by name; zero occurrences in provisa/"],
  ["embedded PostgreSQL control plane",
   "C-29",  "Laptop card — not SQLite (which claim-audit §1.10 was wrong about)"],
  ["Terraform modules exist",
   "C-30",  "Single VM card — GCP, AWS and Azure"],
  ["scales engine workers",
   "C-31",  "Kubernetes card — the Helm chart, with the two in-progress specifics cut"],
  ["no network calls at install time",
   "C-32",  "Air-gapped card — never phones home at any point"],
  ["Business Source License 1.1",
   "C-33",  "§10 — the licence by name, not 'Apache 2'"],
  ["fewer than 100 employees and contractors and under USD 1,000,000",
   "C-33",  "The thresholds in numbers, with the AND conjunction"],
  ["GPL-2.0-or-later on the fourth anniversary",
   "C-33",  "The Change License and Change Date, which the site footer still omits"],
  ["30-day trial",
   "C-34",  "The free-licence trial window — explicit, not implied"],
  ["never gates or degrades",
   "C-34",  "The nag line, verbatim"],
  ["0.1.0a479",
   "C-35",  "The published artifact, pre-1.0"],
  ["1,599 requirements complete and 84 in progress",
   "C-35",  "Dated, denominator dropped — the two figures that reconcile across both ledgers"],
  ["counted on 14 October 2026",
   "C-35",  "The counted-on date — turns the sentence from a promise about a state into a statement about a day"],
  ["self-hosted",
   "C-36",  "Self-hosted sentence (new in revision 3)"],
  ["There is no managed service to buy today",
   "C-36",  "Verbatim from plan revision 3 — no SaaS, in any tense"],
];

/* Links that must not ship until their target pages are rebuilt on this
 * design system. Each phrase is lifted straight from brief §8's build note
 * — a dead evidence link out of Home is worse than no link. Scoped to <main>,
 * so the footer (which carries its own live map) is not asserted. */
const FORBIDDEN_LINK_TEXT = [
  ["Every source type",       "brief §8 — /why/sources is Phase 2, not rebuilt yet"],
  ["What lock-in would look like", "brief §8 — /why/no-lock-in is Phase 2, not rebuilt yet"],
  ["Editions and licensing",  "brief §8 — /pricing is Phase 3, does not exist yet"],
];

const raw = readFileSync(FILE, "utf8");
if (!raw) throw new Error(`${FILE} is empty or missing`);

const noComments = raw.replace(/<!--[\s\S]*?-->/g, " ");
const text = noComments
  .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&quot;/g, '"').replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
  .replace(/\s+/g, " ")
  .trim();

/* The prose match tolerates markup inside a sentence (code, em, strong, span,
 * a) by stripping those tags only, so "every <code>SELECT</code>" matches
 * "every SELECT" without eating the space before the next word. */
const prose = noComments
  .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
  .replace(/<\/?(code|strong|em|span|a|mark|b|i)\b[^>]*>/g, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&quot;/g, '"').replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const fail = [];
const pass = [];

/* --- 1. anchor ids ------------------------------------------------------- */

for (const [id, re, what] of ANCHORS) {
  if (re.test(noComments)) pass.push(`present: ${what}`);
  else fail.push(`MISSING anchor: ${what} (regex ${re}) — AC 2`);
}

/* --- 2. required claim strings ------------------------------------------- */

for (const [needle, cid, why] of REQUIRED) {
  if (prose.includes(needle)) pass.push(`[${cid}] present: ${needle.slice(0, 56)}${needle.length > 56 ? "…" : ""}`);
  else fail.push(`[${cid}] MISSING "${needle}" — ${why}`);
}

/* --- 3. CTA rule --------------------------------------------------------- */

/* "Get a free licence" (header, drawer, contact) must resolve to /register
 * — the brief §11 team-path conversion. Any href on an element whose anchor
 * text is "Get a free licence" that is not /register is a CTA regression,
 * and specifically a `cloud.provisa.dev` href is the regression the ladder
 * (REQ-2014) is written to prevent. */
const anchors = [...noComments.matchAll(
  /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g
)].map(([, href, inner]) => ({
  href,
  text: inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
}));

const freeLicence = anchors.filter((a) => /Get a free licence/i.test(a.text));
if (freeLicence.length === 0)
  fail.push('no "Get a free licence" anchor on the page — brief §11 requires one in the contact band');
for (const a of freeLicence) {
  if (a.href === "/register") pass.push(`CTA: "${a.text}" → /register`);
  else fail.push(`CTA REGRESSION: "${a.text}" → ${a.href} (must be /register, brief §11)`);
}

/* The utility bar and footer "Register (free licence)" link, which the brief
 * doesn't name verbatim but every page in the family carries. They are not
 * the primary CTA — the band in §11 is — so they are informational, not
 * asserted here; `verify-claims.mjs` already bans cloud.provisa.dev. */
const banned = findBanned(raw);
if (banned.length === 0) pass.push("no struck claim from claim-bans.mjs");
else for (const b of banned)
  fail.push(`FORBIDDEN "${b.banned}" ×${b.count} — ${b.why}`);

/* --- 4. structural counts ----------------------------------------------- */

const count = (re) => (noComments.match(re) || []).length;

/* AC 3 — the components the brief §4 names, with the counts it names. */
for (const [what, n, re] of [
  ["LayerRows (§3, five layers plus the hook)", 6, /class="pv-layer pv-layer--detail/g],
  ["ChoiceCards (§4, the three buyer paths)",   3, /class="pv-choice(?:\s|")|class="pv-choice [^"]*"/g],
  ["RuledCards — §7 reach ×3 and §9 deploy ×4", 7, /<div class="pv-ruled(?:\s|")[^"]*"/g],
  ["ComparisonTables (§6 interfaces, §8 engines)", 2, /<table\b/g],
  ["code tabs (§5, six governed surfaces)",     6, /role="tab"/g],
  ["code panels (§5, six panels)",              6, /class="pv-code pv-codetabs__panel"/g],
  ["StatStrips (§2 figures and §7 reach)",      2, /class="pv-stats"[^>]*aria-label/g],
  ["editorial illustrations (§1 hero + §4 three)", 4, /<figure class="pv-editorial(?:\s|")[^"]*"/g],
  ["no FigPanel placeholders remain",           0, /<div class="pv-fig(?:\s|")[^"]*"/g],
  ["editorial PNGs referenced (§1 hero + §4 three)", 4, /<img\s+[^>]*src="\/assets\/editorial\/img-[0-9a-z-]+-light\.png"/g],
  /* The theme-swap: each editorial figure ships a light img and a dark img so
   * the pair swaps on the site's [data-theme] toggle instead of trying to
   * key off prefers-color-scheme (which the kit does not use). */
  ["editorial dark imgs paired with the lights", 4, /<img class="pv-editorial__img pv-editorial__img--dark"[^>]*aria-hidden="true"/g],
  ["h1 (one hero heading)",                     1, /<h1\b/g],
]) {
  const got = count(re);
  if (got === n) pass.push(`${n} ${what}`);
  else fail.push(`expected ${n} ${what}, found ${got}`);
}

/* The sixth LayerRow is unnumbered (outside tone, no idx), because the hook
 * is an external callout, not a layer compiled into the plan. The brief is
 * emphatic that nothing fills the gap. */
const idxs = [...noComments.matchAll(/<span class="pv-layer__idx">([^<]*)<\/span>/g)]
  .map((m) => m[1]);
if (String(idxs) === String(["00", "01", "02", "03", "04"]))
  pass.push("§3 numbers 00-04 with no gap, and the hook is unnumbered");
else fail.push(`§3 must number 00-04 and leave the hook unnumbered, found [${idxs.join(", ")}]`);

/* The sixth row's tone is `outside`, which is the slate variant the kit
 * reserves for a callout beside the layers. */
const sixthTone = /class="pv-layer pv-layer--detail pv-layer--outside"/.test(noComments);
if (sixthTone) pass.push("§3 sixth row has the outside tone");
else fail.push("§3 sixth row must carry pv-layer--outside — the hook is not a layer");

/* The interfaces table — seven listener rows (th scope=row), each paired
 * with a default-state cell. Six would mean a listener was dropped; eight
 * would mean a surface was promoted to a listener. */
const listenerRows = count(/<th scope="row">(?:HTTP|gRPC|Arrow Flight|pgwire|Bolt|Airport|MCP)<\/th>/g);
if (listenerRows === 7) pass.push("§6 names all seven listeners as rows");
else fail.push(`§6 must have seven listener rows (HTTP gRPC Flight pgwire Bolt Airport MCP), found ${listenerRows}`);

/* No product screenshot. SHOT-01/02 would be <img> tags with a /assets/shots
 * path or a shot-01-style name; neither should be on the page (acceptance
 * criterion 4). The four image slots are editorial illustrations. */
const shotImgs = count(/<img[^>]*(?:shot-?0|screenshot)/gi);
if (shotImgs === 0) pass.push("no product screenshot — AC 4");
else fail.push(`${shotImgs} <img> looks like a product screenshot — AC 4 forbids them`);

/* No <style> on the page. Home composes the kit; a page-level rule here is
 * how a design system stops being one. */
if (!/<style[\s>]/.test(noComments)) pass.push("no page-level CSS");
else fail.push("the page carries a <style> block — put the rule in the kit instead");

/* AC 7 — the three links that must not ship until their targets land. The
 * forbidden text is the anchor text itself, not an href pattern, so a
 * TextLink whose target does not exist in `site/` but which still carries
 * the brief's label is still caught. Scoped to <main>, so the footer's
 * live map (which carries /pricing/ etc. as placeholders) is unaffected. */
const main = (noComments.match(/<main[\s\S]*?<\/main>/) || [""])[0];
for (const [needle, why] of FORBIDDEN_LINK_TEXT) {
  if (main.includes(needle))
    fail.push(`FORBIDDEN link text in <main>: "${needle}" — ${why}`);
  else pass.push(`no link in <main>: "${needle}"`);
}

/* The hosted-service notice must be absent from the utility bar — site-wide
 * since plan revision 3. The utility bar is the first thing a crawler sees,
 * so missing this is the most expensive miss. */
const utility = (noComments.match(/<div class="pv-utility[\s\S]*?<\/div>\s*<\/div>/) || [""])[0];
if (/cloud\.provisa\.dev|managed service|hosted service|free trial/i.test(utility))
  fail.push("utility bar still carries a hosted-service notice — AC 5, plan revision 3 withdrew it");
else pass.push("utility bar carries no hosted-service notice — AC 5");

/* --- report -------------------------------------------------------------- */

console.log(`${pass.length} passed`);
for (const f of fail) console.log("  FAIL  " + f);
console.log(fail.length ? `\n${fail.length} failed` : "\nall checks passed");
process.exit(fail.length ? 1 : 0);
