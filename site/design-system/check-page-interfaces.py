#!/usr/bin/env python3
"""Composition and string checks for /why/interfaces (PRO-11).

No dependencies and no browser, so it runs anywhere:

    python3 site/design-system/check-page-interfaces.py

It asserts the things the brief and the acceptance criteria are specific
about — the seven-row matrix with its Default column, both footnotes, the
two-route table, the component counts, the connection snippets with their
comment lines and their ports, and the links out — plus the string-check table
from the build issue, which is the claim-regression grep. The render pass at
360/768/1280/1920/2560 in both themes is the browser half, in
verify-page-interfaces.mjs.
"""

import re
import sys
from html.parser import HTMLParser

src = open("site/why/interfaces.html", encoding="utf-8").read()


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
        s.inmain = False
        s.text = []
        s.codepre = []
        s.incode = False

    def handle_starttag(s, t, a):
        d = dict(a)
        if t != "br" and t not in ("meta", "link", "input", "img", "i", "source"):
            s.stack.append(t)
        if "id" in d:
            s.ids.append(d["id"])
        if t == "main":
            s.inmain = True
        if t == "img" and s.inmain:
            s.imgs += 1
        if t == "h1":
            s.h1 += 1
        if t == "a" and "href" in d and s.inmain:
            s.hrefs.append(d["href"])
        for c in (d.get("class") or "").split():
            s.cls[c] = s.cls.get(c, 0) + 1
        if t == "table":
            s.tables.append({"cols": [], "rows": []})
            s.cur = s.tables[-1]
        if t == "tr" and s.cur is not None:
            s.cur["rows"].append([])
        if t in ("th", "td") and s.cur is not None:
            s.celltag = t
            s.cellbuf = []
        if t == "pre":
            s.incode = True
            s.codebuf = []
        if t == "button" and d.get("role") == "tab":
            s.tabs.append(d)
        if d.get("role") == "tabpanel":
            s.panels.append(d)
        if "pv-acc__btn" in (d.get("class") or ""):
            s.accbtn.append(d)

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

    def handle_data(s, data):
        if s.incode:
            s.codebuf.append(data)
        if s.cur is not None and s.stack and s.stack[-1] in ("th", "td"):
            s.cur["rows"][-1].append(data) if s.cur["rows"] else None


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


# tag balance
ok("every tag closes (parser stack empty)", not p.stack, str(p.stack[-6:]))
ok("ids are unique", len(p.ids) == len(set(p.ids)), str([i for i in p.ids if p.ids.count(i) > 1]))

# §2 matrix, read off the raw rows
t1 = re.search(r'<caption class="pv-sr">Provisa&#8217;s|<caption class="pv-sr">Provisa', src)
m = re.search(r"<thead>(.*?)</thead>(.*?)</table>", src, re.S)
cols = re.findall(r'<th scope="col">([^<]+)</th>', m.group(1))
rows = re.findall(r'<th scope="row">([^<]+)</th>', m.group(2))
ok(
    "§2 columns are Listener · Default · Carries · What connects",
    cols == ["Listener", "Default", "Carries", "What connects"],
    " · ".join(cols),
)
ok("§2 has seven listener rows", len(rows) == 7, str(rows))
ok(
    "§2 listeners in brief order",
    rows == ["HTTP", "gRPC", "Arrow Flight", "pgwire", "Bolt", "Airport", "MCP"],
    str(rows),
)
body2 = m.group(2)
ok(
    "three defaults are on, four are off",
    body2.count(">on, <code>") == 3
    and body2.count("<strong>off</strong> until you set a port") == 4,
    f"on={body2.count('>on, <code>')} off={body2.count('<strong>off</strong> until you set a port')}",
)

# footnotes
ok(
    "footnote 1 — the sixteenth surface, outbound",
    "sixteenth goes the other way" in src and "Kafka topic" in src,
)
ok(
    "footnote 2 — product default vs deployment convention",
    "settings_catalog.py" in src and "not\n            product defaults" in src.replace("\r", ""),
)

# §5a
ok(
    "a second table with the two routes",
    src.count('<div class="pv-table">') == 2
    and "POST /data/compile" in src
    and "POST /data/sql/explain" in src,
)
ok("compile takes a GraphQL document", "A GraphQL document" in src)
ok(
    "no SQL-in SQL-out compile route sentence ships",
    "There is no SQL-in, SQL-out compile route." in src,
)

# component counts
c = p.cls
ok("Callout ×3 (two in §3, one in §7)", c.get("pv-callout") == 3, str(c.get("pv-callout")))
ok("§3's first callout is the forest tone", c.get("pv-callout--get") == 1)
ok(
    "Accordion items, one per surface panel in the brief",
    c.get("pv-acc__item") == 13,
    str(c.get("pv-acc__item")),
)
ok(
    "one accordion panel starts open and twelve are collapsed",
    len([b for b in p.accbtn if b.get("aria-expanded") == "true"]) == 1
    and len([b for b in p.accbtn if b.get("aria-expanded") == "false"]) == 12
    and src.count('class="pv-acc__panel" id=') == 13,
    f"open={len([b for b in p.accbtn if b.get('aria-expanded') == 'true'])}",
)
ok(
    "CodeTabs: four tabs, four panels",
    len(p.tabs) == 4 and len(p.panels) == 4,
    f"{len(p.tabs)}/{len(p.panels)}",
)
ok("one tab selected, three not", sum(1 for t in p.tabs if t.get("aria-selected") == "true") == 1)
ok(
    "every tab's aria-controls resolves to a panel id",
    all(t["aria-controls"] in p.ids for t in p.tabs),
)
ok(
    "every accordion button's aria-controls resolves",
    all(b["aria-controls"] in p.ids for b in p.accbtn),
)
ok("RuledCard ×5", c.get("pv-ruled") == 5, str(c.get("pv-ruled")))
ok("one editorial illustration (IMG-07)", c.get("pv-editorial") == 1)
ok("no FigPanel placeholders remain", c.get("pv-fig", 0) == 0)
ok("IMG-07 light PNG is referenced", "/assets/editorial/img-07-light.png" in src)
ok(
    "Button ×2 in the conversion band",
    src.count('class="pv-btn pv-btn--on-color"') == 1
    and src.count('class="pv-btn pv-btn--inverse"') == 1,
)
ok("exactly one h1", p.h1 == 1)
ok("Emph in the hero and §6", c.get("pv-emph") == 2, str(c.get("pv-emph")))
ok("seven section labels", c.get("pv-seclabel") == 7, str(c.get("pv-seclabel")))
ok(
    "no product screenshot in main — only the IMG-07 editorial (light + dark imgs)",
    p.imgs == 2 and "shot-" not in src and "screenshot" not in src.lower(),
    f"{p.imgs} <img> in main",
)

# snippets
code = p.codepre
ok("four code blocks", len(code) == 4, str(len(code)))
ok(
    "psql sets the port before it connects",
    "PROVISA_PGWIRE_PORT=5439" in code[0]
    and code[0].index("PROVISA_PGWIRE_PORT") < code[0].index('psql "postgresql'),
)
ok(
    "psql's no-default-port comment survives verbatim",
    "# The Postgres listener has no default port. 5439 is what our" in code[0]
    and "# Helm chart and installer set; any free port works." in code[0],
)
ok(
    "bolt names PROVISA_BOLT_PORT and the convention",
    "# Bolt has no default port either. 7687 is the convention," in code[1]
    and "# set by PROVISA_BOLT_PORT before the server starts." in code[1],
)
ok("flight says on by default, on 8815", "# Flight is on by default, on 8815." in code[2])
ok("graphql carries the bearer token", "Bearer $TOKEN" in code[3])
ok(
    "the comment lines are marked up as comments",
    src.count('class="pv-code__c"') == 5,
    str(src.count('class="pv-code__c"')),
)
ok("the Cypher pattern survives the escape", "MATCH (c:Customer)-[:PLACED]->(o:Order)" in code[1])
ok(
    "both > comparisons survive the escape",
    code[1].count("o.total > 1000") == 1 and "total > 1000" in code[2],
)

# links
h = p.hrefs
ok("primary conversion → /install", "/install" in h)
ok("secondary conversion → /register", "/register" in h)
ok("Book a demo → the demo form on this page", "#contact-demo" in h and "contact-demo" in p.ids)
ok("no link in main points at a trial host", not [x for x in h if "cloud." in x], str(h))
ok(
    "no link in the page body to an unbuilt Phase 2 page",
    not [x for x in h if re.search(r"/vs/hasura|one-model", x)],
    str(h),
)
ok(
    "the nav marks Interfaces as current",
    src.count('href="/why/interfaces" aria-current="page"') == 2,
)
ok("canonical is the route", 'rel="canonical" href="https://provisa.dev/why/interfaces"' in src)
ok("the skip link target exists", "main" in p.ids)
ok("#contact exists for the header and utility links", "contact" in p.ids)

# ---- the string-check table from the build issue --------------------
print("\nstrings that must not appear")
BANS = [
    "31337",
    "5251",
    "/api/sql/compile",
    "/sql/compile",
    "nine ways in",
    "five listeners",
    "cloud.provisa.dev",
    "hosted trial",
    "managed service",
    "on every engine",
    "SOC 2",
    "ISO 27001",
    "HIPAA",
    "GDPR",
    "FedRAMP",
    "PCI",
    "all-in-one",
    "single platform",
    "Available",
    "In development",
]
for b in BANS:
    hits = [m.start() for m in re.finditer(re.escape(b), src)]
    ok(
        f"{b!r} does not appear",
        not hits,
        "; ".join(src[max(0, i - 70) : i + 70].replace(chr(10), " ") for i in hits[:2]),
    )
# "seventeen" is the brief's own copy in the first footnote, narrating the
# count a previous draft reached. It is on the ban list and in the final copy,
# so it is asserted to appear exactly once, in that sentence, and nowhere else.
# Raised with the Content Manager on PRO-11.
seventeen = [m.start() for m in re.finditer("seventeen", src)]
ok(
    "'seventeen' appears only in the footnote that explains the old count",
    len(seventeen) == 1
    and "previous draft of this page got to seventeen"
    in src.replace(chr(10) + "            ", " "),
    f"{len(seventeen)} occurrences",
)

nums = sorted(set(re.findall(r"\b([0-9]{4,5})\b", src)))
ok(
    "the only ports on the page are the six the SME resolved",
    set(nums) - {"1000", "1258", "1913"} == {"8000", "50051", "8815", "5439", "7687", "8009"},
    str(nums),
)

print(f"\n{total - fail}/{total} checks pass")
sys.exit(1 if fail else 0)
