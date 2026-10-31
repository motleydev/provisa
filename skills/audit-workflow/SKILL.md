---
name: audit-workflow
description: How to audit requirement-to-code-to-test traceability, and the one rule that matters most — requirements.yaml is the source, requirements.md is generated output.
---

# audit-workflow

## The source of truth is the YAML

`docs/arch/requirements.md` opens with:

> Generated from `docs/arch/requirements.yaml`. Do not hand-edit.

Append a requirement to the `.md` and it is gone at the next `make sync-reqs`, because
`scripts/gen_requirements_md.py` rewrites the whole file from the YAML. The `.md` is for
reading and for deep-linking (`#REQ-NNN` anchors); the YAML is the record.

**Allocate a new id above the highest id in `docs/arch/requirements.yaml`, not above the
tail of the `.md` and not above the tail of your own branch.** Two agents on two branches
numbering from their own working copy mint the same id, and because they append in different
places it surfaces at merge as duplicate anchors rather than as a conflict. Check across
refs when you are not on the integration branch:

```bash
git log --all -p -- docs/arch/requirements.yaml | grep -oE '^\+- id: REQ-[0-9]+' | sort -t- -k3 -n | tail -1
```

## A requirement entry

Schema: `provisa/tools/req_schema.py`. Required fields are `id`, `status`, `group`,
`category`, `priority`, `type`, `description`.

- `status` — `proposed`, `accepted`, `in-progress`, `complete`, `rejected`, `superseded`.
  `accepted`, `in-progress` and `complete` require a `scenario`.
- `group` — must match a `name` in `docs/arch/groups.yaml` exactly. That file is a closed
  enumeration; add a group there first if a requirement genuinely fits nowhere.
- `priority` — `MUST`, `SHOULD`, `MAY`. `type` — `behavioral`, `structural`, `constraint`,
  `ui`, `infrastructure`.
- `feature` — the paragraph id in `docs/arch/features.yaml` this requirement serves,
  checked against that file.
- `code` and `tests` — paths. `tests` is what the coverage and orphan checks read.
- `use_case`, `scenario` (Given/When/Then), `since`, `target`, `stakeholders`,
  `competitive_position`, and the per-tier judgement fields (`integration_test`, `e2e`,
  `bdd`, `unit_test`, each with a `_reason`).

## The audit commands

```bash
uv run python scripts/validate_requirements.py                  # schema + groups + features
uv run python scripts/validate_requirements.py --coverage-check # MUST/SHOULD complete behavioral REQs with no tests
uv run python scripts/validate_requirements.py --orphan-check   # test files no requirement references
python scripts/coverage_reqs.py                                 # REQ ids no test names (make coverage-reqs)
make sync-reqs                                                  # regenerate every derived doc
```

`requirements-ci.yml` runs the first two on every push, as the check named
**Validate requirements.yaml**. `make sync-reqs` regenerates `requirements.md`,
`features.md`, the feature matrix, the traceability matrix and the roadmap; commit that
output on its own, with the `docs: regenerate ...` subject.

The two directions are worth running together: `--coverage-check` finds requirements with
no test, `--orphan-check` finds tests no requirement claims. A test that proves a
requirement names its id, which is how `scripts/coverage_reqs.py` finds it.

## Auditing dependencies and code

Separate from requirements, and both mechanical:

```bash
make pip-audit                                      # known CVEs in the resolved tree
pre-commit run bandit --all-files                   # bandit -r provisa -ll -s B608
```

`B608` (SQL built by string construction) is suppressed repo-wide: this is a query compiler,
and composing SQL is the product. That suppression is not a licence to interpolate user
input — the compiler's parameter binding is where that is handled.

## Reporting an audit

Say what you ran, paste the counts, and name each gap with its id or path. An audit that
reports "mostly covered" has not been done. `agents/doc-writer.md`'s rule applies: tag every
claim `[tool-verified]` or `[inferred]`.
