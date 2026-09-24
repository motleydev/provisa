/** Source lists shared by the home and sources pages (live copy). */

/** The home page's short list. */
export const HOME_SOURCES = [
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

/** The file crawler, on the sources page. */
export const CRAWLER = {
  crawls: ['Local & network folders', 'S3', 'SharePoint', 'HDFS', 'HTTP(S)', 'FTP · FTPS', 'SFTP', 'Iceberg'],
  reads: ['CSV', 'TSV', '.gz of either', 'JSON', 'Parquet', 'Arrow', 'YAML', 'SQLite · .db'],
  converts: ['Excel · .xlsx · .xls', 'Word · .docx', 'PowerPoint · .pptx', 'HTML', 'XML', 'Markdown'],
};

/** Every registrable source type, grouped (sources page, "The 53"). */
export const SOURCE_GROUPS: Array<{ title: string; items: string[] }> = [
  {
    title: 'Relational',
    items: ['PostgreSQL', 'MySQL', 'MariaDB', 'SingleStore', 'SQL Server', 'Oracle', 'Firebird', 'SQLite', 'CockroachDB', 'YugabyteDB', 'Greenplum', 'TiDB'],
  },
  {
    title: 'Warehouses & lakehouses',
    items: ['Snowflake', 'BigQuery', 'Databricks', 'Microsoft Fabric', 'Synapse', 'Redshift', 'Trino', 'Delta Lake', 'Iceberg', 'Hudi', 'Hive', 'Hive on S3'],
  },
  { title: 'Analytics & OLAP', items: ['ClickHouse', 'DuckDB', 'Elasticsearch', 'Apache Pinot', 'Apache Druid', 'Exasol'] },
  { title: 'Graph & semantic', items: ['Neo4j', 'SPARQL / RDF'] },
  { title: 'NoSQL, cache & streaming', items: ['MongoDB', 'Cassandra', 'Redis', 'Kafka', 'WebSocket', 'RSS'] },
  { title: 'Files & documents', items: ['CSV', 'Parquet', 'Google Sheets', 'SharePoint', 'File crawler'] },
  { title: 'APIs & remote schemas', items: ['REST / OpenAPI', 'GraphQL remote', 'gRPC remote', 'Airport (DuckDB)'] },
  { title: 'Observability & other', items: ['Prometheus', 'Splunk', 'Soda', 'Great Expectations', 'Ingest', 'Government data'] },
];
