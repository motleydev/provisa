---
name: project-layout
description: Where things live in this repo and which tree owns what. Read before creating a file, so it lands in the directory that already owns its concern.
---

# project-layout

Seventy-seven packages under `provisa/` means the answer to "where does this go" is almost
always "beside the thing it extends". Grep for an existing sibling before creating a
directory.

## The trees

| Path | Owns |
| --- | --- |
| `provisa/` | the Python product. One package per concern; see below. |
| `provisa-ui/` | the React admin SPA (Vite + TypeScript + Apollo). |
| `provisa-client/` | the Python client library, a separate distribution. |
| `jdbc-driver/` | the JDBC driver. |
| `site/` | the marketing site — hand-written HTML/CSS, deployed to Cloudflare. |
| `tests/` | every Python test tier. See `skills/test-tiers/SKILL.md`. |
| `docs/` | prose docs (MkDocs) and `docs/arch/` for architecture and requirements. |
| `scripts/` | generators, CI lane runners, build and release tooling. |
| `agents/`, `skills/`, `refs/`, `hooks/` | the agent contract. Tracked, root-level. |
| `demo/`, `config/`, `db/`, `helm/`, `docker/`, `packaging/`, `observability/` | deployment and demo data. |
| `vendor/buenavista/` | a Provisa fork of the pgwire engine, bundled into the wheel. |

## Inside `provisa/`

The packages group into layers, and two of the boundaries are enforced — see
`skills/dependency-rules/SKILL.md`.

- **Query languages in:** `compiler/`, `cypher/`, `transpiler/`, `nl/`, `apq/`
- **Execution:** `executor/`, `federation/`, `processors/`, `mv/`, `ingest/`
- **Served protocols:** `api/`, `graphql_remote/`, `grpc/`, `grpc_remote/`, `bolt/`,
  `pgwire/`, `subscriptions/`, `webhooks/`
- **Sources:** one package per source kind — `mongodb/`, `elasticsearch/`, `neo4j/`,
  `kafka/`, `druid/`, `pinot/`, `hive/`, `cosmosdb/`, `qdrant/`, `sparql/`, `logs/`,
  `google_sheets/`, `microsoft365/`, and twenty more. `source_adapters/` and `sources/`
  hold what is common; `api_source/`, `file_source/`, `codesource/`, `node/` are the
  generic readers.
- **Governance:** `security/`, `auth/`, `audit/`, `encryption/`, `dq/`, `lineage/`,
  `freshness/`, `licensing/`
- **Platform:** `core/`, `control_plane/`, `cache/`, `storage/`, `redis/`, `events/`,
  `scheduler/`, `discovery/`, `observability/`, `runtime_deps/`
- **Imports from other systems:** `hasura_v2/`, `ddn/`, `dbt/`, `ossie/`, `import_shared/`
- **`tools/`** — internal schema and generator support (`provisa/tools/req_schema.py`),
  omitted from coverage and not part of the served product.

`provisa/cli.py` is the `provisa` entry point (`[project.scripts]`), `provisa/ui_server.py`
serves the built UI, and `provisa/_ui/` plus `provisa/_config/` are staged into the wheel by
`scripts/build-wheel.sh` — they are build output, never hand-edited.

## Inside `provisa-ui/src/`

`pages/` and `components/` for UI, `hooks/` for data access (`useAdminQueries.ts` is the
GraphQL surface — see `skills/react-graphql/SKILL.md`), `api/`, `context/`, `theme/`,
`i18n/`, `tour/`, `generated/` for codegen output, `test-utils/` and `__tests__/` for tests,
`e2e/` (outside `src/`) for Playwright specs.

## Non-`.py` files must be declared to ship

`setuptools` bundles only `.py` by default. Anything read at runtime through
`Path(__file__)` — a `.sql` bootstrap, a `.proto`, a baked schema, the reader `.mjs` files —
needs an entry in `[tool.setuptools.package-data]`. The packaged runtime once started with
no `sources` table because `provisa/core/schema.sql` was not in the wheel.

## Generated files

`docs/arch/requirements.md` carries `Generated from docs/arch/requirements.yaml. Do not
hand-edit.` Its source is the YAML; `make sync-reqs` regenerates it along with
`features.md`, the feature matrix, the traceability matrix and the roadmap. The same holds
for `provisa-ui/src/generated/` and `provisa/_ui/`. Editing generated output loses the edit
at the next generation.
