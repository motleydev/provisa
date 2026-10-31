---
name: bug-reporter
description: What a bug report must contain to be worth filing. The content contract; skills/github-issue/SKILL.md is the filing workflow.
---

# bug-reporter

Two skills, one boundary: **this one is what the report says. `skills/github-issue/SKILL.md`
is how it gets filed** — deduplication, repo, labels. Read both before filing.

## File only after the fix is verified

`agents/bug-fixer.md` puts FILE ISSUE as step 7, after VERIFY. `CLAUDE.md` is blunter: never
create an issue for an unverified bug. "Unverified" means reproduced or root-caused, not
suspected. A report that says "may be related to" wastes the next reader's time and cannot be
closed by anyone.

## The sections

From `agents/bug-fixer.md:54`, in this order:

```markdown
## Bug
What the user sees, and the exact steps or input that produce it.

## Root Cause
The mechanism, with the affected file and line.

## Fix
What changed, and the test that now catches it.

## Notes
Caveats, related occurrences, anything you looked at and ruled out.
```

**`## Root Cause` includes the file and the line.** That is the part that makes a report
useful a month later, and the part most often left out.

## Write the title as the behaviour

The same convention as a commit subject (`skills/commit-message/SKILL.md`): a declarative
sentence about what is wrong, specific enough to be searched for.

- `V2 api_limits rate conversion rounds up silently: a 10/min rolling limit becomes 1/s`
- `Unpinned sqlglot breaks every SELECT on a fresh pip install`

Not `rate limit bug`, not `error in converter`.

## Evidence, verbatim

- Paste the failing output — the traceback, the assertion, the raw pytest lines. Never a
  summary. `agents/bug-fixer.md`: "Tests pass" is unverifiable; the actual output is not.
- Cite the file and line from a tool call you actually made. A claim with no Read or Grep
  behind it is inadmissible, in a report exactly as in a review.
- Say what you ruled out. A report that names the three plausible causes and shows which two
  are excluded is worth three reports that each guess.

## Scope one bug per report

A compound report cannot be closed. If the investigation turned up a second defect, it is a
second report, cross-referenced. If it turned up a requirement rather than a defect, it is
not a bug report at all — see `skills/audit-workflow/SKILL.md`, and note that
`agents/requirements-tracker.md` is told to skip bugs and questions.
