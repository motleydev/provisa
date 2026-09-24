import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Static build for Cloudflare Pages. `build.format: 'file'` emits
// why/governance.html, which Pages serves at /why/governance — the same URLs
// the previous site used.
export default defineConfig({
  site: 'https://provisa.dev',
  trailingSlash: 'never',
  // Astro's HTML compressor drops the space between a line of text and an
  // inline element that starts the next source line ("query in<strong>SQL").
  // gzip on Cloudflare makes the uncompressed markup cost negligible.
  compressHTML: false,
  build: {
    format: 'file',
  },
  integrations: [
    // Design-system components render to static HTML; none are hydrated.
    react(),
    sitemap(),
  ],
});
