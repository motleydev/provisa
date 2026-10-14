# Provisa Go-To-Market Strategy

## Product Philosophy

Positioning line: **Federation, metrics, ontology and governance from a single model. Nothing to keep in sync.** Four properties, kept separate: federation (72 connectors reaching 85+ kinds of source, SaaS systems such as Salesforce, ServiceNow and Stripe among them), metrics (defined once), ontology (the glossary as a graph of concepts, separate from the metrics), and governance (six layers compiled into every query plan). Complementary to data catalogs that provide a context layer: they tell an agent what it should do; Provisa enforces what it can do. No invalid join ever runs on your data.

Provisa follows the Hasura V2 PLG model: **connect a source, register tables, suggest relationships, query with GraphQL** — zero required governance config. Domains, security policies, and steward workflows are progressive disclosures, not prerequisites. Every governance feature is in the core; what you buy is the right to run it in production, plus an SLA and someone to call.

## SKUs

| SKU | Delivery | Price | Target |
| --- | --- | --- | --- |
| **Community Edition (CE)** | Self-hosted | Free under the BSL use grant | Developers, small teams |
| **Enterprise** | Self-hosted, your cloud, or air-gapped | Contract | Regulated enterprise |
| **Vertical Packages** | Config artifacts (either edition) | Bundled or add-on | Domain-specific buyers |

**Managed hosting is not offered.** Go-to-market is licence sales first; there is no SaaS SKU, in any tense. Do not write "coming soon" or "in development". The reasons, all current: there is no public signup path, no published SLA, and the published artifact is a `0.1.0` alpha. `docs/competitive_analysis.md:28` and `:32` state "SaaS: not available" and "Does not currently offer SaaS. On-prem and self-hosted only." Self-hosted-only is an *advantage* in three of the four priority verticals and `docs/competitive_analysis.md:29` already argues it against Apollo and Starburst Galaxy — lead with it rather than apologising for it.

(The multi-tenant requirements once cited here as blockers are closed: REQ-073 is superseded by REQ-1243 ✅, per-org schema isolation REQ-695/702 ✅, and per-tenant encryption REQ-684/685/694 ✅. They are no longer the reason, and repeating them puts us in contradiction with our own `requirements.md`.)

### CE vs Enterprise gate

CE is full-featured. Governance ships in the open-source core: RLS enforcement, column masking, the append-only query audit log, ABAC hooks, and SSO (Firebase, Keycloak OIDC) are all CE features, not paywalled. Enterprise adds only: SLA guarantees, dedicated support, advanced audit logging, and compliance reporting. No bait-and-switch — CE stays genuinely capable. The GraphQL/Hasura community has a sharp nose for hobbled community editions; trust is the asset.

BSL 1.1 licence, as `LICENSE:13-30` actually states it. Four facts, stated in plain numbers wherever we publish them:

- **Source-available**, not open source. The licence text says so itself.
- **Change Licence: GNU General Public License, version 2.0 or later.** Not Apache 2. Apache versus copyleft is the first thing an open-source review board checks.
- **Change Date: the fourth anniversary** of the date each released version is first made publicly available. A named interval per version, not "a time window".
- **Additional Use Grant:** non-production use is free for anyone; production use is free for an organisation that, with its affiliates, has **fewer than 100 employees and contractors and under USD 1,000,000** in revenue, budget or expenditure in its last completed fiscal year, with 90 days' grace on crossing either threshold. **Any other production use requires a separate commercial licence** — not to host it for others, not to unlock a feature, to run it.

Keep two things apart in two separate sentences, because they share a word: the in-product licence *file* is free, is a registration artifact, and never gates or degrades functionality (REQ-1137). The BSL Additional Use Grant is what decides whether you may run Provisa in production at all.

## GTM Motions

### 1. PLG — Community (developer / small team)

**Hook:** Disaffected Hasura V2 community. Hasura DDN (V3) is a forced rewrite with a new mental model and cloud-first pricing. V2 CE is abandoned. Teams are actively evaluating alternatives now.

**Message:** *"Everything you loved about Hasura V2. Connect your database, track your tables, get GraphQL. Plus governance when your team needs it."*

**Tactics:**

- Hasura V2 metadata migration tool as the top-of-funnel hook — zero-risk trial for teams already burned by migration work
- SEO: "Hasura V2 alternative", "Hasura DDN migration", "self-hosted GraphQL" — low competition, high intent
- Show up in Hasura GitHub Discussions, /r/graphql, Hacker News — genuine participation, not ads
- Honest comparison page: V2 vs DDN vs Provisa. The community respects directness and shares it
- Broader GraphQL community angle: "GraphQL over anything" — 72 connectors reaching 85+ kinds of source, including Kafka, Iceberg, MotherDuck, Stripe, HubSpot, Airtable, Notion, Auth0, things Hasura never touched
- Zero-copy warehouse angle: Snowflake, Databricks, and BigQuery tables reachable live via their own Iceberg catalogs, not just materialize-and-copy — a warehouse team keeps its data in place
- ClickHouse and MongoDB also reach live, not just materialize-and-copy — full predicate/aggregate pushdown to ClickHouse confirmed against a real 60M-row table; not every competitor gets analytics warehouses and document stores both live
- SaaS-API sources (Stripe, HubSpot, Airtable, Notion, Auth0, AWS Cognito, Cloudflare D1, Logflare, Calendly) reach through the same captive-Postgres pattern already proven for files/SharePoint/Splunk — no bespoke connector per SaaS app

**Conversion moment:** The team crosses the Additional Use Grant — 100 employees and contractors, or USD 1M in revenue, budget or expenditure — or wants an SLA and someone to call. Both land on the same place: a commercial licence. Governance is already running by then; it is not what they are buying.

### 2. Commercial licence — organisations that outgrow the use grant

**Hook:** A team already in production on CE that has crossed, or can see itself crossing, either threshold. They have 90 days' grace from the crossing to licence it, so the conversation is scheduled, not forced.

**Message:** *"Nothing changes in your deployment. The licence changes."* No migration, no feature unlock, no re-platforming — the same self-hosted install, now licensed for production at your size, with an SLA and a support contact.

**Tactics:** registration data (`/register`) is the only signal we have, since Provisa collects no telemetry — treat a registered install at a company past the thresholds as the trigger to reach out. Self-hosting stays the delivery model; the upsell is the contract, not the hosting.

### 3. Direct + SI — Regulated Enterprise

**Buyers:** CDOs, Data Platform teams, compliance/IT in healthcare, financial services, government.

**Hook:** Governance, RLS, audit trail, HIPAA/FedRAMP, air-gap deployment, vendor SLA.

**SI channel:** Regulated verticals rarely buy without a systems integrator they already trust. SI is the actual seller. Requirements: certification path, reference implementations, deal registration. SI builds a repeatable Hasura migration practice on top of Provisa.

**Sales cycle:** 6–12 months. Need 2–3 reference enterprise logos before this motion scales.

**Accelerant:** Community adoption in the wild helps enterprise procurement — "our team already knows it."

## Vertical Strategy (Land and Expand)

Vertical packages are pre-built configuration artifacts — source configs, registered tables, relationships, sample queries, dashboards — installable in under an hour. Low engineering cost (mostly config, not code). Ship on any tier; function as both a free CE demo and a paid enterprise accelerant.

**Wedge motion:** Deploy vertical package → team proves value fast → expand horizontally to internal sources → org-wide adoption.

### Priority verticals

| Vertical | Pre-built content | Compliance hook | Graph angle |
| --- | --- | --- | --- |
| **Cybersecurity** | CVE/NVD feeds, MITRE ATT&CK, CISA KEV, asset inventory | SOC 2, FedRAMP | CVE → CWE → affected product → asset traversal |
| **Financial services** | SEC/EDGAR filings, market data, regulatory feeds | SOC 2, PCI-DSS | Entity → filing → risk traversal |
| **Healthcare** | Claims, formulary, provider directories | HIPAA | Provider → patient → claims traversal |
| **Government** | Open data feeds, geospatial | FedRAMP | Opens federal SI channel |

**Cybersecurity is the strongest wedge:** data sources are public and well-known, security teams think in graph relationships, Cypher traversal is a natural fit, FedRAMP overlap opens the federal SI channel.

## Summary

The GTM stack (community → commercial licence → enterprise + SI) is the standard source-available playbook, minus the hosted tier: adoption under the use grant, a licence when the organisation outgrows it, enterprise and SI for the regulated buyer. Differentiation comes from execution: how clean the Hasura V2 migration story is, and how strong the governance features are for regulated verticals. The vertical packages reduce time-to-value for enterprise and give the SI channel a concrete, repeatable practice to sell.
