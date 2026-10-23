---
name: venv-setup
description: How to get a working environment — uv, the .venv the tooling expects by path, and the git hooks that have to be delegated to run at all.
---

# venv-setup

## Create it

```bash
uv sync --extra dev
```

CI does the same thing with `--frozen` (`.github/workflows/nixos.yml`:
`uv sync --frozen --extra dev --extra embedded --extra docs`). Add extras for the tier you
are working on: `embedded` for the pip-installable tier, `docs` for MkDocs, `desktop` for the
native bundle.

Run project commands through `uv run` — `uv run pytest`, `uv run pyright`,
`uv run python scripts/ci/run_lane.py <lane>`. That is what every workflow does.

## `.venv` is referenced by path, not discovered

Several checkers name the interpreter explicitly, and the reason is in
`.pre-commit-config.yaml`:

> The project venv, not whatever pyright is first on PATH: the checker resolves imports
> against the interpreter it runs under, so a system pyright types the code against a
> different site-packages than CI's `uv run pyright` and the two disagree.

So:

- `.pre-commit-config.yaml` runs pyright as `.venv/bin/python -m pyright`.
- `make lint-imports` runs `.venv/bin/lint-imports`.
- The revert-message check runs `.venv/bin/python scripts/check_revert_message.py`.
- `[tool.pyright]` sets `venvPath = "."` and `venv = ".venv"`.

A venv at any other path leaves those hooks failing on a missing file. Keep it at `.venv`
in the repo root.

`[tool.pyright] extraPaths` is `["vendor/buenavista", ".", "provisa-client", ".claude/commercial"]` —
the vendored fork and the sibling client resolve from the tree, not from site-packages.

## The git hooks need the delegation, and `pre-commit` on PATH

`core.hooksPath` points at `.githooks/`, so git never reads `.git/hooks/` — where
`pre-commit install` writes its hook. The committed hooks in `.githooks/` delegate to
pre-commit by hand. `.githooks/pre-commit` carries why:

> Without this delegation the ruff/bandit/pyright hooks declared in `.pre-commit-config.yaml`
> run on nobody's machine, which is how the type-error count grew.

Both `.githooks/pre-commit` and `.githooks/commit-msg` exit with
`pre-commit not on PATH; install it with 'uv sync --extra dev'` if it is missing. A commit
that succeeds without pre-commit having run is the failure case, not a convenience.

Confirm the setup:

```bash
git config core.hooksPath          # -> .githooks
command -v pre-commit
.venv/bin/python -m pyright --version
```

## The UI

```bash
cd provisa-ui && npm ci
```

Playwright needs a browser, and where it installs matters: point
`PLAYWRIGHT_BROWSERS_PATH` at a durable path, not at a run-scoped temporary directory, or
the download is discarded and repeated every run. See
`skills/puppeteer-debugging/SKILL.md`.

## Never touch local-dev

`CLAUDE.md`'s Three Instances section is `CRITICAL`: `local-dev` is the maintainer's
machine, started by the maintainer with `./start-ui-install.sh --demo`. Do not start, stop,
restart or reset it — not to run a test, not to verify a change, not to demo a feature. Your
environment is the `test` instance: isolated, self-provisioned, on unexposed ports.
