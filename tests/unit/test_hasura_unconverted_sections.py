# Copyright (c) 2026 Kenneth Stott
# Canary: 1c7ea8d8-cba6-42cf-97f1-836285606f67
# Canary: placeholder
#
# This source code is licensed under the Business Source License 1.1
# found in the LICENSE file in the root directory of this source tree.
#
# NOTICE: Use of this software for training artificial intelligence or
# machine learning models is strictly prohibited without explicit written
# permission from the copyright holder.

"""REQ-2034: the five unconverted Hasura v2 sections report from either export layout.

``query_collections``, ``allowlist``, ``rest_endpoints``, ``network`` and ``opentelemetry`` have no
target in a Provisa configuration. They were reported from a consolidated metadata document and not
at all from a metadata directory — the layout ``hasura metadata export`` writes by default. Two of
the five, ``allowlist`` and ``rest_endpoints``, are security- and client-facing, so a conversion
that lost them quietly lost a control the operator was relying on.
"""

from __future__ import annotations

from pathlib import Path

import yaml

from provisa.hasura_v2.parser import parse_metadata_dir, parse_metadata_document
from provisa.import_shared.warnings import WarningCollector

_ALLOWLIST = [{"collection": "allowed-queries"}]
_REST_ENDPOINTS = [{"name": "get_order", "url": "order", "methods": ["GET"]}]
_QUERY_COLLECTIONS = [{"name": "allowed-queries", "definition": {"queries": []}}]
_NETWORK = {"tls_allowlist": [{"host": "api.internal", "permissions": ["self-signed"]}]}
_OPENTELEMETRY = {"status": "enabled", "exporter_otlp": {"otlp_traces_endpoint": "http://otel"}}


def _write(md: Path, name: str, content: object) -> None:
    md.mkdir(parents=True, exist_ok=True)
    (md / name).write_text(yaml.safe_dump(content), encoding="utf-8")


def _categories(collector: WarningCollector) -> list[str]:
    return [w.category for w in collector.warnings]


def test_directory_export_reports_allowlist_and_rest_endpoints(tmp_path: Path):
    """The reproduction from the bug report: one export, parsed as a directory."""
    md = tmp_path / "metadata"
    _write(md, "tables.yaml", [])
    _write(md, "allow_list.yaml", _ALLOWLIST)
    _write(md, "rest_endpoints.yaml", _REST_ENDPOINTS)

    collector = WarningCollector()
    parse_metadata_dir(md, collector)

    assert _categories(collector) == ["allowlist", "rest_endpoints"]
    assert all(
        w.message == f"{w.category} is present in the export and is not converted"
        for w in collector.warnings
    )


def test_directory_and_document_report_the_same_keys(tmp_path: Path):
    """The two readers agree. Divergence here is what the bug was."""
    md = tmp_path / "metadata"
    _write(md, "tables.yaml", [])
    _write(md, "query_collections.yaml", _QUERY_COLLECTIONS)
    _write(md, "allow_list.yaml", _ALLOWLIST)
    _write(md, "rest_endpoints.yaml", _REST_ENDPOINTS)
    _write(md, "network.yaml", _NETWORK)
    _write(md, "opentelemetry.yaml", _OPENTELEMETRY)

    dir_collector = WarningCollector()
    parse_metadata_dir(md, dir_collector)

    doc_collector = WarningCollector()
    parse_metadata_document(
        {
            "version": 3,
            "sources": [],
            "query_collections": _QUERY_COLLECTIONS,
            "allowlist": _ALLOWLIST,
            "rest_endpoints": _REST_ENDPOINTS,
            "network": _NETWORK,
            "opentelemetry": _OPENTELEMETRY,
        },
        doc_collector,
    )

    assert _categories(dir_collector) == _categories(doc_collector)
    assert _categories(dir_collector) == [
        "query_collections",
        "allowlist",
        "rest_endpoints",
        "network",
        "opentelemetry",
    ]
    assert [w.message for w in dir_collector.warnings] == [
        w.message for w in doc_collector.warnings
    ]


def test_empty_section_files_are_silent(tmp_path: Path):
    """``hasura metadata export`` writes these files whether or not the section is configured.

    Warning on mere existence would fire on every conversion, which is the same credibility problem
    as warning on none of them. Presence is judged on content, as the document reader judges it.
    """
    md = tmp_path / "metadata"
    _write(md, "tables.yaml", [])
    _write(md, "allow_list.yaml", [])
    _write(md, "rest_endpoints.yaml", [])
    _write(md, "network.yaml", {})
    (md / "opentelemetry.yaml").write_text("", encoding="utf-8")

    collector = WarningCollector()
    parse_metadata_dir(md, collector)

    assert collector.warnings == []


def test_api_spelling_of_the_allowlist_file_is_also_matched(tmp_path: Path):
    """The CLI writes ``allow_list.yaml``; the metadata API names the section ``allowlist``.

    An export hand-assembled from the API key name still reports, and reports under the API key.
    """
    md = tmp_path / "metadata"
    _write(md, "tables.yaml", [])
    _write(md, "allowlist.yaml", _ALLOWLIST)

    collector = WarningCollector()
    parse_metadata_dir(md, collector)

    assert _categories(collector) == ["allowlist"]


def test_section_under_databases_reports_once(tmp_path: Path):
    """Reported from a per-database subdirectory, and only once when it sits in both places."""
    md = tmp_path / "metadata"
    _write(md, "allow_list.yaml", _ALLOWLIST)
    _write(md / "databases" / "default", "tables.yaml", [])
    _write(md / "databases" / "default", "rest_endpoints.yaml", _REST_ENDPOINTS)
    _write(md / "databases" / "default", "allow_list.yaml", _ALLOWLIST)

    collector = WarningCollector()
    parse_metadata_dir(md, collector)

    assert _categories(collector) == ["allowlist", "rest_endpoints"]


def test_source_path_names_the_file_that_triggered_the_warning(tmp_path: Path):
    """An operator reading the warning needs to know which file to carry forward by hand."""
    md = tmp_path / "metadata"
    _write(md, "tables.yaml", [])
    _write(md, "allow_list.yaml", _ALLOWLIST)

    collector = WarningCollector()
    parse_metadata_dir(md, collector)

    assert collector.warnings[0].source_path == str(md / "allow_list.yaml")
