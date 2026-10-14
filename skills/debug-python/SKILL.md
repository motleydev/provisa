---
name: debug-python
description: Debugging Python in this codebase — the five-step process, where the logs and observation points already are, and the async and federation traps.
---

# debug-python

`agents/debugger.md` holds the method. The five steps are REPRODUCE, ISOLATE, OBSERVE,
HYPOTHESIZE, VERIFY, and the one that gets skipped is OBSERVE: gather evidence *without
interpreting it*.

Rank hypotheses the way that file says: recent changes (high) > configuration >
data-dependent > environment > library bug (very low). A library bug is almost never the
answer, and `git log -p <file>` is almost always faster than reading the library.

## Observation points that already exist

Do not build a harness that is already in `tests/`:

- `tests/driver_sql_tap.py` — the SQL a driver actually issued.
- `tests/otlp_receiver.py` — the OTel spans the app actually emitted.
- `tests/grpc_proto_client.py`, `tests/webhook_call.py` — what crossed the protocol boundary.
- `tests/deadline_clock.py` — control time instead of sleeping, so an intermittent timing
  bug becomes deterministic.
- `tests/thread_trace.py` — what the threads were doing.
- `tests/embedded_pg.py`, `tests/embedded_redis.py`, `tests/local_platform.py` — a real
  Postgres and a real cache with no Docker, which is usually the fastest reproduction.

## Logs

`[tool.pytest.ini_options]` sets `log_level = "DEBUG"` and `log_cli = false`: logs are
captured, not printed. Assert on them with `caplog`; stream them with `-o log_cli=true` when
you need to watch. `print()` in product code is a review finding — use `logging`.

The app is OpenTelemetry-instrumented (FastAPI, httpx, psycopg, redis, pymongo,
elasticsearch, grpc). For a failure that crosses a boundary, the trace answers "where did
this stop" faster than a stack trace does.

## Read a stack trace from the bottom

`agents/debugger.md`: bottom-to-top, and find the boundary between our code and library
code. That boundary line is the hypothesis.

## Async traps

The event loop is where the intermittent bugs live. Three shapes recur:

- **A blocking call on the loop.** Everything stalls, nothing errors, and the symptom
  appears in an unrelated endpoint. Look for a sync driver call that was never wrapped in
  `asyncio.to_thread` — see `skills/async-patterns/SKILL.md`.
- **A swallowed `CancelledError`.** A cancelled request becomes a hung one. Grep the
  traceback's frames for a bare `except`.
- **A fire-and-forget task.** `asyncio.create_task` with nobody holding the reference: the
  exception surfaces nowhere and the work may be collected mid-flight.

Test loops are session-scoped (`asyncio_default_test_loop_scope = "session"`), so state
leaking between async tests is a real explanation for "passes alone, fails in the suite" —
`pytest <file>::<test>` to confirm.

## Federation traps

A wrong result in a federated query has three plausible homes, and they are distinguishable:
the compiler's lowering, the routing decision, or the source driver. `tests/driver_sql_tap.py`
tells you what the driver was asked for, which separates the first two from the third in one
step. The layering is enforced one-way (`skills/dependency-rules/SKILL.md`), so a compiler
bug cannot be caused by the executor.

## The instance you are debugging

`CLAUDE.md`, Three Instances, is `CRITICAL`. Before any command that starts a server,
touches a database, edits config or runs docker compose, name which instance it lands on.
Never attach a debugger to `local-dev` and never reuse one instance's connection details to
reach another.

## Report

State only what you can prove, cite evidence for every hypothesis, and tag each assertion
`[tool-verified]` or `[inferred]`. If the symptoms do not fully fit your theory, say so —
`agents/debugger.md` prefers "the evidence suggests X but does not rule out Y" to a premature
conclusion.
