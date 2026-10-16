# Column-Level Lineage

Provisa tracks column-level data lineage statically — computed from SQL definitions and command
contracts, no execution required. Two views are available: a per-statement DAG and a
federation-wide provenance graph spanning all registered views and materialized views (MVs).

## The lineage explorer

Navigate to **Lineage** in the UI (`/lineage`). Paste a SQL statement and click **Build statement
graph** to see its column-level DAG. Click **Federation graph** to load the provenance graph over
every MV in the registry. [tool-verified: LineagePage.tsx:28-119]

## Statement-level DAG (REQ-1160)

Each named output column in your SQL becomes a node. The builder traces it back through every
CTE, subquery, join, and inline command call to its source columns, building a directed graph
from source inputs to final outputs.

### Worked example

```sql
SELECT o.id, e.embedding, upper(e.geo) AS geo_u
FROM   orders o
JOIN   enrich_grpc_set('main.public.orders') e ON o.id = e.id
```

This statement produces three output columns. The graph for `geo_u` looks like:

```text
main.public.orders.id     ─╮
main.public.orders.region ─╯──[enrich_grpc_set(...)]──►  e.geo  ──[UPPER]──►  geo_u
                              (taint closure over the declared input contract)
```

- `main.public.orders.id` and `main.public.orders.region` are **source** nodes — the narrow input
  contract of `enrich_grpc_set`, qualified from the relation named in the call. `geo` is a declared
  *output* of the command, so `orders.geo` is not a node: nothing upstream of `e.geo` exists except
  the declared inputs. The closure connects every declared input to every declared output, so
  `e.embedding` carries the same two edges. [tool-verified: `_splice_commands` in graph.py:266-285,
  run on this statement 16 October 2026]
- `e.embedding` and `e.geo` are **command** nodes — the `enrich_grpc_set` boundary.
- `geo_u` is a **derived** node produced by the `UPPER` SQL function.
- `orders.id` is also a source node, from `o.id` in the select list — the alias-qualified form,
  distinct from the command's `main.public.orders.id`.

The command boundary is **not opaque**. Because `enrich_grpc_set` declares its input columns
(`id`, `region`) and output columns (`id`, `embedding`, `geo`), the lineage engine splices the
taint closure continuously from the source relation's declared columns to each output.
[tool-verified: `_splice_commands` in graph.py:266-285 and `_input_relation` in graph.py:307-317]

### Node kinds and visual cues

[tool-verified: LineageDag.tsx:25-29, KIND_COLOR constants; LineagePage.tsx:21-26 LEGEND]

| Node kind | Color | Meaning |
| --- | --- | --- |
| `source` | Green | A base table column |
| `derived` | Blue | Produced by a SQL expression (function, operator, CTE) |
| `command` | Purple | An output column from a registered command |

Additional rings on a node:

- **Orange ring** — a final output column of the statement.
- **Double border** — the column's relation is a materialized view (MV/CTAS snapshot).
- **Red ring** — member of a cycle classified as an error.
- **Yellow ring** — member of a cycle classified as a feedback loop.

[tool-verified: LineageDag.tsx:88-103 Cytoscape style selectors]

### Named transforms on edges

Every edge carries the raw SQL expression that produces the target column, plus a list of named
operations: SQL functions (`sql_function`), arithmetic/logical operators (`operator`), registered
commands (`command`), bare column references (`identity`), and literals (`constant`).
[tool-verified: TransformOp and name_transform in graph.py:36-145]

An edge from a command call is rendered as a dashed purple line in the UI.
[tool-verified: LineageDag.tsx:122-124]

## Federation-wide graph (REQ-1161)

The federation graph merges the per-statement lineage of every registered view and materialized
view into one provenance graph. Node identity is `relation.column` — a view's output column and
another view's input reference to the same column collapse to one node. The result is a single DAG
from base source columns to every derived dataset in the platform. The MV registry contributes no
nodes of its own; it marks which of those relations are materialization boundaries, so cycle
characterization sees the version cuts. [tool-verified: `_registry_views` in lineage_router.py,
`build_federation_graph` in merge.py:205-229, `qualify_outputs` in graph.py:275-299]

Use `focus`, `direction`, and `depth` to scope the view at federation scale without recomputing
the graph. [tool-verified: `slice_graph` in merge.py:160-189]

A registered relation that nothing derives from, and that derives from nothing, still appears — as
one isolated `source` node per column (REQ-1626). Absence from this graph therefore reads as *not
reachable*, never as *not derived*. Registered relations are also handed to the parser as known
relations, so a bare table reference in a view's SQL stitches to the registered relation instead of
standing as a second node for the same data; a bare name matching more than one registered relation
is left unstitched rather than guessed. [tool-verified: `_with_registry_columns` in
lineage_router.py, `_bare_to_full` in merge.py]

### How it is rendered (REQ-1627)

A federation-wide graph carries more nodes than a column-per-node render can show, so it arrives
**collapsed**: one node per relation, labelled with its column count, expanded per relation on
click, with expand-all and collapse-all for the whole graph. An edge between two collapsed
relations rolls up into one edge carrying the count of columns it stands for. The same graph opens
in a near-fullscreen modal that shares collapse state with the inline panel, so opening it
continues the trace rather than restarting it. [tool-verified: `LineageDag.tsx`, `LineagePage.tsx`]

### Reading the graph through a role (REQ-1625, REQ-1628)

The federation graph is read through a role, picked on the lineage form itself rather than taken
from the NavBar role picker: the NavBar picks which of the user's own roles they act as, this picks
whose data is being analysed. The `roles` parameter names **any** role in the organisation,
including roles the caller does not hold, because the analytic use is exactly to read the federation
from another role's vantage point. No selection means every role.

**It is a lens, not a redaction.** The columns the named roles can query *seed* the graph, and the
walk from those seeds runs **upstream and unrestricted** — every ancestor of a seed is returned in
full, whether or not that role could query it. What is reachable only *downstream* of the seeds
belongs to another role's perspective and is cut. The `domains` filter likewise restricts which
relations may **seed**, never which may be an ancestor, so a chain that crosses an unchecked domain
is not severed. A cycle survives the cut only when the whole loop is inside the perspective.

Because reading the federation through an arbitrary role discloses which columns that role can
query — the same disclosure `visible_to` is — the perspective carries the right that governance
metadata carries: `view_governance`. Without it, the role picker and the Complete Lineage control
are absent. [tool-verified: `ancestor_closure` and `_role_seeds` in merge.py:215-234 and
lineage_router.py:191-214, `require_capability_request` at lineage_router.py:287]

## Cycles (REQ-1161)

Cycles are described, not rejected. The lineage engine detects every directed cycle and
**classifies** it. [tool-verified: `Cycle.classification` property in merge.py:43-46]

| Classification | Border color | Meaning |
| --- | --- | --- |
| `feedback` | Yellow | The cycle crosses a materialized node — a legal, time-lagged feedback loop. The MV snapshot is the version boundary that makes it well-defined. |
| `error` | Red | No materialization boundary on the loop — a circular definition with no stable evaluation order. Likely a design error. |

[tool-verified: LineagePage.tsx:83-98 cycle alert rendering; merge.py:38-48]

A `feedback` cycle is not a failure. An enrichment MV that feeds back a derived column into its
own source relation is a valid pattern as long as one node on the loop is materialized — the
snapshot isolates the two halves temporally. An `error` cycle needs operator judgment: it usually
means two views reference each other with no snapshot in between.

## API

Both endpoints are **static** — they read definitions and contracts, not data. Both require the
`view_governance` capability: a provenance graph names columns, and column names are themselves
disclosure. [tool-verified: `require_capability_request(request, "view_governance")` at
lineage_router.py:117 and :287]

### POST /admin/lineage/graph

Returns the column-level DAG for a single SQL statement.

```http
POST /admin/lineage/graph
Content-Type: application/json

{
  "sql": "SELECT o.id, e.embedding FROM orders o JOIN enrich_grpc_set('main.public.orders') e ON o.id = e.id",
  "dialect": "postgres"
}
```

[tool-verified: `lineage_graph` endpoint at lineage_router.py:45-54, LineageGraphRequest model at
lineage_router.py:29-31]

The whole response for that statement — six nodes and four edges, printed as the run returned it
[tool-verified: `lineage_graph_for` (lineage_router.py:50-89, the endpoint's body) run on this exact
statement with `enrich_grpc_set` declaring `id` and `region` on its relation argument, sqlglot
30.9.0, 16 October 2026; shape is `LineageGraph.to_dict` in graph.py:82-105]:

```json
{
  "nodes": [
    {"id": "id", "column": "id", "relation": null, "kind": "derived", "materialized": false},
    {"id": "orders.id", "column": "id", "relation": "orders", "kind": "source", "materialized": false},
    {"id": "embedding", "column": "embedding", "relation": null, "kind": "derived", "materialized": false},
    {"id": "e.embedding", "column": "embedding", "relation": "e", "kind": "command", "materialized": false},
    {"id": "main.public.orders.id", "column": "id", "relation": "main.public.orders",
     "kind": "source", "materialized": false},
    {"id": "main.public.orders.region", "column": "region", "relation": "main.public.orders",
     "kind": "source", "materialized": false}
  ],
  "edges": [
    {"source": "orders.id", "target": "id", "transform": "o.id",
     "ops": [{"name": "id", "kind": "identity", "args": []}]},
    {"source": "e.embedding", "target": "embedding", "transform": "e.embedding",
     "ops": [{"name": "embedding", "kind": "identity", "args": []}]},
    {"source": "main.public.orders.id", "target": "e.embedding", "transform": "enrich_grpc_set(...)",
     "ops": [{"name": "enrich_grpc_set", "kind": "command", "args": []}]},
    {"source": "main.public.orders.region", "target": "e.embedding", "transform": "enrich_grpc_set(...)",
     "ops": [{"name": "enrich_grpc_set", "kind": "command", "args": []}]}
  ],
  "outputs": ["id", "embedding"]
}
```

Two forms of source id appear, and they are different nodes. `orders.id` is the select list's
`o.id`, read through the alias. A command's declared inputs are qualified from the literal relation
argument of the call instead, so they arrive as `main.public.orders.id` and
`main.public.orders.region`. The two `enrich_grpc_set` edges are the taint closure: every declared
input of the call, onto the one command output this statement selects. `e.id` is in the join
condition and never traversed, so it is not a node here.

Returns HTTP 422 when the SQL cannot be parsed.
[tool-verified: lineage_router.py:51-54]

### GET /admin/lineage/federation

Returns the merged provenance graph over every registered view and materialized view. Requires
`view_governance`.

```http
GET /admin/lineage/federation
GET /admin/lineage/federation?focus=orders.id&direction=downstream&depth=3
GET /admin/lineage/federation?roles=analyst_eu&domains=sales,finance
```

[tool-verified: `federation_graph` endpoint at lineage_router.py:275-339]

Query parameters [tool-verified: function signature at lineage_router.py:275-283]:

| Parameter | Values | Default | Effect |
| --- | --- | --- | --- |
| `focus` | A node id | — | Scope the response to the sub-graph around this node |
| `direction` | `upstream` \| `downstream` \| `both` | `both` | Which direction to traverse from `focus` |
| `depth` | integer | unbounded | Maximum hop distance from `focus` |
| `domains` | Comma-separated domain ids | every domain | Restrict which relations may **seed** the graph. Never restricts which may be an ancestor |
| `roles` | Comma-separated role names | every role | The perspective the graph is read from: the columns those roles can query seed it, and the walk runs upstream from there. Any role in the org, not only one the caller holds |

Response is the same shape as the statement graph, with a `cycles` field added
[tool-verified: `MergedGraph.to_dict` in merge.py:60-64]:

```json
{
  "nodes": [...],
  "edges": [...],
  "outputs": [...],
  "cycles": [
    {
      "nodes": ["orders.region", "enriched_orders.region"],
      "has_materialization_boundary": true,
      "classification": "feedback"
    }
  ]
}
```

## What a column rename or drop would break (REQ-1484)

A column carries two names, and each is stored by a different set of artifacts.

The **exposed name** is what the SQL and GraphQL surfaces show: `table_columns.alias`, falling back
to the snake_case default when no alias is set [tool-verified: `computed_sql_alias` at
`schema_helpers.py:317`]. Views, materialized views, metric expressions, RLS predicates, DQ
contracts, metric-view grains and MV row keys are all authored against that name, so **renaming an
alias breaks them just as surely as deleting the column does**.

The **physical name** is `table_columns.column_name`, the identity that survives the table upsert's
wholesale column replace. Relationships, [glossary](glossary.md) bindings, tag assignments, the watermark column
and column presets store this one, so they only break when the column is **removed**.

`columnDependents` reports both. Downstream views and MVs come from slicing the federation graph at
the column's exposed name; the artifacts that graph does not cover come from a direct scan of the
registry [tool-verified: `graph_dependents` in `provisa/lineage/dependents.py`, registry scans in
`provisa/api/admin/column_dependents.py`].

```graphql
query {
  columnDependents(tableId: "42", renamed: ["order_total"], removed: ["legacy_code"]) {
    columnName
    dependents { kind name detail breaksOn }
  }
}
```

`breaksOn` is `rename` for an exposed-name reference and `remove` for a physical-name one, so a
caller can tell which half of the edit each artifact is reacting to.

Ask this **before** the save. A renamed column is located by the exposed name it still carries in
the registry; once the alias has landed, the old name is gone and the query finds nothing.

The Tables page runs the query automatically when a pending edit changes an alias or shrinks the
column set, and lists what it finds [tool-verified: `diffEditedColumns` in
`provisa-ui/src/pages/tables/columnDiff.ts`, dialog in `TablesPage.tsx`]. The warning is advisory:
it names the affected artifacts and the administrator decides. It does not block the save, because
the estate's consumers cannot all be reached — an outside dashboard or a client application that
queries the column by name is beyond the registry's knowledge. For the same reason, scans over free
SQL text match the column as an identifier token rather than resolving scope, which can name an
artifact that turns out not to use the column. Over-reporting is the safe direction for a warning.

## Using lineage to govern command contracts

Because the taint closure connects every declared input column to every declared output column,
the breadth of that closure depends entirely on what you declare.

Consider a command that takes a full orders table (`id`, `region`, `amount`, `customer_id`,
`discount`, `notes`, ...) and returns an `embedding`. If the input contract lists all those
columns, every downstream column that uses the embedding will show lineage from all of them.
That is accurate but not useful — it is hard to tell what actually mattered.

Declare only `id` and `text` (the columns the embedding model actually reads), and the lineage
cone tightens to those two source columns. The derivation is both sound and precise.

See [Commands](commands.md) for the mechanics of declaring a narrow input contract.
