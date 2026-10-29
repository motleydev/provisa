/**
 * Static assertions for /how-it-works (PRO-191).
 *
 *   node site/design-system/check-page-how-it-works.mjs
 *
 * The page states the data-kernel positioning and what the maintainer has
 * published for it (README.md, the "How it works" page of the upstream site).
 * What is held in place: the kernel sentence, the four heritages, the four
 * regulated-industry demands, one h1, six numbered sections, no inline CSS,
 * and the footer marking this page current.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { findBanned, servedCopy } from "../claim-bans.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "how-it-works.html"), "utf8");
const served = servedCopy(src);
const text = served.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const count = (re) => (served.match(re) || []).length;

const pass = [];
const fail = [];
const check = (name, ok, detail = "") =>
  (ok ? pass : fail).push(ok ? name : `${name}${detail ? ` — ${detail}` : ""}`);

check("one h1", count(/<h1\b/g) === 1, String(count(/<h1\b/g)));
check("six numbered section labels", count(/class="pv-seclabel__num"/g) === 6);
check("no page-level CSS", !/<style[\s>]/.test(served));
check(
  "the kernel sentence",
  /Provisa is a data kernel\s*\./.test(text) &&
    /A compiler and runtime for building your data control plane/.test(text),
);
for (const heritage of [
  "Operating systems and virtual machines",
  "Terraform: declare the desired state, and plan before you apply",
  "Kubernetes and Helm: a control plane that reconciles",
  "LLVM: many front ends, one intermediate form, many back ends",
]) check(`heritage: ${heritage.split(":")[0]}`, text.includes(heritage));
for (const demand of [
  "Every answer traceable and reproducible",
  "Least privilege by construction",
  "Residency by region",
  "Review before production",
]) check(`demand: ${demand}`, text.includes(demand));
check("the ten primitives are named", [
  "sources", "tables", "relationships", "terms", "roles",
  "capabilities", "grants", "scope", "products", "contracts",
].every((p) => new RegExp(`<strong>${p}</strong>`).test(served)));
check(
  "footer marks this page current",
  /<a href="\/how-it-works" aria-current="page">How it works<\/a>/.test(served),
);
const banned = findBanned(src);
check("no struck claim", banned.length === 0, banned.map((b) => b.banned).join(", "));

console.log(`${pass.length} passed`);
for (const f of fail) console.log("  FAIL  " + f);
console.log(fail.length ? `\n${fail.length} failed` : "\nall checks passed");
process.exit(fail.length ? 1 : 0);
