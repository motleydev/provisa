---
name: test-first
description: The repo's TDD contract — no fix without a test, no test without reproduction, and what the RED step has to prove before any production code is touched.
---

# test-first

From `agents/bug-fixer.md`, stated as the core philosophy:

> **No fix without a test. No test without reproduction.**

Every bug fix starts with a failing test that proves the bug exists. The fix is complete when
that test passes. If you cannot reproduce it, you cannot fix it.

## The loop

1. **RED.** Write the test before touching production code. It must fail against the current
   code, and it must fail *for the reason you claim* — read the failure message, not just the
   exit status. A test that passes on the broken code is testing something else.
2. **Minimal.** Isolate the exact broken behaviour. One behaviour per test. Cheapest tier
   that can observe it (`skills/test-tiers/SKILL.md`).
3. **GREEN.** The minimum change that makes it pass. No surrounding refactor, no fallback
   value, no silent error path.
4. **Confirm nothing else broke.** `pytest tests/ -x -q`, and `npx tsc -b` when `.ts`/`.tsx`
   is in scope. Paste the raw output — `agents/bug-fixer.md` is explicit that "tests pass" is
   unverifiable and a summary is not acceptable.

## For a new feature

The same order, with the scenario as the starting point. A requirement in
`docs/arch/requirements.yaml` with status `accepted`, `in-progress` or `complete` is required
by the schema to carry a `scenario` in Given/When/Then form. That scenario is the test to
write first; `tests/features/` plus `tests/steps/` is where it goes when it is a bdd
scenario.

`uv run python scripts/validate_requirements.py --coverage-check` fails when a MUST or
SHOULD requirement marked `complete` has no tests. Writing the test first is the cheapest
way to never meet that check in anger.

## Testing gaps come with the fix

`agents/bug-fixer.md` makes gap detection a step, not a courtesy. While you are in there:

- Grep `tests/` for the function and class names from the failing code.
- Compare the tested functions against the module's public API.
- Look at the error paths and the boundaries, which is where the untested cases are.

Write those tests alongside the fix. A bug usually means a class of inputs was never
considered, and the single regression test only covers the one instance that was reported.

## What test-first does not license

Deleting or weakening an existing test to make a new one pass. `CLAUDE.md` is `CRITICAL`:
test errors are resolved whether preexisting or not, and never skipped or ignored. If an
existing test now contradicts the behaviour you are building, that is a requirement change —
say so and take it to the requirement, not to the assertion.
