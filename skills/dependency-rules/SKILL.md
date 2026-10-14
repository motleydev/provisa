---
name: dependency-rules
description: The import boundaries inside provisa/ that import-linter enforces, and the rules for adding a third-party dependency to pyproject.toml.
---

# dependency-rules

Two kinds of dependency rule: which of our own modules may import which, and what it takes
to add somebody else's package.

## Internal boundaries

`[tool.importlinter]` in `pyproject.toml`, checked by `make lint-imports` and by pre-commit:

| Contract | Source | Forbidden |
| --- | --- | --- |
| compiler must not import executor | `provisa.compiler` | `provisa.executor`, `provisa.api` |
| cypher must not import executor | `provisa.cypher` | `provisa.executor`, `provisa.api` |

The direction is one-way: a query language lowers *down* into semantic SQL and knows nothing
about how or where the result is executed, or about the protocol that asked. Cypher is
allowed to import the compiler — REQ-1678 records that Cypher lowers through the compiler by
design (REQ-863) — but not the executor and not the API layer.

Adding a contract is cheap and is the right move when you catch a layering violation by
hand. Declare it in `pyproject.toml`; `lint-imports` picks it up with no other wiring.

## Where a cycle usually wants to go

When a lower layer needs something from a higher one, the answer is almost never an import.
It is a parameter, a callback passed in at construction, or a type that moves down into
`provisa/core/`. `import_shared/` exists for exactly this: what the several importers
(`hasura_v2/`, `ddn/`, `dbt/`, `ossie/`) have in common, held below all of them.

## Third-party dependencies

`pyproject.toml`'s dependency list is annotated, and the annotations are the convention. Read
twenty lines of it before adding anything. Every unusual entry carries:

- **Why it is here**, in one or two sentences, with the REQ-ID when one mandates it.
- **What breaks without it**, measured where it was measured — `httptools` names "~10% of a
  cached GraphQL hit's CPU"; `orjson` names that FastAPI's default response class still used
  stdlib json.
- **The reason for a pin or a cap.** `mcp>=1.2.0,<2` records that mcp 2.0 removed
  `mcp.server.fastmcp` and the endpoint failed to start with `ModuleNotFoundError`. A bare
  version number with no reason is the thing to avoid: an unpinned transitive break is how
  `sqlglot` took out every SELECT on a fresh install.
- **The licence**, when it is not obvious — `ldap3` is noted LGPL-3.0, imported, never
  modified or statically linked.

Two further rules the file states outright:

- **A platform marker is not a fallback.** `chdb; sys_platform != 'win32'` and
  `pgserver; sys_platform != 'linux' or platform_machine != 'aarch64'` are there because the
  wheel matrix says so, and the code path for the excluded platform aborts with an
  explanation instead. `requires-python = ">=3.12,<3.13"` exists so a 3.13 resolver refuses
  the install rather than crashing at first run.
- **A first-party surface may not rely on another package's dependency graph.** `openpyxl`
  was already arriving transitively through `databricks-sql-connector`; it is declared
  explicitly because `GET /admin/report.xlsx` writes XLSX.

Optional extras name a delivery tier (`embedded`, `desktop`, `docs`, `mysql`, `sqlserver`,
`oracle`), not a convenience grouping. An import site for an optional dependency handles
`ImportError` itself, which is why pyright's `reportMissingImports` is a warning here.

Run `make pip-audit` after changing dependencies.
