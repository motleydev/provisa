#!/usr/bin/env bash
# Manually build and publish the site (the Astro build in dist/ plus the Pages
# Functions in functions/) to Cloudflare Pages. Config lives in wrangler.jsonc —
# project name, output dir (dist/), and the D1 binding. Run from anywhere:
#
#   ./site/deploy.sh                 # deploy to production
#   ./site/deploy.sh --preview       # deploy a preview build (non-prod branch)
#
# Requires:
#   - Node/npx available (wrangler runs via `npx --yes wrangler`)
#   - CLOUDFLARE_API_TOKEN (Pages: Edit + D1: Edit) exported, or a prior `wrangler login`
#   - CLOUDFLARE_ACCOUNT_ID exported (only needed with an API token)
#   - A D1 database whose id is filled into site/wrangler.jsonc (see site/README.md)
set -euo pipefail

SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANCH="main"
[[ "${1:-}" == "--preview" ]] && BRANCH="preview"

if ! command -v npx >/dev/null 2>&1; then
  echo "error: npx not found — install Node.js to run wrangler." >&2
  exit 1
fi

# Run from the site dir so wrangler picks up wrangler.jsonc (functions/ + D1 binding).
cd "${SITE_DIR}"

# Build the site. If the MkDocs docs were built separately, copy them in so
# /docs/ ships with the same deploy: DOCS_DIR=/path/to/built/docs ./deploy.sh
npm ci
npm run build
if [[ -n "${DOCS_DIR:-}" ]]; then
  rm -rf dist/docs
  cp -R "${DOCS_DIR}" dist/docs
fi
echo "Deploying ${SITE_DIR} → Cloudflare Pages 'provisa-dev' (branch: ${BRANCH})"
npx --yes wrangler pages deploy --branch="${BRANCH}"
