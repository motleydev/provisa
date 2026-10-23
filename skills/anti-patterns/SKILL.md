---
name: anti-patterns
description: The patterns this repo refuses, and what to do instead. Cited by bug-fixer, code-reviewer, refactorer and test-strategist. Flag violations as CRITICAL.
---

# anti-patterns

Four of these are `CRITICAL` lines in `CLAUDE.md`. They are refusals, not preferences: a
reviewer blocks on them rather than suggesting an improvement.

## No fallback values, no silent error handling

The first `CRITICAL` in `CLAUDE.md`, with its reason attached — it caused repeated production
issues. When a value might be missing, find the design guarantee that says it cannot be, or
fix the upstream source that failed to set it. Do not patch around it at the read site.

The one exception, also from `CLAUDE.md`: a fallback is acceptable when the design explicitly
requires it **and** an inline comment documents the justification, naming the REQ-ID that
mandates it. `pyproject.toml` is full of this shape — every unusual pin carries the REQ and
the measurement behind it.

Concretely:

- No bare `except:` and no `except Exception:` that swallows.
- Distinguish "not found" from "failed". A lookup that returns `None` for both is the bug.
- `or "default"`, `.get(key, fallback)` and `try: ... except: pass` on a value the design
  guarantees are all the same defect wearing three faces.

## No migrations

`CLAUDE.md`: V1 development. Never add migrations. Change the schema in place —
`provisa/core/schema.sql` and the control-plane bootstrap — rather than stacking a migration
on top of it. `[tool.coverage.run]` omitting `provisa/migrations/*` is not permission to add
one.

## Never skip or ignore a failing test

`CLAUDE.md`: test errors must be resolved whether preexisting or not. "It was already red"
is not a disposition. Deleting a test, marking it `xfail`, or narrowing its assertion to make
it pass are all the same move.

A skip that hides a missing credential is treated as a failure mechanically —
`tests/skip_is_failure.py` turns every skipped `requires_warehouse` test into a failure
carrying the skip's own reason, because "a lane that reports it as skipped reports a pass it
did not earn." The deselected lanes in `addopts` are documented process-isolation lanes, not
silent skips. See `skills/test-tiers/SKILL.md`.

## Files past 1000 lines

`agents/code-reviewer.md:96` flags a file over 1000 lines for splitting. On the UI side the
limit is mechanical: `provisa-ui/eslint.config.js` sets
`'max-lines': ['error', { max: 1000, skipBlankLines: true, skipComments: true }]`, with a
grandfather list of six files that predate the rule. Each entry in that list is a debt
marker — subdivide the file, then delete its line. Do not add a line to it.

## Fixing the symptom

From `agents/bug-fixer.md`: find the root cause, not the surface error, and do not refactor
the surrounding code while you are in there. A broad fix hides which change was the one that
mattered.

## Claiming without reading

`CLAUDE.md`: before answering any question about what existing code does, run a Grep or Read
first. No exceptions, no answering from memory. A claim with no tool call behind it in the
same response is inadmissible — `agents/debugger.md`, `agents/bug-fixer.md` and
`refs/prose-quality.md` all say this in their own words.
