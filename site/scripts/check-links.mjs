// Checks every internal link in dist/: the page must exist and, for #anchors,
// the target page must contain that id. External links are listed, not fetched.
// Paths served by other systems on the same domain are allowed through.
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const EXTERNAL_PREFIXES = ['/docs', '/api/', '/dl/'];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = await walk(dist);
const pages = new Map();
for (const f of files) {
  const html = await readFile(f, 'utf8');
  const rel = '/' + relative(dist, f).replace(/\.html$/, '').replace(/(^|\/)index$/, '');
  const route = rel === '/' ? '/' : rel.replace(/\/$/, '');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const hrefs = [...html.matchAll(/\shref="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  pages.set(route, { ids, hrefs, file: f });
}

const problems = [];
const external = new Set();
for (const [route, page] of pages) {
  for (const href of page.hrefs) {
    if (/^(https?:|mailto:|tel:)/.test(href)) {
      external.add(href);
      continue;
    }
    if (href.startsWith('/_astro/') || href.startsWith('/fonts/') || /\.(svg|png|xml|css|txt)$/.test(href)) continue;
    const [path, hash] = href.split('#');
    const target = path === '' ? route : path.replace(/\/$/, '') || '/';
    if (EXTERNAL_PREFIXES.some((p) => target.startsWith(p))) continue;
    const t = pages.get(target);
    if (!t) problems.push(`${route}: missing page ${href}`);
    else if (hash && !t.ids.has(hash)) problems.push(`${route}: missing anchor ${href}`);
  }
}

console.log(`${pages.size} pages checked.`);
console.log(`External links (${external.size}):\n  ` + [...external].sort().join('\n  '));
if (problems.length) {
  console.log(`\n${problems.length} problem(s):\n  ` + problems.join('\n  '));
  process.exit(1);
}
console.log('\nNo broken internal links.');
