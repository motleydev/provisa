# Claim verdicts — Home, Platform, Governance, Interfaces (PRO-6)

Verdicts on all 128 numbered claims in the §6 tables of `brief-home`, `brief-platform`,
`brief-governance` and `brief-interfaces`. Produced 2026-10-13 against `main` at `15bd4bf1b`.

Every verdict below was produced by reading the file cited or running the command shown. Where a
verdict departs from the brief's own evidence trace, the correction names the file and line.

Verdicts: **OK** · **OK, reworded** (replacement wording supplied) · **Cut**.

This supersedes `docs/claim-audit.md` where the two disagree. Three of that document's statements
were wrong and are corrected in §4 below.

---

## 0. The gate I applied

`docs/features.md`'s **Available / In development** markers cannot be used as the publishing gate,
and the four briefs all lean on them. The generator marks a whole feature group **In development**
when *any one* of its requirements is open:

```python
# provisa/tools/feature_schema.py:110-114
def feature_status(paragraph_ids: set[str], requirements: list) -> str:
    open_ = any(r.feature in paragraph_ids and r.status.value in _OPEN for r in requirements)
    return "In development" if open_ else "Available"
```

Groups span up to 146 requirements. "Row-level security, column visibility and masking" is marked
In development on 3 open rows out of 41. "Connector catalog" on 14 out of 146. Taken literally the
markers say nothing a buyer can use, and published on a page they say something false.

The gate used here is **per-paragraph**: a claim is cleared when the requirements attached to the
`docs/arch/features.yaml` paragraph the claim rests on are all `complete`, and carries a qualifier
when they are not. That roll-up is reproducible:

```bash
python3 - <<'EOF'
import re
from collections import defaultdict
y = open('docs/arch/requirements.yaml').read()
byfeat = defaultdict(list)
for e in re.split(r'\n- id: ', y):
    rid = re.match(r'(REQ-\d+)', e)
    f = re.search(r'\n  feature: ([^\n]+)', e)
    s = re.search(r'\n  status: ([^\n]+)', e)
    if rid and f:
        byfeat[f.group(1).strip()].append((rid.group(1), s.group(1).strip()))
OPEN = {'proposed', 'accepted', 'in-progress'}
for p in sorted(byfeat):
    o = [r for r in byfeat[p] if r[1] in OPEN]
    print(('OPEN ' if o else 'CLEAR'), p, f"{len(byfeat[p]) - len(o)}/{len(byfeat[p])}",
          ("| " + ", ".join(f"{r[0]}({r[1]})" for r in o)) if o else "")
EOF
```

**One structural consequence.** `public-data-publishing` is the only feature group in the product
with **zero** complete requirements — 0 of 4. REQ-1058, REQ-1059 and REQ-1060 are `proposed`;
REQ-1959 is `in-progress`. Public-column publishing is designed and not built. That removes a
governance layer from two pages. See decision 3a.

---

## 1. The eleven decisions

### 1 — Home C-8 / Platform C-28: "no Docker, no JVM, no root"

**Verdict: OK, reworded. Keep all three words; add three qualifiers next to the command.**

All three are true and *no JVM* is in fact the load-bearing one, because it is the reason the wheel
is DuckDB-only:

- **No Docker** — `docs/features.md:1042`: the desktop installer "runs everything natively with no
  Docker". `config/capabilities.yaml` `native` preset: `external_services: []`.
- **No JVM** — `pyproject.toml:184-186` states the bundled Trino JVM is omitted because PyPI
  carries no JVM server. This is the reason, not an inference.
- **No root** — `pip install` into a user environment plus `pgserver`, which runs `initdb` into the
  user's own data directory. Nothing in the `embedded` extra
  (`duckdb`, `fakeredis`, `provisa-duckdb-ext>=0.1.1`, `pyproject.toml:191`) installs a system
  service or writes outside the data directory.

The three qualifiers must sit beside the command, not in a footnote, because a reader hits all
three inside the first minute:

1. **The wheel is DuckDB-only.** Omitting the JVM omits Trino. `pyproject.toml:185` points at
   `TRINO_HOST`/`TRINO_PORT` for multi-engine federation — i.e. not in the wheel.
   `site/index.html:718` currently calls this "the whole system". It is the whole control plane and
   UI on one engine. Reword that too.
2. **Python 3.12 exactly, and not Linux aarch64.** `requires_python <3.13,>=3.12`; `docs/cli.md:14-17`
   — "Linux aarch64 has no pgserver wheel and no source distribution, so the embedded tier does not
   run there."
3. **The published artifact is an alpha**, `0.1.0a479`. Procurement will look at PyPI. Nothing
   anywhere on the site may imply GA.

Copy that is true: *"`pip install "provisa[embedded]"` then `provisa run`. No Docker, no JVM, no
root — the embedded tier runs DuckDB in-process with an embedded PostgreSQL control plane. Python
3.12 on linux-x86_64, macOS or Windows; for Trino or another engine, point the install at one."*

### 2 — Home C-31 / Platform C-17: the engine arithmetic

**Verdict: OK, reworded. 32 is right, 21 is right, and `docs/engines.md`'s "20" is also right. There
is no doc error.**

```bash
python3 -c "
from provisa.federation.engine import _ENGINE_BUILDERS, _RDB_KINDS
print(len(_ENGINE_BUILDERS), len(_RDB_KINDS), 6 + 5 + 1 + len(_RDB_KINDS))"
# 32 20 32
```

The two numbers count different things. `_RDB_KINDS` (`provisa/federation/engine.py:1156-1186`) has
**20** entries — the pre-named network-addressable databases. The key `sqlalchemy`
(`:1145`) is a 21st key on the same runtime, taking any URL from `$PROVISA_ENGINE_URL`. So the
table has 21 rows and the prose's "the 20 keys below" refers to the 20 pre-named ones. Both correct.

6 federating + 5 warehouse + 21 = 32. Confirmed.

Do not put "21 SQLAlchemy engine keys" in a `StatStrip`. It invites exactly the recount that
produced this question. Use the structure instead, which is also the better claim because it is a
capability gradient a platform architect can plan against:

*"32 engine keys. Six federating engines read sources in place. Five warehouse engines execute what
they can reach and land the rest. One generic SQLAlchemy runtime, pre-named for twenty databases,
lands everything and federates with plain SQL."*

### 3 — Home C-36 / Governance C-29: how much of the SaaS gap to state

**Verdict: OK, reworded. State that it is not offered. State none of the technical detail — because
the detail in `docs/marketing.md:18` is stale and an evaluator who checks it finds us contradicting
ourselves.**

Every technical blocker that line names is closed:

| Requirement | `docs/arch/requirements.yaml` |
| --- | --- |
| REQ-073 multi-tenant platform | ↪ superseded by REQ-1243 |
| REQ-1243 | ✅ complete |
| REQ-695 per-org schema isolation | ✅ complete |
| REQ-702 org-scoped demo seeding | ✅ complete |
| REQ-684 / REQ-685 / REQ-694 encryption, envelope, client-owned KMS | ✅ complete |

So "the multi-tenant platform behind it is partly built" is wrong in the direction that looks worst:
it understates the product while reading as a confession. Meanwhile `saas-operations` has 7 open
requirements across the front door, provisioning and email — which is the real reason, and is not
what the line says.

Put none of that on a public page. A managed-service promise with no SLA, no signup path and no
published pricing is a liability on an enterprise page, and "self-hosted only" is an *advantage* in
three of the four priority verticals — `docs/competitive_analysis.md:29` already argues exactly that
against Apollo and Starburst Galaxy.

Copy: *"Provisa is self-hosted. You run it on your hardware, in your cloud account, or air-gapped.
There is no managed service to buy today."* One sentence, no REQ ids, no roadmap. On Interfaces,
where a trial link sits next to it, add: *"The trial runs on infrastructure we operate so you can
evaluate without installing. It is not a production service."*

And `docs/marketing.md:18` needs correcting at source today — it is the line a salesperson repeats
on a call.

### 3a — The governance layer count (affects Home C-6, C-20; Governance hero, C-7)

Not on the list of eleven, but it is the larger version of the same problem and it changes two pages.

**Layer 1 — public publishing — is 0 of 4 requirements complete.** REQ-1059 (`proposed`) is the
mechanism itself: "each org has a built-in 'public' role starting with ZERO visibility." That is
exactly the sentence Home C-20 and Governance C-7 put on the page, and it is a design, not a
feature.

The pages say **five**, not six. Five complete enforcement layers is still more than any competitor
in `docs/competitive_analysis.md` enforces, and it is defensible today:

| Layer | What it does | Requirements | Status |
| --- | --- | --- | --- |
| 0 | Objects outside the role are absent from schema, catalog and browser | REQ-039 | ✅ |
| 1 | Domain access — a query touching a table outside `domain_access` is rejected pre-execution | REQ-038 | ✅ |
| 2 | Row-level security — per-table, per-role `WHERE` injected into every `SELECT` | REQ-041, REQ-263, REQ-264 | ✅ |
| 3 | Column visibility and masking — invisible columns stripped, masked values replaced server-side | REQ-040, REQ-263, REQ-740–745 | ✅ |
| 4 | Predicate guard — masked columns refused in `WHERE`/`HAVING` at parse time | REQ-531 | ✅ |
| 5 | Approval hook — ABAC callout before execution, over webhook, gRPC or Unix socket | REQ-203/204/246/247/555/556 | ✅ (6/6) |

**Second correction to the briefs' layer numbering.** `docs/security.md:7-39` numbers the predicate
guard as Layer 5; both briefs put the approval hook there and drop the predicate guard. Keep both —
as renumbered above — because the predicate guard is the *strongest demo asset in the product*
(a masked column refused in a `WHERE`, then `EXPLAIN` on the governed plan) and it is currently
missing from all four pages.

But note the framing: Home C-6 says the layers are "compiled into every query plan." Layers 0–4 are.
The approval hook is an external callout, not part of the plan. Either say "five layers compiled
into the plan, plus an approval hook before it runs," or drop the word *compiled*.

Also fix `docs/security.md:63`, which says "all **five** constraints active simultaneously" after
enumerating six. A careful reader will find it.

### 4 — Home C-37: the BSL wording

**Verdict: OK, reworded. The published site is NOT stale — it is accurate and better than the
brief's summary of it. Copy from `LICENSE`, not from the brief.**

`LICENSE:14-30`, verbatim: production use is permitted for an organisation that, together with its
Affiliates, has "fewer than 100 employees and contractors counted together **and** less than
1,000,000 USD (or equivalent) in total revenue, budget, or expenditures in its most recently
completed fiscal year"; 90 days' grace on ceasing to meet them; any other production use requires a
separate commercial licence. Change Date is **the fourth anniversary of each released version's**
first public availability. Change License is **GNU General Public License, Version 2.0 or later**.

`site/index.html:639-646` and `:853` already state all of this correctly, including GPL v2-or-later
and the four-year conversion. The brief's C-37 drops both. Put them back — an open-source review
board checks the Change License first, and `docs/marketing.md:24` currently says "Apache 2", which
is wrong and must be corrected at source.

Two things to add that are currently nowhere:

- **The 90-day grace period.** It is generous and it is reassuring.
- **The distinction between the two things called a licence.** The in-product licence file is free
  and is purely a registration nag — 30-day trial (`provisa/licensing/monotonic.py:27`), then a
  non-fatal notice that "NEVER gates or degrades functionality", and the message itself says "A
  license is FREE" (`provisa/licensing/nag.py:11-45`, REQ-1137 ✅). **That is not the BSL production
  grant.** Two different things with the same word, one free, and the page is about to publish them
  adjacent to each other.

The thresholds are a *strength* with this audience. State them in plain numbers. Elastic and
HashiCorp learned that by doing the opposite.

### 5 — Platform C-7: the rewritten-SQL example

**Verdict: Cut the constructed SQL. The tab stays — fill it with the real response shape, which is
better than the invented one.**

Do not paste model-written SQL onto a page whose entire job is to be read by people who will run the
real thing within the hour. The output is not quoted in any doc, but the response *shape* is
defined in code, and it is more impressive than a SQL string because it is machine-readable
governance evidence.

`provisa/api/admin/dev_queries.py` `_build_enforcement_metadata` (REQ-040, REQ-041, REQ-263) returns
an `EnforcementMetadata` with exactly these fields, and `provisa/api/data/endpoint.py:140-165`
serialises it under `compiled[].enforcement`:

```
rls_filters_applied   the predicate text injected per table
columns_excluded      "table.column" for every column stripped for this role
schema_scope          "role:<role_id>"
masking_applied       "table.column -> <mask_type>" per masked column
ceiling_applied        the row/time ceiling, when one fired
route                  the routing decision
```

Alongside it the response carries the compiled semantic SQL, the engine SQL or direct SQL, the
parameters, the sources touched, and the optimizations that fired (MV rewrite, hot-table inlining,
cache service).

So tab 3 shows a real `curl` and a real response skeleton with those field names, and the body text
makes the point that lands with a procurement reader: **the enforcement is enumerable before the
query runs, by field name, per role.** That is an auditable artifact. An invented SQL string is not.

Whoever builds the page runs the command against the demo install and pastes the actual JSON. If
nobody will run it, the tab ships with the field list above and no fabricated values — never with
constructed SQL.

### 6 — Platform C-19: `provisa pg-ext install`

**Verdict: OK. Confirmed current, in code, not only in docs. Publish it.**

`provisa/pg_extensions/external_install.py:14-15`:

> major (manifest.json `pg_major`). Today they are built for PostgreSQL 16 only, on linux-x64 and
> darwin-arm64; any other major or platform is refused by name.

The refusal is enforced at `:139-144` — the installer reads the server's own major and platform,
and when no bundle matches it raises naming the bundles that exist. `provisa/pg_extensions/catalog.py:192-210`
fails loud (REQ-898) rather than falling back to a source build. REQ-1873 is ✅ complete.

The RDS / Cloud SQL limit follows from the mechanism rather than from a named check: the installer
copies files into `pg_config --pkglibdir` and `--sharedir` and edits
`shared_preload_libraries`. A managed service with no filesystem access cannot take that. State it
as the reason, not as a vendor blocklist: *"The bundles are copied into the server's own library
directory, so they need filesystem access to the Postgres host. A managed service that does not
give you that — Amazon RDS, Cloud SQL — cannot take them; use the extensions the service offers."*

This belongs within one click of anywhere the site names Postgres as an engine. It is a hard limit
and burying it converts a sophisticated reader into a hostile one.

### 7 — Governance C-4 / Platform C-6: the compile-only endpoint path

**Verdict: OK, reworded. `/api/sql/compile` does not exist. The real route is `POST /data/compile`,
and it takes a GraphQL document, not SQL.**

- `provisa/api/data/endpoint.py:83` — `router = APIRouter(prefix="/data", tags=["data"])`
- `provisa/api/data/endpoint.py:140` — `@router.post("/compile")`, REQ-161/REQ-163, both ✅
- Request body is `CompileRequest{query, variables}` and the handler calls
  `provisa.api.admin.dev_queries.compile_query`, which is **GraphQL → SQL**. Confirmed independently
  by `provisa/security/high_security.py:54`, which lists `"/data/compile"` as the route that
  "returns the generated SQL for a query, never its results".
- The role comes from the authenticated session; `X-Provisa-Role` is honoured only when
  unauthenticated.

**Both briefs place this claim under §SQL over HTTP, and that is the error underneath the wrong
path.** SQL over HTTP is `POST /data/sql` (`provisa/api/data/endpoint_dev.py:229`). Its companion is
`POST /data/sql/explain` (`:410`, REQ-1519 ✅), which returns *the engine's own EXPLAIN of the
governed plan* — a different and also useful thing, not the governed SQL text.

So there are two routes and the pages must not merge them:

| Want | Route | Input | Returns |
| --- | --- | --- | --- |
| The governed SQL that would run, with filters and masks inlined, plus route, params and enforcement metadata | `POST /data/compile` | GraphQL | compiled SQL + `enforcement` (see decision 5) |
| The engine's plan for the statement that would run | `POST /data/sql/explain` | SQL | annotated EXPLAIN tree + optimizations that fired |

Fix both `curl` examples to `POST /data/compile` with a GraphQL body. If a page wants a
SQL-in/SQL-out compile-only example, it does not exist and the example comes off.

### 8 — Governance §9: the maturity disclosure

**Verdict: the In-development marking on RLS and masking is an artifact of group aggregation. It is
not an enforcement gap. Keep §9, and do not quote the markers.**

This is the one I was asked for a read on, so here it is precisely. "Row-level security, column
visibility and masking" is marked In development on **3 open requirements out of 41**, and not one
of the three is enforcement:

| Requirement | Status | What it actually is |
| --- | --- | --- |
| REQ-1760 | in-progress, 2026-Q4 | An internal code-hygiene constraint: every call to `provisa/federation/runtime.py`'s `execute_engine` must pass an explicit typed authorization argument rather than a bare SQL string. It hardens the *internal* call surface — including privileged paths like MV refresh. It does not mean a user query escapes RLS. |
| REQ-1382 | accepted, 2026-Q4 | Precedence when an IdP claim and a locally-administered user attribute collide: the IdP wins, the local value is marked *shadowed*, never silently merged. |
| REQ-1383 | accepted, 2026-Q4 | Both attribute sources resolve into one `user.*` namespace, with per-attribute provenance shown in the admin UI. |

Every enforcement requirement is complete: REQ-038, REQ-039, REQ-040, REQ-041, REQ-263, REQ-264,
REQ-531, and the four mask types REQ-740–745. REQ-402–404 — RLS predicates reading identity
attributes — are complete today. REQ-1382/1383 are the *attribute supply chain feeding* the
predicates, and specifically the collision rule between two sources of them. Adjacent surface.

The other three groups named in the brief:

- **Roles and capabilities** — In development on 4 of 42. Two are platform-admin scope (REQ-1299,
  REQ-1303). Two are the join guard and they matter; see Governance C-13.
- **Approvals and query limits** — In development on **1 of 24**, REQ-1995 (`proposed`), on
  *creation* approvals. The approval-hook paragraph is 6 of 6 complete. The brief's statement that
  features.md marks the approval hook In development is wrong at the paragraph level.
- **Lineage and provenance** — In development on **1 of 14**, REQ-1366 (`proposed`), and it is a
  *spike* to generalize `as_of` time-travel from Iceberg/Delta to non-versioned sources. Column
  lineage is complete.

So §9 does not disclose a gap in enforcement, because there is not one. What it should disclose is
narrower, truer and more credible than either "In development" or silence:

> **What is not finished.** Public-column publishing — serving a published column to an
> unauthenticated reader — is designed and not built. Everything on this page about roles, domains,
> row filters, masking and the predicate guard is in the product today, and the per-requirement
> status for every one of them is in the repository you can read before you talk to us.

Then link `docs/exports/traceability_matrix.csv`. A procurement reader who finds a per-requirement
traceability matrix behaves differently from one who finds a marketing page. Of 1,872 requirements,
1,599 are complete, 84 in progress, 37 proposed — publish that ratio. It is a healthy number and
nobody in the comparison set publishes anything like it.

What would actually damage the page is quoting the group markers, because they are wrong in both
directions: they would mark RLS unfinished and "Cypher and graph analytics" (74 of 74 complete)
finished, side by side, with no way for a reader to tell which claim to trust.

### 9 — Interfaces C-16: port numbers (blocking)

**Verdict: OK, reworded — and the structure of the answer matters more than the numbers.
31337 is wrong. 5251 is unsupported. The rest are deployment conventions, not product defaults.**

The authoritative source is `provisa/core/settings_catalog.py`, REQ-1913:

| Listener | Setting | Env | Default | Line |
| --- | --- | --- | --- | --- |
| Arrow Flight | `server.flight_port` | `FLIGHT_PORT` | **8815** | :595-605 |
| gRPC | `server.grpc_port` | `GRPC_PORT` | **50051** | :581-593 |
| pgwire | `server.pgwire_port` | `PROVISA_PGWIRE_PORT` | **0 — off** | :618-630 |
| Bolt | `server.bolt_port` | `PROVISA_BOLT_PORT` | **0 — off** | :631-641 |
| Airport | `server.airport_port` | `PROVISA_AIRPORT_PORT` | **0 — off** | :643-651 |
| MCP | `mcp.port` | `PROVISA_MCP_PORT` | **0 — off** | :1039-1050 |

So four of the six listeners have **no default port at all** — a zero means the listener is not
started (`provisa/api/app_startup.py:429,478,508,526`, each an opt-in hook). Interfaces C-6 already
says this for pgwire and it is right; it is true of Bolt, Airport and MCP too.

The familiar numbers are the **deployment convention**, and they are real and citable:

- REQ-1258: "Helm provisa Service must expose all protocol endpoints served by the API container:
  pgwire (**5439**), Bolt (**7687**), MCP (**8009**), gRPC (**50051**), in addition to API (**8000**)
  and Arrow Flight (**8815**)."
- `helm/provisa/values.yaml:200-211` sets exactly those, and `config/provisa-install.yaml:448,462`
  sets pgwire 5439.

Three corrections:

1. **Flight is 8815, not 31337.** `31337` appears nowhere in the repo. Cut it.
2. **`docs/competitive_analysis.md`'s Bolt port 5251 is unsupported** — nowhere in
   `settings_catalog.py`, `capabilities.yaml`, the Helm values or any requirement. Fix that doc.
3. **MCP is not a path on the API port.** It is its own listener. The URL is
   `http(s)://<host>:<mcp.port>/mcp` (`provisa/api/mcp/status.py:98`), transport
   **streamable HTTP** — the only transport `start_mcp_server` binds a port for.

Do the connection examples this way, which is also the technically correct way and saves the support
tickets the Content Manager is right to worry about:

```bash
# pgwire — off until you set a port; 5439 is the port our Helm chart and installer use
PROVISA_PGWIRE_PORT=5439 provisa run
psql "postgresql://you@localhost:5439/provisa"
```

Show the env var and the conventional value together, every time, with "the listener is off until
you set a port" said once near the top. Never a bare `localhost:5439` with no indication that the
reader has to turn it on — that is the line that generates the ticket.

REQ-1258 is `in-progress`, so the per-protocol Helm Service exposure is being finished. The ports
themselves are not in doubt.

### 10 — Interfaces: the count in the hero

**Verdict: sixteen. And put a second, structural number beside it, because sixteen is the soft one.**

Use **sixteen**, matching the matrix row for row, and rewrite Home C-3 to the identical sixteen
labels. The brief's seventeen comes from a different taxonomy — it splits Flight from Flight SQL and
REST from JSON:API from OpenAPI, then drops the Python client and the Kafka sink. A reader who
counts one page and then the other finds two taxonomies, which is worse than either number.

Any "ways in" count is soft, because the taxonomy is a choice and a hostile reader will recount.
So pair it with the number that is not a choice:

**Seven listeners. Sixteen ways in.**

Seven is structural and verifiable from `provisa/api/app_startup.py:289-533` — HTTP, gRPC and Arrow
Flight start by default; pgwire, Bolt, Airport and MCP are opt-in, each binding its own port. That
is a falsifiable claim about the architecture, and it is the one worth leading with.

(This also corrects `docs/claim-audit.md` §1.5, which said Airport rides the Flight server. It has
its own listener — REQ-1120, `PROVISA_AIRPORT_PORT`, `provisa/api/airport/start_airport_server`.
JDBC does ride Flight; Airport does not.)

### 11 — Home C-11 and the ClickHouse figure

**Verdict: the number stays off Home. The capability it points at is defensible and belongs on
Platform or Sources, reworded. The 60M is a table size, not a result.**

Three things are wrong with `docs/marketing.md:42` as a public figure:

1. **"Full" is wrong.** The connector declares `join_pushdown` False — asserted in its own test at
   `tests/unit/test_pg_clickhouse_fdw_connector.py:54-58`. Predicates and aggregates push down;
   joins execute above.
2. **No latency or throughput was recorded.** "60M-row" is a table size. Every reader will take it
   as a performance result, and we cannot answer the follow-up question.
3. **It is not reproducible from the repo.** The source is a docstring note of a one-off developer
   session at `tests/unit/test_pg_clickhouse_fdw_connector.py:14-17` — no fixture, no harness entry,
   no committed output. A measured figure on a public page has to survive someone asking to see it
   run.

The instinct to keep it off Home was right. But the underlying capability is strong and is verified
by running code rather than by a docstring:

```bash
python3 -c "
from provisa.federation.engine import live_source_types, reachable_source_types
print(len(reachable_source_types('trino')), len(live_source_types('trino')))"
# 63 37
```

ClickHouse, MongoDB, Snowflake, Databricks and BigQuery are all in `live_source_types('trino')`.
That is the claim, and it is better than the 60M sentence because every figure in it is one command
away — which is exactly what this reader wants:

*"72 source types. On a Trino engine, 63 are reachable and 37 are read in place with no copy —
including ClickHouse, MongoDB, Snowflake, Databricks and BigQuery. Predicates and aggregates push
down into the source; joins execute above it."*

If someone will run `demo/named/perf/bench/run_benchmark.py` and publish a figure with the hardware
and the query named, that number is worth a `StatStrip`. Until then no measured number goes on any
of these four pages, and that includes "sub-100ms", which has the same problem and is currently on
`site/index.html:285`, `:316` and five other published pages.

---

## 2. Per-page verdicts

Rows not listed are plain **OK**.

### Home — C-1 … C-37

| # | Verdict | Wording that is true |
| --- | --- | --- |
| C-3 | OK, reworded | Use the sixteen labels from the Interfaces matrix, identically. See decision 10. |
| C-4 | OK, reworded | "Provisa does not own the engine, and for 37 of the 63 source types a Trino engine reaches, it does not move the data." The unqualified "does not move the data" is false for the 26 that land a replica — and `docs/engines.md` says so, so a reader will find it. |
| C-5 | OK, reworded | **85+ is unsupported — strike it everywhere.** There is no derivation in the repo that reaches 85; the only attempt (`README.md:106`) reaches 79 at most. Replace with "72 source types; on a Trino engine 63 reachable, 37 read live." |
| C-6 | OK, reworded | **Five** layers, not six. See decision 3a. And drop "compiled" or scope it — the approval hook is a callout, not part of the plan. |
| C-8 | OK, reworded | Decision 1. |
| C-11 | OK, reworded | Decision 11. "Through their own Iceberg catalogs" is a mechanism claim I cannot confirm holds for all three; what is verified is that all three are in `live_source_types('trino')`. Claim the outcome, not the mechanism. |
| C-13 | OK, reworded | Cut "queryable as data." The queryable `column_tags` relation is REQ-1414, **proposed**. The glossary-as-graph half is complete. |
| C-20 | **Cut** | Layer 1 is 0 of 4 requirements complete. REQ-1059 — "a built-in 'public' role starting with ZERO visibility" — is `proposed`. This sentence describes a design. |
| C-25 | **Cut** the second sentence | "No invalid join ever runs on your data" is unsupported and is the most exposed claim on any of the four pages. `docs/security.md:41-66` calls the guard "governance policy, **not a hard security boundary**" in our own words, and documents three bypasses plus an unconditional skip for GraphQL. Replacement in §3. |
| C-27 | OK, reworded | Add the qualifier: immutability is enforced by PostgreSQL `RULE`s (`provisa/audit/query_log.py:56,61`), and `rules=True` holds only for the PostgreSQL dialect (`provisa/core/database.py:133-143`). The embedded PostgreSQL control plane is the default in every shipped tier, so this holds out of the box — but SQLite is a selectable control-plane store where it does not. Say "on a PostgreSQL control plane — the default from the desktop install up." |
| C-31 | OK, reworded | Decision 2. Do not put 21 in a `StatStrip`. |
| C-33 | OK, reworded | Needs the dated maturity line. `deployment-cloud-vm` carries REQ-1027 (`proposed`); `deployment-compose-helm` carries four in-progress. |
| C-34 | OK, reworded | The two specifics claimed are the two that are open: REQ-1256 (Helm ships a served UI) and REQ-1258 (the Service exposes every protocol port), both `in-progress`. Either mark the row, or claim the chart without those two specifics. |
| C-36 | OK, reworded | Decision 3. |
| C-37 | OK, reworded | Decision 4. Add GPL-2.0-or-later, the four-year Change Date, the 90-day grace, and the free-registration-licence distinction. |

### Platform — C-1 … C-33

| # | Verdict | Wording that is true |
| --- | --- | --- |
| C-1 | OK, reworded | REQ-1919, `in-progress`, is literally "The model store" — the paragraph is 2 of 4 complete. The *contents* of the list are right; "stored once" is the part being finished (REQ-1932 splits model / state / platform stores). Say "one model — sources, tables, columns, relationships, roles, rules, views" without the architectural "stored once". |
| C-6 | OK, reworded | Decision 7 — `POST /data/compile`, GraphQL body. |
| C-7 | **Cut** the constructed SQL | Decision 5. Tab 3 keeps its slot and shows the real response shape, or a real captured response. Never model-written SQL. |
| C-8 | OK, reworded | REQ-1965 (`in-progress`) is exactly this claim, and the open part is "**on every engine**". Say "nested data returns as JSON" and drop the universal quantifier until REQ-1965 closes. The DDL-refusal half is complete. |
| C-12 | OK, reworded | "…and can be turned off" rests on REQ-477, `in-progress`. The steward / boundary / approval half is complete. Drop the last clause. |
| C-17 | OK, reworded | Decision 2 — one answer with Home C-31. |
| C-18 | OK, reworded | Cut "the same model answers the same question on any engine." It does not: live-vs-landed and pushdown differ per engine, which is the whole point of the capability table two sections earlier. The first half — engines declare capabilities, the planner reads them — is correct and sufficient. |
| C-25 | OK, reworded | "Almost at once" is an unmeasured latency claim, same family as sub-100ms. `docs/features.md:741` is a design description, not a measurement. Say "starts returning rows before the scan completes, holding one batch in memory" — mechanically true, nothing to defend. |
| C-28 | OK, reworded | Decision 1. The "embedded PostgreSQL control plane" half is verified: `config/capabilities.yaml:148-160` makes `embedded_pg` the default for both the `demo` and `native` presets (REQ-1535). |
| C-29 | OK, reworded | REQ-1256 and REQ-1258 again. Same treatment as Home C-34. |
| C-30 | OK, reworded | REQ-1027 (`proposed`) sits under `deployment-cloud-vm`. Mark it or drop the per-protocol-load-balancer specific. |

**On the maturity-line decision the brief raises for me and the VP: one dated line in §1, and the
recommendation in the brief is right for the right reason.** Eleven per-section markers would say
something false, because the group markers do not mean what they appear to mean (§0). But do not
word the line around features.md. Word it around the requirement ledger:

> *Provisa is at `0.1.0a479`, pre-1.0. Of 1,872 tracked requirements, 1,599 are complete. Every
> capability on this page names the requirements behind it, and their status is in the repository.*

That is checkable, it is dated by the version string, and it pre-empts the alpha discovery instead
of being caught by it.

### Governance — C-1 … C-29

| # | Verdict | Wording that is true |
| --- | --- | --- |
| C-3 | OK, reworded | "No code path returns rows without a role bound to them" is the absolute that REQ-1760 (`in-progress`) is still closing on the *internal* call surface. Scope it: "No query path returns rows without a role bound to them" — true today, and the hardening of privileged internal paths like MV refresh is the open work. |
| C-4 | OK, reworded | Decision 7. Both `curl` examples change route, method target and body language. |
| C-7 | **Cut** | Layer 1. Same as Home C-20 — 0 of 4 complete. |
| C-12 | OK, reworded | The approval hook is complete (6/6) and the claim stands; it is **Layer 5** only if the predicate guard is dropped, which it should not be. Renumber per decision 3a and add the predicate guard as its own layer. |
| C-13 | **Cut** the last clause | "the refusal names the valid paths, computed in one place" is REQ-1955 and REQ-1956, both `proposed`. The guard itself (REQ-603/REQ-1297) is complete, so "a join is allowed only on a registered, approved relationship" stands — the refusal naming paths does not exist yet. |
| C-16 | OK, reworded | Same PostgreSQL-control-plane qualifier as Home C-27. "No admin can edit history" is true where the dialect enforces it, which is the default everywhere — say which. |
| C-17 | OK, reworded | REQ-1386 (`in-progress`) is the ops-domain *reporting views*. The audit log and internal log tables are queryable in the ops domain today (REQ-884); the curated management reports on top of them are being built. Claim the tables, not the reports. |
| C-19 | OK, reworded | **Understated.** Four providers ship, not three: AWS KMS (REQ-690), HashiCorp Vault Transit (REQ-691), Azure Key Vault (REQ-692) and Google Cloud KMS — `provisa/encryption/providers.py:154,183,226,256`, registry at `provisa/encryption/registry.py:272`. The "registers without core changes" half is verified: `register_encryption_provider` at `registry.py:62`. Add GCP. |
| C-23 | OK, reworded | Scope the as-of claim. REQ-1366 (`proposed`) is a spike to generalize time-travel beyond Iceberg/Delta to non-versioned sources. The delta ledger and MV point-in-time rebuild are complete (4/5). Say "a materialized view rebuilt as it stood at an earlier moment" and do not imply as-of over arbitrary sources. |
| C-28 | OK, reworded | Decision 8. Do not publish the Available / In development split. Publish the requirement ratio and the traceability matrix. |
| C-29 | OK, reworded | Decision 3. |

### Interfaces — C-1 … C-29

| # | Verdict | Wording that is true |
| --- | --- | --- |
| C-3 | OK, reworded | "Ordering reaches into related objects" sits on REQ-450 and REQ-451, both `in-progress` — they govern which arguments nested relationship paths expose. The per-role schema, Hasura-convention filtering/paging and Apollo APQ halves are complete. Drop the nested-ordering specific or mark that one row. |
| C-4 | OK, reworded | Decision 7. The compile-only route is not on the SQL-over-HTTP surface; `POST /data/sql/explain` is, and it returns a plan, not governed SQL. |
| C-12 | OK, reworded | Split the row. WebSocket and SSE subscriptions are complete (0 of 33 open). The **Kafka sink** carries REQ-116, `in-progress`. One marker on one row, not on all three. |
| C-14 | OK, reworded | Transport is **streamable HTTP** (`provisa/api/mcp/status.py:121` — the only transport `start_mcp_server` binds a port for). `stdio` is not native: it is the bundled `mcp-proxy` bridge, and `bridge_command` is set **only by the native launcher** (REQ-1104), so on the container tier the panel shows a supply-your-own-bridge note. The matrix's "HTTP / stdio" needs that qualifier. The copy-ready config half is verified — `provisa-ui/src/pages/McpExplorePage.tsx` against `/admin/mcp-server`. |
| C-15 | **Cut** | Decision 8. Publishing the features.md markers publishes a number that is wrong in both directions — it would mark RLS unfinished and Cypher (74/74) finished on the same page. The maturity column comes out, or it is sourced per-paragraph from `requirements.yaml`. The "In development means a requirement behind it is still open, not that it does not run" note is honest but it is a footnote defending a column that should not be there. |
| C-16 | OK, reworded | Decision 9. **31337 is wrong — Flight is 8815.** Show env var plus conventional value, and say once that four of the seven listeners are off until a port is set. |
| C-21 | OK, reworded | Same as Platform C-8 — REQ-1965 on "every engine". |
| Hero | OK, reworded | Decision 10. **Sixteen**, and Home C-3 must match row for row. Add "seven listeners" as the structural number. |

---

## 3. The claim a hostile technical reader goes after first

**Home C-25 — "No invalid join ever runs on your data."** Cut it today.

It is an absolute, it is on the highest-traffic page, and `docs/security.md:41-66` dismantles it in
our own words: the relationship guard is "governance policy, **not a hard security boundary**." Four
documented ways past it:

- a role holding `ignore_relationships` — among seeded system roles, `modeler` holds it
  (`provisa/core/db.py:172-180`, REQ-1297 ✅);
- the pair `relationship_guard: false` on the role **and** `--relationship-guard=false` in the
  statement (`provisa/pgwire/_pipeline.py:4262-4278`);
- **unconditionally skipped for GraphQL**, because SDL relationship fields are pre-approved by
  construction — a sound argument that the sentence as written does not survive;
- and the refusal does not yet name the valid paths (REQ-1955/1956, `proposed`), so the one thing
  that would make the guard feel like a boundary to a user is not built.

A Starburst or Immuta field engineer reads that sentence, greps our public repo, and has a slide by
lunch. And they will not stop at the sentence — they will take the whole page's credibility with it,
which is the actual cost. This is the claim to lose now.

The replacement is better positioning than the original, because it converts an absolute nobody
believes into a specific guarantee that is unusual:

> **"Every join in SQL and Cypher must match a relationship someone approved. Under high-security
> mode that is not bypassable — not by a role granted the bypass capability by mistake, not by a
> statement asking for it."**

`provisa/pgwire/_pipeline.py:4273-4276`, REQ-693 ✅. "A production role granted the bypass in error
still cannot break out" is a genuinely good enterprise control story, and it is currently being
spent on an absolute that cannot be defended.

**Second and third, in order:** the six-layer count (Layer 1 is 0 of 4 built — decision 3a), and
**"85+ kinds of source"** (Home C-5), which is the easiest thing on the page to attack because the
reader can try to reconstruct it and fail in about four minutes.

One pattern across all four pages worth naming, because it will keep recurring: **every claim in
trouble is an absolute or a round number** — *no invalid join ever*, *85+*, *full pushdown*,
*sub-100ms*, *the whole system*, *every engine*, *no code path*. Every claim that survived scrutiny
is a mechanism. For this audience the mechanism is the more persuasive of the two anyway. A reader
who runs a lot of Apache software does not want to be told the layer is perfect; they want to know
exactly where it sits and what it refuses to do.

---

## 4. Corrections to `docs/claim-audit.md`

Three statements in my earlier audit were wrong. They would have propagated into page copy, so they
are corrected here and the audit should be amended at source.

1. **§1.10 — "The embedded tier runs a SQLite control plane." Wrong.** `config/capabilities.yaml:148-160`
   makes `embedded_pg` the `default_for: [demo, native]` control-plane store, with the stated reason
   (REQ-1535): "SQLite has no schemas, and REQ-1488 makes an environment a schema — so a SQLite
   plane can hold prod and nothing else." SQLite remains a selectable option; it is not the default
   in any shipped tier. **Consequence:** the audit-log immutability claim is stronger than I said —
   the `RULE`-based enforcement holds out of the box on the desktop install. It still needs the
   "on a PostgreSQL control plane" qualifier, because SQLite is selectable and `rules=False` there.

2. **§1.5 — "JDBC and Airport both ride the Flight server." Half wrong.** JDBC does. Airport has its
   own listener: REQ-1120, `server.airport_port`, started by
   `provisa/api/airport/start_airport_server` at `provisa/api/app_startup.py:526-533`. **Consequence:**
   the listener count is **seven** (HTTP, gRPC, Flight on by default; pgwire, Bolt, Airport, MCP
   opt-in), not five. Better number, and it is what decision 10 uses.

3. **§1.10 — "the customer's own AWS KMS, Azure Key Vault or GCP KMS." Incomplete.** Four providers
   ship, including HashiCorp Vault Transit (REQ-691). Governance C-19's list of three is missing
   GCP KMS. See the C-19 row.

Also, §1.6 recorded REQ-1959 as the only thing open on Layer 1. That understated it: the whole
`public-data-publishing` group is open — REQ-1058, REQ-1059 and REQ-1060 as well, none complete.
Layer 1 is not "landing", it is unbuilt. Decision 3a reflects the corrected position.

---

## 5. What is cleared for build

| Page | Cut | Reworded | Plain OK | Blocking |
| --- | --- | --- | --- | --- |
| Home | 2 (C-20, C-25 2nd sentence) | 14 | 22 | none |
| Platform | 1 (C-7 example) | 10 | 22 | none |
| Governance | 2 (C-7, C-13 clause) | 9 | 18 | none |
| Interfaces | 1 (C-15) | 7 | 21 | none resolved — C-16 answered |

No row remains `pending`. Interfaces C-16 is resolved; nothing on these four pages is blocked on me.

Four things need fixing in the docs, at source, independently of the pages, because each is a line
someone will repeat on a call:

| Doc | Line | Fix |
| --- | --- | --- |
| `docs/marketing.md` | :24 | Change License is GPL-2.0-or-later, not Apache 2; state the use-grant thresholds |
| `docs/marketing.md` | :18 | Every REQ it names as open is complete; rewrite around the real reason (`saas-operations`) |
| `docs/marketing.md` | :5, :42 | Strike "85+"; strike "full" from the ClickHouse pushdown sentence |
| `docs/competitive_analysis.md` | Bolt row | Port 5251 is unsupported; the convention is 7687 and the default is off |
| `docs/security.md` | :63 | "all five constraints" after enumerating six |
