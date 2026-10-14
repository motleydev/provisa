# Claim audit — the message spine for the site rebrand

Audited 2026-10-13 against `main` at `15bd4bf1b`. Every verdict below was produced by reading the
file cited or by running the command shown. Nothing here is taken from `docs/marketing.md`,
`docs/competitive_analysis.md`, `README.md` or the current `site/` tree without independent
confirmation; those four are claim sets, not evidence.

Verdicts: **verified** (file and line, or a command and its output), **partial** (true with a
qualifier that must appear on the page), **stale** (the doc is behind the code — the correction is
given), **unsupported** (strike it).

---

## 0. Two problems that affect every page, read these first

**0.1 — `docs/features.md`'s Available / In development markers are not a release signal and must
not be used as the publishing gate.** The generator sets a feature group to Available only when
*none* of its requirements is open (`scripts/gen_feature_matrix.py:13-14`). Groups span dozens of
requirements, so one open idea marks the whole group. The result is that "Source registration",
"Semantic model", "GraphQL", "SQL over HTTP", "Roles and capabilities", "Row-level security, column
visibility and masking", "Federation and routing", "Installation" and "Deployment" all read **In
development**, while "Audit", "Cypher", "Arrow Flight" and "Natural-language query" read
**Available**. Taken literally, nothing the site wants to say could be said.

Use the per-requirement status in `docs/arch/requirements.md` instead. It is granular and it is
healthy: 1,599 of 1,872 requirements complete, 84 in progress, 37 proposed.

```bash
grep -o "^\*\*Status:\*\* [^·]*" docs/arch/requirements.md | sort | uniq -c | sort -rn
```

The gate I will apply to every page claim from here on: the requirements the claim rests on are
`✅ complete`, or the claim carries the qualifier that the open ones imply.

**0.2 — the four load-bearing numbers in `docs/marketing.md` are the four weakest things in the
material.** 85+, the 60M-row pushdown figure, sub-100ms, and the BSL summary are all either
unsupported or wrong. They are also the four most quotable. Fixing them is the highest-value
output of this audit; see 1.2, 1.3, 1.7 and 1.11.

---

## 1. Claim ledger

### 1.1 — "72 connectors"

**Verdict: verified, with a disclosure the page should make before a reviewer makes it for us.**

72 is the number of entries in the Sources form picker.

```bash
python3 - <<'EOF'
import re
lines = open('provisa-ui/src/pages/sources/constants.ts').read().split('\n')
start = next(i for i,l in enumerate(lines) if l.startswith('export const SOURCE_TYPES'))
depth, buf = 0, []
for i in range(start, len(lines)):
    buf.append(lines[i]); depth += lines[i].count('[') - lines[i].count(']')
    if depth == 0 and i > start: break
print(len(re.findall(r'\bvalue:\s*[\'"]([^\'"]+)', '\n'.join(buf))))
EOF
# 72
```

Cited at `docs/sources.md:29`; the array is `provisa-ui/src/pages/sources/constants.ts:42-216`.

The disclosure: of the 72, three are data-quality and profiling integrations (`soda`,
`great_expectations`, `data_profiler`) and three are content sources rather than systems the buyer
already runs (AskAmerica/GovData, Kaggle, Wikipedia). A Trino or Denodo field engineer will count
them. **66 are data systems.** Say 72 and footnote the composition; do not let the first analyst
call be the place it comes up.

Separately, the backend `SourceType` enum carries **87** members, 15 more than the picker. The
difference is not extra reach — see 1.4.

### 1.2 — "85+ kinds of source"

**Verdict: unsupported. Strike it from every page.**

The only derivation anywhere in the repo is `README.md:106`: "the larger number counts the hosted
PostgreSQL services (RDS, Aurora, Cloud SQL, AlloyDB, Azure, Supabase, Neon) and the File Crawler's
file formats individually." That does not reach 85. There are 7 hosted-Postgres aliases, in one
string at `provisa-ui/src/pages/sources/constants.ts:55` — 72 + 7 = 79. The File Crawler recognises
four extensions mapping to three formats (`provisa/file_source/crawler.py:33-38`: `.csv`,
`.parquet`, `.sqlite`, `.db`), and all three are already separate picker entries, so they add
nothing. There is no rule that produces 85, and no file in the repo asserts one.

A number a reader cannot reconstruct is worse than no number on a page aimed at this reader. Three
reproducible numbers are available and they are all better:

| Number | What it is | How to reproduce |
| --- | --- | --- |
| **72** | source types in the Sources form | the command in 1.1 |
| **63** | source types the Trino engine can reach | `reachable_source_types("trino")` |
| **37** | of those, read live with no replica | `live_source_types("trino")` |

```bash
python3 -c "
from provisa.federation.engine import live_source_types, reachable_source_types
print(len(reachable_source_types('trino')), len(live_source_types('trino')))"
# 63 37
```

Recommended replacement line: **"72 source types. On a Trino engine, 63 are reachable and 37 are
read live with no copy."** Every figure is one command away, which is what this audience wants.

### 1.3 — Which sources reach live, and the ClickHouse 60M-row figure

**Verdict on the live/replica split: verified, and reproducible per engine.**
**Verdict on the 60M-row pushdown sentence: partial, and the word "full" is wrong. Rewrite it.**

The split is a property of the running system, not a doc, and the system will answer:

```bash
python3 - <<'EOF'
from provisa.federation.engine import build_engine
e = build_engine('trino')
for st, c in sorted(e.connectors.items()):
    cap = c.capability()
    print(f"{st:20} {'LIVE' if c.reads_in_place else 'REPLICA':8} "
          f"pred={cap.predicate_pushdown} agg={cap.aggregate_pushdown} join={cap.join_pushdown}")
EOF
```

`live_source_types` / `reachable_source_types` are at `provisa/federation/engine.py:1497` and
`:1516`; `reads_in_place` is at `provisa/federation/connector_base.py:180`.

**Read live on Trino, with aggregate pushdown** — safe to name on the page: PostgreSQL, MySQL,
MariaDB, TiDB, CockroachDB, YugabyteDB, Greenplum, SingleStore, SQL Server, Oracle, Exasol,
Snowflake, Databricks, BigQuery, Redshift, ClickHouse, Iceberg, Delta Lake, Hive, Hive-on-S3.

**Read live, predicate pushdown only — aggregates do not push down**: MongoDB, Cassandra, Redis,
Elasticsearch, Kafka, Prometheus, Salesforce, ServiceNow, SharePoint, Splunk, cloud inventory.
Druid and Pinot push predicates and aggregates but not joins.

**Not live — Provisa reads them and lands a replica**: OpenAPI, remote GraphQL, gRPC, Neo4j,
SPARQL, WebSocket, RSS, ingest, SQLite, SAP HANA, HiveServer2, Cosmos DB, Qdrant, Firebird,
Airport, Google Workspace, Microsoft 365, GovData, logs, node, python, remote Trino, Fabric,
Synapse, the two quality checkers, the profiler.

One trap in that table: a landed connector reports `pred/agg/join = True` because once the rows are
in the engine's store the engine does all three. Those flags are only meaningful on the LIVE rows.
Do not copy the matrix onto a page without that filter.

On the 60M-row sentence (`docs/marketing.md:42`), the measurement exists and says less than the
sentence does. It is a docstring note of a one-off developer session at
`tests/unit/test_pg_clickhouse_fdw_connector.py:14-17`:

> Live-verified this session against a real ~60M-row table: IMPORT FOREIGN SCHEMA auto-typed the
> full schema, count(\*) matched exactly, and EXPLAIN VERBOSE confirmed predicate+aggregate pushdown.

Four corrections:

1. It is scoped to the **Postgres engine** reaching ClickHouse through ClickHouse's own
   `clickhouse_fdw` extension (`PgClickHouseFdwConnector`, REQ-1870, `✅ complete`). It is not the
   ClickHouse engine and not Trino. On the Postgres engine that extension has to be installed in
   the operator's own server first (see 1.8).
2. **"Full" is wrong.** The connector's own capability declares `join_pushdown` False — asserted in
   the test at `tests/unit/test_pg_clickhouse_fdw_connector.py:54-58`. Predicates and aggregates
   push down; joins do not.
3. **No latency or throughput was recorded.** 60M is a table size, not a performance result. A
   reader will take it as one.
4. The session is not reproducible from the repo — no fixture, no harness entry, no committed
   output.

Rewrite: **"ClickHouse is read in place, with predicates and aggregates pushed into ClickHouse and
joins executed above it. Verified against a 60-million-row table through ClickHouse's own
`clickhouse_fdw` extension on the Postgres engine; on Trino the ClickHouse connector is live with
the same predicate and aggregate pushdown."** No number that implies a speed, no "full".

### 1.4 — SaaS APIs: Salesforce and ServiceNow yes, Stripe qualified, the rest strike

**Verdict: the SaaS claim as written is unsupported and is the most dangerous factual error in the
material after the licence.** `docs/marketing.md:40` and `:43` name Stripe, HubSpot, Airtable,
Notion, Auth0, AWS Cognito, Cloudflare D1, Logflare and Calendly as sources Provisa reaches. The
code says otherwise, in its own words, at `provisa/core/models.py:176-179`:

> SaaS-API sources reached via Supabase `wrappers` (REQ-1871/1874) — each a **STUB: the type is
> registrable, but no connector/dialect/driver reaches it yet.**

Twenty enum members sit under that comment (`provisa/core/models.py:186-205`): `airtable`, `auth0`,
`aws_cognito`, `dynamodb`, `firebase`, `logflare`, `s3_vectors`, `stripe`, `calcom`, `calendly`,
`clerk`, `cloudflare_d1`, `gravatar`, `hubspot`, `infura`, `notion`, `orb`, `paddle`, `shopify`,
`slack`. None is in the Sources form. REQ-1871 is `⚙ in-progress`; REQ-1874 is `✓ accepted`, which
means designed and not built. Eight of the nine names in `marketing.md` are on that list.

Stripe is the exception, and only through a different mechanism: a branded OpenAPI source carrying
Stripe's published specification, 425 paths, API version `2026-09-30.endive`
(`docs/sources.md:818-832`; `provisa/openapi/brands.py`). `docs/sources.md:832` states the overlap
explicitly — "A Stripe source added through the form is an `openapi` source, not that stub." But
OpenAPI is a **landed** connector, so Stripe does not reach live. REQ-1923, which carries the
branded sources, is `⚙ in-progress`.

What is claimable, and it is still a strong claim because no competitor in the comparison set has
it: **Salesforce, ServiceNow, SharePoint, Splunk and cloud resource inventory are read live on a
Trino engine, with predicates pushed into the API.** All five are `✅ complete` (REQ-1954,
REQ-1947). Aggregates do not push down; say so.

The brief's claim 1 reads "Warehouses, document stores and SaaS APIs reach live, not
materialise-and-copy." Warehouses: verified. Document stores: verified for MongoDB, with the
aggregate caveat. SaaS APIs: verified for the five named above only, and false for every SaaS name
`docs/marketing.md` actually leads with. **Correct the spine, not just the page.**

### 1.5 — The protocol list

**Verdict: every protocol is real. The framing "nine protocols" double-counts and will be caught.**

| Way in | Status | Note that belongs on the page |
| --- | --- | --- |
| GraphQL over HTTP | verified | the canonical surface; REST, JSON:API, OpenAPI and gRPC are derived from it (`docs/features.md:427`) |
| SQL over HTTP | verified | — |
| REST / JSON:API / OpenAPI | verified | Swagger UI served per role |
| pgwire | verified, REQ-527/529/`✅` | **the listener is off until a port is set** (`docs/features.md:557`). SQL only, never GraphQL or Cypher |
| Bolt | verified, REQ-802/806/`✅` | each of the user's roles appears as a database |
| Arrow Flight / Flight SQL | verified, REQ-045/143/1216/`✅` | on Trino the route goes through a Flight SQL proxy, and **fails rather than falling back** if the proxy is down (`docs/features.md:581`) |
| Airport (DuckDB) | verified, REQ-1120/1121/`✅` | served **on the Flight server**, not a listener of its own |
| JDBC | verified | a client driver that **moves results as Arrow over Flight** (`docs/features.md:566`), not a separate server protocol |
| gRPC | verified, REQ-525/`✅` | per-role generated proto; an HTTP proxy exists for clients that cannot speak gRPC |
| MCP | verified, REQ-1101/1104/`✅` | **on by default only in the desktop build, bound to loopback** (`docs/features.md:621`) |
| WebSocket | verified | subscriptions and live queries; also a source type, which is a different thing — do not blur them |

Two partials to mark:

- **JDBC and Airport both ride the Flight server.** The distinct server listeners are HTTP, pgwire,
  Bolt, Arrow Flight and gRPC — five. "Nine protocols" (`README.md:7`) counts client-facing
  surfaces, which is a legitimate thing to count, but the page must not imply nine listeners. The
  honest and more impressive line is **"five listeners, nine ways in"**, with the mapping shown.
- **Registered commands are not available on every surface.** REQ-1156 records that MCP, Arrow
  Flight, gRPC and Bolt/Cypher do not reach the tracked-function invocation path; GraphQL, pgwire
  SQL and REST do. Claim uniform **governance** across protocols — that is verified, REQ-266 — but
  not uniform **command invocation**.

### 1.6 — The six governance layers

**Verdict: the six exist and are named. Five are `✅ complete`; one is `⚙ in-progress`. "No invalid
join ever runs on your data" is a seventh thing and, as written, is unsupported.**

`docs/security.md:7-39` names them in enforcement order:

| # | Layer | Where enforced | Requirement | Status |
| --- | --- | --- | --- | --- |
| 0 | Introspection filtering — objects outside a role are absent from the schema, catalog and browser | schema and catalog generation, per role | REQ-039 | ✅ |
| 1 | Public access — a column published `public` is served to every role in the org | governance context | REQ-1959 | **⚙ in-progress** |
| 2 | Domain access — a query touching a table outside `domain_access` is rejected before execution | compiler validation, `_check_domain_access` | REQ-038 | ✅ |
| 3 | Row-level security — per-table, per-role `WHERE` injected into every `SELECT`, evaluated against raw data | governed-SQL rewrite | REQ-041, REQ-263, REQ-264 | ✅ |
| 4 | Column visibility and masking — invisible columns stripped, masked values replaced before results leave the server | governed-SQL rewrite | REQ-040, REQ-263 | ✅ |
| 5 | Predicate guard — masked columns refused in `WHERE` and `HAVING`, at parse time | `validate_sql`, pre-execution | REQ-531 | ✅ |

Two corrections to make in `docs/security.md` itself before the Governance page is written from it:

- Line 63 says "all **five** constraints active simultaneously" after enumerating six. Fix the doc;
  a careful reader will find it.
- Layer 1 is `⚙ in-progress`. Either the Governance page says "five enforcement layers, with
  public-column publishing landing", or it says six and the page cannot ship until REQ-1959 closes.
  My recommendation is the former: five complete layers is already more than any competitor in
  `docs/competitive_analysis.md` enforces, and it is defensible today.

**On "No invalid join ever runs on your data" (`docs/marketing.md:5`) — unsupported as written.**
This is the V002 relationship guard, and `docs/security.md:41-66` describes it accurately and
unflatteringly:

- It is "governance policy, **not a hard security boundary**" — the doc's own words.
- It is bypassed by a role holding the `ignore_relationships` capability. Among seeded system roles
  only `modeler` holds it (`provisa/core/db.py:172-180`, REQ-1297 `✅`).
- It is bypassed by the pair `relationship_guard: false` on the role **and** the comment
  `--relationship-guard=false` in the statement. Either alone does nothing
  (`provisa/pgwire/_pipeline.py:4262-4278`).
- **It is unconditionally skipped for GraphQL.** SDL relationship fields are pre-approved by
  construction, so the check is redundant there — a sound argument, but the sentence as written
  does not survive it.
- Under `security.mode: high` neither bypass applies and the grant is ignored
  (`provisa/pgwire/_pipeline.py:4273-4276`, REQ-693 `✅`).

Replacement that is true and still sharp: **"Every join in SQL and Cypher must match a relationship
someone approved. In high-security mode that is not bypassable, by anyone, including a role granted
the bypass by mistake."** The redundancy argument — a production role granted the capability in
error still cannot break out — is a genuinely good enterprise story and it is being wasted by an
absolute that cannot be defended.

### 1.7 — Sub-100ms transactional writes

**Verdict: unsupported as a performance claim. It is a design target, stated as a measurement.**

The source is REQ-027 (`docs/arch/requirements.md:3219`): "Single-source queries route to direct
RDBMS connection; SQLGlot transpiles to target dialect. **Target: sub-100ms to low hundreds of
ms.**" `docs/architecture.md:300` repeats it as "(sub-100ms target)". The word *target* is dropped
everywhere it is used for marketing — `site/index.html:285`, `:316`,
`site/vs/starburst.html:89`, `site/why/interfaces.html:76`, `README.md:14`, `:72`, `:107`.

There is one measured latency figure in the repo and it points the other way. REQ-1891's use-case
note records a live profiling session: gRPC `point_lookup` at "**238ms p50**, matching the
benchmark's own 193–214ms", described as roughly 100ms above the "flight/cypher/http band" before
the fast-path fix landed. Whatever the band is, it was not demonstrated to be under 100ms.

A real harness exists — `demo/named/perf/bench/`, documented in `docs/sizing.md` — but it measures
**Provisa CPU time per request**, not end-to-end latency (`docs/sizing.md:22`), and no results are
committed.

Two honest options. Architectural, and shippable today: **"A single-source write bypasses the
federation engine entirely and goes to the source's own driver, transactionally, governed
identically."** That is REQ-027's mechanism, it is `✅ complete`, and it is the part that actually
differentiates from Starburst. Or measured, if someone will run it: publish a figure from
`demo/named/perf/bench/run_benchmark.py` with the hardware and the query named. Until then the
number comes off the page.

### 1.8 — `pip install "provisa[embedded]"`, no Docker, no JVM, no root

**Verdict: verified, including live on PyPI. Three qualifiers must travel with it.**

```bash
curl -s https://pypi.org/pypi/provisa/json | python3 -c "
import json,sys; d=json.load(sys.stdin)['info']
print(d['version'], d['requires_python'], 'embedded' in d['provides_extra'])"
# 0.1.0a479 <3.13,>=3.12 True
```

The extra resolves: `embedded = ["duckdb", "fakeredis", "provisa-duckdb-ext>=0.1.1"]`
(`pyproject.toml:191`), REQ-1126/1128/1129/1142 all `✅ complete`. No Docker, no JVM, no root is
true — `pyproject.toml:184-186` says the bundled Trino JVM is omitted because PyPI carries no JVM
server.

The qualifiers:

1. **The embedded tier is DuckDB-only.** Omitting the JVM means omitting Trino. `pyproject.toml:185`
   notes that "full multi-engine federation stays available by pointing at a customer-provided
   external engine via `TRINO_HOST`/`TRINO_PORT`" — which is to say, not in the wheel.
   `site/index.html:718` calls this "the whole system"; it is the whole control plane and UI on one
   engine. Reword.
2. **Python 3.12 exactly, and not Linux aarch64.** `requires_python <3.13,>=3.12`, and
   `docs/cli.md:14-17`: "Linux aarch64 has no pgserver wheel and no source distribution, so the
   embedded tier does not run there." A reader on an ARM server or on 3.13 hits this in the first
   minute. Put it next to the command, not in a footnote.
3. **The published artifact is `0.1.0a479`, an alpha, uploaded 2026-10-10.** Anyone in procurement
   will look. The site must not imply GA anywhere that a version string contradicts.

Related, for the Postgres engine rather than the wheel: `provisa pg-ext install` stages the bundled
extensions into an operator's own Postgres, and the bundles are built for **PostgreSQL 16 only**,
linux-x64 and darwin-arm64, and **cannot be installed on RDS or Cloud SQL** because those give no
filesystem access (`docs/engines.md:45-49`, REQ-1873). If the site says "Postgres" in the engine
list, that sentence has to be reachable within one click.

### 1.9 — The swappable-engine list

**Verdict: 7 of the 8 named engines verified. Starburst is unsupported. The three warehouses carry
a caveat that changes what the claim means.**

```bash
python3 -c "from provisa.federation.engine import engine_kinds; print(len(engine_kinds()))"
# 32
```

Registry is `_ENGINE_BUILDERS`, `provisa/federation/engine.py:1133`; the count is also asserted at
`docs/engines.md:10`.

| Named on the site | Key | Verdict |
| --- | --- | --- |
| Trino | `trino`, `trino-byo` | verified — embedded managed cluster, or an external coordinator |
| **Starburst** | **none** | **unsupported.** "Starburst" appears nowhere in `provisa/` and nowhere in `docs/engines.md`. Zero hits, zero tests |
| DuckDB | `duckdb` | verified — native partial federator, the desktop and demo default |
| ClickHouse | `clickhouse`, `clickhouse-server` | verified — embedded chdb (REQ-909 `✅`) or a server/cloud URL |
| Postgres | `pg` | verified, with the PG16-only / no-RDS extension caveat in 1.8 |
| Snowflake | `snowflake` | verified as a **partial federator** |
| Databricks | `databricks` | verified as a **partial federator** |
| BigQuery | `bigquery` | verified as a **partial federator** |

On Starburst: Starburst Enterprise and Galaxy speak the Trino protocol, so `trino-byo` should reach
a Starburst coordinator. Nothing in the repo tests it or names it. Claim **"any Trino-protocol
coordinator, including the one you already run"** — true, useful, and it does not put an untested
product name in a table on the page whose whole job is to be scrutinised by Starburst's own field
team. Naming Starburst as a supported engine on the vs-Starburst page, with no test, is the single
easiest claim for a competitor to call.

On the warehouses: `docs/engines.md:51-62` is explicit — Snowflake, Databricks, BigQuery, Fabric and
Synapse are "partial federators: the warehouse executes, and sources it cannot reach natively land
into it first." So "the engine is swappable" is true, but "swap in Snowflake and nothing copies" is
not. The honest version is better positioning anyway: **six federating engines read sources in
place; five warehouse engines execute what they can reach and land the rest; twenty SQLAlchemy keys
land everything and federate with plain SQL.** That is a capability gradient a platform architect
can plan against, and it is exactly the kind of table Databricks' own docs use.

### 1.10 — HIPAA, FedRAMP, SOC 2, PCI-DSS

**Verdict: unsupported, all four. Nothing is claimable today. This is the one that gets a company
sued, and the material is currently set up to do it.**

There is no certification evidence of any kind in the repo. The four names appear in exactly two
places: `docs/marketing.md:57` lists "HIPAA/FedRAMP" as an enterprise *hook*, and the vertical table
at `docs/marketing.md:75-78` puts SOC 2, FedRAMP, PCI-DSS and HIPAA in a column headed "Compliance
hook". The only other hit is `docs/testing-plan.md:171`, which names auditors as a *consumer* of the
traceability matrix. There is no SOC 2 report, no Type I or Type II, no FedRAMP authorization or
agency sponsor, no 3PAO, no PCI-DSS AOC, no BAA template.

Each of the four needs a different sentence, and none of them is "we are compliant":

- **SOC 2** requires an audit by a CPA firm over an observation window. No audit, no report, no
  claim. You cannot be "SOC 2 ready" on a page either, unless a readiness assessment exists.
- **FedRAMP** requires an agency sponsor, a 3PAO assessment and an ATO, and the authorization
  attaches to a *hosted service offering*. Provisa has no generally available hosted offering
  (1.12). FedRAMP is not reachable from here and must not appear as a product attribute.
- **HIPAA** has no certification to hold. A self-hosted software vendor that never touches PHI is
  not a business associate and signs no BAA. The honest claim is about controls, not status.
- **PCI-DSS** certifies an environment, and the environment here is the customer's.

What *is* verified, and is what the page should carry instead:

| Control | Evidence | Status |
| --- | --- | --- |
| Append-only query audit log — tenant, user, role, query hash, tables, source, status, duration; query text never stored in the clear | `provisa/audit/query_log.py:20-66` | ✅ |
| Immutability enforced by the database, not the application — `CREATE RULE ... DO INSTEAD NOTHING` on UPDATE and DELETE | `provisa/audit/query_log.py:56,61` | ✅ **PostgreSQL control plane only** — see below |
| Envelope encryption, AES-256-GCM, unique DEK per payload, DEK wrapped by the org master key | REQ-685 | ✅ |
| Customer-held master key in the customer's own AWS KMS, Azure Key Vault or GCP KMS; Provisa never stores raw key material; revoking the grant renders the data unreadable | REQ-694 | ✅ |
| Air-gapped deployment, no phone-home, no telemetry | `docs/deployment.md:163`, REQ-227; `provisa/licensing/nag.py:19-21` | ✅ |
| High-security mode: relationship guard unbypassable, wire-protocol listener can be turned off | REQ-693 | ✅ |
| ABAC approval hook before a query runs, over webhook, gRPC or Unix socket, with a circuit breaker | `docs/features.md:318` | ✅ |
| SCRAM-SHA-256 on pgwire, mutual TLS, per-surface login throttling | `docs/security.md:299-335` | ✅ |
| Per-requirement traceability matrix for auditors | `docs/exports/traceability_matrix.csv` | ✅ |

**One qualifier that must not be lost.** Audit-log immutability is enforced by PostgreSQL RULEs, and
`rules=True` holds for exactly one dialect (`provisa/core/database.py:139`, inside the
`d == "postgresql"` branch); SQLite and the rest are `rules=False`. The embedded tier runs a SQLite
control plane. So `docs/features.md:363`'s "Nobody, including an admin, can edit the history" is
**partial** — true on a PostgreSQL control plane, not database-enforced on the embedded one. Saying
it unqualified to a SOC 2 assessor and then having them find the SQLite path is a trust event you
do not recover from in that engagement.

Suggested page language, which I will sign off: **"Provisa gives you the controls an auditor asks
for: an append-only access record the database itself will not let you edit, envelope encryption
under a key held in your own KMS, and an air-gapped deployment that never phones home. The
certifications belong to the environment you run it in; the control evidence is per-requirement and
exportable."** Then link the traceability matrix. That reads more credible to a CISO than a row of
logos, and it is true.

### 1.11 — BSL 1.1 terms

**Verdict: `docs/marketing.md:24` is wrong on all three of its substantive points. This is the most
dangerous error in the material, because legal will read `LICENSE` and find it.**

`docs/marketing.md:24`: "BSL 1.1 license: source-available, converts to Apache 2 after time window,
prevents commercial cloud hosting without a deal."

`LICENSE:12-30` actually says:

| Parameter | Actual text | What marketing says |
| --- | --- | --- |
| Change License | **GNU General Public License, Version 2.0 or later** (`LICENSE:30`, `:98`) | "Apache 2" |
| Change Date | **The fourth anniversary** of each released version's first public availability (`LICENSE:27-28`) | "a time window" |
| Additional Use Grant | Production use permitted only for an organisation that, **with its affiliates, has fewer than 100 employees and contractors and under USD 1,000,000 in revenue, budget or expenditure**; 90 days' grace on crossing either threshold; **any other production use requires a separate commercial licence** (`LICENSE:14-26`) | "prevents commercial cloud hosting without a deal" |

Apache 2 versus GPL-2.0-or-later is not a detail. It is the difference between a licence anyone can
embed and a copyleft one, and it is the first thing an open-source review board checks.

The use grant is the bigger problem, because the whole PLG story is built on top of a
misunderstanding of it. `docs/marketing.md:22` says "CE is full-featured… No bait-and-switch — CE
stays genuinely capable," and that is true about *features*. But **every organisation this site is
being written for needs a commercial licence to run Provisa in production at all** — not to host it
for others, not to unlock a feature, to run it. The threshold is 100 people or USD 1M. "Governance
is the upgrade path, not the entry tax" (`docs/marketing.md:7`) describes the feature set correctly
and the licence incorrectly.

Compounding it: the in-product licence file is free and is purely a nag. 30-day trial
(`provisa/licensing/monotonic.py:27`), then a non-fatal out-of-band notice on every protocol that
"**NEVER gates or degrades functionality**", and the message itself says "A license is FREE"
(`provisa/licensing/nag.py:11-45`, REQ-1137 `✅`). That free licence file is a registration
artifact. **It is not the BSL production grant.** Two different things with the same word, one of
them free, and the site is about to publish the free one next to a BSL badge.

What the page must do: state the Additional Use Grant thresholds in plain numbers, name GPL-2.0-or-
later and the four-year Change Date, and separate the free registration licence from the commercial
production licence in two different sentences. Stating a hard, generous, legible threshold is a
*strength* with this audience — Sentry, Elastic and HashiCorp all learned that the hard way by doing
the opposite. And `docs/marketing.md:24` needs correcting at source, today, because it is the line
a salesperson will repeat on a call.

### 1.12 — The CE / Enterprise gate

**Verdict: partial. The feature claim is plausible and I found no paywall in the code; the framing
conflicts with 1.11 and must be rewritten around it.**

`docs/marketing.md:22` claims RLS, column masking, the append-only audit log, ABAC hooks and SSO
(Firebase, Keycloak OIDC) are all in the open-source core, with Enterprise adding only SLA,
dedicated support, advanced audit logging and compliance reporting. There is no edition or tier
check anywhere in `provisa/licensing/` — the module holds anchors, keys, machine id, monotonic
clock, state and the nag, and nothing that gates a capability. That is consistent with the claim and
with REQ-1137's "never gates or degrades functionality".

But "CE is free" and "CE is full-featured" are being used to mean the same thing, and they do not.
Free of charge for a sub-100-person, sub-USD-1M organisation; full-featured for everyone; licensed
for production for neither of the others. Write those as three facts.

One more thing to check before the page ships, which I could not resolve from the repo: "Enterprise
adds advanced audit logging and compliance reporting" implies something the core does not have, and
I found no such split in the code. Either name the specific Enterprise additions or drop the
sentence; a vague "advanced" tier against a product whose audit log is already append-only and
database-enforced invites the question of what was held back.

### 1.13 — SaaS SKU availability

**Verdict: the conclusion is correct — do not imply general availability. The stated reasoning is
stale and must not be repeated anywhere, because an evaluator who reads `requirements.md` will find
the contradiction.**

`docs/marketing.md:18` says the SaaS SKU "requires the productized multi-tenant platform (REQ-073),
which is partial today… per-org schema isolation (REQ-695/702) and at-rest per-tenant config
encryption (REQ-684/685/694) are not [done]."

Every requirement in that sentence says otherwise:

| Requirement | Status in `docs/arch/requirements.md` |
| --- | --- |
| REQ-073 | **↪ superseded by REQ-1243** — not "partial" |
| REQ-1243 (the successor) | ✅ complete |
| REQ-695 per-org schema isolation | ✅ complete |
| REQ-702 org-scoped demo seeding | ✅ complete |
| REQ-684 EncryptionService | ✅ complete |
| REQ-685 envelope encryption | ✅ complete |
| REQ-694 client-owned KMS key | ✅ complete |

So the named technical blockers are closed. **SaaS is still not claimable**, for better reasons:

- `docs/competitive_analysis.md:28` and `:32`, written against the same codebase, say "SaaS: not
  available — disadvantage for buyers who want zero ops" and "Does not currently offer SaaS. On-prem
  and self-hosted only. Architecture supports multi-tenant SaaS… not yet productized."
- `docs/marketing.md:51` says SMB SaaS customers are served manually — "we'll run it for you".
- The published artifact is a `0.1.0` alpha (1.8).
- There is no evidence in the repo of a generally available managed service: no public signup path,
  no published SLA, no pricing page for it.

The site should treat SaaS as **not offered**, not as "coming soon". A managed-service promise with
no SLA and no signup is a liability on an enterprise page, and "on-prem only" is an *advantage* in
three of the four priority verticals — `docs/competitive_analysis.md:29` already argues exactly
that against Apollo and Starburst Galaxy. Lead with it.

And `docs/marketing.md:18` needs rewriting at source. A prospect's technical evaluator who reads
both files finds a self-contradiction in our own documentation, which costs more than the
admission ever would.

---

## 2. Capability gaps in the site's story

First, the brief's hunch, corrected. **Lineage is mentioned but never the subject**, and **ontology
and the glossary are on `why/one-model.html` but have no page of their own.** Measured:

```bash
cd site && for f in index.html why/*.html vs/*.html; do
  printf "%-28s lineage:%s glossary:%s ontology:%s\n" "$f" \
    "$(grep -ci lineage $f)" "$(grep -ci glossar $f)" "$(grep -ci ontolog $f)"; done
```

Lineage: 8 hits on `why/materialized-views.html`, 7 on `why/catalog.html`, 3 on `index.html`, zero
on all three `vs/` pages. Glossary: 5 hits, all on `why/one-model.html`, and the word "glossary"
appears on no other page. Ontology: 5 on `why/one-model.html`, 4 on `index.html`. So "the site has
no page for either" is not right, but "under-sold" is exactly right, and the `vs/` pages — the ones
an evaluator reads — never mention lineage at all.

**2.1 — Column-level lineage, computed statically, with no execution.** This is the most under-sold
thing in the product and it is the strongest thing to lead a Platform page with. Provisa builds
column-level lineage from SQL definitions and command contracts without running anything
(`docs/lineage.md:1-5`), traces an output column back through every CTE, subquery, join and inline
command call, and merges all statements into one federation-wide provenance graph over every view
and materialized view (REQ-1160, REQ-1161, both `✅ complete`). It handles the taint closure across
a command boundary correctly (`docs/lineage.md:33-40`). Every competitor in
`docs/competitive_analysis.md` either buys this from a catalog vendor or does not have it. It is
currently a bullet under materialized views.

**2.2 — The glossary as a real ontology, with one important correction to the brief.** Every
physical column resolves to a term by a deterministic normalization rule — case folding, camelCase
tokenization, abbreviation expansion, proxy-token stripping — so `cust_id`, `customerId` and
`CUSTOMER_KEY` all land on one term `customer`, which has one place to carry the definition
(`docs/glossary.md:17-35`, REQ-1387 `✅`). A concept stays a draft until it reaches data. The
glossary is separate from the metrics by design: a term says what a concept *is*, a metric says how
a number is *computed* (`docs/glossary.md:8`). The glossary and the tag graph are themselves
queryable tables in the meta domain, so an agent can ask what a column means
(`docs/features.md:134`).

**The correction:** the brief says "User-defined ontology." The terms, definitions, domains,
owners and edges are user-defined; the **relationship vocabulary is a closed set of ten types** —
`KIND_OF`, `PART_OF`, `SYNONYM_OF`, `RELATED_TO`, `VALID_VALUE_OF`, `DERIVED_FROM`, `REPLACES`,
`PREFERRED_TERM_FOR`, `TRANSLATION_OF`, `ANTONYM_OF` (`docs/glossary.md:110-123`), and a curator
chooses "from the closed set" (`docs/glossary.md:201`). You cannot define a predicate of your own.
Anyone who actually owns an ontology will ask within thirty seconds whether they can import their
SKOS or OWL vocabulary. Say **"a typed concept graph over your data, with ten SKOS-style relation
types"** — precise, obviously a deliberate design choice, and it does not invite a question we
cannot answer. (There is a `sparql` source type for reading RDF triplestores, which is a separate
and also under-sold capability.)

**2.3 — Metrics defined once, usable in each surface's native syntax.** `docs/features.md:109-123`:
a metric is a named governed aggregate with its own definition, fact and entity roles on tables
carry through, and the Explore page composes SQL from metrics, facts and dimensions scoped to the
domains the user holds. "Metrics and aggregates" is one of the few groups marked Available. Every
semantic-layer competitor sells exactly this and the site barely says it.

**2.4 — Regions and data residency.** Also marked Available. One shared model, clusters in several
regions each with their own nodes, engine, replica storage, cache and record; a table can name a
home region so whole-table copies are built only there, and readers elsewhere are served from that
replica with their own rules applied (`docs/features.md:197-211`). For a European or a public-sector
buyer this is a procurement gate, and the site does not mention it.

**2.5 — Environments, with synthetic data.** A non-production environment can hold synthetic
datasets generated to match the real shape, its own copies of file sources and its own derived
stores, all destroyed with it; temporary environments expire and cannot use the admin mutation
bypass (`docs/features.md:183-196`). "How do I give developers a realistic non-prod without copying
production data" is a question every regulated buyer asks and nobody on this list answers well.

**2.6 — The approval hook.** For rules too complex to express as a row filter, Provisa calls out
before the query runs, over webhook, gRPC or Unix socket, switchable per table, per source or
deployment-wide, with a circuit breaker and a reused gRPC channel (`docs/features.md:318`). This is
the answer to "our policy engine is OPA / our DLP tool owns this decision", and it is absent from
the site.

**2.7 — Client-held encryption keys on bulk results.** Results written to S3 or Iceberg can be
encrypted with a key only the client holds; the JDBC driver, Python client and GraphQL clients
decrypt client-side, so the server never sees the clear text, and the key can be a CMK in the
customer's own cloud account (`docs/features.md:404`). Combined with REQ-694's revoke-to-render-
unreadable, this is a stronger data-sovereignty story than anything in the comparison set.

**2.8 — Engine cold-start behaviour, told as a feature rather than hidden.** On the hosted
deployment engine shards scale to zero when idle; a query arriving cold waits rather than failing,
the wake happens before dispatch so the statement runs once with its full retry budget, sign-in
prewarms the org's shard, a moved coordinator is re-resolved and the statement redispatched once,
and the UI shows a timed banner while the state is `starting` (`docs/engines.md:107-142`, REQ-1448
and REQ-1516, both `✅`). Operators have been burned by serverless query engines that fail the
first query. Saying plainly what happens is a trust-builder. Note it applies to the hosted
deployment only — desktop and self-hosted are always-on.

**2.9 — The governed plan is inspectable.** Query stats, a Mermaid plan diagram built from the
**governed** plan after RLS and masking, with each optimization that fired as its own node, and
`POST /data/sql/explain` wrapping the governed SQL in the dialect's EXPLAIN — `analyze: true` runs
it for real (`docs/engines.md:144-172`, REQ-1517 `✅`). A supported dialect table exists; others
return 400. "Show me the SQL you actually ran under my role" is the demo that closes a sceptical
platform engineer, and the site never offers it.

**2.10 — The Hasura v2 migration importer.** Marked Available; `docs/marketing.md:36` calls it the
top-of-funnel hook. It has no page. If the PLG motion is real, it needs one.

---

## 3. Where the argument is weak

This is the part I was asked for most, so it is blunt.

**3.1 — "Stays in its lane" is the wrong frame, and it is the wrong frame for a specific reason.**
Discipline is not a benefit; it is a description of what we did not build. Nobody buys restraint.
And the frame is also not quite true: Provisa ships 32 engine keys, an embedded Trino, an embedded
ClickHouse, a materialization store, a replica builder, a response cache, a vector index, a
subscription fabric and a chat assistant. A Denodo evaluator who has heard "we're just a thin layer"
and then reads `docs/engines.md` will conclude we are not being straight with them.

The frame that does the same work and is defensible: **the data does not move, and the engine is
yours.** It is specific, it is falsifiable, it is what the live/replica matrix in 1.3 actually
proves, and it converts a negative ("we don't do compute") into the buyer's own constraint ("I
already bought compute"). Everything the spine wants from "stays in its lane" — no lock-in, no
migration, no duplicate copy — follows from it, and none of it requires claiming we are smaller
than we are.

**3.2 — The four claims are in the wrong order for this reader.** Reach first is a connector-count
argument, and connector counts are the one thing every competitor claims, so it lands as noise and
it invites the one number we cannot defend (1.2). The reader described in the brief — runs a lot of
Apache software, wants technical answers — already has Trino. They do not need reach; they need a
reason the thing above Trino should be us and not dbt plus Immuta plus a catalog.

Lead with **governance that compiles**. It is the only one of the four claims that is structurally
unavailable to the alternatives: six layers rewritten into one canonical governed statement before
anything executes, identical across SQL, GraphQL and Cypher, with no bypass path (REQ-266 `✅`), and
a plan you can EXPLAIN to prove it (2.9). "Catalogues tell an agent what it should do; Provisa
enforces what it can do" (`docs/marketing.md:5`) is the best sentence in the material and it is
buried in the third claim. Then one model and three languages, then reach as the proof that the
model spans the estate, then semantics.

**3.3 — No cost-based optimizer, and the site has no answer.** `docs/competitive_analysis.md:15`
concedes it in our own words: "No Cost-Based Optimizer… Starburst exceeds Provisa on raw CBO depth
for complex ad-hoc analytical queries," and `:14` adds "Exceeds Provisa on raw query scale and CBO
maturity." A Starburst SE will raise this on the first call. The site currently says nothing, which
means the first time a prospect hears it, they hear it from Starburst.

The answer exists in the same paragraph and is good: Provisa is not competing on ad-hoc analytical
plans, because the engine under it does that. What it has is a structural coupling the CBO argument
misses — **an approved relationship is simultaneously a governance artifact and an optimization
hint**. The join shape a steward approves is exactly what the materialized-view optimizer needs, so
cross-source relationships generate pre-materialized joins automatically and stewards get query
acceleration as a byproduct of governing. Plus hot-table value CTEs and transparent MV rewrite. Say
that, concede the CBO in the same breath, and name the workload boundary: repeated lookups and known
join shapes, not ad-hoc exploratory scans. Conceding one thing precisely is what makes the other
twenty claims readable.

**3.4 — The agent and AI story is strong, scattered, and undefended.** Governed MCP, a per-role
proto, NL→SQL/Cypher/GraphQL with a validation loop, Claude-powered relationship discovery, vector
search with governed embedding columns where visibility is all-or-nothing because a vector cannot be
partially masked, and the enforce-versus-advise distinction against catalogs. Those add up to the
clearest "why an agent needs a governance layer" argument in this category, and they are spread
across five feature groups and three pages. Either commit a page to it or cut it to one sentence on
Home. Half-telling it is the worst option, because the claim is currently strong enough to attract
the question "so what stops the agent" without being assembled enough to answer it.

**3.5 — Questions a Trino or Starburst evaluator will ask that we currently cannot answer.** Each
one needs an owner before the page that touches it ships.

| Question | Where we stand |
| --- | --- |
| "What is the overhead of your layer on a query my cluster already runs?" | **No answer.** The harness measures Provisa CPU per request (`docs/sizing.md:22`) and no results are committed. This is the first question and we have nothing. Highest-priority gap in the whole audit. |
| "You have no CBO. What happens to my 40-table join?" | Answer exists (3.3), not on the site. |
| "Who else runs this in production?" | No reference customers, no logos, no case study. `docs/marketing.md:61` concedes 2–3 are needed before the enterprise motion scales. Do not fake it; a founder-led "first release, talk to us" is more credible than a wall of grey rectangles. |
| "Your pgwire/Bolt/Flight servers are new code in the data path. Who has pen-tested them?" | No third-party assessment in the repo. A fair question for a product that terminates five protocols. |
| "Show me RLS holding under a hostile query" | Strongest demo available: the predicate guard refusing a masked column in a `WHERE` (Layer 5), then `EXPLAIN` on the governed plan. Build it as a page asset. |
| "My estate is 400 tables. How long to model it?" | AI relationship discovery and automatic glossary derivation are the answer and neither is quantified anywhere. |
| "GPL-2.0-or-later after four years — can I embed this?" | See 1.11. Legal will ask, and our own marketing doc currently has the wrong answer. |
| "What is your release cadence and what breaks between versions?" | No published versioning or compatibility policy. Alpha version string makes this sharper. |

**3.6 — Where the positioning under-claims.** Three things are stronger than how they are currently
told. Static column-level lineage with no execution (2.1) — the catalog vendors charge for a worse
version. Client-held encryption keys with revoke-to-unreadable (2.7) — a data-sovereignty story
nobody in the comparison set can match. And the deployment range: the same product, the same config
and the same governance from a `pip install` on a laptop to an air-gapped HA cluster
(`docs/competitive_analysis.md:28`). Starburst has no laptop story at all; Apollo has no on-prem
control plane. That breadth is being spent on a single footnote about Docker.

**3.7 — Where it overreaches.** Consolidated so the Content Manager has one list: "85+" (1.2);
"full pushdown… 60M-row" (1.3); the SaaS source names (1.4); "No invalid join ever runs on your
data" (1.6); "sub-100ms" (1.7); "the whole system" for the embedded wheel (1.8); Starburst as a
supported engine (1.9); HIPAA, FedRAMP, SOC 2, PCI-DSS (1.10); "converts to Apache 2" and the use
grant (1.11); "Exceeds all" as a comparison verdict — it appears eleven times in
`docs/competitive_analysis.md` and is the voice of a sales sheet, not of a technical comparison.
Keep the comparisons, convert every "exceeds all" into a specific capability difference, and keep
every concession already in that file. The concessions are what make the rest believable.

---

## 4. Per-page claim sets

Claims in landing order. Every item is cleared at the verdict given in part 1 and may be written
straight from here. A claim not on this list is not cleared; send it to me before it goes to the
Designer.

### Page 1 — Home

1. **Positioning.** "Federation, metrics, ontology and governance from one model. Nothing to keep in
   sync." Verified as positioning. Do not append the compliance hooks.
2. **The enforce-versus-advise line.** "A catalog tells an agent what it should do. Provisa enforces
   what it can do." Verified, `docs/marketing.md:5`. This is the hero sentence — put it above the
   fold.
3. **Governance compiles into the plan.** Five enforcement layers rewritten into one canonical
   governed statement before anything runs, identical in SQL, GraphQL and Cypher, with no query path
   that skips it. Verified, REQ-266. **Five, not six, until REQ-1959 closes (1.6).**
4. **Approved joins.** "Every join in SQL and Cypher must match a relationship someone approved. In
   high-security mode that is not bypassable, by anyone." Verified per the 1.6 rewrite. **Never the
   absolute form.**
5. **Ask once in English; six governed surfaces answer.** SQL, GraphQL, Cypher, gRPC, JSON:API and
   OpenAPI, each generated for the asking role and run through the same compiled governance.
   Verified per 5.1a. **This is the spine as of 2026-10-14 and it replaces "three languages, one
   model" in every spine position on this page, the §5 CodeTabs block included.** All three
   qualifiers in 5.1b must be visible where it appears — particularly that six is the capability,
   not a count the reader should expect to see. The three query languages remain the right claim
   where the sentence is about query languages; see 5.1c.
6. **Five listeners, nine ways in.** pgwire, Bolt, Arrow Flight (carrying Flight SQL, JDBC and
   Airport), gRPC, HTTP (GraphQL, REST, JSON:API, OpenAPI, MCP, WebSocket). Verified per 1.5.
   **Not "nine protocols".**
7. **Reach.** "72 source types. On a Trino engine, 63 are reachable and 37 are read live with no
   copy." Verified per 1.1 and 1.2. **No 85+.**
8. **The data stays where it is.** Warehouses through their own Iceberg catalogs; ClickHouse and
   MongoDB live; Salesforce and ServiceNow live with predicates pushed into the API. Verified per
   1.3 and 1.4. **No Stripe, HubSpot, Airtable, Notion or Auth0 in a live-reach sentence.**
9. **The engine is yours.** 32 engine keys; run on the Trino cluster you already have. Verified per
   1.9. **No Starburst by name.**
10. **Smallest install.** `pip install "provisa[embedded]"` — no Docker, no JVM, no root. DuckDB
    engine; Python 3.12; not Linux aarch64. Verified per 1.8, with all three qualifiers visible.
11. **Licence, stated plainly.** BSL 1.1. Free for production use under 100 people and USD 1M;
    a commercial licence above that; GPL-2.0-or-later four years after each release. Verified per
    1.11. **This belongs on Home, not buried on a pricing page.** Stating a hard threshold reads as
    confidence.

Not on Home: any compliance name, any latency number, any SaaS implication, "stays in its lane".

### Page 2 — Platform

1. **One model, many surfaces.** Every request compiles to one canonical PostgreSQL-style statement
   and is then translated to the dialect of wherever it runs, so the protocol you connected with
   does not change the SQL. Verified, `docs/features.md:668`.
2. **Routing, as mechanism not as a number.** A single-source statement bypasses the federation
   engine and goes to the source's own driver, transactionally. Cross-source statements fan out
   through the engine. Both governed identically. Verified, REQ-027. **No "sub-100ms" (1.7).**
3. **Live versus replica, named per source.** The three-way table from 1.3. Say which sources push
   aggregates and which push predicates only. This table is the single most persuasive asset on the
   site for this reader, because it is a concession-bearing table and it is reproducible.
4. **Column-level lineage with no execution.** From one statement, traced through CTEs, subqueries,
   joins and inline command calls; merged into one provenance graph across every view and
   materialized view. Verified, REQ-1160/1161 (2.1). **Give this real space — it is currently a
   bullet under materialized views.**
5. **Metrics defined once.** A named governed aggregate usable in each surface's native syntax;
   facts and dimensions compose in Explore within the caller's domains. Verified (2.3).
6. **The concept graph.** Every column resolves to a term by a deterministic rule, so `cust_id`,
   `customerId` and `CUSTOMER_KEY` land on one `customer` with one definition. Ten SKOS-style
   relation types. Separate from the metrics by design. Verified per 2.2. **"Ten relation types",
   never "user-defined ontology".**
7. **The engine is a component.** Six federating engines read in place; five warehouse engines
   execute what they reach and land the rest; twenty SQLAlchemy keys land everything. Verified per
   1.9. Lead with the gradient, not the count.
8. **Inspectable plans.** Query stats, a plan diagram built from the governed plan after RLS and
   masking, and `EXPLAIN`/`EXPLAIN ANALYZE` on the SQL that actually ran under your role. Verified,
   REQ-1517 (2.9).
9. **Freshness is a setting.** Live, replica with a TTL, or CDC row-by-row — Debezium topics
   including Avro, MongoDB change streams, Kafka and WebSocket through one path. Verified,
   `docs/features.md:830`.
10. **Deployment range.** Same product, same config, same governance from a laptop wheel to an
    air-gapped HA cluster. Verified, `docs/competitive_analysis.md:28` (3.6).

### Page 3 — Governance

1. **Lead with the compiler, not the feature list.** Governance is not a filter applied to results;
   it is a rewrite of the statement before execution, at one place every surface goes through.
   Verified, REQ-266.
2. **The layers, in order, each with where it is enforced.** Use the 1.6 table verbatim. **Five
   complete layers.** Hold Layer 1 (public columns) until REQ-1959 closes.
3. **The predicate guard, explained.** A masked column is refused in `WHERE` and `HAVING` at parse
   time, because otherwise a caller binary-searches the value they cannot see. Verified, REQ-531.
   This is the detail that tells a security reviewer someone thought about it.
4. **Approved joins, with the honest boundary.** Policy, not a hard boundary; two bypasses, both
   named; unbypassable in high-security mode even for a role granted the bypass in error. Verified
   per 1.6. **Publishing the bypasses is what makes the high-security claim land.**
5. **Domain access as composition.** A query executes within a domain plus what is reachable by
   approved traversal; everything else is absent, not denied. Verified, REQ-038/039.
6. **Per-role schemas.** The GraphQL SDL, SQL information schema, Cypher label catalog and gRPC
   proto are generated per role; unauthorised objects are structurally absent. Verified, REQ-039.
7. **The approval hook.** Webhook, gRPC or Unix socket, scoped per table, per source or
   deployment-wide, with a circuit breaker. Verified (2.6). This is the answer to "our policy engine
   owns this decision".
8. **The access record.** Append-only; tenant, user, role, query hash, tables, source, status,
   duration; query text never stored in the clear; written at the single governed pipeline so no
   surface can skip it; UPDATE and DELETE refused by the database itself. Verified per 1.10 —
   **with "on a PostgreSQL control plane" attached to the immutability sentence.**
9. **Keys you hold.** Envelope encryption, AES-256-GCM, unique DEK per payload; the org master key
   is a CMK in your own KMS; Provisa never stores raw key material; revoke the grant and the data is
   unreadable. Verified, REQ-685/694.
10. **Client-side decryption of bulk results.** Verified (2.7).
11. **Controls, not certifications.** Use the 1.10 suggested language and link
    `docs/exports/traceability_matrix.csv`. **No HIPAA, FedRAMP, SOC 2 or PCI-DSS anywhere on this
    page.** This is the hard line in the whole audit; I will not sign a page that crosses it.

### Page 4 — Interfaces

1. **One model under every surface.** GraphQL is the canonical schema; REST, JSON:API, OpenAPI and
   gRPC are derived from it. Verified, `docs/features.md:427`. **This page is where the spine's
   six surfaces are proved**: the same derivation that makes gRPC and JSON:API free of extra
   modelling is why one English question can come back on all six (5.1a). Lead with it here.
2. **Governance is uniform; command invocation is not.** State the first, qualify the second.
   Verified per 1.5.
3. **The five listeners and nine ways in**, as a table with the mapping shown so JDBC and Airport
   sit visibly under Flight. Verified per 1.5.
4. **pgwire.** BI tools and anything with a Postgres driver; simple and extended query protocols,
   multiple statements, positional and binary parameters, cursors, COPY; DBeaver browses through the
   usual catalog queries; SCRAM-SHA-256; SQL only. **The listener is off until a port is set.**
   Verified, REQ-527/529.
5. **Bolt.** Neo4j Browser, Bloom and the Neo4j drivers run Cypher; each of the user's roles appears
   as a database. Verified, REQ-802/806.
6. **Arrow Flight.** Batch-by-batch streaming so a full result never sits in memory, Flight SQL,
   ADBC clients, and the JDBC driver moving Arrow over Flight. On Trino the route goes through a
   Flight SQL proxy and **fails rather than silently rerouting** if it is down — say that; a
   platform engineer reads it as honesty, not as a limitation. Verified, REQ-045/143/1216.
7. **Airport.** DuckDB attaches to Provisa as a catalog; each role sees only its own columns; writes
   held in a transaction until commit. Verified, REQ-1120/1121.
8. **gRPC.** A proto generated per role, showing only that role's tables and columns; role selected
   by call metadata; stable field numbers; an HTTP proxy for clients that cannot speak gRPC.
   Verified, REQ-525.
9. **MCP.** Governed tools for agents. **On by default only in the desktop build, bound to
   loopback.** Verified, REQ-1101/1104.
10. **Streaming and large results.** pgwire, Flight SQL and gRPC receive rows as the engine produces
    them; oversized results are written to object storage and returned as an expiring presigned
    link, Parquet and ORC written by the engine straight to the store so the data never passes
    through Provisa. Verified, `docs/features.md:738-741`.
11. **Subscriptions.** WebSocket, SSE and a Kafka sink, governed with the same RLS and masking as a
    read. Verified, `docs/features.md:794-816`.

### Page 5 — Compare hub

The job of this page is to be the page a competitor's field team cannot quote against us. That means
the concessions are the feature.

1. **Frame it as fit, not as a scoreboard.** Four honest positions: *you already run a query engine
   and need governance and a semantic model above it* — Provisa; *you need the fastest ad-hoc
   analytical plans over a lake* — Starburst, and keep it; *you need a graph database for deep
   traversal and GDS* — Neo4j; *you need to compose GraphQL services your teams already built* —
   Apollo.
2. **What is structurally different**, three rows only: six governance layers compiled into the
   statement rather than filters applied around it; three query languages over one model; the engine
   as a swappable component rather than the product. All verified.
3. **What we concede, in our own voice.** No cost-based optimizer; Starburst exceeds us on raw query
   scale and CBO maturity for ad-hoc analytical work; no SaaS offering; Cypher does not cover GDS
   analytics or APOC; unbounded path queries are not supported; first release, no public reference
   customers yet. Every one of these is already in `docs/competitive_analysis.md:14-15` or
   `:28-32`. **Publishing them is the single highest-credibility act available to this site.**
4. **Replace every "exceeds all"** with a specific capability difference and a link to the page that
   proves it. Eleven occurrences (3.7).
5. **The migration row.** Hasura v2 metadata importer, DDN supergraph converter, and Provisa exposing
   itself as an Apollo Federation v2 subgraph so an existing supergraph does not have to be
   replaced. Verified, `docs/competitive_analysis.md:30`, `:31`, `:33`.
6. **No competitor-capability claim ships without a date.** Their roadmaps move; ours is the only
   thing we can be sure of. Date-stamp the page and say what version of each product it was written
   against.

### Page 6 — vs Starburst

The current page (`site/vs/starburst.html`) is a six-row table with no concessions and three claims
I have struck. It reads as a vendor flyer. Rebuild it:

1. **"If you run Starburst, keep it."** Open with it. Provisa runs on a Trino-protocol coordinator —
   including the one you already operate — as a `trino-byo` engine. Verified, REQ-840/916.
   **Describe it as "a Trino-protocol coordinator, including the one you already run", not as
   "Starburst" (1.9).**
2. **What Starburst is better at, first and unhedged.** Mature cost-based optimizer with statistics
   collection; greater raw query scale; deeper analytics connector ecosystem for lake workloads;
   Galaxy is a real managed service and we have none. All from
   `docs/competitive_analysis.md:14`, `:15`, `:28`, `:32`. Putting this first is what makes everything after it
   readable.
3. **The actual difference: what sits above the engine.** Six compiled governance layers versus
   query-level row filters and column masking applied per connector type; per-role generated schemas
   across four surfaces; a domain traversal model no competitor in the set has; a semantic model with
   metrics and a concept graph. All verified.
4. **Three languages, not one.** Starburst is SQL only. Provisa adds GraphQL and Cypher over the
   same model, with governance applied identically. Verified,
   `docs/competitive_analysis.md:11`.
5. **Application surfaces, not just analytics consumers.** gRPC with a per-role proto, REST and
   JSON:API, WebSocket and SSE subscriptions with a Kafka sink, governed MCP. Starburst has
   SQL/JDBC and Flight. Verified, `docs/competitive_analysis.md:13`.
6. **Transactional single-source writes** routed to the source's own driver, not engine-mediated
   analytical writes. Verified, REQ-027. **Strike "sub-100ms" from the existing row (1.7).**
7. **Smallest deployment.** `pip install "provisa[embedded]"` against Galaxy-or-a-cluster, with the
   three qualifiers from 1.8 kept. Verified. **Strike "no Docker, no JVM, no root" as an unqualified
   row** — keep the phrase, add the DuckDB-engine and Python-3.12 caveats in the same cell.
8. **Where the two overlap and we do not claim to win.** Both federate; both push predicates down.
   Say it. A comparison page that claims eight of eight is read as eight of zero.

### Page 7 — Data residency (`/why/data-residency`, new)

Verified against the code and the requirements, not against `docs/regions-demo.md`. Read the claim
strength verdict first: it changes what the rest of this list is allowed to sound like.

**Claim strength: narrow page, cleared. Strong page, refused. Ratified 2026-10-14 — the page ships
narrow, with the Swiss/German worked example as a sketch.** That decision is now the brief for
whoever builds the page: everything below is in scope, nothing above the line is, and the worked
example at the end of this section carries its two mandatory fixes into the sketch — it is drawn as
a modelling choice someone made, not as behaviour the platform imposes.

The enforcement code is present and
specific — `provisa/security/residency.py` (REQ-1921), `provisa/federation/query_residency.py`
(REQ-1922), `provisa/core/regions.py` (REQ-1921/1922) — with unit, UI and e2e tests
(`tests/unit/test_data_residency.py`, `provisa-ui/src/pages/__tests__/SecurityPage.residency.test.tsx`,
`provisa-ui/e2e/regions-demo.spec.ts`). The *demonstration* is not. `docs/regions-demo.md:8` still
reads "scaffolded, not yet provable", still says the two regions share one Postgres and depend on
region-qualified schema and cache names, and `:56` still has the draft-table step pending. So: the
page may describe the model and the refusals, because those are in code. It may not invite anyone to
watch two regions run, and no screenshot of the demo may appear on it. A bank's architect will ask
for a reference deployment; the honest answer today is a design walkthrough, not a demo.

1. **Regions are declared, in two places, and the page must say both.** The *platform* declares the
   physical regions its nodes run in — an id and the address those nodes answer at
   (`platform.regions`). An *org*'s model then selects which of those it uses and names, for each,
   the stores it keeps there: engine, replicas, views, cache, state, request record. Verified,
   `provisa/core/regions.py:11-26` and `STORE_ROLES`. **Not "declare your regions in one manifest".**
   A region is a platform fact an org opts into, which is the part a hosting-sceptical buyer
   actually wants to hear.
2. **No regions declared means one implicit region, and nothing in a model may name one.** Verified,
   `DEFAULT_REGION` in `regions.py`. Worth one sentence: residency is off until you turn it on, so
   it costs a single-region deployment nothing.
3. **A table is homed to a region; its data is replicated and read only from that region's stores.**
   Verified, `regions.py:11-20` (REQ-1922). A table naming no region may be copied in every region.
   A materialized view may name a region too, and is read only from its copy there (`read_home_views`,
   REQ-1921). **A source's region decides nothing** — it is the default the admin form starts a new
   table of that source in ("a table carries its own region; a source's region is its default").
   State that explicitly; an auditor who thinks the source is the boundary will mis-model the whole
   deployment.
4. **A read is refused by name when the home region is not there.** A homed table in service is read
   only from its home-region replica, never live; whether that replica is built is the home region's
   own record, read from the home region's state store, and a store that cannot be reached refuses
   the read the same way. Verified, `query_residency.require_home_replica` → `HomeRegionUnavailable`,
   error code `query.home_region_unavailable` (REQ-1922). A draft table has no replica, so it is read
   live and only from its own region (`require_draft_read_in_its_region`). This is the strongest
   operational claim on the page: the failure mode of a region going dark is a named refusal, not a
   silent partial answer.
5. **`data_residency` is the right to *set* where data lives, and an org admin alone cannot move
   data.** Verified and enforced, `provisa/security/residency.py` (REQ-1921): setting, changing or
   removing the region of a table, source or materialized view needs the `data_residency` right
   *beside* the domain ownership the edit needs anyway; a grant lists the values it covers (the org's
   regions plus "no region"); a move from P to Q needs both covered, a new object needs only Q, and a
   draft needs only Q. The refusal names the value that is not covered and distinguishes two cases in
   its error code — `security.data_residency_refused` (holds a grant that does not cover it) and
   `security.data_residency_missing` (holds no grant at all). **Qualifier that must travel with this
   claim: it is write-side only.** `data_residency` is not a read filter; what a reader sees across
   regions is governed by RLS (`regions-demo.md:46,53`). Selling it as a read control is the one
   mistake on this page that would be called out in a security review.

**Struck — do not publish, in any wording:**

- **"Data does not leave its region unless a rule allows it."** What is enforced is where data is
  *stored and replicated*. There is no residency rule object and nothing refuses a cross-region read
  of a table that is homed and built. See the limit below.
- **"Nodes behave as service accounts, with node-to-node rules for masking and aggregation
  limits."** Not in the code and not in `docs/regions-demo.md` either. The cross-region path is the
  reading engine attaching the home region's replica store `READ_ONLY` by DSN
  (`duckdb_runtime.attach_region_store`), not an authenticated node-to-node call that the home
  region's governance can filter. And no aggregation-limit primitive exists anywhere: there is no
  minimum group size, no k-anonymity, no aggregate-only mode. (`is_aggregate_only` in
  `provisa/nl/runner.py:117` is a query-shape flag in the natural-language path, not a control.)
  RLS and column masking are real, but they are compiled by the **reading** node from the one shared
  model, so the enforcement point is the reader. If the page wants to say governance follows the data
  across regions, the true version is "one model, so the same rules compile on both sides", and that
  is worth saying.
- Any compliance or regulation name — GDPR, Schrems II, FINMA, the EU Data Act. Nothing in §1.10
  changed. A residency page is exactly where a reader expects one of these names, and exactly where
  putting one costs us the deal when procurement asks for the artifact behind it.

**The honest limit, with one correction to how it was described to me.** The leak is not specific to
aggregates. A cross-region read of *any* shape lands rows in the reading region's engine process,
because that engine attaches the home region's store and reads its tables as they are
(`query_residency.read_home_replica` → `duckdb_runtime.attach_region_read`, which forwards to
`attach_region_store` and discards the schema/table/build arguments). An aggregate is simply the
most common shape in which someone notices. The recommended answer is accurate and supported: build
the materialized view inside the permitted region, home the view there, and expose only the view —
a view that names a region is read only from its copy there and is refused by name when that copy is
not built or its store cannot be reached (`read_home_views`, REQ-1921). **But the refusal is a
property of the pattern, not of residency.** Nothing stops a query reading the raw homed table
instead, if that table is also in the model and built. So write it as the modelling pattern it is —
*home the aggregate, not the rows* — and do not write, or let a diagram imply, that Provisa refuses
the other shape. One sentence of the form "this is the model we recommend; the product supports it
rather than requiring it" is what makes this page survive an architecture review instead of
collapsing in it.

**The Swiss/German worked example: publishable, with two fixes.** Client rows homed per country —
yes, table-level region (3). A Swiss materialized view of deposits by canton, homed in `ch` — yes, a
view may name a region. Frankfurt reading only that view — yes, and the refusal when the Swiss views
store is unreachable is real (4). Two fixes before it ships: (a) "Frankfurt reads only the view" is a
modelling choice, not an enforced boundary — if the `ch`-homed client table is in the same model and
built, a Frankfurt-side query can read it subject to RLS, so the example must say that the model is
what keeps Frankfurt on the view; (b) row-level security "limiting by home region" must be shown as a
rule over an ordinary column in the data (a `home_region` column), because RLS does not read the
object's region metadata — the page must not suggest the two are wired together. Also: no bank name,
no "a European bank we work with", no implied customer. A configuration sketch, labelled as one.

### Page 8 — vs Hasura (`/vs/hasura`, now Phase 1)

The importer is `provisa/hasura_v2/` — `parse_metadata_dir` (parser.py), `convert_metadata`
(mapper.py), remote schemas in remote_schema.py, filters in `provisa/import_shared/filters.py`,
warnings collected through `provisa/import_shared/warnings.WarningCollector`. Everything below is
read off those files. On this page the warnings list is the credibility, so it is written first and
in full.

**Correction to the brief, before anything else.** Webhook actions and cron triggers are *not*
reported as warnings, so the page must not say they are — the reader can disprove it in ten minutes
and will then disbelieve the rest.

- An action whose handler is `http(s)://` converts to a webhook, carrying its URL, its typed
  arguments, mutation-or-query kind, and the action's permitted roles as `visible_to` (an action with
  no permissions goes to `org_admin` alone, as Hasura answers it). `mapper.py:_map_action`. Only a
  **non-HTTP handler** warns, and lands as a function placeholder (`mapper.py:531`).
- A **cron trigger** converts to a scheduled trigger with its schedule, webhook URL and enabled flag
  (`mapper.py`, "Cron triggers -> Scheduled triggers").
- An **event trigger** is the one that warns: "converted with limited fidelity (webhook: …)"
  (`mapper.py:481-487`). It converts; the fidelity gap is what the operator must check.

**Carries over — cleared to publish, each with its qualifier:**

1. **Sources:** `postgres`, `pg`, `mysql`, `mssql`, `citus`, `bigquery` (`mapper.py:50-57`).
   **Qualifier: name those six.** Any other `kind` silently becomes `postgresql`
   (`_source_type_from_kind`, no warning), so a GDC-era source converts to a wrong source type
   quietly. Never "any V2 source".
2. **Tracked tables and custom names:** `custom_root_fields.select`, `select_by_pk` or `custom_name`
   becomes the table alias (`mapper.py:276-282`, `387-391`). Qualifier: one alias wins, in that
   order; separate names for select and select-by-pk collapse to one.
3. **Object and array relationships**, with their column mapping, arrays as one-to-many. Qualifier,
   and it belongs on the page because it is good behaviour: an object relationship declared by FK
   column alone, where the export names no target and no inverse array relationship exists, is
   **dropped with a warning** that tells the operator to declare it with `manual_configuration` or
   add it after import (`mapper.py:429`, REQ-1680).
4. **Select permissions** become column visibility (`visible_to` per column) plus row rules compiled
   from the permission filter into RLS rules (`mapper.py:329-349`, `404-414`).
5. **Insert and update permissions** become writable columns (`writable_by` per column) and a `write`
   capability on the role (`mapper.py:351-372`, `217-224`). `org_admin` is added to every column's
   visibility and writability (REQ-1684), matching Hasura's implicit admin.
6. **Inherited roles:** the role is created and the set's roles are created.
   **Qualifier that must be on the page in plain words: only the first role in the set becomes the
   parent** (`mapper.py:202`, "simplified mapping"), and nothing warns. A V2 role inheriting from
   three roles arrives with one. An ex-Hasura SE will test this specific thing.
7. **Computed fields** become functions returning the table (`mapper.py:467-479`).
8. **Tracked functions** become functions.
9. **Remote schemas** land as tables in a `graphql` schema, with per-role column visibility read out
   of each role's permission SDL and root-field arguments becoming `_nf_<arg>` parameter columns
   supplied at query time (REQ-1986, REQ-1684). **Qualifier: only when the export carries role
   permissions.** A remote schema with none lands nothing and warns (`remote_schema.py:106`); an SDL
   that does not parse warns per role (`:124`); nested fields that could not be landed as columns
   warn by name (`:183`).
10. **Permission filters:** `_and`, `_or`, `_not`, `_exists`, eighteen scalar operators, and Hasura
    session variables — `X-Hasura-User-Id` becomes `current_setting('provisa.user_id')`
    (`filters.py:20-38`, `43-77`, `100-157`). This is the part that makes a V2 operator believe the
    rest, so show one before-and-after filter on the page.
11. **Auth from env:** firebase, keycloak, oauth/JWK providers; admin secret becomes the superuser;
    `CLAIMS_MAP` becomes role mappings. Warns on `AUTH_PROVIDER=webhook` (unsupported — the operator
    must choose a provider) and on `CLAIMS_MAP` that is not valid JSON.
12. **`api_limits.yaml`** becomes per-role rate and query-complexity limits (REQ-1174). Relay
    pagination follows `graphql_engine.enable_relay`.

**Does not come across — publish this list, it is the page:**

- `query_collections`, `allowlist`, `rest_endpoints`, `network`, `opentelemetry`: not converted
  (`parser.py:420-423`). Internal note, not for the page: that report fires for a single inline
  metadata document, because the directory reader never opens those files — a `metadata/` directory
  export says nothing about them. The page should list them as not converted either way.
- **Per-role row limits and aggregation denials.** `limit` and `allow_aggregations` are parsed into
  the model (`models.py:25-28`) and never applied by the mapper. A V2 role capped at 100 rows, or
  denied aggregates, arrives with neither.
- **Insert and update `check` expressions** — the write-side predicate — are parsed and not applied.
  Column presets are not handled. Delete permissions only raise the role to `write`; the per-table
  delete rule is not carried.
- **Permissions that traverse a relationship.** `{author: {id: {_eq: "X-Hasura-User-Id"}}}` — the
  commonest V2 permission idiom after a plain session-variable equality — does not convert: the
  relationship name is treated as a column and its inner operator falls through to the unsupported
  branch, emitting `author /* unsupported op: id */` into the rule (`filters.py:150`). An unknown
  top-level `_`-operator is skipped outright (`filters.py:131-132`). **Both widen the rule, and
  neither warns.** This is the most consequential gap on the page and the first thing a sceptical
  reader will try. It is also a defect, not merely an undocumented limit, and is filed separately —
  but the page ships with it disclosed either way.
- **JSONB, PostGIS and column-comparison operators** (`_contains`, `_has_key`, `_st_d_within`,
  `_ceq`, `_cgt`, …) are not in the operator table (`filters.py:21-38`).

**The sentence I would put on the page**, because it converts the gap list from a liability into the
reason to trust the page: *"The importer converts your metadata and reports what it could not. Read
the report — it is the point. Permissions that traverse a relationship, per-role row limits,
aggregation denials and insert check constraints do not come across. Event triggers come across with
limited fidelity. An inherited role with more than one parent keeps one. All of that is work you redo
by hand, and we would rather you saw the list now than in the first hour of a trial."*

**Verdict on the "you have to migrate either way" framing: do not assert it.** It is four claims
wearing one coat, and only one of them is ours.

- "DDN is a different model, and moving to it is migration work, not an upgrade" — defensible, if
  phrased about the work and sourced to the published migration path. Keep that one.
- "V2 gets little attention" — a claim about a competitor's internal roadmap priorities.
  Unverifiable by us, stale the moment a V2 release lands, and the sentence that makes a reader who
  still likes Hasura stop reading.
- "Cloud-first pricing" — about someone else's price list, which changes without telling us. If it
  appears at all it needs a dated citation, the way the Starburst column is dated (PRO-7).
- "You have to migrate either way" — asserts the reader's future. They will decide that; being told
  it is what makes warm outbound feel like cold outbound.

This page is read by someone a former colleague sent it to, and in many cases by someone who built
the thing we are comparing against. Criticising their former employer's roadmap costs more
credibility than it buys. State what the importer does, state what it will not carry, and let the
person who has already read the DDN migration guide reach their own conclusion. One framing sentence
is cleared: *"If you are staying on V2, nothing here is urgent. If you are being moved off it, you
are already doing a migration — this is a comparison of destinations."* That is about the reader's
situation, not about Hasura's plans.

Also on this page, by inheritance: no SaaS implication in any tense (1.13), the three-languages claim
as cleared in Page 1 item 5, and reach numbers only in the Page 1 item 7 form.

---

## How to use this with the page queue

For each page, the claim set above is the baseline. When a page comes to me for sign-off I will
check three things: every claim appears in that page's list; every qualifier attached to a claim
here is present on the page, not dropped in the edit; and no number appears that is not reproducible
by a command or a cited line. The qualifiers are the part that goes missing in a design pass, so
expect me to be tedious about them specifically.

Four corrections should land in the source docs regardless of the site, because they are repeated by
people on calls: `docs/marketing.md:24` (the BSL summary — wrong licence, wrong grant),
`docs/marketing.md:18` (stale requirement statuses), `docs/marketing.md:40-43` (SaaS sources that
are declared stubs), and `docs/security.md:63` ("five" where six are listed). The first is the
urgent one.

**Status of those, 2026-10-14 (PRO-8).** The BSL summary, the SaaS reasoning and the upgrade-path
line in `docs/marketing.md` are corrected, as is the use-grant copy at `site/register.html`. Two
further things went with them, because they said the same wrong thing in a different place: the
GTM motion list carried a "SaaS — SMB" section gated on REQ-073, now a commercial-licence motion,
and the register page offered `cloud.provisa.dev` as a way to skip self-hosting. `docs/security.md:63`
is still open and is not mine. The site-wide one is below.

**Still wrong site-wide, and bigger than the four.** Every primary call to action on the site points
at `cloud.provisa.dev` with "Start a free trial". That is managed hosting, offered in the present
tense, on every page — against the standing decision that there is no SaaS SKU in any tense. Fixing
the two source docs does not touch it. It needs an owner and a replacement CTA; a download-and-register
path is the obvious candidate, since `/register` already exists and functionality does not depend on
it.

---

## 5. Addendum (PRO-8): five capabilities from Ken's scenario document

Added to the §2 list. The source document is idea-stage and says so, so each item here is a claim
like any other and is marked with what a first pass found. Four are flagged, not audited — do not
write a page, a roadmap line or a sales sentence off them until they are.

1. **One question, six surfaces — VERDICT: real, and the spine understates it.** The
   natural-language path compiles one question to six targets, not three:
   `_TARGETS = ["cypher", "graphql", "sql", "grpc", "jsonapi", "openapi"]`
   (`provisa/nl/runner.py:51`, same set gating the query branches at `:851`), each target a separate
   branch whose failure is captured and returned as that branch's error so the others still complete
   (`:956`, `:972`). It is role-checked in the sense the claim needs: the run fetches role-scoped SDL,
   resolves the role through `require_role`, and binds that role's RLS context and domain access
   (`runner.py:531-571`). So "one model, three languages" is a true statement about the *query
   languages* and an undersell as a description of what one question produces.

   **Decision, 2026-10-14: the spine is replaced, not supplemented.** I had recommended adding the
   six-surface claim alongside "three languages"; the call went the other way and six surfaces is now
   the spine. One consequence of that is mine to carry rather than the deciders': a spine is quoted
   back at us by people who did not read the qualifier, so I re-audited the claim at spine strength
   before writing it down. §5.1a is that re-audit, §5.1b is the wording the spine may use, and §5.1c
   is where the replacement reaches and where it must stop.
2. **Creation-request queue and steward workflow — exists in code, absent from the site.** Not a gap
   in the product, a gap in the story: `_queue_creation_request` (REQ-434,
   `provisa/api/admin/schema_common.py:137`) with the response code
   `schema.creation_request_queued`. The claim as Ken states it — an agent or analyst may *propose* a
   source, table or relationship, a steward executes or rejects with a reason, and the agent never
   registers anything whatever its credential holds — needs the "never, whatever its credential"
   half verified against the mutation authorization path before it is published. It is the single
   best answer we have to "what stops your agent writing to my catalog", and it is on no page.
3. **Write-back through the governed path, checked against the caller's rights and audited** — no
   first-pass match in `provisa/` for write-back by that name. Transactional single-source writes are
   real (REQ-027, §1.7), which may be the same capability under a different word. Unaudited; do not
   equate the two until someone has read both.
4. **Bitemporal and time-travel replay** — answering as of a past time as it was recorded then,
   against the model version live on that date. No first-pass match. This is the most demanding of
   the five, it is the one regulated buyers ask for by name, and claiming it without the model-version
   half would be a serious overclaim. Unaudited.
5. **Test environments, branched models, synthetic generation from profiles at full scale** — no
   first-pass match for branched models or synthetic generation; the profiler exists
   (`provisa/profiler/`), which is where "from profiles" would start. Unaudited.

---

### 5.1a — the six-surface claim, re-audited at spine strength

Read 2026-10-14 against `provisa/nl/runner.py`, `provisa/nl/executor.py` and
`provisa-ui/src/pages/NlPage.tsx`. Four findings, two of which correct what §5.1 first said.

**All six are generated *and run*. That is stronger than the first pass claimed.** Every target is in
`_QUERY_TARGETS` (`runner.py:851`), and each generated query is handed to
`provisa/nl/executor.py::execute` (`runner.py:983`), which routes every branch through the one
compiled governance pipeline — `_govern_and_route_compiled` → `_execute_plan`, the same entrypoint
the live Bolt session and the REST/JSON:API readers use (`executor.py:117-129`, `:156-170`). The
first pass's qualifier, "generated queries and request shapes, not six running endpoints", was wrong
in one direction: these are answers, not drafts.

**It was also too generous in the other direction, and this is the one a sceptical engineer will
test.** The three protocol surfaces are *the request a client would send, plus the envelope that
client would receive*, computed through the governed pipeline — not a round trip over a gRPC channel
or an HTTP socket. `_execute_grpc` shapes the result into the `{Type}AggregateResult` /
`{Type}GroupByRow` structure the real servicer carries, and the code states the intent in as many
words: the NL preview "must look like what the gRPC client actually receives"
(`executor.py:253-258`). That is defensible and worth saying plainly. What we may not imply is that
Provisa dialled its own gRPC server six times.

**Role-checked holds for all six.** Role-scoped SDL and the role's GraphQL schema
(`runner.py:766-767`, `executor.py:150-152`), the role resolved through `require_role` with its
domain access (`executor.py:103`), and governance applied by the compiled pipeline on every branch,
the protocol branches included.

**The six are not six independent attempts — this is the qualifier most likely to be lost in a
design pass.** SQL and GraphQL are scheduled first, and Cypher (non-strict), gRPC, JSON:API and
OpenAPI all await them (`runner.py:918-940`, `:969-974`). A failed shared table-selection step, or a
failed SQL *and* GraphQL pair, takes the dependent four down with it. Degradation is correlated, not
independent.

**Three of the six answer only some question shapes.** gRPC, JSON:API and OpenAPI express exactly
three things: a single-table row fetch, an aggregate-only, and a group-by-plus-aggregate with a
nodes projection (`runner.py:400-505`). A question they cannot express returns the sentinel
`NOT_APPLICABLE`, which the UI renders as that branch's own state
(`provisa-ui/src/pages/NlPage.tsx:380`). The product is already honest about this on screen; a page
that is less honest than the product is the worst of the available positions. SQL, GraphQL and
Cypher are the three that carry an arbitrary question.

### 5.1b — the spine, in the words a page may use

> **Ask once in English. Provisa answers on six governed surfaces — SQL, GraphQL, Cypher, gRPC,
> JSON:API and OpenAPI — each one generated for the asking role and run through the same compiled
> governance.**

Three qualifiers travel with it and I will check every page for them:

1. **"Six surfaces" is what the platform answers on, not a promise of six answers per question.**
   Write it as capability, never as a count the reader should expect to see. "Up to six" is
   acceptable; "six every time" is not.
2. **gRPC, JSON:API and OpenAPI are the request and the response envelope a client of those
   protocols would exchange** — computed through the governed pipeline. Not a network round trip.
3. **Those three cover row, aggregate and group-by questions**; anything else comes back as that
   branch's "not applicable", exactly as the product shows it. The arbitrary question is carried by
   SQL, GraphQL and Cypher.

A page with the spine and without qualifier 1 is the page I will send back.

### 5.1c — where the replacement reaches, and where it stops

Replace it wherever "one model, three languages" is the **top-line message**: the Home hero and
§5 CodeTabs block, the Platform and Interfaces leads, the accordion title, the kit's text-link
sample, and the `<meta name="description">` of any page whose description opens with it. Those are
spine positions and they now carry §5.1b.

Do **not** rewrite a claim that is specifically about *query languages*, because that is a different
claim and not the spine:

- **`/vs/starburst`.** The row that earns its keep there is "Starburst speaks SQL; Provisa speaks
  SQL, GraphQL and Cypher over one model" — audited against Starburst Enterprise 482-e.3 LTS for
  query languages. We have not audited Starburst's protocol surface count, so a six-versus-one row
  would assert something about a competitor we did not check. Keep the language row; add the spine as
  its own line if the page wants it.
- **Page 5's structural-difference row** and any comparison table cell with the same shape.
- **`docs/features.md:496`**, which describes the three-language parallel answer as a feature. It is
  a feature description rather than the spine — but it is now incomplete, and it is *generated*
  ("Do not hand-edit", from `docs/arch/features.yaml` via `scripts/gen_features_doc.py`). So the fix
  is a change to the YAML and a regeneration by whoever owns the product docs, not a copy edit, and
  it is out of scope here. Worth doing: that paragraph is what an engineer reads after the page
  sells them, and it currently contradicts the spine by omission.

Files carrying the old spine as of 2026-10-14, for whoever executes the swap:
`site/index.html:408` and `:423-426` (the §5 CodeTabs heading, "the same question, three ways to
ask"), `site/design-system/partials/accordion.html:32`,
`site/design-system/partials/text-link.html:5`, `site/why/one-model.html:133`, and
`site/vs/starburst.html:10` (meta description), `:164` and `:448` — the Starburst three being the
keep-the-language-row cases above, so only the meta description needs a decision.

One thing to fix while that file is open, unrelated to the spine and already struck in 1.5:
`site/why/one-model.html:133` reads "Three languages, nine protocols". **Nine protocols** is the
form Page 1 item 6 rules out — it is five listeners and nine ways in. Whoever edits that link should
correct both halves in one pass.
