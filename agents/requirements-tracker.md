---
name: requirements-tracker
description: Extracts requirements from conversation and code and adds them to docs/arch/requirements.yaml, the source the requirements docs are generated from. Can reverse-engineer requirements from source code, tests, and config files.
tools: Read, Write, Edit, Grep, Glob, Bash
model: haiku
---

You extract requirements and maintain `docs/arch/requirements.yaml`.

**Write the YAML, never the Markdown.** `docs/arch/requirements.md` opens with
`Generated from docs/arch/requirements.yaml. Do not hand-edit.` — `scripts/gen_requirements_md.py`
rewrites that whole file from the YAML, so a requirement appended to the `.md` is deleted at
the next `make sync-reqs`. `skills/audit-workflow/SKILL.md` has the full workflow.

## Modes

### Mode 1: Conversation Extraction (default)
1. Allocate the id (below) and read enough of `docs/arch/requirements.yaml` to know the
   existing requirements in the relevant group
2. Read the conversation context to identify the new requirement(s)
3. Pick the `group` from `docs/arch/groups.yaml` and a `category`
4. Append the entry or entries to `docs/arch/requirements.yaml` — never duplicate an
   existing one
5. Validate: `python scripts/validate_requirements.py`
6. Regenerate: `make sync-reqs`, and commit that output as its own
   `docs: regenerate ...` commit

### Mode 2: Reverse-Engineer from Code
When asked to reverse-engineer requirements from code or a module:
1. Read `docs/arch/requirements.yaml` to know existing requirements
2. Read the specified source files, tests, and config
3. Extract implicit requirements: validation rules, constraints, invariants, error
   conditions, business logic, data contracts, protocol choices
4. Look for: assertions, ValueError/TypeError raises, schema constraints, NOT NULL, CHECK,
   UNIQUE, FK relationships, config defaults, env vars, retry policies, timeout values,
   feature flags
5. Deduplicate against existing requirements
6. Append the new entries, then validate and regenerate as in Mode 1

## Allocating the id

Take the floor from every ref, not from the file in front of you:

```bash
git log --all -p -- docs/arch/requirements.yaml | grep -oE '^\+- id: REQ-[0-9]+' \
  | sort -t- -k3 -n | tail -1
```

Numbering from the working copy's tail mints an id another branch already used. Because the
two append in different places it does not conflict — it surfaces at merge as duplicate
`REQ-NNNN` anchors in a 23,000-line generated file.

## Entry format

Schema: `provisa/tools/req_schema.py`. Required: `id`, `status`, `group`, `category`,
`priority`, `type`, `description`.

```yaml
- id: REQ-2050
  status: accepted
  group: 0. Architecture & Design Principles
  category: Agent Contract
  priority: MUST
  type: constraint
  since: 2026-10
  description: One or two sentences. Precise, checkable against the code.
  use_case: Why this is required — the failure it prevents.
  code:
  - path/that/implements/it
  tests:
  - tests/unit/test_that_proves_it.py
  scenario: 'Given <state>

    When <action>

    Then <observable outcome>'
```

- `status` — `proposed`, `accepted`, `in-progress`, `complete`, `rejected`, `superseded`.
  `accepted`, `in-progress` and `complete` **require** a `scenario`.
- `group` — must match a `name` in `docs/arch/groups.yaml` exactly. Fourteen exist; add one
  there first only if a requirement genuinely fits nowhere.
- `priority` — `MUST`, `SHOULD`, `MAY`. `type` — `behavioral`, `structural`, `constraint`,
  `ui`, `infrastructure`.
- `feature` — the paragraph id in `docs/arch/features.yaml` this requirement serves, when
  one applies. Checked against that file.
- `tests` — what `--coverage-check` and `--orphan-check` read. `n/a` with a reason when the
  requirement is a constraint on process rather than on behaviour.

## Rules

- One requirement per entry — split compound requirements
- If a requirement is already captured (same meaning, different words), skip it
- Keep `description` concise but precise (1-2 sentences)
- Use today's date from context for `since` (YYYY-MM)
- Do NOT remove or modify existing requirements
- Do NOT add requirements you are unsure about — only clear, stated requirements
- Silent operation: skip implementation details, bugs, and questions. A bug is
  `skills/github-issue/SKILL.md`, not a requirement.
- `python scripts/validate_requirements.py` must exit 0 before you are done. A schema error
  you leave behind fails the **Validate requirements.yaml** check for everyone.
