/* The struck-claim list, in one place.
 *
 * It lived inside `verify-home.mjs`, which only ever scanned `/`. That is why
 * `/why/one-model` shipped "85+", "six layers" and "No invalid join ever runs
 * on your data" for as long as it did (PRO-27). The list is now a module two
 * checkers share: `verify-home.mjs`, which needs a running browser and checks
 * Home's composition, and `verify-claims.mjs`, which needs neither and sweeps
 * every page in `site/`.
 *
 * Each entry is a string the SME struck and the reason it was struck. These
 * are claim regressions, not style preferences — see §6 of `brief-home` and
 * `docs/claim-audit.md` §1.
 */

export const BANNED = [
  ["85+", "no derivation in the repo reaches 85; the pages say 72 / 63 / 37"],
  ["no invalid join", "the join guard is policy, not a hard boundary"],
  ["never runs on your data", "same — the guard has documented bypasses"],
  ["60-million", "a table size is not a result"],
  ["60M", "same"],
  ["sub-100ms", "not reproducible from the repo"],
  ["six layers", "five, numbered 0-4, plus an approval hook beside them"],
  ["6 layers", "same"],
  ["Apache 2", "the Change License is GPL-2.0-or-later"],
  ["coming soon", "SaaS is not offered — not deferred"],
  ["in development", "same"],
  ["managed hosting", "same"],
  ["all-in-one", "off the brand pages by standing instruction"],
  ["single platform", "same"],
  ["one platform for everything", "same"],
  ["cloud.provisa.dev", "withdrawn as a conversion in plan revision 3"],
  ["SOC 2", "no compliance certification name appears on any page"],
  ["ISO 27001", "same"],
  ["HIPAA", "same"],
  ["GDPR", "same"],
  ["FedRAMP", "same"],
  ["PCI", "same"],
  ["21 SQLAlchemy", "the arithmetic is right but the figure invites a recount"],
  ["21 keys", "same — use the structural sentence"],
  ["six every time", "the spine's qualifier 1: six is the capability, not a count per question"],
  ["all six surfaces answer", "same — write it as 'up to six'"],
  ["three ways to ask", "the old spine; §5 is six governed surfaces (claim-audit §5.1c)"],
  ["nine protocols", "the framing double-counts — seven listeners, sixteen surfaces"],
  ["62 connectors", "72 source types is the reproducible figure (claim-audit §1.1)"],
  ["six governance layers", "five, plus the approval hook beside them"],
];

/* Comments are excluded before matching. A struck claim inside an HTML comment
 * is not copy a reader or a crawler is served, and the comments on these pages
 * quote the struck strings in order to name the rule — `site/vs/starburst.html`
 * explains the withdrawn trial host by naming it. Matching inside comments
 * would make the honest note indistinguishable from the claim it forbids. */
export const servedCopy = (src) => src.replace(/<!--[\s\S]*?-->/g, " ");

const rx = (s) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");

/** Every ban the source violates, as `{ banned, why, count }`. */
export const findBanned = (src, skip = []) =>
  BANNED.filter(([s]) => !skip.includes(s))
    .map(([s, why]) => ({ banned: s, why, count: (servedCopy(src).match(rx(s)) || []).length }))
    .filter((h) => h.count > 0);
