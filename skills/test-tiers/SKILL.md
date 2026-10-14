---
name: test-tiers
description: Which tier a test belongs in, which lane runs it, and why a tier is deselected by default. The full contract agents/test-strategist.md summarizes.
---

# test-tiers

A tier here is a **process lane**, not a speed label. Lanes exist because co-running them in
one pytest process breaks them, and `pyproject.toml` says exactly how.

## The default lane

```toml
testpaths = ["tests", "tests/steps"]
addopts = "-m 'not packaging and not cluster and not isolated' --ignore=tests/e2e"
```

Default = integration + unit + bdd against the shared dev stack. Four things are out, each
for a stated reason:

- **`--ignore=tests/e2e`** — the e2e tier provisions its own isolated Docker stack on
  ephemeral ports and, being in-process, overwrites `PG_PORT`/`TRINO_PORT` in `os.environ`.
  Co-run, it redirects the dev-stack integration tests at the wrong stack.
- **`packaging`** — installer flow, validated manually plus by unit tests.
- **`cluster`** — helm/minikube against a live minikube.
- **`isolated`** — needs its own pytest process: shared module-singleton state, or a
  non-restartable JVM.

`scripts/test-all` runs every lane and `coverage combine`s them. These are documented
process-isolation lanes. They are not skips — see `skills/anti-patterns/SKILL.md`.

## Placement

| Marker | Needs | Put it in |
| --- | --- | --- |
| `unit` | nothing external | `tests/unit/` |
| `local_platform` | embedded Postgres + fakeredis (`tests/local_platform.py`) | `tests/unit/` or `tests/integration/` |
| `integration` | the Docker Compose stack (PG + Trino) | `tests/integration/` |
| `bdd` | a scenario in `tests/features/` | `tests/steps/` |
| `e2e` | the full HTTP pipeline against a running app | `tests/e2e/` |

Choose the cheapest tier that can actually observe the behaviour. `tests/unit/` alone
collects ~12K tests and is parallelized with `-n auto`; a unit test is the one that gets run
on every push.

## Service markers

Anything a test needs that is not PG + Trino gets its own `requires_*` marker, and the
marker's own help text names the compose service that provides it — `requires_neo4j`,
`requires_kafka`, `requires_ldap`, and so on through `requires_druid`. Read the `markers`
list in `pyproject.toml` before inventing one; there are over forty.

Three classes of marker carry a rule with them:

- **`requires_warehouse`** — live cloud warehouse creds. A skip here is reported as a
  failure (`tests/skip_is_failure.py`), so the marker is only correct when the lane that runs
  it loads credentials.
- **Live-account markers** (`requires_redshift`, `requires_athena`, `requires_salesforce`,
  `requires_servicenow`, `requires_sharepoint`, `requires_microsoft_365`,
  `requires_google_workspace`, `requires_cloudops`) — no self-provision; they run only in
  their own lane.
- **`linux_mem`** — only discriminates on Linux; the container lane runs it so a macOS host
  never reports a phantom skip.

## The integration split

`tests/integration/` is divided into six groups — `group_sources`, `group_engines`,
`group_protocols`, `group_auth_org`, `group_governance`, `group_pipeline` — assigned
automatically by `tests/integration/conftest.py`. Do not hand-mark a group.

## The three instances

`CLAUDE.md` is explicit: `test`, `local-dev` and `cloud-dev` are separate instances, and a
change in one must never reach another. Test suites self-provision isolated per-worktree
Docker Compose projects on unexposed ports. Never point a test at the maintainer's
`local-dev` plane or at `cloud.provisa.dev`.

## Commands

```bash
make test        # pytest, default lane
make test-unit   # pytest tests/unit -p no:cov
pytest -m e2e    # the separate e2e process lane
uv run python scripts/ci/run_lane.py <lane>   # what CI runs, per lane
```

`pytest-timeout` is a dependency so that `scripts/ci/run_lane.py` bounds every test and a
hang fails by name instead of consuming the job.
