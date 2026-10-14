---
name: pytest-patterns
description: How tests are written in this repo — async mode, fixtures, markers, naming, and the helpers in tests/ you should reuse instead of rebuilding.
---

# pytest-patterns

## What pytest is already configured to do

From `[tool.pytest.ini_options]`:

- **`asyncio_mode = "auto"`.** An `async def test_*` needs no `@pytest.mark.asyncio`. Do not
  add one.
- **Session-scoped loops.** `asyncio_default_fixture_loop_scope` and
  `asyncio_default_test_loop_scope` are both `"session"`, so a fixture and the test that uses
  it share one event loop. A fixture that creates its own loop breaks this.
- **`python_files = ["test_*.py", "*_test.py", "steps_*.py"]`.** A bdd step module is
  `steps_*.py` and lives in `tests/steps/`.
- **`log_level = "DEBUG"`, `log_cli = false`.** Logs are captured, not streamed. Use
  `caplog` to assert on them; `-o log_cli=true` when you need them live.

## Reuse the helpers in `tests/`

`tests/` has a flat layer of shared machinery next to the tier directories. Grep it before
writing infrastructure:

- `conftest.py`, `helpers.py`, `fixtures/` — the shared fixtures.
- `embedded_pg.py`, `embedded_redis.py`, `local_platform.py` — the no-Docker platform
  (embedded Postgres + fakeredis).
- `port_lease.py` — ports for a self-provisioned stack. Never hardcode a port; the test
  instance runs on unique unexposed ports by design (`CLAUDE.md`, Three Instances).
- `itest_stack.py`, `platform_plane.py` — stack lifecycle.
- `driver_sql_tap.py`, `grpc_proto_client.py`, `otlp_receiver.py`, `webhook_call.py` —
  observation points.
- `deadline_clock.py` — time control. Do not `sleep` to wait for a deadline.
- `env_creds.py` — credentials for the live-account lanes.
- `skip_is_failure.py` — why a `requires_warehouse` skip is a failure.

## Writing a test

1. **Cheapest tier that can observe the behaviour.** See `skills/test-tiers/SKILL.md`.
2. **One behaviour per test**, named for the behaviour. The repo's own commit subjects are
   the register to copy: `the cache TTL a new source is given after create is set on its edit
   form's Load tab`, not `test_cache_ttl_2`.
3. **Mark it** for anything external it reaches, using an existing `requires_*` marker.
4. **Reference the requirement.** `scripts/coverage_reqs.py` reports which `REQ-NNN` ids have
   no test naming them, and it searches `tests/unit`, `tests/integration` and `tests/e2e` for
   the literal id. A test that proves a requirement should contain its id.
5. **Assert on the failure, not just the happy path.** `hypothesis` is available for property
   tests.

## Playwright, not pytest, for the UI

`CLAUDE.md` is `CRITICAL` on this: every Playwright test imports `test` from `./coverage`,
never from `@playwright/test` directly. The base fixture in `provisa-ui/e2e/coverage.ts`
catches uncaught browser exceptions automatically; importing around it loses that.

## Verbatim output

`agents/bug-fixer.md`: never summarize test results. "Tests pass" is unverifiable; paste the
pytest output. A truncated tail that still shows the counts line is fine.
