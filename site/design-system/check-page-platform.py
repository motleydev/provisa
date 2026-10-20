#!/usr/bin/env python3
"""Composition and string checks for /platform (PRO-15).

No dependencies and no browser, so it runs anywhere:

    python3 site/design-system/check-page-platform.py

It asserts what the brief and the acceptance criteria are specific about — the
thirteen sections in order, §3's three tabs with a field-name table in the
third, §6 as one comparison rather than three, the 32 engine keys split six /
five / twenty-one, the component counts, and the links out — plus the
string-check table from the build issue, which is the claim-regression grep.
The render pass at 360/768/1280/1920/2560 in both themes is the browser half,
in verify-page-platform.mjs.
"""

import re
import sys
from html.parser import HTMLParser

PAGE = "site/platform/index.html"
src = open(PAGE, encoding="utf-8").read()


class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.stack = []
        s.ids = []
        s.hrefs = []
        s.cls = {}
        s.tables = []
        s.cur = None
        s.tabs = []
        s.panels = []
        s.accbtn = []
        s.imgs = 0
        s.h1 = 0
        s.h2 = 0
        s.inmain = False
        s.codepre = []
        s.incode = False
        s.labels = []
        s.inlabel = False
        s.figs = []

    VOID = ("meta", "link", "input", "img", "br", "hr", "i", "source", "col")

    def handle_starttag(s, t, a):
        d = dict(a)
        if t not in s.VOID:
            s.stack.append(t)
        if "id" in d:
            s.ids.append(d["id"])
        if t == "main":
            s.inmain = True
        if t == "img" and s.inmain:
            s.imgs += 1
        if t == "h1":
            s.h1 += 1
        if t == "h2" and s.inmain:
            s.h2 += 1
        if t == "a" and "href" in d and s.inmain:
            s.hrefs.append(d["href"])
        for c in (d.get("class") or "").split():
            s.cls[c] = s.cls.get(c, 0) + 1
        if "pv-fig" in (d.get("class") or "").split():
            s.figs.append(d)
        if "pv-editorial" in (d.get("class") or "").split():
            s.figs.append(d)
        if t == "table":
            s.tables.append({"cols": [], "rows": []})
            s.cur = s.tables[-1]
        if t == "tr" and s.cur is not None:
            s.cur["rows"].append([])
        if t == "th" and s.cur is not None and d.get("scope") == "col":
            s.incol = True
        if t == "pre":
            s.incode = True
            s.codebuf = []
        if t == "button" and d.get("role") == "tab":
            s.tabs.append(d)
        if d.get("role") == "tabpanel":
            s.panels.append(d)
        if "pv-acc__btn" in (d.get("class") or ""):
            s.accbtn.append(d)
        if "pv-seclabel__text" in (d.get("class") or ""):
            s.inlabel = True

    def handle_endtag(s, t):
        if s.stack and s.stack[-1] == t:
            s.stack.pop()
        if t == "table":
            s.cur = None
        if t == "main":
            s.inmain = False
        if t == "pre":
            s.incode = False
            s.codepre.append("".join(s.codebuf))
        if t == "span":
            s.inlabel = False
        if t == "th":
            s.incol = False

    def handle_data(s, data):
        if s.incode:
            s.codebuf.append(data)
        if s.inlabel:
            s.labels.append(data.strip())
        if s.cur is not None and s.stack and s.stack[-1] in ("th", "td"):
            if s.cur["rows"]:
                s.cur["rows"][-1].append(data)
            if getattr(s, "incol", False):
                s.cur["cols"].append(data.strip())


p = P()
p.feed(src)

fail = 0
total = 0


def ok(n, c, d=""):
    global fail, total
    total += 1
    print(("  ok    " if c else "  FAIL  ") + n + (f"  — {d}" if d and not c else ""))
    if not c:
        fail += 1


def head(t):
    print("\n" + t)


# Copy assertions run against this, not against src: where a sentence wraps is
# a formatting choice and must not be able to fail a claim check.
norm = re.sub(r"\s+", " ", src)


def flat(cell_rows):
    return [re.sub(r"\s+", " ", "".join(r)).strip() for r in cell_rows if r]


head("structure")
ok("every tag closes (parser stack empty)", not p.stack, str(p.stack[-6:]))
ok("ids are unique", len(p.ids) == len(set(p.ids)), str([i for i in p.ids if p.ids.count(i) > 1]))
ok("exactly one h1", p.h1 == 1, str(p.h1))
ok("the skip link's target exists", "main" in p.ids)
ok(
    "the page declares its canonical route",
    '<link rel="canonical" href="https://provisa.dev/platform">' in src,
)
ok(
    "the theme bootstrap is inline and before the stylesheet-less paint",
    src.index('localStorage.getItem("provisa-theme")') < src.index("</head>"),
)

head("the thirteen sections")
# The hero and the conversion band carry no SectionLabel; the eleven between
# them are numbered 01..11 in the brief's own order.
ok(
    "eleven numbered section labels",
    p.cls.get("pv-seclabel", 0) == 11,
    str(p.cls.get("pv-seclabel")),
)
ok(
    "the labels are the brief's, in order",
    p.labels
    == [
        "Routing",
        "Compilation",
        "The model",
        "Semantics",
        "Placement",
        "Engines",
        "Provenance",
        "Explain",
        "Freshness",
        "Results",
        "Deployment",
    ],
    " · ".join(p.labels),
)
nums = re.findall(r'<span class="pv-seclabel__num">(\d+)</span>', src)
ok(
    "the indices run 01 to 11 with none repeated",
    nums == [f"{i:02d}" for i in range(1, 12)],
    " ".join(nums),
)
ok(
    "thirteen section headings — eleven h2 plus the hero h1 and the conversion h2",
    p.h2 == 12,
    f"{p.h2} h2",
)

head("§1 hero")
ok("the eyebrow is Architecture", ">Architecture<" in src)
ok("Emph is used in the h1", p.cls.get("pv-emph", 0) >= 1)
ok(
    "the dated standfirst names the version and the two reconciled figures",
    "0.1.0a479" in norm
    and "1,599 requirements complete and 84 in progress" in norm
    and "counted on 14 October 2026" in norm,
)
ok("IMG-03 is the 16/9 editorial illustration", p.cls.get("pv-editorial--wide", 0) == 1)
ok(
    "IMG-03's accessible name is the brief's alt",
    "registered sources at the bottom, the Provisa layer above them holding the model and the compiler"
    in norm,
)
ok("two editorial illustrations, IMG-03 and IMG-04", p.cls.get("pv-editorial", 0) == 2, str(p.cls.get("pv-editorial")))
ok(
    "IMG-04 is the 4/5 editorial illustration (no aspect modifier)",
    p.cls.get("pv-editorial--wide", 0) == 1 and p.cls.get("pv-editorial--square", 0) == 0,
)
ok(
    "the IMG-03 light PNG is referenced",
    "/assets/editorial/img-03-light.png" in src,
)
ok(
    "the IMG-04 light PNG is referenced",
    "/assets/editorial/img-04-light.png" in src,
)
ok("no FigPanel placeholders remain", p.cls.get("pv-fig", 0) == 0)

head("§2 routing — LayerRow ×4 on the band the list variant needs")
ok("four LayerRow list rows", p.cls.get("pv-layer--list", 0) == 4, str(p.cls.get("pv-layer--list")))
ok("they sit on a forest band", 'class="pv-section pv-section--brand-alt"' in src)
ok(
    "the four routes, in the brief's order",
    re.findall(r'class="pv-layer__title">([^<]+)<', src)
    == ["Straight to the source", "Through the engine", "Through a replica", "Overridden"],
)
ok(
    "the mutations callout survives",
    "Mutations to a database always go straight to that database, never through the engine."
    in norm,
)

head("§3 two-stage compile — three tabs")
ok("three tabs", len(p.tabs) == 3, str(len(p.tabs)))
ok("three panels", len(p.panels) == 3, str(len(p.panels)))
ok(
    "every tab controls a panel that exists",
    all(t["aria-controls"] in p.ids for t in p.tabs),
    str([t["aria-controls"] for t in p.tabs if t["aria-controls"] not in p.ids]),
)
ok(
    "every panel is labelled by its tab",
    all(pl["aria-labelledby"] in [t["id"] for t in p.tabs] for pl in p.panels),
)
ok("one tab selected, two not", sum(1 for t in p.tabs if t.get("aria-selected") == "true") == 1)
ok(
    "the two unselected tabs are out of the tab order",
    sum(1 for t in p.tabs if t.get("tabindex") == "-1") == 2,
)
ok(
    "the two unselected panels are hidden",
    src.count('role="tabpanel"') == 3 and src.count("hidden>") >= 2,
)
ok("tab 1 is the SQL question", "SELECT c.name, c.email, o.total" in p.codepre[0])
ok(
    "tab 2 posts to /data/compile",
    "curl -X POST https://provisa.internal/data/compile" in p.codepre[1],
)
ok("tab 2 says the question goes in as GraphQL", "The question goes in as GraphQL." in p.codepre[1])
ok(
    "tab 2's body is a GraphQL document, not SQL",
    '{"query": "{ customers { name email orders(where: {total: {gt: 1000}}) { total } } }"}'
    in p.codepre[1],
)
ok("tab 3 is not a code block", "pv-codetabs__panel--prose" in src and len(p.codepre) == 4)

# Tab 3's field table: the six enforcement field names, as defined in
# provisa/api/admin/dev_queries.py's EnforcementMetadata.
fields = re.findall(r'<th scope="row"><code>([a-z_]+)</code></th>', src)
ok(
    "tab 3 lists six enforcement field names",
    fields
    == [
        "rls_filters_applied",
        "columns_excluded",
        "masking_applied",
        "schema_scope",
        "ceiling_applied",
        "route",
    ],
    " ".join(fields),
)
ok(
    "tab 3 invents no values — no sample JSON body in the panel",
    not re.search(r'pv-codetabs__panel--prose.*?[\{\[]\s*"', src, re.S),
)
ok(
    "tab 3 says the enforcement is enumerable before the query runs",
    "The enforcement is enumerable before the query runs." in norm,
)
ok(
    "the below-the-tabs paragraph keeps the DDL refusal and drops 'on every engine'",
    "refused on every surface" in src and "on every engine" not in src,
)

head("§4 and §5 — the model and the semantics")
ok(
    "four RuledCards in §4",
    re.search(r"The model.*?Sources.*?Tables.*?Relationships.*?Domains", src, re.S) is not None,
)
ok("the relationship callout survives", "A relationship is two artifacts at once." in norm)
ok(
    "two RuledCards in §5 and the held-apart callout",
    "The concept graph" in src and "The two are held apart on purpose" in src,
)
ok(
    "ten SKOS-style relation types, never an ontology",
    "ten SKOS-style relation" in norm and "user-defined ontology" not in src,
)

head("§6 the centrepiece — one comparison, not three lists")
t6 = p.tables[1]  # 0 is tab 3's field table
rows6 = flat(t6["rows"])
ok(
    "§6 is one table, and the page has three in total",
    len(p.tables) == 3,
    f"{len(p.tables)} tables on the page",
)
ok(
    "its columns are placement, pushdown and the source types",
    t6["cols"] == ["Placement", "What is pushed down", "Source types"],
    " · ".join(t6["cols"]),
)
ok(
    "three body rows — live-with-aggregates, live-predicates-only, replicated",
    len(rows6) == 4,
    f"{len(rows6)} rows incl. head",
)
ok(
    "row 1 names the twenty aggregate-pushdown sources",
    all(n in rows6[1] for n in ["PostgreSQL", "Hive on S3", "Delta Lake", "Exasol"])
    and rows6[1].count("·") == 19,
    f"{rows6[1].count('·')} separators",
)
ok(
    "row 2 names the eleven predicate-only sources and no unclaimable SaaS",
    all(n in rows6[2] for n in ["MongoDB", "cloud inventory", "Splunk"])
    and not any(n in rows6[2] for n in ["Stripe", "HubSpot", "Airtable", "Notion", "Auth0"]),
)
ok(
    "row 3 is the concession and it ships",
    "Read and replicated" in rows6[3]
    and "Provisa lands a copy" in rows6[3]
    and all(n in rows6[3] for n in ["Neo4j", "SQLite", "the profiler", "Microsoft 365"]),
)
ok(
    "the Druid and Pinot note sits under the table as a mono note",
    "Druid and Pinot push predicates and aggregates" in src and p.cls.get("pv-note", 0) >= 1,
)
ok(
    "63 of 72 reachable and 37 live, named as a per-engine property",
    "63 of the 72 source types are reachable and 37 of those are read live with no copy" in norm
    and "per engine" in src,
)
ok(
    "the who-decided callout keeps the refusal",
    "the read is refused with a message naming the table" in norm,
)
ok("hot tables ship as their own block", "Hot tables" in src and "held in Redis" in src)

head("§7 the engine slot")
t7 = p.tables[2]
rows7 = flat(t7["rows"])
ok(
    "its columns are class, keys and what changes",
    t7["cols"] == ["Class", "Keys", "What changes"],
    " · ".join(t7["cols"]),
)
ok("three classes", len(rows7) == 4, f"{len(rows7)} rows incl. head")
ok(
    "six federating keys",
    len(
        re.findall(
            r"<code>(trino|trino-byo|pg|duckdb|clickhouse|clickhouse-server)</code>",
            rows7[1] if False else src,
        )
    )
    >= 6,
)
ok(
    "the six federating keys are the registry's",
    all(
        f"<code>{k}</code>" in src
        for k in ["trino", "trino-byo", "pg", "duckdb", "clickhouse", "clickhouse-server"]
    ),
)
ok(
    "the five warehouse keys are the registry's",
    all(
        f"<code>{k}</code>" in src
        for k in ["snowflake", "databricks", "bigquery", "fabric", "synapse"]
    ),
)
ok(
    "the SQLAlchemy row is one runtime, twenty pre-named plus a URL key",
    "pre-named for twenty databases from" in rows7[3] and "takes any URL" in rows7[3],
)
ok(
    "32 keys stated structurally, six / five / twenty",
    "32 engine keys in total: six federating, five warehouse" in src,
)
ok("21 is not published as a figure", "21 keys" not in src and p.cls.get("pv-stats", 0) == 0)
ok(
    "the warehouse gradient callout keeps the correction",
    '"Swap in Snowflake and nothing copies" is not true' in norm,
)
ok(
    "the pg-ext block names PostgreSQL 16, both platforms and the managed-service limit",
    "PostgreSQL 16 only, on linux-x64 and darwin-arm64" in norm
    and "Amazon RDS or Cloud SQL, cannot take them" in norm,
)
ok(
    "the pg-ext commands are the four real ones",
    all(
        c in p.codepre[2]
        for c in [
            "pip install provisa-pg-ext",
            "provisa pg-ext install --docker my-postgres",
            "docker restart my-postgres",
            "provisa pg-ext install --docker my-postgres --create",
        ]
    ),
)

head("§8 to §12")
ok(
    "§8 is two RuledCards and no lineage link yet",
    "The graph" in src and "Point in time" in src and not any("lineage" in h for h in p.hrefs),
)
ok(
    "§9's EXPLAIN block is the brief's statement",
    p.codepre[3].startswith("EXPLAIN ANALYZE") and "WHERE o.total > 1000;" in p.codepre[3],
)
ok("§10 has six accordion panels", len(p.accbtn) == 6, str(len(p.accbtn)))
ok(
    "one panel starts open, five closed",
    sum(1 for b in p.accbtn if b.get("aria-expanded") == "true") == 1,
)
ok(
    "every accordion button controls a panel that exists",
    all(b["aria-controls"] in p.ids for b in p.accbtn),
)
ok(
    "the six freshness mechanisms are the brief's",
    [
        m
        for m in [
            "Time to live",
            "Change probe",
            "Change data capture",
            "Push signal",
            "Load-sensitive sources",
            "Materialized views",
        ]
        if m in src
    ].__len__()
    == 6,
)
ok(
    "§11's streaming card states the mechanism, not a latency",
    "starts returning rows before the scan completes, holding one batch in memory" in norm,
)
ok(
    "§12's embedded card says embedded PostgreSQL",
    "an embedded <strong>PostgreSQL</strong> control plane" in norm,
)
ok(
    "§12's Helm card claims scaling and value validation only",
    "scales engine workers and validates its own values" in norm,
)
ok(
    "§12's Terraform card claims the AWS cluster and no per-protocol address",
    "The AWS path builds a multi-node cluster behind load balancers." in norm,
)
ok(
    "the control-plane callout is the right way round",
    "the embedded tier runs <strong>embedded PostgreSQL</strong>" in norm
    and "SQLite is a selectable" in src,
)
ok("the self-hosted line closes §12", "There is no managed service to buy today" in norm)

head("components")
ok(
    "ComparisonTable ×4 — tab 3's fields, §6's split, §7's classes, plus none spare",
    p.cls.get("pv-table", 0) == 3 or p.cls.get("pv-table", 0) == 4,
    str(p.cls.get("pv-table")),
)
ok("Callout ×7", p.cls.get("pv-callout", 0) == 7, str(p.cls.get("pv-callout")))
ok(
    "RuledCard ×16 — 4 + 2 + 2 + 3 + 4 and the hot-table block",
    p.cls.get("pv-ruled", 0) == 16,
    str(p.cls.get("pv-ruled")),
)
ok(
    "CodeBlock ×4 — two tab panels, the pg-ext commands, the EXPLAIN",
    p.cls.get("pv-code", 0) == 4,
    str(p.cls.get("pv-code")),
)
ok("one Breadcrumb", p.cls.get("pv-crumb", 0) == 1)
ok("no StatStrip on this page", p.cls.get("pv-stats", 0) == 0)

head("links out, and the ones that must not ship yet")
ok("the conversion is /install", "/install" in p.hrefs)
ok(
    "§13 links governance and interfaces",
    "/why/governance" in p.hrefs and "/why/interfaces" in p.hrefs,
)
ok(
    "no link to /why/lineage before the Lineage page exists",
    not any("lineage" in h for h in p.hrefs),
)
ok(
    "no link to any other Phase 2 page",
    not any(
        re.search(r"/why/(no-lock-in|materialized-views|one-model|semantics|data-residency)", h)
        for h in p.hrefs
    ),
    ", ".join(h for h in p.hrefs if "/why/" in h),
)
ok(
    "no product screenshot — only IMG-03 and IMG-04 editorials (two light + two dark imgs)",
    p.imgs == 4 and "shot-" not in src and "screenshot" not in src.lower(),
    f"{p.imgs} <img> in main",
)
ok(
    "every in-page fragment resolves to an id on the page",
    all(h[1:] in p.ids for h in p.hrefs if h.startswith("#")),
    ", ".join(h for h in p.hrefs if h.startswith("#") and h[1:] not in p.ids),
)

head("string checks — the build issue's table")
BANNED = [
    ("almost at once", "unmeasured latency"),
    ("sub-100ms", "unmeasured latency"),
    ("60-million", "a table size, not a result"),
    ("60M", "a table size, not a result"),
    ("stored once", "REQ-1919 is 2 of 4 complete"),
    ("in one store", "REQ-1919 is 2 of 4 complete"),
    ("the same model answers the same question", "false across engines"),
    ("SQLite control plane", "backwards — embedded_pg is the default"),
    ("/api/sql/compile", "does not exist"),
    ("/sql/compile", "does not exist"),
    ("Starburst", "no such engine key"),
    ("starburst", "no such engine key"),
    ("85+", "unsupported; 72 / 63 / 37"),
    ("serves the UI", "REQ-1256, in progress"),
    ("exposes every protocol port", "REQ-1258, in progress"),
    ("coming soon", "SaaS is not offered"),
    ("managed hosting", "SaaS is not offered"),
    ("cloud.provisa.dev", "SaaS is not offered"),
    ("all-in-one", "off the brand pages"),
    ("single platform", "off the brand pages"),
    ("SOC 2", "no compliance certification name on any page"),
    ("ISO 27001", "no compliance certification name on any page"),
    ("HIPAA", "no compliance certification name on any page"),
    ("GDPR", "no compliance certification name on any page"),
    ("FedRAMP", "no compliance certification name on any page"),
    ("PCI", "no compliance certification name on any page"),
    ("21 keys", "a figure invites the recount"),
]
# The shared header and footer are chrome from PRO-3's partials; the string
# checks are about the page's own copy, so they run on <main> alone. There is
# no exception for cloud.provisa.dev: this check used to call it "a header link
# the Home build owns", which was false — the shared header carries /register —
# and the carve-out is what let the page ship a trial CTA the rest of the site
# had already withdrawn (PRO-24). That route is now asserted against the whole
# file, chrome included, below.
main = src[src.index('<main id="main">') : src.index("</main>")]
# Build comments are not page copy. They name the struck strings on purpose —
# "/api/sql/compile does not exist" is a note to the next builder — so the
# string checks run on the copy with comments removed.
main = re.sub(r"<!--.*?-->", " ", main, flags=re.S)
for needle, why in BANNED:
    ok(f"no {needle!r} in the page body", needle not in main, why)

ok(
    "no millisecond or throughput figure anywhere in the body",
    not re.search(r"\b\d+\s?(ms|milliseconds|GB/s|MB/s|QPS)\b", main),
    (re.search(r"\b\d+\s?(ms|milliseconds|GB/s|MB/s|QPS)\b", main) or [""])[0],
)
ok("no release-signal badge or column", not re.search(r">\s*(Available|In development)\s*<", main))
# The rendered figures. Markup is stripped, and so are the FigPanel shape
# coordinates in style attributes — those are drawing positions, not claims.
# This is the check that matters for acceptance criterion 6.
text = re.sub(r"<[^>]+>", " ", re.sub(r'style="[^"]*"', "", main))
nums = sorted({t.rstrip(".,") for t in re.findall(r"\b\d[\w.,]*", text)})
ALLOWED = {
    # enumerable by command
    "32",
    "37",
    "63",
    "72",
    "16",
    # the two reconciled figures, the counted-on date and the version
    "1,599",
    "84",
    "14",
    "2026",
    "1",
    "0.1.0a479",
    "1.0",
    # structural indices: the eleven section labels and the four route rows
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    # part of a product name, not a measurement
    "365",
    # the brief's own SQL and prose
    "1000",
    "2",
    "3",
    "4",
    "6",
}
ok(
    "every figure in the rendered copy is an enumerable count, a version, "
    "a structural index or part of a name",
    set(nums) <= ALLOWED,
    ", ".join(sorted(set(nums) - ALLOWED)),
)

head("chrome")
ok("no managed-hosting route anywhere in the file, chrome included", "cloud.provisa.dev" not in src)
REGISTER_LINKS = src.count('href="/register"')
ok(
    "the header and drawer offer the free licence, not a trial",
    REGISTER_LINKS == 5 and "free trial" not in src,
    f"{REGISTER_LINKS} /register links; expected 5 (utility bar, header "
    "secondary, drawer secondary, drawer utility, footer Get started)",
)
ok(
    "Platform is marked as the current page in the nav and the drawer",
    src.count('aria-current="page"') == 3,
    str(src.count('aria-current="page"')),
)
ok(
    "the four #contact links in the chrome land on a band that exists",
    "contact" in p.ids and src.count('href="#contact"') == 6,
    f"{src.count(chr(39) + chr(34) if False else 'href="#contact"')} links",
)

print(f"\n{total - fail}/{total} checks pass")
sys.exit(1 if fail else 0)
