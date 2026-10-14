---
name: next-phase
description: How work is chosen in this repo — the C/V/I scoring in next.md, integration posture as the gate, and what to do when you finish something.
---

# next-phase

## Where the build order lives

`next.md` at the repo root: *Next: Requirements Gap — Prioritized Build List*. Open
requirements ranked by three scores, 1–5, 1 being low or cheap:

- **C — build complexity.**
- **V — value.**
- **I — integration burden:** what must be running to build and test the change.

The list is grouped by integration posture rather than by score, because I gates *when* work
can happen, not only how hard it is. Tier 1 is leaf builds that need no live stack —
unit-testable with mocks or fixtures. Those come first regardless of a tempting V elsewhere.

Each verdict in the scores table is a one-word disposition: `leaf follow-on`,
`high-value leaf, MUST`, `substrate linchpin`, `cloud-gated, defer`, `filler`. A cluster
scored I=5 is not refused, it is sequenced behind the substrate it needs.

## Picking the next thing

1. Read `next.md`. If the work you are about to start is not on it, check whether something
   in Tier 1 should go first.
2. Check the requirement's status in `docs/arch/requirements.yaml`. `proposed` means the
   decision has not been taken; do not implement a `proposed` MUST without raising it.
3. Prefer the lowest I that still delivers value. A change that needs only
   `tests/local_platform.py` is worth more this week than one that needs a live warehouse.
4. Under swarm mode, the rule is the lowest-ID task that is unblocked and unowned, claimed
   by marking yourself owner — `refs/swarm-mode.md`.

## Closing a phase

`next.md` carries a **Shipped this cycle** section at the top. When a cluster completes:

- Set each requirement's `status: complete` in `docs/arch/requirements.yaml` and give it a
  `since` of the month.
- Move the cluster into *Shipped this cycle* with its REQ range and a one-line statement of
  what now holds.
- Run `make sync-reqs` and commit the regenerated docs separately.
- Run `uv run python scripts/validate_requirements.py --coverage-check`. A `complete`
  MUST with no tests fails CI, and completing a requirement is exactly when that gap
  appears.

Verdicts are revised, not preserved. A cluster that turned out to be a linchpin gets its I
score corrected in place so the next reader is not misled by a stale 2.
