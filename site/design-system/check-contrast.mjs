#!/usr/bin/env node
// Contrast check for the design system's alias layer (PRO-3 gap 2).
//
//   node site/design-system/check-contrast.mjs          one line per pair
//   node site/design-system/check-contrast.mjs --quiet   failures only
//
// Parses site/design-system/tokens.css, resolves every alias twice — once with
// light-dark() taking its light branch, once its dark branch — and asserts the
// pairs below. Exits 1 on any failure, so it can gate a change to tokens.css.
//
// Thresholds (WCAG 2.2):
//   body      4.5:1  text under 24px (or under 19px bold)
//   large     3.0:1  display text, 24px and up
//   ui        3.0:1  1.4.11, a control's own boundary or state
//   soft      1.2:1  hairline rules and illustrative figure geometry, which
//                    carry no information on their own. Measured, not waived.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TOKENS = path.join(path.dirname(fileURLToPath(import.meta.url)), "tokens.css");

/* ---- colour maths ---------------------------------------------------- */

const hex = (h) => {
  h = h.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const lin = (c) => (c /= 255, c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (h) => { const [r, g, b] = hex(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
export const ratio = (a, b) => {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/* ---- tokens.css -> two flat maps of resolved hex --------------------- */

/** The comma-separated arguments of a function call, respecting nesting. */
function args(s) {
  const out = [];
  let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

/** Declarations in every `:root` block, last one winning — the cascade for a
    single file of single-class selectors. */
export function parseTokens(css) {
  const raw = {};
  // Comments first: they talk about :root and about tokens, and would otherwise
  // be read as declarations.
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const block of css.matchAll(/:root[^{]*\{([^}]*)\}/g)) {
    for (const d of block[1].split(";")) {
      const i = d.indexOf(":");
      if (i === -1) continue;
      const name = d.slice(0, i).trim();
      if (!name.startsWith("--")) continue;
      raw[name] = d.slice(i + 1).trim();
    }
  }
  return raw;
}

/** `value` with var() and light-dark() resolved for one theme. */
function resolve(value, raw, theme, seen = new Set()) {
  let v = value.trim();
  for (let pass = 0; pass < 20; pass++) {
    const ld = v.indexOf("light-dark(");
    if (ld !== -1) {
      const close = matchParen(v, ld + "light-dark".length);
      const [l, d] = args(v.slice(ld + "light-dark(".length, close));
      v = v.slice(0, ld) + (theme === "dark" ? d : l) + v.slice(close + 1);
      continue;
    }
    const m = /var\(\s*(--[\w-]+)\s*\)/.exec(v);
    if (!m) break;
    if (seen.has(m[1])) throw new Error(`cycle through ${m[1]}`);
    const next = raw[m[1]];
    if (next === undefined) throw new Error(`${m[1]} is not declared in tokens.css`);
    v = v.slice(0, m.index) + resolve(next, raw, theme, new Set([...seen, m[1]])) + v.slice(m.index + m[0].length);
  }
  return v.trim();
}

function matchParen(s, from) {
  const open = s.indexOf("(", from);
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")" && --depth === 0) return i;
  }
  throw new Error("unbalanced parentheses in tokens.css");
}

/** rgba(r,g,b,a) composited onto `onto`, so a translucent rule can be measured. */
function flatten(v, onto) {
  const m = /^rgba?\(([^)]*)\)$/.exec(v);
  if (!m) return v;
  const [r, g, b, a = "1"] = args(m[1]).map(Number.parseFloat.bind(Number));
  const bg = hex(onto);
  return "#" + [r, g, b].map((c, i) => Math.round(c * a + bg[i] * (1 - a)).toString(16).padStart(2, "0")).join("");
}

export function themes(css) {
  const raw = parseTokens(css);
  const out = {};
  for (const theme of ["light", "dark"]) {
    const t = {};
    for (const name of Object.keys(raw)) {
      const v = resolve(raw[name], raw, theme);
      if (/^#[0-9a-f]{3,8}$/i.test(v) || /^rgba?\(/.test(v)) t[name.slice(2)] = v;
    }
    out[theme] = t;
  }
  return out;
}

/* ---- the pairs ------------------------------------------------------- */

const PAIRS = [
  ["body copy on the page", "text-body", "surface-page", "body"],
  ["body copy on a band", "text-body", "surface-band", "body"],
  ["small copy on the page", "text-muted", "surface-page", "body"],
  ["small copy on a band", "text-muted", "surface-band", "body"],
  ["display heading on the page", "text-primary", "surface-page", "large"],
  ["display heading on a band", "text-primary", "surface-band", "large"],
  ["link on the page", "text-link", "surface-page", "body"],
  ["link on a band", "text-link", "surface-band", "body"],
  ["eyebrow on the page", "text-eyebrow", "surface-page", "body"],
  ["eyebrow on a band", "text-eyebrow", "surface-band", "body"],
  ["display emphasis on the page", "text-emphasis", "surface-page", "large"],
  ["small emphasis on the page", "text-emphasis-small", "surface-page", "body"],
  ["small emphasis on a band", "text-emphasis-small", "surface-band", "body"],
  ["primary button label", "action-primary-text", "action-primary", "body"],
  ["primary button label, hover", "action-primary-text", "action-primary-hover", "body"],
  ["inverse button label", "action-inverse-text", "action-inverse", "body"],
  ["inverse button label, hover", "action-inverse-text", "action-inverse-hover", "body"],
  ["on-colour button label", "action-on-color-text", "action-on-color", "body"],
  ["on-colour button label, hover", "action-on-color-text", "action-on-color-hover", "body"],
  ["secondary button label", "text-primary", "surface-page", "body"],
  ["utility bar copy", "text-on-brand", "surface-brand", "body"],
  ["utility bar link", "text-on-color", "surface-brand", "body"],
  ["forest band copy", "text-on-brand-alt", "surface-brand-alt", "body"],
  ["forest band index", "text-on-brand-alt-2", "surface-brand-alt", "body"],
  ["forest band heading", "text-on-color", "surface-brand-alt", "large"],
  ["inverse band copy", "text-on-inverse-2", "surface-inverse", "body"],
  ["inverse band muted copy", "text-on-inverse-3", "surface-inverse", "body"],
  ["inverse band heading", "text-on-inverse", "surface-inverse", "large"],
  ["code", "text-code", "surface-code", "body"],
  ["code comment", "text-code-faint", "surface-code", "body"],
  ["code block title", "text-code-label", "surface-code", "body"],
  ["code on a deep block", "text-code", "surface-code-deep", "body"],
  ["code tab, inactive", "text-tab", "surface-code", "body"],
  ["code tab wire, inactive", "text-tab-faint", "surface-code", "body"],
  ["code tab wire, active", "text-tab-wire-on", "surface-brand-alt", "body"],
  ["code highlight row", "text-on-color", "code-highlight", "body", "surface-code"],
  ["see tint — copy", "text-primary", "group-see-tint", "body"],
  ["see tint — index", "group-see-text", "group-see-tint", "body"],
  ["get tint — copy", "text-primary", "group-get-tint", "body"],
  ["get tint — index", "group-get-text", "group-get-tint", "body"],
  ["run tint — copy", "text-primary", "group-run-tint", "body"],
  ["run tint — index", "group-run-text", "group-run-tint", "body"],
  ["table highlight column copy", "text-body", "group-get-tint", "body"],
  ["table highlight column head", "text-link", "group-get-tint", "body"],
  ["chip", "text-primary", "surface-sunken", "body"],
  ["input value", "text-primary", "surface-input", "body"],
  ["focus ring on the page", "focus-ring", "surface-page", "ui"],
  ["focus ring on an inverse band", "focus-ring-inverse", "surface-inverse", "ui"],
  ["switch edge against the page", "switch-edge", "surface-page", "ui"],
  // The off track is 1.9:1 against the page, so the control's boundary is its
  // 1px edge, not its fill. The knob carries the state: against the on track
  // by its own contrast, against the off track by that same edge.
  ["switch edge against the off track", "switch-edge", "switch-track-off", "ui"],
  ["switch knob against the on track", "switch-knob", "switch-on", "ui"],
  ["fig label on a see ground", "fig-label", "fig-bg-see", "body"],
  ["fig label on a get ground", "fig-label", "fig-bg-get", "body"],
  ["fig label on a run ground", "fig-label-run", "fig-bg-run", "body"],
  ["fig geometry — paper on see", "fig-paper", "fig-bg-see", "ui"],
  ["fig geometry — paper on get", "fig-paper", "fig-bg-get", "ui"],
  ["fig geometry — paper on run", "fig-paper", "fig-bg-run", "ui"],
  ["fig geometry — ink on see", "fig-ink", "fig-bg-see", "soft"],
  ["hairline on the page", "border-hairline", "surface-page", "soft"],
  ["hairline on a band", "border-hairline", "surface-band", "soft"],
  ["strong rule on the page", "border-strong", "surface-page", "ui"],
  ["input rule on a band", "border-input", "surface-band", "soft"],
  ["rule inside a tinted card", "border-on-tint", "group-see-tint", "soft"],
];

const MIN = { body: 4.5, large: 3.0, ui: 3.0, soft: 1.2 };

function run(quiet) {
  const css = fs.readFileSync(TOKENS, "utf8");
  const T = themes(css);
  let fails = 0;
  for (const theme of ["light", "dark"]) {
    const rows = [];
    for (const [label, fgName, bgName, kind, ontoName] of PAIRS) {
      const t = T[theme];
      for (const n of [fgName, bgName, ontoName].filter(Boolean)) {
        if (!t[n]) throw new Error(`--${n} does not resolve to a colour in the ${theme} theme`);
      }
      const onto = ontoName ? t[ontoName] : theme === "dark" ? t["surface-page"] : t["surface-page"];
      const bg = flatten(t[bgName], onto);
      const fg = flatten(t[fgName], bg);
      const r = ratio(fg, bg);
      const ok = r >= MIN[kind];
      if (!ok) fails++;
      if (ok && quiet) continue;
      rows.push(
        `  ${ok ? "ok  " : "FAIL"} ${r.toFixed(2).padStart(5)}:1 (min ${MIN[kind].toFixed(1)})  ${label.padEnd(34)} ${fg} on ${bg}`,
      );
    }
    if (rows.length) console.log(`${theme}\n${rows.join("\n")}`);
  }
  const n = PAIRS.length * 2;
  console.log(`${n - fails}/${n} pairs pass (${PAIRS.length} pairs × light and dark)`);
  return fails;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(run(process.argv.includes("--quiet")) ? 1 : 0);
}
