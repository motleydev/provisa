#!/usr/bin/env node
/* Export a Provisa slide page to PNGs, one per slide (PRO-150).
 *
 * This is the bridge between the three outputs. The website walkthrough, the
 * images the Notion redesign page embeds, and the sales PDF all come from the
 * same HTML and the same CSS, so none of them can drift from the others and
 * nobody re-authors a deck in PowerPoint.
 *
 *     python3 site/design-system/serve.py 8731 &
 *     node site/design-system/export-slides.mjs http://127.0.0.1:8731/walkthrough/masters \
 *       --out build/slides/masters
 *
 * Each .pv-slide__canvas is screenshotted at the reference canvas, 1920x1080,
 * at deviceScaleFactor 2. --u is one percent of the canvas width, so the
 * exported plate is the same drawing the browser shows at any other size; the
 * viewport only fixes which size "full" means.
 *
 * Needs Playwright, the same dependency the verify-page-*.mjs scripts carry.
 * It is not installed in every workspace (PRO-38), so this script says so
 * rather than failing on an import trace.
 *
 * --theme dark exports the dark rendering by setting the same localStorage key
 * the theme bootstrap reads, before the page paints.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const WIDTH = 1920;
const HEIGHT = 1080;
const SCALE = 2;

function usage(message) {
  console.error(message);
  console.error(
    "\nusage: node site/design-system/export-slides.mjs <url> [--out <dir>] [--theme light|dark] [--pdf]"
  );
  process.exit(2);
}

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith("--"));
if (!url) usage("No URL given.");

function flag(name, fallback) {
  const i = args.indexOf("--" + name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
}

const outDir = flag("out", "build/slides");
const theme = flag("theme", "light");
if (theme !== "light" && theme !== "dark") usage(`Unknown theme: ${theme}`);
const wantPdf = args.includes("--pdf");

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error(
    "Playwright is not installed in this workspace, so the export cannot run.\n" +
      "It is the same dependency site/design-system/verify-page-*.mjs needs; see PRO-38."
  );
  process.exit(3);
}

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: SCALE,
});

/* The theme bootstrap in partials/head.html reads this key synchronously
 * before first paint, so seeding storage is how a dark export avoids
 * screenshotting a light flash. */
if (theme === "dark") {
  await context.addInitScript(() => {
    try {
      localStorage.setItem("provisa-theme", "dark");
    } catch (e) {
      /* Storage unavailable in this context: the export falls back to the
       * light rendering, and the filenames below still say "dark", so the
       * mismatch would be visible rather than silent. */
      console.warn("provisa: could not seed the theme key, exporting light");
    }
  });
}

const page = await context.newPage();

/* An export that screenshots a half-drawn reveal is worthless, so deck mode
 * and its motion are both off for the export: ?view=page makes
 * walkthrough.js return before it builds the controller, and the plate
 * geometry below gives each canvas the full 16:9 viewport anyway. */
const exportUrl = new URL(url);
exportUrl.searchParams.set("view", "page");

const response = await page.goto(exportUrl.toString(), { waitUntil: "networkidle" });
if (!response || !response.ok()) {
  console.error(`${exportUrl} returned ${response ? response.status() : "no response"}`);
  await browser.close();
  process.exit(1);
}

await page.evaluate(() => document.fonts.ready);

/* Force every canvas to the reference geometry for the export. In page mode a
 * canvas is an article section with a fluid --u; here each one is given the
 * viewport as a 16:9 container, which is exactly what .pv-plate does on the
 * master gallery. */
await page.addStyleTag({
  content: `
    .pv-slide{container-type:size !important;aspect-ratio:16/9 !important;
      padding:0 !important;border-top:0 !important;overflow:hidden !important}
    .pv-slide__canvas{--u:calc(min(100cqw, 100cqh * 16 / 9) / 100) !important;
      width:calc(var(--u) * 100) !important;max-width:none !important;
      aspect-ratio:16/9 !important;padding:calc(var(--u) * 5) !important}
    .pv-rail,.pv-deck__bar{display:none !important}
  `,
});

const canvases = await page.locator(".pv-slide__canvas").all();
if (canvases.length === 0) {
  console.error(`No .pv-slide__canvas found at ${exportUrl}`);
  await browser.close();
  process.exit(1);
}

const manifest = [];
for (const [i, canvas] of canvases.entries()) {
  const n = String(i + 1).padStart(2, "0");
  const master =
    (await canvas.evaluate((el) =>
      Array.from(el.classList).find((c) => c.startsWith("pv-sl--"))
    )) ?? "pv-sl--unclassed";
  const file = path.join(outDir, `slide-${n}-${theme}.png`);
  await canvas.scrollIntoViewIfNeeded();
  await canvas.screenshot({ path: file });
  manifest.push({ slide: i + 1, master: master.replace("pv-sl--", ""), file });
  console.log(`slide ${n}  ${master.replace("pv-sl--", "").padEnd(10)}  ${file}`);
}

if (wantPdf) {
  const file = path.join(outDir, `deck-${theme}.pdf`);
  await page.pdf({
    path: file,
    width: `${WIDTH}px`,
    height: `${HEIGHT}px`,
    printBackground: true,
    pageRanges: `1-${canvases.length}`,
  });
  console.log(`pdf          ${file}`);
}

await writeFile(
  path.join(outDir, `manifest-${theme}.json`),
  JSON.stringify({ url: exportUrl.toString(), theme, slides: manifest }, null, 2) + "\n"
);

await browser.close();
console.log(`\n${manifest.length} slides exported to ${outDir}`);
