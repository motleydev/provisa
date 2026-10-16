/**
 * Composition and copy checks for /install (PRO-17). No browser, no server:
 * `site/` has no build step, so the served bytes are the bytes on disk.
 *
 *   node site/design-system/check-page-install.mjs
 *
 * This is the browserless half of the pair `site/design-system/README.md`
 * describes. The five-width, two-theme render pass is the other half and needs
 * Playwright (PRO-38).
 *
 * The page's rule is that every command on it runs, so the checks here are
 * weighted towards the commands and the lines that qualify them:
 *
 *   1. The page is on the kit, with the Home chrome and none of the
 *      pre-rebrand chrome.
 *   2. The hero code block is the first thing below the H1 in source order
 *      (acceptance criterion 2). Source order is what makes that true at all
 *      five widths without a breakpoint, so it is checkable without a browser
 *      — a rail or a grid here would not be.
 *   3. Every comment line inside every code block is present, verbatim
 *      (acceptance criterion 3). On this page the comments carry the claim:
 *      a reader who loses the Python line gets a resolver error in their first
 *      thirty seconds.
 *   4. The release line ships (acceptance criterion 5), so nothing on the
 *      page implies general availability.
 *   5. Every code block pastes: no `$` prompt, no non-breaking space, no
 *      entity left undecoded inside a <pre> (acceptance criterion 7).
 *   6. The page-specific string bans from the issue's own table. The struck
 *      claims shared with every other page are NOT repeated here —
 *      `site/verify-claims.mjs` sweeps those across all of `site/` and a
 *      second copy of that list is the thing it exists to prevent. What is
 *      here is only what is specific to this page: a subcommand that does not
 *      exist, a wrong version range, an unset port placeholder, and the two
 *      scope errors the SME's verdict pass struck.
 *   7. `psql` may only appear after a command that set the port. This is the
 *      page's one broken-command rule written as an assertion: the pgwire
 *      listener is off until `PROVISA_PGWIRE_PORT` is set, and revision 2 of
 *      this page told a reader to connect to a port nothing had opened.
 *   8. The copy the SME cleared is compared verbatim, the way
 *      check-page-one-model.mjs does it, so a later tightening cannot quietly
 *      reword a cleared claim.
 */

import { readFileSync } from "node:fs";

const FILE = "site/install.html";

const raw = readFileSync(FILE, "utf8");
const noComments = raw.replace(/<!--[\s\S]*?-->/g, " ");
const main = (noComments.match(/<main[\s\S]*?<\/main>/) || [""])[0];
const head = (noComments.match(/<head[\s\S]*?<\/head>/) || [""])[0];

const decode = (s) =>
  s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

/* Inline tags come out without leaving a space behind them, so a link or a
 * <code> inside a sentence does not add one before the next word and the
 * comparison fails on the words rather than on the markup. */
const prose = noComments
  .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
  .replace(/<\/?(code|strong|em|span|a|mark|b|i)\b[^>]*>/g, "")
  .replace(/<[^>]+>/g, " ");
const text = decode(prose).replace(/\s+/g, " ").trim();

/* Every <pre> on the page, as the plain text a reader would paste. */
const pres = [...noComments.matchAll(/<pre>([\s\S]*?)<\/pre>/g)]
  .map((m) => decode(m[1].replace(/<\/?(span|mark|code|b|i|em|strong)\b[^>]*>/g, "")));

const fail = [];
const pass = [];
const ok = (c, m) => (c ? pass : fail).push(m);

/* --- 1. the chrome is the kit's ---------------------------------------- */

const CHROME = [
  ['href="/design-system/fonts.css"', "the self-hosted webfonts"],
  ['href="/design-system/tokens.css"', "the token layer"],
  ['href="/design-system/provisa.css"', "the kit"],
  ['src="/design-system/provisa.js"', "the kit's behaviour"],
  ['rel="canonical" href="https://provisa.dev/install"', "the canonical route"],
  ["provisa-theme", "the inline theme bootstrap"],
];
for (const [needle, what] of CHROME) ok(raw.includes(needle), `chrome: ${what}`);

const GONE = [
  ["/styles.css", "the pre-rebrand stylesheet"],
  ["fonts.googleapis.com", "the Google Fonts link"],
];
for (const [needle, what] of GONE) ok(!raw.includes(needle), `gone: ${what}`);

ok(/<link rel="canonical" href="[^"]*\/install">/.test(head),
   "the canonical href is the extensionless route");

/* --- 2. the hero code block is first below the H1 ---------------------- */

const afterH1 = main.slice(main.indexOf("</h1>") + 5);
const between = afterH1.slice(0, afterH1.indexOf('<div class="pv-code">'));
ok(main.includes("</h1>"), "the page has an H1");
ok(afterH1.includes('<div class="pv-code">'), "a CodeBlock follows the H1");
ok(between.trim() === "",
   `nothing stands between the H1 and the code block (found: ${between.trim().slice(0, 80)})`);

/* And the hero is one column, not a rail: the rail is what would put prose or
 * a figure beside the code at 1280 and above. */
const hero = main.slice(0, main.indexOf("pv-seclabel"));
ok(!hero.includes("pv-rail"), "the hero is single-column, so source order is the rendered order");

/* --- 3. every comment line ships --------------------------------------- */

const COMMENTS = [
  "# Python 3.12 required — 3.13 is not supported.",
  "# Not Linux aarch64: no pgserver wheel and no source distribution,",
  "# so the embedded tier does not run there. Use the container tier.",
  "# the bundled sample domains, on embedded SQLite",
  "# Loads the bundled pet-store and shelter sample domains over embedded",
  "# SQLite, and marks the session as a demo run. No Docker. The UI opens",
  "# at the URL it prints.",
  "# provisa.yaml — a source, a domain, and one table with its columns.",
  "# The Postgres listener is off until you give it a port.",
  "# 5439 is what our Helm chart and installer set; any free port works.",
  "# In another shell — psql speaks to Provisa as if it were Postgres",
  "# Federate on a Trino coordinator you already run",
  "# Or federate in your own PostgreSQL. The extensions it federates",
  "# through have to be installed in that server.",
  "# pg_duckdb loads only at server start",
];
const allPre = pres.join("\n");
for (const line of COMMENTS)
  ok(allPre.includes(line), `comment line ships: ${line.slice(0, 54)}`);

/* The Python window is the one line in the hero that is marked rather than
 * dimmed. .pv-code__c is --text-code-faint, so a comment is the faintest text
 * in the block by design, and this is the line whose failure mode is a
 * resolver error on the page's first command. */
ok(/<mark># Python 3\.12 required — 3\.13 is not supported\.<\/mark>/.test(raw),
   "the Python window is marked, not dimmed");

/* --- 4. the release line ----------------------------------------------- */

ok(text.includes("Current release 0.1.0a479. This is a first release and we say so."),
   "the release line ships, verbatim");
ok(!/\b(generally available|general availability|GA release)\b/i.test(text),
   "nothing on the page implies general availability");

/* --- 5. every code block pastes ---------------------------------------- */

for (const [i, pre] of pres.entries()) {
  const lines = pre.split("\n");
  const prompt = lines.find((l) => /^\s*\$\s/.test(l));
  ok(!prompt, `code block ${i + 1}: no leading $ prompt${prompt ? ` (${prompt.trim()})` : ""}`);
  ok(!pre.includes("\u00a0"), `code block ${i + 1}: no non-breaking space`);
}
/* Entities are decoded above, so an undecoded one is a literal `&amp;` in the
 * served bytes — which pastes as `&amp;&amp;` and fails. */
ok(!/&amp;(amp|lt|gt|quot|#39);/.test(raw), "no double-escaped entity in the source");
ok(pres.length >= 3, `the page carries its code blocks (${pres.length} <pre>)`);

/* --- 6. the page's own string bans ------------------------------------- */

const BANNED = [
  ["provisa --help", "used as a source-registration stand-in; there is no such step"],
  ["provisa source", "no such subcommand (cli.py:636-820)"],
  ["provisa sources", "same"],
  ["provisa register", "same"],
  ["Python 3.12+", "requires-python is >=3.12,<3.13"],
  ["$PROVISA_PGWIRE_PORT", "an unset placeholder; the tab sets 5439"],
  ["TLS works out of the box", "a cluster property, on a page whose hero is a laptop install"],
  ["the launcher opens the tour", "that is the desktop installer, not the pip tier"],
  ["serves the UI", "REQ-1256, in progress"],
  ["exposes every protocol port", "REQ-1258, in progress"],
];
for (const [needle, why] of BANNED)
  ok(!main.includes(needle), `absent from the page: "${needle}" — ${why}`);

/* The two words that describe a licence. `free forever` and `non-production`
 * are true of the BSL production grant and false of the registration file, and
 * the brief's rule is that the two never share a sentence. The footer blurb is
 * the shared chrome and is about the grant; inside <main>, where both licences
 * are discussed in adjacent paragraphs, neither word is used at all. */
for (const word of ["free forever", "non-production"])
  ok(!main.includes(word),
     `"${word}" does not appear in the page body, where both licences are discussed`);
ok(/non-production use \(including evaluation\) is free\s+forever/.test(raw),
   "the footer blurb is the chrome's, and is about the production grant");

/* --- 7. psql only after the port is set -------------------------------- */

/* The page's first-order broken-command rule. The pgwire listener is off
 * until PROVISA_PGWIRE_PORT is set, so the FIRST psql command on the page
 * must appear after a command that set the port. §3 tab 3 is a prose tab
 * panel, so the port-setting command sits in a <pre> inside it before the
 * psql connect. Revision 2's bug was exactly this ordering, with the port
 * never set at all. */
/* `psql` on its own is the tab-button label ("Ask it over pgwire · psql");
 * what has to appear only after the port-setting command is the connect
 * invocation `psql -h …`, so the match requires a flag after it. */
const psqlAt = main.search(/psql\s+-/);
ok(psqlAt !== -1, "§3 ships a psql connect");
const portAt = main.indexOf("PROVISA_PGWIRE_PORT=");
ok(portAt !== -1 && portAt < psqlAt,
   "the psql connect appears only after a command that set PROVISA_PGWIRE_PORT");
ok(/PROVISA_PGWIRE_PORT=([1-9]\d{3,4})\b/.test(main),
   "the port is a literal, not a placeholder");
/* The three corrections from PRO-40's run (brief C-11, revision 4). The
 * connect command binds `127.0.0.1`, not `localhost`; the role is
 * `analyst`, not `admin`; and the server command carries `--demo`. */
ok(/PROVISA_PGWIRE_PORT=5439 provisa run --demo/.test(allPre),
   "the server command carries --demo (otherwise the query's tables don't exist)");
ok(/psql -h 127\.0\.0\.1 -p 5439 -U analyst/.test(allPre),
   "the connect uses 127.0.0.1 and -U analyst, not localhost / admin");

/* --- 8. the cleared copy, verbatim ------------------------------------- */

const COPY = [
  ["the hero release line, with the 2026-10-14 run",
   "Current release 0.1.0a479. This is a first release and we say so. Run on 2026-10-14 on CPython 3.12.15 in a fresh virtualenv; the API and the UI both answered 200 and the server printed ✓ Provisa is ready."],
  ["the hero bridge to §3 tab 2",
   "That is the demo data. Pointing it at your own sources is the next step and it is a config file, not another install — §3, tab 2."],
  ["the hero body",
   "The desktop installer is a single download driven by start, stop, status and open. By default it runs everything natively: DuckDB as the federation engine, an embedded PostgreSQL control plane, an in-memory cache. Trino on Docker or an external engine are opt-in choices in the setup wizard, and Docker or a VM is provisioned only if you pick one of them. The run command waits for the API to report ready before it prints success, so a green line means a green line."],
  ["the hero caption",
   "The embedded tier runs on DuckDB. No JVM means no Trino — this is the whole control plane and UI on one engine, not multi-engine federation in a wheel. For that, point it at an engine you run."],
  ["§2 the engine card",
   "DuckDB, in process. It is the only engine in the wheel — omitting the JVM omits Trino. Good for a desktop, an edge box and development; not for multi-user production, and we would rather tell you that here than have you find out in staging."],
  ["§2 the control-plane card",
   "An embedded store holding the model, the operating state and the platform state — pluggable, chosen by a SQLAlchemy URI, and PostgreSQL everywhere that is not a desktop. One consequence worth knowing before you build a control narrative on it: audit-log immutability is enforced by PostgreSQL rules, so on the desktop tier append-only is an application convention rather than a database guarantee."],
  ["§2 the callout",
   "Nothing phoned home. The whole distribution installs with no network calls at install time or first launch, and the add-ons are found locally, then on mounted volumes, before anything is downloaded."],
  ["§3 the lead, on registration-exposes-nothing",
   "Registering a source exposes nothing. A table is queryable only after someone registers it; an unregistered table is invisible, absent from the schema browser and unnameable in a query. That is the default, not a setting."],
  ["§3 tab 2 the mechanism paragraph",
   "There is no publish-the-whole-table shorthand. A column you do not list is not published, and margin above is listed for org_admin only, so an analyst session cannot name it. That is the mechanism behind the sentence above this section: registering a source exposes nothing, and a table is queryable only after someone says which columns of it are."],
  ["§3 tab 3 the trust-mode callout, inside the tab",
   "That psql command has no password in it, and it does not need one. The bundled demo starts with auth: provider: none, which puts pgwire in trust mode: the username is taken directly as the role and the secret is ignored. The listener also binds every interface. On a laptop that is the right default and it is why the command above is two words long. It is not a configuration to put on a network — our own documentation says not to use trust mode over an unencrypted connection, and we would rather you read that here than discover it."],
  ["§3 tab 3 the SCRAM remedy, beside the disclosure",
   "Set auth.provider: basic with auth.scram: true and pgwire advertises SASL with SCRAM-SHA-256, so the password is proved rather than sent. Client certificates are verified in the handshake before any credential is examined."],
  ["§4 the lead",
   "The same psql session, one join away from the one that worked — two tables in different domains with no approved relationship between them:"],
  ["§4 what the refusal is",
   "That is the governance pipeline refusing an unauthorised join at the Postgres wire, to a stock psql client, with a diagnostic naming the two columns so a data engineer can act on it rather than guess. Nothing about the refusal is specific to our own tooling: the client is the one already installed on the reader's machine."],
  ["§4 the policy-not-a-wall callout",
   "A joinable-looking pair of columns in two systems is the ordinary way a wrong number reaches a dashboard, and most engines in this category would return the cartesian product without comment. The approved-join guard is governance policy rather than a hard boundary — two bypasses exist and they are named on /why/governance — but in high-security mode it is not bypassable by anyone."],
  ["§4 the no-password paragraph, which is the page's argument",
   "There was no password on that session. Tab 3 connects in trust mode, so the role was asserted by the client and taken at face value — and the join was refused anyway. Authentication decides who you say you are; the compiled plan decides what that role may do, and the second does not depend on the first being strong. Most readers conflate the two, and this is the one place on the site where they come apart with evidence in front of them."],
  ["§5 the TLS callout, scoped in its first clause",
   "In a cluster deployment, every endpoint is served over TLS — UI and API as well as pgwire, Bolt and Flight — and Provisa generates self-signed certificates when none are supplied. The Helm chart takes an existing certificate secret or a cert-manager issuer."],
  ["§6 the pg-ext limit, as a mechanism and not a vendor blocklist",
   "The pg-ext bundles are built for PostgreSQL 16 only, on linux-x64 and darwin-arm64. A managed service without filesystem access — RDS, Cloud SQL — cannot take them; use the extensions the service offers."],
  ["§7 the production grant",
   "Provisa is source-available under Business Source License 1.1. Production use is free for an organization that, with its affiliates, has fewer than 100 employees and contractors and under USD 1,000,000 in annual revenue, budget or expenditure, with 90 days' grace if you cross either threshold. Any other production use needs a commercial licence. Each released version becomes GNU General Public License, Version 2.0 or later on the fourth anniversary of that version's first public availability."],
  ["§7 the trial, affirmatively",
   "Nothing stops working: no feature gate, no row limit, no read-only mode, no expiry."],
  ["§7 the per-protocol notice",
   "That notice travels on each protocol's own non-fatal channel — pgwire NoticeResponse, Bolt success metadata, Flight app_metadata, gRPC trailing metadata, a REST header — and it never modifies the result body, the row stream, or any schema-typed field. A licence reminder that cannot corrupt a result set is a design decision, and it cannot even fail the request it rides on."],
  ["§7 the callout that separates the two licences",
   "The free licence file is a registration artifact. It is not the BSL production grant. If your organization is over either threshold, you need a commercial licence to run Provisa in production — and the free file does not change that."],
];

for (const [what, block] of COPY) {
  if (text.includes(block)) { pass.push(`verbatim: ${what}`); continue; }
  /* Where it stopped matching, so the failure names the edit rather than the
   * paragraph. */
  let lo = 0, hi = block.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (text.includes(block.slice(0, mid))) lo = mid; else hi = mid - 1;
  }
  fail.push(`NOT VERBATIM (${what}) after ${lo} chars: …${block.slice(Math.max(0, lo - 60), lo + 60)}…`);
}

/* --- 8a. §3 ships three tabs; the trust-mode callout sits inside tab 3 - */

/* The brief's §3 is CodeTabs with three tabs, and the acceptance criterion
 * from revision 5 is that the trust-mode callout sits inside tab 3 at the
 * same weight as the command — not a footnote, not below the tabs. So the
 * callout must appear inside the <div id="p-ask"> panel. */
const tablist = (main.match(/<div class="pv-codetabs__tabs"[\s\S]*?<\/div>/) || [""])[0];
const tabCount = (tablist.match(/role="tab"/g) || []).length;
ok(tabCount === 3, `§3 ships three tabs (found ${tabCount})`);

const panelAsk =
  (main.match(/<div[^>]*id="p-ask"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/) ||
   [""])[0];
ok(panelAsk.includes("pv-callout"),
   "the trust-mode callout is inside tab 3 (p-ask), not below the tabs");
ok(/trust mode/.test(panelAsk),
   "the trust-mode disclosure is inside the pgwire tab");

/* The brief's string ban "the launcher opens the tour" is already enforced
 * above. The pgwire tab must also mention that the role is `analyst`, not
 * `admin`, which is the correction PRO-40 published as copy. The copy's
 * explanation of why admin fails quotes the broken command ("there is no
 * `admin`", "-U admin returns 'No schema for role admin'") — that content is
 * what we want on the page, not what we want absent, so we scrub <code> spans
 * and quoted strings before testing for a bare `admin` elsewhere. */
const panelAskProse = panelAsk
  .replace(/<code>[\s\S]*?<\/code>/g, "")
  .replace(/'admin'/g, "")
  .replace(/\borg_admin\b/g, "");
ok(/\banalyst\b/.test(panelAsk) && !/\badmin\b/.test(panelAskProse),
   "the pgwire tab names the demo's one role (analyst), not admin");

/* --- 8b. §4 ships the refusal, with the no-password paragraph ---------- */

const refusal = (main.match(/id="refusal"[\s\S]*?<\/section>/) || [""])[0];
ok(/V002\] Invalid JOIN: employees\.id = pets\.id/.test(refusal),
   "§4 ships the exact V002 refusal line");
ok(/approved-join guard/.test(refusal),
   "§4 carries the governance qualifier (two bypasses, high-security mode)");

/* --- 9. the inbound links this page answers ---------------------------- */

/* Both ids stay on Home, on the section that links here. A fragment cannot be
 * redirected server-side, so dropping either one silently breaks every link to
 * provisa.dev/#download — no 404, no redirect, just a reader at the top of a
 * page they did not want. */
const home = readFileSync("site/index.html", "utf8").replace(/<!--[\s\S]*?-->/g, " ");
for (const id of ["download", "deploy"])
  ok(home.includes(`id="${id}"`), `Home still carries #${id}`);
ok(/href="\/install"/.test(home), "Home's download section links /install");

/* The three download endpoints are Pages Functions, not pages, and they are
 * this page's primary conversion. */
for (const platform of ["macos", "windows", "linux"])
  ok(main.includes(`href="/dl/${platform}"`), `the /dl/${platform} conversion ships`);

/* --- report ----------------------------------------------------------- */

console.log(`${pass.length} passed`);
for (const f of fail) console.log("  FAIL  " + f);
console.log(fail.length ? `\n${fail.length} failed` : "\nall checks passed");
process.exit(fail.length ? 1 : 0);
