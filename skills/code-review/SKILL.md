---
name: code-review
description: How a review is conducted and reported here — the gates that must be green, the severity ladder, the output format, and the evidence rule every finding has to meet.
---

# code-review

`agents/code-reviewer.md` is the full checklist. This is the process around it: what a review
is accountable for, and what a finding has to look like to count.

## Evidence, or it is not a finding

Three rules from `agents/code-reviewer.md`, and they are the ones reviews fail on:

- **Only flag what you can point at.** No speculating about a bug you have not traced. If
  you are unsure, "potential issue", not "bug". Never claim a security vulnerability without
  showing the attack path.
- **Cite file and line from a visible Read or Grep in the same response.** No tool call
  means the flag is inadmissible. `CLAUDE.md` says the same thing as a `CRITICAL`: never
  answer from memory about what existing code does.
- **Tag every finding** `[tool-verified]` or `[inferred]`. An inferred finding never gets
  presented as a confirmed one.

## Run the gates before reading the diff

A review that reports a style nit while a check is red has spent its attention in the wrong
place.

```bash
make lint && make typecheck && make lint-imports
make test-unit
cd provisa-ui && npx tsc -b 2>&1 | head -50   # zero errors required when .ts/.tsx is in scope
```

`agents/code-reviewer.md` is emphatic on the TypeScript one: run it immediately when any
`.ts`/`.tsx` file is in scope, and do not infer type correctness.

`CLAUDE.md` is `CRITICAL` that a failing test is resolved whether it is preexisting or not,
so a red check that the diff did not cause is still the review's business — name it, say it
is preexisting, and say who owns it. Do not pass a diff on the grounds that it was already
broken.

## Check against the requirement, from the source file

Changed code gets checked against the requirement it serves. `agents/code-reviewer.md`
names `docs/arch/requirements.md` for this; read `docs/arch/requirements.yaml` instead — the
`.md` is generated from it and says so at the top. The YAML carries the `scenario`, the
`code` paths and the `tests` paths, which is what you are checking the diff against.

## Severity

| Level | Means |
| --- | --- |
| CRITICAL | must fix. Security, a `CLAUDE.md` `CRITICAL` violation, a fallback or silent error path, a missing governance enforcement. |
| HIGH | should fix. DRY violation, missing type hints on a public function, a file past 1000 lines. |
| MEDIUM | consider. Practice, naming, a long function. |

Error handling is CRITICAL by instruction, not by judgement — `agents/code-reviewer.md:56`
says flag `anti-patterns` violations as CRITICAL. See `skills/anti-patterns/SKILL.md`.

## Output

```
=== CODE REVIEW: [filename] ===

CRITICAL (must fix):
- [SECURITY] line X: SQL injection risk

HIGH (should fix):
- [DRY] lines A-B duplicated at C-D

MEDIUM (consider):
- [PRACTICE] line Z: Bare except clause

=== SUMMARY ===
Files: N | Critical: X | High: Y | Medium: Z
Assessment: PASS / NEEDS ATTENTION / BLOCKING ISSUES
```

## Reviewing a site change

`site/` carries its own `check-*` and `verify-*` checkers and two pull-request gates —
`.github/workflows/site-review.yml` for the browserless ones and `site-review-browser.yml`
for the Playwright pass at every verified width in both themes. Those checkers and workflows
live on the rebrand branch, not on `main`. Both gates must be green, and a claim about the
product made in site copy is checked against the claim set, not against your reading of the
product.

## Reviewing a prompt or a role file

`agents/code-reviewer.md` has a section for this, and its headline is the part people get
backwards: the goal is information density, not brevity. Do not flag concise-but-precise as
too long. Flag restatement of foundational knowledge, filler, and critical instructions
buried in the middle rather than placed at the start or the end.
