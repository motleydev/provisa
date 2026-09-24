/** The source types highlighted on the home page. */
export const FEATURED_SOURCES = [
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Cassandra',
  'Elasticsearch',
  'Neo4j',
  'SPARQL',
  'Kafka',
  'Snowflake',
  'Databricks',
  'BigQuery',
  'Fabric',
  'ClickHouse',
  'DuckDB',
  'Google Sheets',
  'CSV / Parquet',
  'Excel · DOCX · PPTX',
  'SharePoint',
  'Splunk',
  'S3 · FTP · SFTP',
  'REST APIs',
  'GraphQL APIs',
  'gRPC APIs',
  'RSS · WebSocket',
];

/** Every registrable source type, grouped by what it is. */
export const SOURCE_GROUPS: Array<{ name: string; items: string[] }> = [
  {
    name: 'Relational',
    items: ['PostgreSQL', 'MySQL', 'MariaDB', 'SingleStore', 'SQL Server', 'Oracle', 'Firebird', 'SQLite', 'CockroachDB', 'YugabyteDB', 'Greenplum', 'TiDB'],
  },
  {
    name: 'Warehouses & lakehouses',
    items: ['Snowflake', 'BigQuery', 'Databricks', 'Microsoft Fabric', 'Synapse', 'Redshift', 'Trino', 'Delta Lake', 'Iceberg', 'Hudi', 'Hive', 'Hive on S3'],
  },
  { name: 'Analytics & OLAP', items: ['ClickHouse', 'DuckDB', 'Elasticsearch', 'Apache Pinot', 'Apache Druid', 'Exasol'] },
  { name: 'Graph & semantic', items: ['Neo4j', 'SPARQL / RDF'] },
  { name: 'NoSQL, cache & streaming', items: ['MongoDB', 'Cassandra', 'Redis', 'Kafka', 'WebSocket', 'RSS'] },
  { name: 'Files & documents', items: ['CSV', 'Parquet', 'Google Sheets', 'SharePoint', 'File crawler'] },
  { name: 'APIs & remote schemas', items: ['REST / OpenAPI', 'GraphQL remote', 'gRPC remote', 'Airport (DuckDB)'] },
  { name: 'Observability & other', items: ['Prometheus', 'Splunk', 'Soda', 'Great Expectations', 'Ingest', 'Government data'] },
];

/** Where the file crawler looks, and what it reads or converts. */
export const CRAWLER = {
  where: ['Local & network folders', 'S3', 'SharePoint', 'HDFS', 'HTTP(S)', 'FTP · FTPS', 'SFTP', 'Iceberg'],
  reads: ['CSV', 'TSV', '`.gz` of either', 'JSON', 'Parquet', 'Arrow', 'YAML', 'SQLite · `.db`'],
  converts: ['Excel · `.xlsx` · `.xls`', 'Word · `.docx`', 'PowerPoint · `.pptx`', 'HTML', 'XML', 'Markdown'],
};

export const CRAWL_STEPS = [
  {
    title: 'Point',
    body: 'A local or network folder, an S3 bucket, a SharePoint site, an HDFS path, or an HTTP, FTP, or SFTP host — one location, not one table.',
  },
  {
    title: 'Crawl',
    body: 'It walks the tree to whatever depth you allow, converts documents that hold tables into data, and reads the schema out of each one.',
  },
  {
    title: 'Register',
    body: 'You pick which of the discovered tables to register — and they land under the same six governance layers as everything else.',
  },
];
