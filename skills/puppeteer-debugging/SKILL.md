---
name: puppeteer-debugging
description: Browser-driven debugging and UI verification. This repo drives Playwright, not Puppeteer — the name is historical. Read before verifying UI behaviour or taking a screenshot.
---

# puppeteer-debugging

**The name is historical. There is no Puppeteer in this repo.** `agents/debugger.md` and
`agents/bug-fixer.md` both cite this skill for "investigating frontend issues or verifying UI
behavior", and the tool that does that here is Playwright. Everything below is the Playwright
contract; the skill keeps its name so those two citations resolve.

## The one rule that is CRITICAL

`CLAUDE.md`: every Playwright test imports `test` from `./coverage`, never from
`@playwright/test` directly. The base fixture in `provisa-ui/e2e/coverage.ts` catches
uncaught browser exceptions automatically, and it wires the per-worker backend port and the
axe accessibility builder. Importing around it silently loses all three — a spec that passes
while the page throws in the console is the failure this prevents.

```ts
import { test, expect } from "./coverage";
```

## The harness is collision-proof on purpose, so do not hardcode

`provisa-ui/e2e/coverage.ts` carries the reasons in full, and they are worth reading before
touching the harness:

- Each worker gets **its own backend process** on its own port. They cannot share one:
  `state.schema_version` is a process-global counter, and `src/apolloClient.ts` resets the
  whole Apollo store when the `X-Schema-Version` header changes — one worker registering a
  table blanked the lists every other worker was asserting on.
- Ports come from the published list indexed by **`TEST_PARALLEL_INDEX`, not
  `TEST_WORKER_INDEX`**: a retry spawns a replacement worker with a fresh `workerIndex` and
  the same `parallelIndex`, so indexing by `workerIndex` runs off the end on the first retry.

Reference the exported URL constant. Never a literal port, never the dev backend.

## Three configs, three targets

| Config | Target |
| --- | --- |
| `playwright.config.ts` | the self-provisioned local harness (one backend per worker) |
| `playwright.cloud.config.ts` | a deployment (REQ-1472 — the same specs, two targets) |
| `playwright.deployed.config.ts` | a deployed instance |

The lane split is expressed as Playwright projects, so `--project=core` and
`--project=trino` select it.

## Screenshots

```bash
make screenshots    # cd provisa-ui && npm run screenshots -> npx tsx scripts/capture-screenshots.ts
```

Use that script rather than a hand-rolled snippet. A one-off snippet is how screenshots end
up in a directory named by an unset variable.

## The browser has to be installed somewhere durable

`browserType.launch: Executable doesn't exist` means Chromium is absent, or
`PLAYWRIGHT_BROWSERS_PATH` points inside a run-scoped temporary directory that is deleted
when the run ends — in which case the download is discarded and repeated every time. Install
once to a path that outlives the run, and point the variable at that path. On a host without
the system libraries Chromium needs, the browser can be run against a staged sysroot rather
than by installing packages.

## Debugging a UI failure

1. **Read the console.** The `./coverage` fixture surfaces uncaught exceptions; that message
   is usually the whole answer.
2. **`--headed --debug`** for one spec. Not the whole suite.
3. **Trace.** A Playwright trace carries the DOM, network and console at every step and
   survives CI; it beats a screenshot of the failure.
4. **Separate the layers.** If the request never left the browser it is a hook or cache
   problem (`skills/react-graphql/SKILL.md`); if it left and came back wrong it is a server
   problem, and `tests/driver_sql_tap.py` continues the trail.
5. **Type-check before concluding.** `cd provisa-ui && npx tsc -b 2>&1 | head -50`, zero
   errors required. `agents/code-reviewer.md` says to run it immediately rather than infer
   type correctness.

## The marketing site

`site/` is checked by its own `check-*` and `verify-*` scripts, which run Playwright
directly against rendered pages at every verified width in both themes, gated by
`.github/workflows/site-review.yml` and `site-review-browser.yml`. Those checkers and
those workflows live on the rebrand branch, not on `main`. When working in `site/`, run the
checkers rather than eyeballing a page — and add a step for a new checker, because a checker
nothing runs is the same as no checker.
