import type { AccordionItem, CodeTab, DownloadItem, MatrixRow, TraceStepData } from '../components/ds';

/** Hero switcher: the same question in each language, over its wire protocol. */
export const HERO_TABS: CodeTab[] = [
  {
    lang: 'SQL',
    wire: 'pgwire',
    code: `
# psql speaks to Provisa as if it were Postgres — on port 5439
psql -h localhost -p 5439 -U analyst

# One SQL query, joined across Postgres, Mongo, and Elasticsearch
SELECT c.name, o.total, t.trace_id
FROM customers c
JOIN orders o   ON o.customer_id = c.id
JOIN queries t  ON t.actor = c.email
WHERE o.total > 1000;`,
  },
  {
    lang: 'GraphQL',
    wire: 'HTTP',
    code: `
# The per-role schema, over plain HTTP
POST https://provisa.internal/graphql

# The same question — relationships are fields, not joins
query BigOrders {
  orders(where: { total: { gt: 1000 } }) {
    total
    customers { name email }
    queries   { trace_id }
  }
}`,
  },
  {
    lang: 'Cypher',
    wire: 'Bolt',
    code: `
# Neo4j Browser and the official drivers, over Bolt
bolt://localhost:7687   # database: provisa_analyst

# The same question — sources are labels, relationships are edges
MATCH (c:Customer)-[:PLACED]->(o:Order)
MATCH (c)-[:RAN]->(t:Query)
WHERE o.total > 1000
RETURN c.name, o.total, t.trace_id`,
  },
  {
    lang: 'REST',
    wire: 'OpenAPI',
    code: `
# No new language. The endpoints are generated from the model.
curl -G https://provisa.internal/data/jsonapi/orders \\
  -H "Authorization: Bearer $TOKEN" \\
  -d 'filter[total][gt]=1000' -d 'include=customers'

# The same question — JSON back, related rows sideloaded
{ "data": [ { "type": "orders", "attributes": { "total": 1420 } } ],
  "included": [ { "type": "customers", "attributes": { "name": "Acme" } } ] }

# The spec is generated too — point a client generator at it
curl https://provisa.internal/data/jsonapi/openapi.json`,
  },
  {
    lang: 'gRPC',
    wire: 'HTTP/2',
    code: `
# A .proto generated from your schema — typed RPCs per table
grpcurl -d '{"total_gt": 1000}' provisa.internal:443 \\
  provisa.v1.ProvisaService/QueryOrders

# The same question — a typed response, no schema drift possible
message Order {
  string id = 1;
  double total = 2;
  Customer customer = 3;
  repeated Query queries = 4;
}`,
  },
];

export const STATS = [
  { value: '3', label: 'languages', color: 'cobalt' as const },
  { value: '9', label: 'protocols', color: 'forest' as const },
  { value: '54', label: 'source types', color: 'vermilion' as const },
  { value: '6', label: 'governance layers', color: 'cobalt' as const },
];

export const ONE_JOB = [
  { title: 'Not a warehouse', body: 'Your data stays where it is. No pipeline, no copy, nothing to migrate.', color: 'cobalt' as const },
  {
    title: 'Not a query engine',
    body: 'It runs on the engine you choose — Trino, DuckDB, Snowflake, Databricks, Postgres — or the one in the box.',
    color: 'forest' as const,
  },
  {
    title: 'Not a rollout',
    body: 'One `pip install`. No Docker, no JVM, no cluster to start. Scale out later with Helm or Terraform.',
    color: 'vermilion' as const,
  },
  { title: 'Not a lock-in', body: 'Your model is plain config in git. The SQL it compiles is yours to read and keep.', color: 'ink' as const },
];

/** "Trace one query": a Tableau report followed through Provisa. */
export const TRACE: TraceStepData[] = [
  {
    title: 'Asked from Tableau',
    body: 'An analyst on the EU team runs a report over JDBC. Tableau sends plain SQL. It has no idea two databases are involved.',
    comments: 'dash',
    code: `
SELECT c.name, c.email, SUM(o.total)
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.name, c.email;`,
  },
  {
    title: 'Resolved against the model',
    body: 'Each table maps to its source. The join is allowed because it matches a registered relationship.',
    code: [
      'customers  → postgres.crm.customers',
      'orders     → mongodb.shop.orders',
      ['customers.id = orders.customer_id  ', { t: '✓ registered', k: 'ok' }],
    ],
  },
  {
    title: 'Governance compiled in',
    body: 'The role `analyst_eu` sees EU rows only, and email is masked. The highlighted lines are now part of the query itself, not a check that runs afterwards.',
    comments: 'dash',
    code: [
      '-- compiled for role analyst_eu',
      'SELECT c.name,',
      { hl: "       REGEXP_REPLACE(c.email, '^(.)[^@]*', '$1***') AS email," },
      '       SUM(o.total)',
      'FROM customers c',
      'JOIN orders o ON o.customer_id = c.id',
      { hl: "WHERE c.region = 'EU'" },
      'GROUP BY c.name, c.email;',
    ],
  },
  {
    title: 'Routed',
    body: 'Two sources, so the plan goes to the engine you configured. A query that touches one source goes straight to its driver.',
    code: `
# two sources → federate
engine  → trino.internal:8080
# one source → direct, sub-100ms`,
  },
  {
    title: 'Returned and recorded',
    body: 'Tableau gets its rows over JDBC, already masked. The audit row names the role, the tables, and the exact SQL that ran.',
    comments: 'none',
    code: [
      'name        email           sum',
      'Ana Ruiz    a***@acme.eu    48,200',
      'Jonas Berg  j***@nordl.se   31,950',
      '',
      [{ t: 'audit', k: 'c' }, '  role=analyst_eu  protocol=jdbc'],
      '       tables=crm.customers, shop.orders',
    ],
  },
];

export const PILLARS = [
  {
    title: 'Three languages, one model',
    body: 'GraphQL, Cypher, and SQL all query the same federated model and retarget to any source dialect. Domains carve it into namespaces — a domain is the schema a SQL client sees — and governance applies identically across all three languages: *not three integrations, but one*.',
  },
  {
    title: 'Read and write',
    body: 'Analytical *and* transactional flows through the same governed API: cross-source reads fan out through federation; writes and single-source reads route direct to the driver, sub-100ms.',
  },
  {
    title: 'Smart routing',
    body: 'Single-source queries bypass federation entirely. Materialized views record the transform that built them, so queries rewrite transparently onto a fresh MV.',
  },
];

export const USE_CASES: AccordionItem[] = [
  {
    title: 'Give an agent your data',
    lede: 'An AI agent needs one database, safely.',
    body: 'Point Claude or any MCP client at Provisa instead of the database. The OAuth token maps to a role, so the agent gets the same six governance layers a person does — and no bypass to forget about.',
    link: { label: 'MCP, and the eight other protocols', href: '/why/governance' },
  },
  {
    title: 'A backend for your frontend',
    lede: "One API over sources that don't match.",
    body: 'The app needs Postgres, a document store, and two internal REST services in the same response. Declare the relationships once and the API spans all of them — per-role, filtered, paginated — in whichever shape your client wants: GraphQL/OpenAPI, JSON:API, or gRPC. No BFF service to maintain.',
    link: { label: 'The interfaces, and the Hasura path in', href: '/why/interfaces' },
  },
  {
    title: 'BI without a warehouse',
    lede: 'Tableau over the sources you actually have.',
    body: 'Postgres, Mongo, Elasticsearch, a Google Sheet, an S3 prefix of extracts. Connect the BI tool over JDBC or pgwire and join across all of them — no pipeline, no copy, no warehouse in the middle.',
    link: { label: 'All 54 source types', href: '/why/sources' },
  },
  {
    title: 'Data science, connected',
    lede: 'Every dataset the team needs, in Arrow.',
    body: 'Register the sources once and the whole team queries them from pandas, Polars, or DuckDB. Arrow Flight streams record batches columnar all the way out — no row-by-row serialization, nothing materialized server-side while you read — and single-source queries route straight to the driver.',
    link: { label: 'Flight, Airport, and pgwire', href: '/why/interfaces' },
  },
  {
    title: 'Provision data to other teams',
    lede: 'Hand over a result set, not a pipeline.',
    body: 'The consuming team writes SQL and gets it back fast: Arrow streams over Flight, typed gRPC, and — past a row threshold — a presigned S3 URL for multi-GB deliveries instead of a timed-out HTTP response. Kafka carries the change notifications, so they pull the delta rather than the snapshot.',
    link: { label: 'How the governance follows the data', href: '/why/governance' },
  },
];

export const SECURITY_POINTS = [
  'Governance compiled into every query plan — no path around it',
  'An audit row written for every query, on every protocol',
  'Airgap install over an Artifactory PyPI mirror — no Docker, no JVM, no root',
  'Reproducible, hash-pinned builds that pass the same CVE gate as every wheel',
];

export const INDUSTRIES = [
  {
    name: 'Financial services',
    line: 'Row-level security, masking, and an audit row on every query an auditor asks about.',
    bg: 'cobalt' as const,
    corner: 'vermilion' as const,
  },
  {
    name: 'Healthcare & life sciences',
    line: 'Column masking with role-based bypass over clinical and research sources — no copies to govern.',
    bg: 'forest' as const,
    corner: 'cobalt' as const,
  },
  {
    name: 'Public sector',
    line: 'Airgap-ready from an Artifactory PyPI mirror. No new supply chain to approve.',
    bg: 'vermilion' as const,
    corner: 'forest' as const,
  },
  {
    name: 'Manufacturing & energy',
    line: 'Crawl the shared drives and SharePoint sites plants run on, and catalog every table in them.',
    bg: 'ink' as const,
    corner: 'vermilion' as const,
  },
];

export const LANGS = [
  { name: 'GraphQL', body: 'Per-role schemas with field-level visibility, constrained to registered relationships — valid by construction.' },
  { name: 'SQL', body: 'Full SQL over federated data. Single-source queries bypass federation entirely for sub-100ms latency.' },
  { name: 'Cypher', body: 'Graph traversals over the same federated model, under identical governance.' },
];

export const INTERFACE_GROUPS: MatrixRow[] = [
  {
    title: 'Relational & BI',
    desc: 'Tableau, Power BI, DBeaver, psql, and local analytical engines.',
    items: [
      { name: 'pgwire', desc: 'Any Postgres client on port 5439; `pg_catalog` is answered in-memory, so schema browsers just work.' },
      { name: 'JDBC & REST', desc: 'The BI tools over JDBC; JSON:API 1.1 for applications.' },
      { name: 'Airport (DuckDB)', desc: 'Any DuckDB client attaches Provisa as a database and pushes filters down.' },
    ],
  },
  {
    title: 'Graph & search',
    desc: 'Neo4j Browser and Bloom, plus application-side traversals.',
    items: [
      { name: 'Bolt', desc: 'The Neo4j tools and official drivers run Cypher against the federated graph.' },
      { name: 'GraphQL over HTTP', desc: 'The same per-role schema every other surface enforces.' },
    ],
  },
  {
    title: 'High-performance data',
    desc: 'Columnar streaming, microservices, zero-serialization ML — narrower cases, not the common path.',
    items: [
      { name: 'Arrow Flight', desc: 'Arrow record batches over gRPC, columnar all the way out. Accepts GraphQL or SQL.' },
      { name: 'gRPC model API', desc: 'A `.proto` generated from your schema; typed query and insert RPCs per table.' },
      { name: 'WebSocket & SSE', desc: 'Subscriptions stream change events: Postgres native, MongoDB native, CDC, or polling.' },
    ],
  },
  {
    title: 'AI & automation',
    desc: 'Agentic tool calls and LLM-driven query generation.',
    items: [
      { name: 'MCP server', desc: 'Agents query your governed data as tools. The OAuth token maps to a role, so agents get no bypass.' },
      { name: 'Natural language', desc: 'NL→SQL, Cypher, or GraphQL powered by Claude, with a validation loop before anything runs.' },
    ],
  },
];

export const DERIVED = [
  {
    title: 'Declared datasets, not pipelines',
    body: 'A pipeline is a program that ran; to audit one you read code. Declare the dataset instead and the definition is the record — column-level lineage, the data version consumed, the rules that produced it. No orchestration DAG.',
  },
  {
    title: 'Feeds the catalog you bought',
    body: "One registration publishes to OpenMetadata, DataHub, Collibra, Atlan, Apache Atlas, and OpenLineage — with lineage stitched on business identity, so re-platforming doesn't reset it.",
  },
  {
    title: 'Every value has an address',
    body: "Governed values resolve over REST or MCP at a semantic address, optionally as of a point in time. Physical URIs are refused, so a citation can't leak a location.",
  },
];

export const AIRGAP_POINTS = [
  'SQLite control plane + embedded DuckDB engine — no Docker, no daemon',
  'Bring your own engine: Trino, Databricks, Snowflake, Postgres, ClickHouse, Oracle — one env var',
  'Reproducible and hash-pinned; passes the same CVE gate as every wheel',
];

export const INSTALL_CODE = `
# One wheel. Everything inside.
pip install "provisa[embedded]"
provisa run

# Federate against your own engine when you want scale-out
export TRINO_HOST=trino.internal
export TRINO_PORT=8080
provisa run`;

export const DEPLOY_OPTIONS = [
  { title: 'Desktop installers', body: 'Signed macOS, Windows, and Linux installers — each with a one-click demo build that boots a sample stack.' },
  { title: 'Python wheel', body: '`pip install "provisa[embedded]"` — the whole system, precompiled UI included. Airgap-ready.' },
  { title: 'Kubernetes · Helm', body: 'A production chart deploys the control plane, workers, and engine — scale the federation tier horizontally.' },
  { title: 'Cloud & VM · Terraform', body: 'Modules for AWS, Azure, and GCP stand up a VM or cluster deployment end to end.' },
];

export const DOWNLOADS: DownloadItem[] = [
  { id: 'macos', os: 'macOS', meta: 'Apple silicon & Intel · latest release', cta: 'Download .dmg', href: '/dl/macos' },
  { id: 'windows', os: 'Windows', meta: 'x64 · embedded Python, no Docker · latest release', cta: 'Download .exe', href: '/dl/windows' },
  { id: 'linux', os: 'Linux', meta: 'x86_64 · latest release', cta: 'Download .AppImage', href: '/dl/linux' },
];

export const PIP_CODE = `
# One wheel. Everything inside. (Python 3.12)
python3 -m venv .venv && source .venv/bin/activate
pip install "provisa[embedded]"

provisa run          # your data
provisa run --demo   # a guided tour on a sample stack`;

export const TIERS = [
  { name: 'Evaluation', desc: 'Free forever, any size organization.' },
  { name: 'Small teams', desc: 'Free in production under 100 people and $1M.' },
  { name: 'Everyone else', desc: 'A commercial license, with a 90-day grace period.' },
];

export const RESOURCES = [
  { type: 'Explainer', title: 'Active vs. passive — what the word has to mean', href: '/why/active-semantic-layer', bg: 'cobalt' as const, a: 'vermilion' as const },
  { type: 'Comparison', title: 'Provisa and Starburst', href: '/vs/starburst', bg: 'vermilion' as const, a: 'cobalt' as const },
  { type: 'Migration guide', title: 'Coming from Hasura v2', href: '/vs/hasura', bg: 'forest' as const, a: 'paper' as const },
  {
    type: 'Position paper',
    title: 'Domains as products, config promotion, and the compute bill',
    href: '/why/no-lock-in',
    bg: 'ink' as const,
    a: 'vermilion' as const,
  },
];

export const FAQ: AccordionItem[] = [
  {
    title: 'Is Provisa a database, or does it replace my warehouse?',
    body: 'Neither. Provisa is a semantic and governance layer that runs on an engine you choose — Trino, DuckDB, ClickHouse, Postgres, Snowflake, Databricks, BigQuery, or the embedded Trino-compatible engine in the box. Your warehouse becomes a replaceable execution engine rather than the place your semantics live.',
    link: { label: 'Why that matters', href: '/why/no-lock-in' },
  },
  {
    title: 'How is this different from Starburst or Denodo?',
    body: 'Starburst is a query engine; Provisa sits above one and can use Starburst as its engine. Denodo is the closest comparison — same category, different center of gravity: Provisa adds GraphQL and Cypher as peers to SQL, nine wire protocols including pgwire and Bolt, engine choice, and a deployment that starts at one `pip install`.',
    link: { label: 'Provisa and Starburst', href: '/vs/starburst' },
  },
  {
    title: "I'm on Hasura v2. Can I migrate?",
    body: "Yes. Point the converter at your Hasura v2 metadata directory and it emits a Provisa config: sources, tables, per-role permissions as row-level security, relationships, remote schemas, actions, event triggers, and cron triggers. Anything it can't map cleanly is reported as a warning rather than dropped.",
    link: { label: 'The migration path', href: '/vs/hasura' },
  },
  {
    title: 'Can AI agents query my data safely?',
    body: "An MCP server — stdio and remote Streamable HTTP — exposes governed tables as tools. The OAuth token maps to a role, so every agent call passes the same six governance layers as a human query, and traversals are limited to registered relationships. Agents get no bypass and there's no second policy to keep in sync.",
    link: { label: 'How governance applies', href: '/why/governance' },
  },
  {
    title: 'Does it work in an airgap?',
    body: "The embedded profile ships the entire runnable system, precompiled UI included, as a single Python wheel. Regulated orgs already trust Artifactory-as-PyPI, so there's no Docker registry to mirror, no JVM, and no root required. Builds are reproducible and hash-pinned.",
  },
  {
    title: 'What happens to my model if I stop using Provisa?',
    body: "You keep it. Provisa is a handful of primitives — domains, tables, relationships, masking, views — compiled deterministically. The model is portable declarative config held in git, and the SQL it compiles is yours to read and export. The semantics you write don't die with the tool.",
    link: { label: 'Our position on lock-in', href: '/why/no-lock-in' },
  },
];
