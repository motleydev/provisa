# Copyright (c) 2026 Kenneth Stott
#
# This source code is licensed under the Business Source License 1.1
# found in the LICENSE file in the root directory of this source tree.
#
# NOTICE: Use of this software for training artificial intelligence or
# machine learning models is strictly prohibited without explicit written
# permission from the copyright holder.

"""A pull request runs the gates its own change can fail, and no others.

Every open pull request once carried the same four red checks -- pip-audit, ruff + pyright,
pytest tests/unit, tsc + vitest -- for causes in files none of them touched: the app lanes ran on
every pull request, so a website change inherited whatever was red on main. Red that a change
cannot have caused is read as background noise, and the noise then hides the next real break (it
hid four). So each app lane is filtered to the paths it can fail on, and the website keeps the
gates that are its own.

The filters are held here rather than by review because the cost of a wrong one is silent: a gate
excluded from the change that breaks it reports nothing, and the break lands."""

from __future__ import annotations

import re
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parents[2]
WORKFLOWS = REPO / ".github" / "workflows"

# The lanes that read the product, not the website. Each is filtered on both of its events.
APP_LANES = [
    "lint.yml",
    "unit-tests.yml",
    "ui-unit-tests.yml",
    "cve-audit.yml",
    "requirements-ci.yml",
]

# A change of only these starts no app lane.
WEBSITE_ONLY = ["site/index.html", "site/assets/app.js", "site/why/sources.html"]


def _triggers(workflow: str) -> dict:
    return yaml.safe_load((WORKFLOWS / workflow).read_text())[True]  # PyYAML reads `on` as True


def _matches(pattern: str, path: str) -> bool:
    """GitHub's path filter for the patterns these workflows use: `**` crosses directories,
    `*` does not."""
    regex = re.escape(pattern).replace(r"\*\*/", "(?:.*/)?").replace(r"\*\*", ".*")
    regex = regex.replace(r"\*", "[^/]*")
    return re.fullmatch(regex, path) is not None


def _starts_a_run(workflow: str, event: str, changed: list[str]) -> bool:
    """Whether a change to ``changed`` starts ``workflow`` on ``event``: it does when at least one
    file is left in after every pattern has been applied in order (a later pattern wins). A trigger
    with no `paths` runs on everything."""
    patterns = (_triggers(workflow)[event] or {}).get("paths")
    if patterns is None:
        return True

    def _kept(path: str) -> bool:
        kept = False
        for pattern in patterns:
            if pattern.startswith("!"):
                if _matches(pattern[1:], path):
                    kept = False
            elif _matches(pattern, path):
                kept = True
        return kept

    return any(_kept(path) for path in changed)


def test_a_website_only_change_starts_no_app_lane():
    for workflow in APP_LANES:
        for event in ("push", "pull_request"):
            assert not _starts_a_run(workflow, event, WEBSITE_ONLY), f"{workflow}:{event}"
    # The image carries the product, not the website; it has no pull_request trigger.
    assert not _starts_a_run("docker-image.yml", "push", WEBSITE_ONLY)


def test_an_app_lane_filters_its_pull_requests_and_not_only_its_pushes():
    """A filter on the push to main alone leaves every pull request running every lane -- which
    is the state this guard exists to end."""
    for workflow in APP_LANES:
        for event in ("push", "pull_request"):
            assert (_triggers(workflow)[event] or {}).get("paths"), f"{workflow}:{event} unfiltered"


def test_a_change_that_touches_the_product_starts_every_app_lane():
    for workflow in APP_LANES:
        for event in ("push", "pull_request"):
            for changed in (
                ["provisa/api/app.py"],
                ["uv.lock"],
                ["pyproject.toml"],
                ["provisa-ui/src/pages/sources/constants.ts"],
                # A website change alongside a product change still runs them.
                ["site/index.html", "provisa/core/models.py"],
            ):
                assert _starts_a_run(workflow, event, changed), f"{workflow}:{event} {changed}"


def test_a_website_only_change_still_starts_the_websites_own_gates():
    """Filtering the app lanes out must not leave a site pull request with nothing gating it."""
    assert _starts_a_run("site-review.yml", "pull_request", WEBSITE_ONLY)
    assert _starts_a_run("site-generators.yml", "pull_request", WEBSITE_ONLY)


def test_the_site_generator_gate_runs_on_every_pull_request():
    """Its two generators read provisa-ui/src and demo/named and write site/, README.md, docs/ and
    mkdocs.yml: a pattern list naming those inputs goes stale the first time a generator gains one,
    and a stale list makes this check green having run on nothing."""
    triggers = _triggers("site-generators.yml")
    assert (triggers["pull_request"] or {}).get("paths") is None
    assert (triggers["push"] or {})["branches"] == ["main"]


def test_each_site_generator_check_is_run_by_exactly_one_workflow():
    """The checks moved out of ui-unit-tests.yml. Moved, not dropped: a generator whose --check no
    workflow runs is the break of #40 again (a rebuilt page lost the marker comments the source
    picker writes between, and the generator threw on main and on every open pull request)."""
    for script in ("gen-site-demos.mjs", "gen-site-source-picker.mjs"):
        assert (REPO / "scripts" / script).is_file()
        runs = [p.name for p in WORKFLOWS.glob("*.yml") if f"{script} --check" in p.read_text()]
        assert runs == ["site-generators.yml"], f"{script}: {runs}"


def test_the_websites_own_python_checkers_are_still_linted():
    """site/design-system/check-page-platform.py arrived over ruff's 100-column limit through a
    site pull request and turned Lint red everywhere. The site's checkers are ruff's, so a site
    change that adds or edits one runs Lint even though site/ is otherwise filtered out."""
    for event in ("push", "pull_request"):
        assert _starts_a_run("lint.yml", event, ["site/design-system/check-page-platform.py"])
        assert not _starts_a_run("lint.yml", event, ["site/design-system/kit.css"])


def test_the_requirements_gate_runs_on_its_sources_and_on_what_it_generates():
    for event in ("push", "pull_request"):
        for path in ("docs/arch/requirements.yaml", "docs/arch/features.yaml"):
            assert _starts_a_run("requirements-ci.yml", event, [path]), path
        # A hand edit to a generated file IS the drift this gate reports.
        for path in ("docs/arch/requirements.md", "docs/features.md"):
            assert _starts_a_run("requirements-ci.yml", event, [path]), path
        # Any other documentation file cannot fail it.
        assert not _starts_a_run("requirements-ci.yml", event, ["docs/sources.md", "README.md"])


def test_every_file_under_docs_that_a_unit_test_reads_still_starts_the_unit_workflow():
    """Unlike the container suite, the unit workflow keeps documentation in its filter: tests in
    tests/unit/ read documentation files directly (docs/metadata-export.md,
    docs/arch/canonical-mail-schema.md). If one is ever filtered out, a change to it is never run
    against the test that reads it."""
    # Both ways a test names a file: one string ("docs/sources.md"), or a Path join of its
    # segments (`"docs" / "arch" / "canonical-mail-schema.md"`). The join is read segment by
    # segment -- taking only its last would look for docs/canonical-mail-schema.md, which is no
    # file, and the test would quietly check nothing.
    joined = re.compile(r"""["'](docs|site)["']((?:\s*/\s*["'][\w.-]+["'])+)""")
    inline = re.compile(r"""["']((?:docs|site)/[\w./-]+)["']""")
    read: set[str] = set()
    for path in (REPO / "tests" / "unit").glob("test_*.py"):
        if path.name in ("test_ci_pr_paths.py", "test_ci_push_paths.py"):
            continue  # Their own strings are filter fixtures, not files they read.
        text = path.read_text(encoding="utf-8")
        read |= set(inline.findall(text))
        for root, rest in joined.findall(text):
            read.add("/".join([root, *re.findall(r"""["']([\w.-]+)["']""", rest)]))
    present = sorted(p for p in read if (REPO / p).is_file())
    assert present, "the scan found no file; its pattern no longer matches how a test names one"
    for path in present:
        if path.startswith("site/"):
            continue  # No unit test reads a page under site/; the next test holds that.
        assert _starts_a_run("unit-tests.yml", "pull_request", [path]), path


def test_no_unit_test_reads_a_page_under_site():
    """What lets the unit workflow filter the website out. A test that comes to read one makes the
    filter wrong, and this fails rather than the change going unrun."""
    naming = re.compile(r"""["']site/[\w./-]+["']""")
    offenders = []
    for path in (REPO / "tests" / "unit").glob("test_*.py"):
        if path.name in ("test_ci_pr_paths.py", "test_ci_push_paths.py"):
            continue
        for named in naming.findall(path.read_text(encoding="utf-8")):
            if (REPO / named.strip("\"'")).is_file():
                offenders.append(f"{path.name}: {named}")
    assert offenders == []
