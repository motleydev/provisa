---
name: async-patterns
description: The async conventions in a codebase that is async end to end — wrapping sync drivers, not blocking the loop, and what the installed runtime already does for you.
---

# async-patterns

`provisa` is async from the HTTP edge down to the drivers. FastAPI and uvicorn at the top,
`asyncpg`, `motor`, `aiokafka`, `httpx` and `redis.asyncio` underneath. The rule that
follows from that: **nothing blocking runs on the event loop.**

## The runtime is already tuned, in `pyproject.toml`

- `uvloop; sys_platform != 'win32'` — libuv via Cython replaces asyncio's default loop for
  the whole app, not one endpoint. uvicorn selects it when it is importable; no code wires
  it.
- `httptools` — uvicorn's HTTP parser. Without it uvicorn falls back to `h11`, pure Python,
  running on the accepting loop for every request, measured at ~10% of a cached GraphQL
  hit's CPU.
- `orjson` — `provisa/api/app.py:3362` wires `OrjsonResponse` as the default for every route
  that does not return its own `Response` (REQ-1867).

Do not re-tune these per-endpoint. If one of them is missing from an environment the whole
app is slower, which is a packaging bug, not something to work around in a handler.

## A sync driver gets wrapped, not awaited in place

Many sources ship only a synchronous client — `pymysql`, `impyla`, `pyexasol`, `pyodbc`,
the Microsoft Graph client, `snowflake-connector-python`. The convention is
`asyncio.to_thread`, used at roughly 240 call sites across `provisa/`:

```python
# provisa/microsoft365/calendar_write.py:100
return await asyncio.to_thread(self.graph.get, path, params, prefer=cal.PREFER)
```

Wrap at the lowest boundary — the single blocking call — not a whole method that also does
async work. The wrapped callable is a plain function; build it with a closure or
`functools.partial` rather than making the driver call `async` on the way in.

File I/O, `subprocess.run`, a JVM call through `jpype1`, and CPU-bound parsing are the same
case.

## Structured concurrency

`asyncio.create_task` appears about eight times in the whole package, and that ratio is
deliberate: a bare task is fire-and-forget, so its exception surfaces nowhere and its
lifetime outlives the request that made it. Use `asyncio.gather` for fan-out you await.
`asyncio.TaskGroup` is available (3.12 is the floor) and currently used nowhere; it is the
better choice than a bare task when you need cancellation to propagate, but it is not yet an
established pattern here. If you do create a long-lived task, hold a reference to it and
cancel it in the owning component's shutdown — a task nobody holds is collected mid-flight.

## Cancellation and timeouts

`CancelledError` is control flow, not an error. Never swallow it in a bare `except` — that
is the `anti-patterns` rule arriving from a different direction, and it turns a cancelled
request into a hung one. Use `asyncio.timeout` or `asyncio.wait_for` for a deadline — there
are fourteen such sites already. Do not implement your own with `sleep` and a flag.

## Tests

`asyncio_mode = "auto"`, and both loop scopes are `session`, so an async fixture and the
test using it share one loop. Write `async def test_*` with no marker, and do not create a
loop inside a fixture. `tests/deadline_clock.py` controls time rather than sleeping. See
`skills/pytest-patterns/SKILL.md`.
