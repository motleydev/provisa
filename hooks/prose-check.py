#!/usr/bin/env python3
"""Block a `.md` write that introduces a banned phrase.

`CLAUDE.md` has claimed this hook exists since the documentation section was
written. It did not, so every markdown file on the project was written against
an unenforced rule.

Wired as a `PostToolUse` hook on Write/Edit/NotebookEdit in
`.claude/settings.json`. The tool has already run by then -- markdown has no
compile step, so a file on disk with a banned phrase in it is not a broken
state, it is a file to fix. Exit 2 puts the hits on stderr, where the agent that
just wrote them reads them.

It scans the text the write introduced, not the file it landed in. Scanning the
whole file would hold a legacy file hostage: `docs/arch/requirements.md` carries
20 pre-existing hits and the requirements-tracker appends to it on almost every
task, so a whole-file check would block requirements tracking outright until an
unrelated rewrite landed. Checking the new text instead blocks exactly what this
rule is about -- an agent reaching for a banned word right now -- and leaves the
backlog to `agents/doc-reviewer.md`, whose job it is.

The phrase list is not duplicated here. It is parsed out of the
banned-phrases fence in `refs/prose-quality.md`, the same file
`agents/doc-writer.md` and `agents/doc-reviewer.md` are told to read, so the
hook and the reference cannot drift apart. `site/claim-bans.mjs` shares its list
between two checkers the same way.
"""

import json
import os
import re
import sys

FENCE = "```banned-phrases"

# The text of the reference is the list, so a write to it carries every phrase
# on it by definition. The only exemption, named by path rather than by a
# pattern that could quietly grow.
EXEMPT = ("refs/prose-quality.md",)

# Where the written text lives in each tool's input. Write sends the whole file,
# Edit sends only the replacement -- which is the half that matters.
WRITTEN_TEXT = {
    "Write": "content",
    "Edit": "new_string",
    "NotebookEdit": "new_source",
}


def repo_root():
    """The directory holding refs/, found from this file rather than from cwd.

    A hook runs with whatever cwd Claude Code had, which in a worktree is not
    the directory this hook lives under.
    """
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def banned_phrases(reference):
    """The phrases inside the fence, in file order.

    Raises when the reference or the fence is absent: a prose check that cannot
    find its list has to say so, not pass everything.
    """
    with open(reference, encoding="utf-8") as fh:
        lines = fh.read().splitlines()

    try:
        start = lines.index(FENCE)
    except ValueError:
        raise RuntimeError(f"{reference} has no {FENCE} fence to read the list from")

    phrases = []
    for line in lines[start + 1 :]:
        if line.startswith("```"):
            return phrases
        if line.strip():
            phrases.append(line.strip())
    raise RuntimeError(f"{reference}: the {FENCE} fence is never closed")


def hits(text, phrases):
    """(phrase, line number within text, the line) for every banned phrase."""
    found = []
    for phrase in phrases:
        # \b on both ends so `unlock` does not fire inside a longer word, and so
        # the apostrophe in `it's worth noting` is matched literally rather than
        # as a word character.
        pattern = re.compile(r"\b" + re.escape(phrase) + r"\b", re.IGNORECASE)
        for number, line in enumerate(text.splitlines(), 1):
            if pattern.search(line):
                found.append((phrase, number, line.strip()))
    return sorted(found, key=lambda hit: (hit[1], hit[0]))


def main():
    event = json.load(sys.stdin)
    tool = event.get("tool_name")
    if tool not in WRITTEN_TEXT:
        return 0

    tool_input = event.get("tool_input") or {}
    path = tool_input.get("file_path")
    if not path or not path.endswith(".md"):
        return 0

    text = tool_input.get(WRITTEN_TEXT[tool])
    if not text:
        return 0  # a delete-only Edit introduces no prose

    root = repo_root()
    relative = os.path.relpath(os.path.abspath(path), root)
    if relative.startswith(".."):
        return 0  # outside this repo; another project's conventions apply
    if relative in EXEMPT:
        print(f"prose-check: {relative} is the banned-phrase list itself", file=sys.stderr)
        return 0

    found = hits(text, banned_phrases(os.path.join(root, "refs", "prose-quality.md")))
    if not found:
        return 0

    print(
        f"prose-check: the text just written to {relative} carries {len(found)} banned phrase(s).",
        file=sys.stderr,
    )
    for phrase, number, line in found:
        print(f"  line {number} of the new text  {phrase!r}  in: {line[:100]}", file=sys.stderr)
    print(
        "Rewrite each one and write the file again. refs/prose-quality.md has "
        "the list and, for most of them, what to say instead.",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__":
    sys.exit(main())
