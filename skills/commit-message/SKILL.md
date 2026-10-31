---
name: commit-message
description: The commit subject convention in this repo — conventional-commit prefix, present-tense statement of the behaviour, REQ-IDs, and the revert rule a hook enforces.
---

# commit-message

## The shape

```
<type>(<scope>): <the behaviour, stated as fact> (REQ-NNNN, REQ-NNNN)
```

Types in use: `feat`, `fix`, `test`, `docs`, `ci`, `chore`, `refactor`, `revert`. The scope
is the subsystem, not the file — `(cypher)`, `(replicas)`, `(ui)`, `(graph)`, `(tour)`,
`(e2e)`, `(settings)`, `(server)`.

## The subject states what is now true

This is the part that differs from most repos. The subject is a declarative sentence about
the behaviour, in the present tense, not an imperative about the patch. Real subjects from
`main`:

```
fix(cypher): a write on a compiled surface is routed as a write, to its source's driver (REQ-031, REQ-670)
fix(replicas): a source that owns no replica is never promoted or rebuilt (REQ-1443, REQ-1934, REQ-2000)
feat(graph): the explorer draws the first "max nodes" rows and says so over the canvas
fix(server): /setup/status answers when every data thread is busy; a refusal logs what holds them
test(e2e): the gRPC fixture compiles its stubs in its own directory; the petstore check reads the mock's address (REQ-1742, REQ-1924)
ci: the UI e2e lanes run on every push to main, and a release is cut only when all three are green
```

Not `add routing for compiled writes`, not `fixed replica bug`. Write the sentence a reader
could check against the code.

Two clauses joined by a semicolon are common and welcome when one change has two effects.
Lower case after the colon. No trailing period.

## REQ-IDs

Append every requirement the commit implements or changes, in parentheses, at the end of the
subject: `(REQ-1443)` or `(REQ-1443, REQ-1934)`. Omit them when there is no requirement —
plenty of `fix(` and `test(` commits have none. A new requirement goes in
`docs/arch/requirements.yaml` first (see `skills/audit-workflow/SKILL.md`); the commit cites
the id, it does not mint it in passing.

## A revert names what it undoes, and a hook checks

`scripts/check_revert_message.py` runs at the `commit-msg` stage and refuses a subject
starting `revert:` or `revert(<scope>):` unless the body contains
`This reverts commit <sha>` naming a commit that exists. Its reason:

> The release notes leave out a reverted commit and its revert by that line
> (`scripts/gen_release_notes.py`); without it the reverted change would be published as
> shipped.

`git revert` writes that line for you. Do not rewrite the body and drop it.

## Generated and mechanical commits

Two subjects recur and should stay recognizable: `chore: canary stamps` (written by
`.githooks/post-commit` via `scripts/canary_stamp.py`) and
`docs: regenerate requirements.md and features.md after <what merged>` for `make sync-reqs`
output. Keep generated output in its own commit rather than mixed into a behaviour change.

## Brevity applies here too

`CLAUDE.md` is `CRITICAL` on brevity. The subject carries the fact. A body is for the
measurement, the REQ reason, or the revert line — not for restating the subject.
