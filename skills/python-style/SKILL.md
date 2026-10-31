---
name: python-style
description: The Python style this repo enforces mechanically — ruff, pyright, and the import rules that run in pre-commit and CI. Read before writing or reviewing Python.
---

# python-style

Every rule here is enforced by a tool. If you are guessing at style, run the tool
instead of guessing — `make lint` and `make typecheck` are the answer.

## The configured rules

From `pyproject.toml`:

- **Target 3.12.** `[tool.ruff] target-version = "py312"`, `[tool.pyright] pythonVersion = "3.12"`,
  and `requires-python = ">=3.12,<3.13"`. The upper cap is deliberate: `pgserver` ships no
  3.13 wheel, so a 3.13 interpreter must be refused by the resolver rather than crash at
  first `provisa run`.
- **Line length 100.** Not 79, not 88.
- **ruff lint set:** the defaults (E, F, W) plus `B006`, mutable default arguments. `B006`
  was added at zero existing violations, so any hit is new.
- **pyright `typeCheckingMode = "standard"`**, `include = ["provisa"]`. Tests are excluded
  from analysis, because pytest injects fixture and step-def symbols by name and static
  unused-symbol analysis there produces only false positives. Do not add pragmas to test
  files to quiet a checker that is not reading them.
- `reportUnusedVariable` and `reportUnusedFunction` are off repo-wide — the same
  inject-by-name shape appears in strawberry resolvers.
- `reportMissingImports = "warning"`: optional runtime dependencies (keyring, the mcp extra)
  are absent by design and their import sites handle `ImportError` already.

## `from __future__ import annotations`

Present at the top of essentially every module in `provisa/` and `scripts/`. Add it to new
modules; it keeps annotations as strings and makes forward references work without quoting.

## Run the checker the project pins, not the one on PATH

`.pre-commit-config.yaml` runs pyright as `.venv/bin/python -m pyright`, with this comment:

> The project venv, not whatever pyright is first on PATH: the checker resolves imports
> against the interpreter it runs under, so a system pyright types the code against a
> different site-packages than CI's `uv run pyright` and the two disagree.

The same applies to `lint-imports` (`.venv/bin/lint-imports`) and to pytest. See
`skills/venv-setup/SKILL.md`.

## Commands

```bash
make lint          # ruff check provisa tests
make lint-fix      # ruff check --fix provisa tests
make typecheck     # pyright
make lint-imports  # .venv/bin/lint-imports — the layering contracts
```

`ruff-format` runs in pre-commit. Do not hand-format against it.

## What style does not cover

Fallback values, silent `except`, and files past 1000 lines are not style questions in this
repo — they are refusals. See `skills/anti-patterns/SKILL.md`.
