/** Home page copy that is easier to keep as data (live copy, verbatim). */
import type { AccordionItem, CodeTab, Download } from '../components/ds';

export const HERO_TABS: CodeTab[] = [
  {
    lang: 'SQL',
    wire: 'pgwire',
    code: `# psql speaks to Provisa as if it were Postgres — on port 5439
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
    code: `# The per-role schema, over plain HTTP
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
    code: `# Neo4j Browser and the official drivers, over Bolt
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
    code: `# No new language. The endpoints are generated from the model.
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
    code: `# A .proto generated from your schema — typed RPCs per table
grpcurl -d '{"total_gt": 1000}' provisa.internal:443 \\
  provisa.orders.OrdersService/Query

# The same question — a typed response, no schema drift possible
message Order {
  string id = 1;
  double total = 2;
  Customer customer = 3;
  repeated Query queries = 4;
}`,
  },
];

export const USE_CASES: AccordionItem[] = [
  {
    title: 'Give an agent your data',
    lede: 'An AI agent needs one database, safely.',
    body: 'Point Claude or any MCP client at Provisa instead of the database. The OAuth token maps to a role, so the agent gets the same six governance layers a person does — and no bypass to forget about.',
    link: 'MCP, and the eight other protocols',
    href: '/why/governance',
  },
  {
    title: 'A backend for your frontend',
    lede: "One API over sources that don't match.",
    body: 'The app needs Postgres, a document store, and two internal REST services in the same response. Declare the relationships once and the API spans all of them — per-role, filtered, paginated — in whichever shape your client wants: GraphQL/OpenAPI, JSON:API, or gRPC. No BFF service to maintain.',
    link: 'The interfaces, and the Hasura path in',
    href: '/why/interfaces',
  },
  {
    title: 'BI without a warehouse',
    lede: 'Tableau over the sources you actually have.',
    body: 'Postgres, Mongo, Elasticsearch, a Google Sheet, an S3 prefix of extracts. Connect the BI tool over JDBC or pgwire and join across all of them — no pipeline, no copy, no warehouse in the middle.',
    link: 'All 54 source types',
    href: '/why/sources',
  },
  {
    title: 'Data science, connected',
    lede: 'Every dataset the team needs, in Arrow.',
    body: 'Register the sources once and the whole team queries them from pandas, Polars, or DuckDB. Arrow Flight streams record batches columnar all the way out — no row-by-row serialization, nothing materialized server-side while you read — and single-source queries route straight to the driver.',
    link: 'Flight, Airport, and pgwire',
    href: '/why/interfaces',
  },
  {
    title: 'Provision data to other teams',
    lede: 'Hand over a result set, not a pipeline.',
    body: 'The consuming team writes SQL and gets it back fast: Arrow streams over Flight, typed gRPC, and — past a row threshold — a presigned S3 URL for multi-GB deliveries instead of a timed-out HTTP response. Kafka carries the change notifications, so they pull the delta rather than the snapshot.',
    link: 'How the governance follows the data',
    href: '/why/governance',
  },
];

/** "See how this works for your use case" — the interface groups. */
export const INTERFACE_GROUPS: Array<{ title: string; lead: string; items: string[] }> = [
  {
    title: 'Relational & BI',
    lead: 'Tableau, Power BI, DBeaver, psql, and local analytical engines.',
    items: [
      '<strong>pgwire</strong> — any Postgres client on port 5439; <code>pg_catalog</code> is answered in-memory, so schema browsers just work.',
      '<strong>JDBC &amp; REST</strong> — the BI tools over JDBC; JSON:API 1.1 for applications.',
      '<strong>Airport (DuckDB)</strong> — any DuckDB client attaches Provisa as a database and pushes filters down.',
    ],
  },
  {
    title: 'Graph & search',
    lead: 'Neo4j Browser and Bloom, plus application-side traversals.',
    items: [
      '<strong>Bolt</strong> — the Neo4j tools and official drivers run Cypher against the federated graph.',
      '<strong>GraphQL over HTTP</strong> — the same per-role schema every other surface enforces.',
    ],
  },
  {
    title: 'High-performance data',
    lead: 'Columnar streaming, microservices, zero-serialization ML — narrower cases, not the common path.',
    items: [
      '<strong>Arrow Flight</strong> — Arrow record batches over gRPC, columnar all the way out. Accepts GraphQL or SQL.',
      '<strong>gRPC model API</strong> — a <code>.proto</code> generated from your schema; typed query and insert RPCs per table.',
      '<strong>WebSocket &amp; SSE</strong> — subscriptions stream change events: Postgres native, MongoDB native, CDC, or polling.',
    ],
  },
  {
    title: 'AI & automation',
    lead: 'Agentic tool calls and LLM-driven query generation.',
    items: [
      '<strong>MCP server</strong> — agents query your governed data as tools. The OAuth token maps to a role, so agents get no bypass.',
      '<strong>Natural language</strong> — NL→SQL, Cypher, or GraphQL powered by Claude, with a validation loop before anything runs.',
    ],
  },
];

export const CRAWL_STEPS = [
  { title: 'Point', body: 'A local or network folder, an S3 bucket, a SharePoint site, an HDFS path, or an HTTP, FTP, or SFTP host — one location, not one table.' },
  { title: 'Crawl', body: 'It walks the tree to whatever depth you allow, converts documents that hold tables into data, and reads the schema out of each one.' },
  { title: 'Register', body: 'You pick which of the discovered tables to register — and they land under the same six governance layers as everything else.' },
];

export const CRAWLS = ['Local & network folders', 'S3', 'SharePoint', 'HDFS', 'HTTP(S)', 'FTP · FTPS · SFTP'];
export const READS = ['CSV · TSV', 'JSON', 'Parquet', 'Arrow', 'YAML', 'Excel', 'Word', 'PowerPoint', 'HTML', 'XML', 'Markdown'];

export const DISTRIBUTION_POINTS = [
  'SQLite control plane + embedded DuckDB engine — no Docker, no daemon',
  'Bring your own engine: Trino, Databricks, Snowflake, Postgres, ClickHouse, Oracle — one env var',
  'Reproducible and hash-pinned; passes the same CVE gate as every wheel',
];

export const DISTRIBUTION_CODE = `# One wheel. Everything inside.
pip install "provisa[embedded]"
provisa run

# Federate against your own engine when you want scale-out
export TRINO_HOST=trino.internal
export TRINO_PORT=8080
provisa run`;

export const DOWNLOADS: Download[] = [
  { os: 'macos', name: 'macOS', action: 'Download .dmg', meta: 'Apple silicon & Intel · latest release' },
  { os: 'windows', name: 'Windows', action: 'Download .exe', meta: 'x64 · embedded Python, no Docker · latest release' },
  { os: 'linux', name: 'Linux', action: 'Download .AppImage', meta: 'x86_64 · latest release' },
];

export const PYPI_CODE = `# One wheel. Everything inside. (Python 3.12)
python3 -m venv .venv && source .venv/bin/activate
pip install "provisa[embedded]"

provisa run          # your data
provisa run --demo   # a guided tour on a sample stack`;

export const FAQ: AccordionItem[] = [
  {
    title: 'Is Provisa a database, or does it replace my warehouse?',
    body: 'Neither. Provisa is a semantic and governance layer that runs on an engine you choose — Trino, DuckDB, ClickHouse, Postgres, Snowflake, Databricks, BigQuery, or the embedded Trino-compatible engine in the box. Your warehouse becomes a replaceable execution engine rather than the place your semantics live.',
    link: 'Why that matters',
    href: '/why/no-lock-in',
  },
  {
    title: 'How is this different from Starburst or Denodo?',
    body: 'Starburst is a query engine; Provisa sits above one and can use Starburst as its engine. Denodo is the closest comparison — same category, different center of gravity: Provisa adds GraphQL and Cypher as peers to SQL, nine wire protocols including pgwire and Bolt, engine choice, and a deployment that starts at one <code>pip install</code>.',
    link: 'Provisa and Starburst',
    href: '/vs/starburst',
  },
  {
    title: "I'm on Hasura v2. Can I migrate?",
    body: "Yes. Point the converter at your Hasura v2 metadata directory and it emits a Provisa config: sources, tables, per-role permissions as row-level security, relationships, remote schemas, actions, event triggers, and cron triggers. Anything it can't map cleanly is reported as a warning rather than dropped.",
    link: 'The migration path',
    href: '/vs/hasura',
  },
  {
    title: 'Can AI agents query my data safely?',
    body: "An MCP server — stdio and remote Streamable HTTP — exposes governed tables as tools. The OAuth token maps to a role, so every agent call passes the same six governance layers as a human query, and traversals are limited to registered relationships. Agents get no bypass and there's no second policy to keep in sync.",
    link: 'How governance applies',
    href: '/why/governance',
  },
  {
    title: 'Does it work in an airgap?',
    body: "The embedded profile ships the entire runnable system, precompiled UI included, as a single Python wheel. Regulated orgs already trust Artifactory-as-PyPI, so there's no Docker registry to mirror, no JVM, and no root required. Builds are reproducible and hash-pinned.",
  },
  {
    title: 'What happens to my model if I stop using Provisa?',
    body: "You keep it. Provisa is a handful of primitives — domains, tables, relationships, masking, views — compiled deterministically. The model is portable declarative config held in git, and the SQL it compiles is yours to read and export. The semantics you write don't die with the tool.",
    link: 'Our position on lock-in',
    href: '/why/no-lock-in',
  },
];
