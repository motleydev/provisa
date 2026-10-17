/**
 * Composition and copy checks for /why/one-model (PRO-28). No browser, no
 * server: `site/` has no build step, so the served bytes are the bytes on disk.
 *
 *   node site/design-system/check-page-one-model.mjs
 *
 * This is the half of the pair that needs nothing installed, on the split
 * `site/design-system/README.md` describes. It asserts two things:
 *
 *   1. The page is on the kit, and nothing of the pre-rebrand chrome survived
 *      the rebuild. The old page carried `site/styles.css`, a Google Fonts
 *      link, and a nav whose `/#interfaces`, `/#governance` and `/#sources`
 *      links and `Download` CTA no longer match the Home chrome — so each of
 *      those is asserted absent by name, not merely assumed gone.
 *   2. The audit's copy reached the new components word for word. Every
 *      paragraph below was written by the claim audit and cleared by PRO-27 in
 *      `435927d10`; the rebuild moves them to kit components and may not
 *      reword them, so each one is compared verbatim against the rendered
 *      prose. A well-meant tightening in a rebuild is how a cleared claim
 *      becomes an uncleared one again.
 *
 * The struck-string ban list is deliberately not here. `site/verify-claims.mjs`
 * sweeps it across every page in `site/` (REQ-2021), so this script would only
 * be a second copy of it — the thing that module exists to prevent.
 */

import { readFileSync } from "node:fs";

const FILE = "site/why/one-model.html";
const HOME = "site/index.html";
const VERIFY_HOME = "site/verify-home.mjs";

const raw = readFileSync(FILE, "utf8");
const noComments = raw.replace(/<!--[\s\S]*?-->/g, " ");
const main = (noComments.match(/<main[\s\S]*?<\/main>/) || [""])[0];
const head = (noComments.match(/<head[\s\S]*?<\/head>/) || [""])[0];

/* Inline tags come out without leaving a space behind them, so a link inside
 * a sentence does not add one before the next word and the comparison fails on
 * the words rather than on the markup. */
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
const ok = (c, m) => (c ? pass : fail).push(m);
const count = (re) => (noComments.match(re) || []).length;

/* --- 1. the chrome is the kit's ---------------------------------------- */

const CHROME = [
  ['href="/design-system/fonts.css"',  "the self-hosted webfonts"],
  ['href="/design-system/tokens.css"', "the token layer"],
  ['href="/design-system/provisa.css"', "the components"],
  ['src="/design-system/provisa.js"',  "the toggle, the drawer and the accordion"],
  ['localStorage.getItem("provisa-theme")', "the inline theme bootstrap, before first paint"],
  ['class="pv-skip"',        "the skip link"],
  ['class="pv-utility"',     "the utility bar"],
  ['class="pv-header"',      "the site header"],
  ['class="pv-drawer"',      "the mobile drawer"],
  ['class="pv-footer"',      "SiteFooter"],
  ['class="pv-crumb"',       "the breadcrumb, which is what says where you are"],
  ['href="/pricing/"',       "the footer's Editions link — verify-ui.mjs asserts this exact string"],
];
for (const [needle, why] of CHROME) {
  ok(noComments.includes(needle), needle + (noComments.includes(needle) ? "" : ` MISSING — ${why}`));
}

/* The pre-rebrand chrome, asserted gone by name. Each of these was on the page
 * before the rebuild. */
const OLD_CHROME = [
  ["styles.css",            "the pre-kit stylesheet"],
  ["fonts.googleapis.com",  "the kit self-hosts its three webfonts"],
  ['href="/#interfaces"',   "the old nav's anchor; the kit links /why/interfaces"],
  ['href="/#governance"',   "same — /why/governance"],
  ['href="/#sources"',      "same — /why/sources"],
  ['href="/#download"',     "the old Download CTA; the ladder is /install and /register"],
  ['class="nav"',           "the old header"],
  ['class="skip-link"',     "the old skip link"],
  ['class="doc"',           "the old document layout"],
  ['class="more"',          "the old doc-next links; the kit's is TextLink"],
  ['class="footer"',        "the old footer"],
  ["brand-mark",            "the inline SVG wordmark; the kit's is BrandBars"],
];
for (const [needle, why] of OLD_CHROME) {
  ok(!noComments.includes(needle), `${needle} is gone` + (noComments.includes(needle) ? ` — FOUND: ${why}` : ""));
}

ok(/<link rel="canonical" href="https:\/\/provisa\.dev\/why\/one-model">/.test(head),
   "the canonical is the extensionless route");

/* The six nav items, in both the header and the drawer, and nothing else. One
 * model is not a nav item, so nothing may claim to be the current page. */
for (const [where, re] of [["header", /<nav class="pv-header__nav"[\s\S]*?<\/nav>/],
                           ["drawer", /<nav class="pv-drawer__nav"[\s\S]*?<\/nav>/]]) {
  const nav = (noComments.match(re) || [""])[0];
  const items = [...nav.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map((m) => m[2].trim());
  ok(String(items) === String(["Platform", "Governance", "Industries", "Interfaces", "Sources", "Compare"]),
     `the ${where} carries the six nav items (${items.join(" · ") || "none"})`);
  ok(!/aria-current/.test(nav), `the ${where} marks no current page — /why/one-model is not a nav item`);
}

const toggles = count(/class="pv-theme"/g);
ok(toggles === 2, `the two-state toggle is in both the header and the drawer (${toggles})`);
ok(count(/data-theme-set="light"/g) === 2 && count(/data-theme-set="dark"/g) === 2
   && !/data-theme-set="auto"/.test(noComments),
   "each toggle has two states and no auto — light is the unconditional default");

ok(!/hosted service|free trial/i.test((noComments.match(/<div class="pv-utility"[\s\S]*?<\/div>\s*<\/div>/) || [""])[0]),
   "the utility bar carries no hosted-service notice");

/* The CTA ladder, from the README: /install primary, /register beside it,
 * Book a demo as the secondary. */
for (const [needle, why] of [
  ['href="/install"',  "the primary rung"],
  ['href="/register"', "the free licence, beside it"],
  ['href="#contact"',  "the demo path"],
  ['action="/api/demo"', "the band's own demo form"],
]) {
  ok(noComments.includes(needle), `the CTA ladder: ${needle}` + (noComments.includes(needle) ? "" : ` MISSING — ${why}`));
}
const primaries = [...main.matchAll(/class="pv-btn[^"]*"/g)]
  .filter((m) => !/--inverse|--secondary|--block/.test(m[0])).length;
ok(primaries === 1, `one primary action in <main> (${primaries})`);

/* --- 2. the composition ------------------------------------------------ */

for (const [what, n, re] of [
  ["h1", 1, /<h1\b/g],
  ["sections", 6, /<section class="pv-section/g],
  ["section labels", 5, /class="pv-seclabel"/g],
  ["FigPanels", 2, /class="pv-fig[ "]/g],
  ["Callouts", 1, /class="pv-callout pv/g],
  ["contact bands", 1, /class="pv-contact"/g],
]) {
  const got = count(re);
  ok(got === n, `${n} ${what}` + (got === n ? "" : `, found ${got}`));
}

const h2s = [...main.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)]
  .map((m) => m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
ok(h2s.length === 6, `six h2 in <main>, one per section (${h2s.length})`);
ok(h2s.includes("The business glossary is a graph."),
   "§4's heading is the ontology copy's own first sentence");
ok(h2s.includes("Alongside context layers."),
   "§6 keeps the heading the audit's copy was written under");

const nums = [...noComments.matchAll(/class="pv-seclabel__num">([^<]*)</g)].map((m) => m[1].trim());
ok(String(nums) === String(["01", "02", "03", "04", "05"]),
   `the five sections number 01-05 with no gap (${nums.join(" ")})`);

/* The anchors the old page's h2 ids served. A fragment cannot be redirected
 * server-side, so #federation, #metrics, #ontology and #governance have to
 * stay real ids on the sections their content moved to. */
for (const id of ["federation", "metrics", "ontology", "governance", "contact", "main"]) {
  ok(noComments.includes(`id="${id}"`), `#${id} survives the rebuild`);
}

/* Both figures carry real alt text, and the rings figure draws five rings. A
 * sixth would depict the struck count: five layers are compiled into the plan
 * and the approval hook sits outside it, which is why it is not drawn. */
const figs = [...noComments.matchAll(/<div class="pv-fig[^"]*" role="img"\s+aria-label="([^"]*)"/g)]
  .map((m) => m[1]);
ok(figs.length === 2 && figs.every((a) => a.length > 40),
   `both figures carry real alt text (${figs.length}: ${figs.map((a) => a.length).join(", ")} chars)`);
const rings = (noComments.match(/class="pv-fig pv-fig--rings"[\s\S]*?<\/div>/) || [""])[0];
ok((rings.match(/<i class="pv-fig__s"><\/i>/g) || []).length === 5,
   `the governance figure draws five rings, one per compiled layer (${(rings.match(/<i class="pv-fig__s"><\/i>/g) || []).length})`);

/* Prose is prose. Every paragraph of running copy is a .pv-p, which is the
 * class that caps itself at the measure — the page is all argument and no
 * table, so an uncapped paragraph would set 130 characters at 2560px. */
const uncapped = [...main.matchAll(/<p class="([^"]*)"/g)].map((m) => m[1])
  .filter((c) => !/\bpv-p\b/.test(c) && !/pv-contact__sub/.test(c));
ok(uncapped.length === 0, `every paragraph in <main> is a .pv-p (${uncapped.join(", ") || "all"})`);

/* §6's prose is in a Callout, which does not cap itself — so it carries the
 * kit's .pv-measure utility. Without it the paragraph sets to the container. */
ok(/class="pv-callout pv-callout--get pv-measure"/.test(main),
   "§6's Callout carries .pv-measure, which is what caps a Callout's prose");

ok(!/<style[\s>]/.test(noComments),
   "no page-level CSS — the page composes the kit");

/* The three cross-links the copy carries inline, as .pv-link--inline rather
 * than as bare anchors: the kit has a variant for a link inside a sentence. */
for (const href of ["/why/sources", "/why/interfaces", "/why/governance"]) {
  const re = new RegExp(`<a class="pv-link pv-link--inline" href="${href}"`);
  ok(re.test(main), `§'s cross-link to ${href} is a TextLink` + (re.test(main) ? "" : " — MISSING"));
}

/* --- 3. the audit's copy, word for word -------------------------------- */

const COPY = [
  ["the four-tools opening",
   "Most estates run these as four tools. A federation engine knows where the data is, a metrics layer knows what the numbers mean, a catalog or knowledge graph knows what the terms mean, and a policy service knows who may see what. Each holds its own description of the same data, and the descriptions drift apart. Provisa keeps one description and runs from it, so the four stay in step because there is only one of them."],
  ["federation: the reach line and the live-source names (PRO-27)",
   "72 source types. On a Trino engine, 63 are reachable and 37 are read live with no copy. Salesforce, ServiceNow, SharePoint, Splunk and cloud resource inventory are among the live ones, with predicates pushed into the API and aggregates run above it. So the SaaS systems the business runs on are tables beside the databases, with no pipeline into a warehouse first. You register the tables you want; nothing a source offers is registered for you."],
  ["federation: the spine, with its qualifier",
   "Ask once in English and up to six governed surfaces answer — SQL, GraphQL, Cypher, gRPC, JSON:API and OpenAPI — each one generated for the asking role and run through the same compiled governance. Three of those six are protocols rather than languages: gRPC, JSON:API and OpenAPI come back as the request a client of that protocol would send and the envelope it would receive, computed through the governed pipeline rather than over a socket, and they express row, aggregate and group-by questions. An arbitrary question is carried by SQL, GraphQL and Cypher; the other three say so rather than guess."],
  ["federation: the listeners, and the two counts distinguished",
   "Or write the query yourself — SQL, GraphQL or Cypher — on whichever of the seven listeners your client speaks: HTTP, gRPC, Arrow Flight, pgwire, Bolt, Airport and MCP. Fifteen client-facing surfaces ride those seven, and the sixteenth goes the other way — a governed change stream out to a Kafka topic. Those sixteen surfaces are ways in and out; the six governed surfaces above are what one English question comes back on. Different count, different thing. Any Postgres-wire client can connect, so a BI tool or a metrics tool can sit on top."],
  ["the link text PRO-27 corrected",
   "All 72 source types."],
  ["metrics",
   "A metric is a named, governed aggregate: a name, an expression, a data type, a description. It is defined once and every tool and language that asks gets the same definition. A metric carries the same role visibility and stewardship as a table, and the joins it needs come from the registered relationships rather than from each tool's own copy of them."],
  ["ontology: the graph",
   "The business glossary is a graph. Terms are derived from the field names in the model, linked to the physical columns they name, and connected to each other by typed relationships a curator chooses. You can also add any concept of your own, give it a definition, and link it into the glossary. That is an ontology: a graph of concepts, their definitions and the relationships between them. Provisa maps it to the database structures that hold the values, which is the step that lets it answer questions about your data. A concept is a draft until it reaches data, directly or through other concepts. Only then is it part of the model. It is separate from the metrics: a glossary term says what a concept is, a metric says how a number is computed."],
  ["ontology: what the graph is for",
   "The graph is what Cypher queries run over, what finds the path between any two tables, and what an agent reads to work out what connects to what. The glossary is itself queryable metadata, so reporting on it goes through the same governance as any other query."],
  ["governance: five layers and the approval hook beside them (PRO-27)",
   "Five layers are compiled into every query plan, on every language and every protocol: introspection filtering, domain access, row-level security, column visibility and masking, and a predicate guard. The policy is part of the plan that runs, so no route in goes around it. Beside them, outside the plan, is the approval hook: your own decision service can refuse the statement before it runs. Public-column publishing — serving a published column to an unauthenticated reader — is designed and not built, so it is not a layer and is not counted here."],
  ["the join paragraph, with both bypasses disclosed (PRO-27)",
   "Every join in SQL and Cypher must match a relationship someone approved. In high-security mode that is not bypassable, by anyone — including a role granted the bypass by mistake. A JOIN or a graph traversal is legal only if it matches a registered, approved relationship, and a refused join names the valid paths. Outside high-security mode the guard is governance policy with two bypasses we would rather you heard from us, and it is skipped for GraphQL, where relationship fields are pre-approved by the schema itself. An agent's token maps to a role, so an agent gets the same layers a person does."],
  ["alongside context layers",
   "Data catalogs that provide a context layer tell an agent what it should do. Provisa enforces what it can do. They are complementary, and Provisa publishes its model into those catalogs."],
  ["the lede",
   "Federation, metrics, ontology and governance from a single model. Nothing to keep in sync."],
];

for (const [what, block] of COPY) {
  if (prose.includes(block)) { pass.push(`verbatim: ${what}`); continue; }
  /* Where it stopped matching, so the failure names the edit rather than the
   * paragraph. */
  let lo = 0, hi = block.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (prose.includes(block.slice(0, mid))) lo = mid; else hi = mid - 1;
  }
  fail.push(`NOT VERBATIM (${what}) after ${lo} chars: …${block.slice(Math.max(0, lo - 60), lo + 60)}…`);
}

/* --- 4. Home's held-back link, which lands with this page -------------- */

const home = readFileSync(HOME, "utf8").replace(/<!--[\s\S]*?-->/g, " ");
const homeMain = (home.match(/<main[\s\S]*?<\/main>/) || [""])[0];
const inbound = [...homeMain.matchAll(/href="([^"]*\/why\/one-model[^"]*)"/g)].map((m) => m[1]);
ok(inbound.length === 1, `Home's §5 links the model page once (${inbound.join(", ") || "not at all"})`);
ok(/Read the model page/.test(homeMain), "the link is the TextLink brief §8 held back");

/* And the assertion that held it back is gone, not left to fail. It existed
 * only because the page was not rebuilt. */
const vh = readFileSync(VERIFY_HOME, "utf8");
const deadLoop = (vh.match(/for \(const dead of \[[^\]]*\]/) || [""])[0];
ok(!deadLoop.includes("/why/one-model"),
   `verify-home.mjs no longer holds /why/one-model dead (${deadLoop.replace(/\s+/g, " ")})`);

/* --- report ----------------------------------------------------------- */

console.log(`${pass.length} passed`);
for (const f of fail) console.log("  FAIL  " + f);
console.log(fail.length ? `\n${fail.length} failed` : "\nall checks passed");
process.exit(fail.length ? 1 : 0);
