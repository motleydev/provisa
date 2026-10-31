---
name: github-issue
description: Deduplicate, then file. The workflow for getting a verified bug into GitHub, including which repo a fork's issue belongs in.
---

# github-issue

`CLAUDE.md`: after confirming a bug — reproduced or root-caused — use this skill to
deduplicate and file. **Never create an issue for an unverified bug.**

This skill is the filing workflow. What the report has to contain is
`skills/bug-reporter/SKILL.md`.

## 1. Search before filing

A duplicate costs a maintainer more than a missing issue does. Search open *and* closed, by
symptom and by the identifier in the code, not only by your own title:

```bash
gh issue list --repo <owner>/provisa --state all --search "<symptom keyword>"
gh issue list --repo <owner>/provisa --state all --search "<function or file name>"
```

Then decide:

- **Same defect, open** — comment with your evidence. Do not open a second issue.
- **Same defect, closed** — reopen it with the new reproduction, and say what changed since
  it was closed. A regression is more valuable information than a new bug.
- **Same area, different mechanism** — file, and cross-reference.

## 2. Pick the repo

`agents/bug-fixer.md` names `owner="kenstott", repo="provisa"`, which is upstream. This
checkout's `origin` is `motleydev/provisa`, a fork. File against the repository whose code
carries the defect and whose maintainer can merge the fix:

- A defect in product code shared with upstream goes upstream.
- A defect in work that exists only in the fork — the marketing site under `site/`, the fork's
  own workflows, the agent contract under `agents/`, `skills/`, `refs/`, `hooks/` — goes to
  the fork.

Say in the issue which one you chose and why, in one line. Getting this wrong is cheap to
fix by transferring; leaving it implicit is not.

## 3. File it

```bash
gh issue create --repo <owner>/provisa --label bug \
  --title "<the behaviour, as a sentence>" \
  --body-file <path>
```

The MCP equivalent is `mcp__github__create_issue(owner=..., repo=..., labels=["bug"],
title=..., body=...)`. Either way: `labels=["bug"]`, the four body sections from
`skills/bug-reporter/SKILL.md`, and **output the returned issue URL** so the next reader can
follow it.

## 4. Link it to the work

- Reference the issue number in the fix's PR body, so merging closes it.
- If the bug revealed a missing requirement, that is a separate entry in
  `docs/arch/requirements.yaml` — an issue is not a requirement, and
  `agents/requirements-tracker.md` is told to skip bugs.
- If the bug is in behaviour a requirement claims, name the `REQ-NNN` in the issue. That is
  the thread an auditor follows.

## What does not become an issue

A question, a preference, a refactor you would like, or a failure you have not reproduced.
A red check nobody owns is not an issue either — it is work, and it needs an owner by name
rather than a ticket that ages.
