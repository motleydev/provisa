#!/usr/bin/env node
/*
 * Generator for the editorial illustration series on PRO-143.
 *
 * Reads per-slot briefs from editorial-slots.json, prepends the shared visual
 * system, posts to OpenRouter google/gemini-3-pro-image, decodes the returned
 * PNG, and writes it to site/assets/editorial/. For each slot it produces a
 * light cut, then a dark cut that is conditioned on the light PNG so geometry
 * stays identical across themes.
 *
 * Usage:
 *   OPENROUTER_IMAGE_API_KEY=... node scripts/editorial-generate.mjs <slot-id> [...]
 *   OPENROUTER_IMAGE_API_KEY=... node scripts/editorial-generate.mjs --all
 *   OPENROUTER_IMAGE_API_KEY=... node scripts/editorial-generate.mjs --priority
 *
 * Idempotent: existing files are skipped unless --force is passed.
 */

import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const SLOTS_PATH = join(__dirname, 'editorial-slots.json')
const OUT_DIR = join(REPO_ROOT, 'site/assets/editorial')
const MODEL = 'google/gemini-3-pro-image'
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

const PRIORITY = ['img-01', 'img-03', 'img-05']

const PALETTE_LIGHT = {
  ground: '#f8f6f1 (paper, warm off-white)',
  ink: '#16181d (near-black ink)',
  cobalt: '#2451d8 (saturated cobalt blue)',
  forest: '#0f6b4f (deep forest green)',
  vermilion: '#e24a1f (saturated vermilion orange-red)',
  dot_grid: '#e3e0d8 (very low-contrast dot grid on paper)'
}

const PALETTE_DARK = {
  ground: '#0e1013 (near-black deep ink)',
  ink_role: '#f1efe9 (warm off-white that plays the ink role on dark)',
  cobalt: '#3d66e8 (raised cobalt for a dark page)',
  forest: '#0b5340 (deep forest, slightly brightened for dark)',
  vermilion: '#b03a16 (vermilion as a dark-theme figure ground)',
  dot_grid: '#1b1e24 (very low-contrast dot grid on dark ground)'
}

const SHARED_VISUAL_SYSTEM = `
You are producing a sophisticated editorial illustration for an enterprise data platform. The series is called the Provisa editorial series. Treat this request as a Swiss print-design brief translated into illustration.

Overall character:
- Combine Swiss print-design discipline with restrained technical abstraction. Confident proportions, clear hierarchy, purposeful negative space.
- Mature enterprise brand illustration. Not playful. No toy-block arrangements. No mascots, faces, robot silhouettes, decorative complexity. No generic flowchart look.

Shape language:
- Use squares, rectangles, bars, and occasional circles and diamonds. Keep rectangular shapes square-cornered.
- Prefer wide, shallow proportions for platforms, layers, and shared infrastructure.
- Vary component sizes and widths to establish hierarchy.
- Avoid repeated paired shapes that could accidentally resemble eyes or faces.
- Keep each object simple; add internal detail only when it carries meaning.

Connectors:
- Treat connectors as precisely routed infrastructure.
- Use mostly straight runs joined by broad, smooth, controlled bends. Curves should resolve changes in direction, not decorate an otherwise straight path.
- No waves, squiggles, vines, tangled branches, or limb-like arrangements.
- Fine, consistent line weight — approximately 1/300 to 1/400 of the image's short side.
- Clean joins. Add junction markers only when they communicate a meaningful relationship.
- Only draw the connections specified in the per-slot brief. Do not invent connections to improve visual balance.
- No arrowheads unless the slot brief explicitly asks for them.

Composition:
- One dominant subject, supporting context, and one focal accent.
- Disciplined alignment with restrained asymmetry. Let scale, spacing, and position establish hierarchy before any detail.
- Balance generous negative space with a composition large enough to read at thumbnail size (256px on the long edge).
- Avoid rigidly uniform spacing when it makes the composition feel mechanically assembled.
- Avoid symmetry that creates an unintended character or face.

Palette and surface:
- Use the palette supplied for this cut. Reserve the vermilion for the focal accent that carries the illustration's main point.
- Full-bleed ground with a very subtle, evenly spaced fine dot grid behind the composition. Keep the grid clearly subordinate — it should be barely visible but present.
- Solid colour fields. No new hues. No obvious gradients, no shadows, no bevels, no lighting effects, no simulated materials.

Rendering:
- Crisp silhouettes, clean edges, controlled linework.
- Flat 2D, front-facing. No perspective, no isometric projection, no 3D, no photography, no texture overlays, no visual noise.
- No people, hands, mascots, or decorative icons.
- Include text only if the per-slot brief explicitly requires it. Do not add captions, callouts, or labels on your own.

Thumbnail test: the main idea must read without a caption at 256px on the long edge. The focal accent must be immediately apparent.
`.trim()

async function fileExists(p) {
  try { await stat(p); return true } catch { return false }
}

function buildPrompt(slot, theme) {
  const palette = theme === 'light' ? PALETTE_LIGHT : PALETTE_DARK
  const paletteLines = Object.entries(palette)
    .map(([role, value]) => `  - ${role}: ${value}`)
    .join('\n')

  const [aspectW, aspectH] = slot.aspect.split(':').map(Number)
  const aspectDescriptor =
    aspectW === aspectH ? `square 1:1 aspect` :
    aspectW > aspectH ? `landscape ${aspectW}:${aspectH} aspect (wider than tall)` :
    `portrait ${aspectW}:${aspectH} aspect (taller than wide)`

  const composition = Object.entries(slot.composition || {})
    .map(([region, description]) => `  - ${region}: ${description}`)
    .join('\n')

  const themeDirective = theme === 'light'
    ? `This is the light-theme cut. The ground is a warm off-white paper. The ink role is near-black. The dot grid is a quiet warm neutral.`
    : `This is the dark-theme cut. The ground is a deep near-black ink. The ink role is a warm off-white. All object colours shift to the dark-page variants listed below. The composition, scale, placement, and connectors must be identical to the light cut — only the palette changes.`

  return `${SHARED_VISUAL_SYSTEM}

---

Slot: ${slot.id}
Page: ${slot.page}
Target aspect: ${aspectDescriptor}
Title: ${slot.title}
Meaning: ${slot.meaning}

Composition requirements:
${composition}

Focal accent: already specified in composition. Make it immediately apparent.
${slot.labels ? `Required labels: ${slot.labels}` : 'No text labels. Do not include any text in the image.'}

${slot.notes ? `Additional notes: ${slot.notes}` : ''}

Theme: ${theme}
${themeDirective}

Palette for this cut:
${paletteLines}

Produce one illustration that satisfies this brief exactly. Return the image as a PNG.`.trim()
}

async function callOpenRouter({ prompt, imageInputDataUrl }) {
  const apiKey = process.env.OPENROUTER_IMAGE_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_IMAGE_API_KEY is not set in this shell.')

  const content = imageInputDataUrl
    ? [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageInputDataUrl } }
      ]
    : prompt

  const body = {
    model: MODEL,
    modalities: ['image', 'text'],
    messages: [{ role: 'user', content }]
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://provisa.ai',
      'X-Title': 'Provisa site editorial series'
    },
    body: JSON.stringify(body)
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}: ${text.slice(0, 1000)}`)

  let json
  try { json = JSON.parse(text) } catch { throw new Error(`Non-JSON response: ${text.slice(0, 300)}`) }

  const msg = json?.choices?.[0]?.message
  const images = msg?.images
  if (!images || !Array.isArray(images) || images.length === 0) {
    throw new Error(`No images returned. Message content: ${JSON.stringify(msg?.content || '').slice(0, 500)}`)
  }
  const url = images[0]?.image_url?.url
  if (typeof url !== 'string' || !url.startsWith('data:')) {
    throw new Error(`First image is not a data URL: ${String(url).slice(0, 200)}`)
  }
  const comma = url.indexOf(',')
  const prefix = url.slice(0, comma)
  const b64 = url.slice(comma + 1)
  const buf = Buffer.from(b64, 'base64')
  return { buf, dataUrl: url, prefix }
}

async function generateSlot(slot, { force = false } = {}) {
  await mkdir(OUT_DIR, { recursive: true })
  const lightPath = join(OUT_DIR, `${slot.id}-light.png`)
  const darkPath = join(OUT_DIR, `${slot.id}-dark.png`)

  const results = { slot: slot.id, light: null, dark: null }

  if (!force && await fileExists(lightPath)) {
    console.log(`[${slot.id}] light: already exists, skipping`)
    results.light = { path: lightPath, status: 'skipped' }
  } else {
    const t0 = Date.now()
    const lightPrompt = buildPrompt(slot, 'light')
    const { buf, dataUrl } = await callOpenRouter({ prompt: lightPrompt })
    await writeFile(lightPath, buf)
    console.log(`[${slot.id}] light: wrote ${lightPath} (${buf.length} bytes, ${Date.now()-t0}ms)`)
    results.light = { path: lightPath, status: 'generated', bytes: buf.length, dataUrl }
  }

  if (!force && await fileExists(darkPath)) {
    console.log(`[${slot.id}] dark:  already exists, skipping`)
    results.dark = { path: darkPath, status: 'skipped' }
  } else {
    let lightDataUrl = results.light?.dataUrl
    if (!lightDataUrl) {
      // The light file already existed; load it into a data URL to condition the dark cut.
      const buf = await readFile(lightPath)
      lightDataUrl = `data:image/png;base64,${buf.toString('base64')}`
    }
    const t0 = Date.now()
    const darkPrompt = buildPrompt(slot, 'dark') + `

The attached image is the already-approved light-theme cut of this slot. Reproduce the exact same composition — same shapes in the same positions, same sizes, same connections, same focal element. The only change is the palette, which must shift to the dark-theme values listed above.`
    const { buf } = await callOpenRouter({ prompt: darkPrompt, imageInputDataUrl: lightDataUrl })
    await writeFile(darkPath, buf)
    console.log(`[${slot.id}] dark:  wrote ${darkPath} (${buf.length} bytes, ${Date.now()-t0}ms)`)
    results.dark = { path: darkPath, status: 'generated', bytes: buf.length }
  }

  return results
}

async function main() {
  const argv = process.argv.slice(2)
  const force = argv.includes('--force')
  const flagless = argv.filter(a => !a.startsWith('--'))

  const slotsFile = JSON.parse(await readFile(SLOTS_PATH, 'utf8'))
  const allSlots = slotsFile.slots

  let target
  if (argv.includes('--all')) target = allSlots
  else if (argv.includes('--priority')) target = allSlots.filter(s => PRIORITY.includes(s.id))
  else if (flagless.length > 0) target = allSlots.filter(s => flagless.includes(s.id))
  else {
    console.error('Usage: node scripts/editorial-generate.mjs [--all | --priority | <slot-id> ...] [--force]')
    process.exit(2)
  }

  if (target.length === 0) {
    console.error('No slots matched.')
    process.exit(2)
  }

  console.log(`Generating ${target.length} slot(s): ${target.map(s => s.id).join(', ')}`)
  const summary = []
  for (const slot of target) {
    try {
      const r = await generateSlot(slot, { force })
      summary.push({ id: slot.id, ok: true, light: r.light?.status, dark: r.dark?.status })
    } catch (e) {
      console.error(`[${slot.id}] FAILED: ${e.message}`)
      summary.push({ id: slot.id, ok: false, error: e.message })
    }
  }

  console.log('\nSummary:')
  for (const s of summary) {
    console.log(`  ${s.id}: ${s.ok ? `light=${s.light} dark=${s.dark}` : `FAILED (${s.error})`}`)
  }
  const failed = summary.filter(s => !s.ok)
  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
