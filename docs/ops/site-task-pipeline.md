# Site Task Pipeline

One branch and one pull request per site task. An issue reaches `done` when its
pull request merges.

## What this replaces

`origin/main` carried none of the website work. Ten issues read `done` with
commits that existed only on `pro8-source-corrections-claim-sets`, where five
agents shared one workspace, one checkout and one branch feeding a single pull
request of 93 files and +15,904 lines. Nothing reviewed a page before the board
called it done, because there was no per-task pull request to review.

## The branch

Cut it from the integration branch, not from `main`:

```sh
git fetch origin
git switch -c pro<NN>-<slug> origin/pro8-source-corrections-claim-sets
```

`main` has neither `site/` nor the fifteen checkers that live beside it. A task
branch cut from `main` carries the whole rebrand in its diff, and the two gates
below cannot fire on files that are not there. The integration branch is the
base until PR #1 lands the rebrand on `main`; after that the base is `main` and
nothing else in this file changes.

One task per branch. A branch carrying two pages can be reviewed as neither.

## The two gates

A pull request that touches `site/**` runs both:

| Workflow | Job name | Covers |
| --- | --- | --- |
| `.github/workflows/site-review.yml` | `struck claims + design system` | the browserless checkers, over the bytes on disk |
| `.github/workflows/site-review-browser.yml` | `rendered pages, every verified width, both themes` | the Playwright checkers, five widths, both themes |

Each reads the workflow file from the merge ref, so each needs its file present
on the base branch. `site-review.yml` is on
`pro8-source-corrections-claim-sets`; `site-review-browser.yml` arrives with
PR #3.

The remaining pull-request checks are the monorepo suite. `ruff + pyright`,
`tsc + vitest`, `pytest tests/unit` and `Validate requirements.yaml` are red on
`main` itself and were red before any site work began, so they are not a
verdict on a page. The two jobs above are the site's gate. Do not merge a site
pull request on a red gate, and do not hold one for a red monorepo job it did
not cause.

## Review happens on the diff

The claim pass and the five-width browser pass are pull-request review on the
task's own two or three files, not a reread of the whole site. A page merges
once its claims are validated and its widths are signed off on that pull
request.

## `done` means merged

- Open the pull request when the page is ready for review. Set the issue `in_review` and attach the pull request as a `pull_request` work product.
- Set the issue `done` after the merge. Commits sitting on a branch are not shipped work, whatever the branch is named.
- Name the merge commit in the closing comment, so the board can check the claim.

## One workspace per issue

Five agents sharing one checkout is how one page build lands on top of another
page's uncommitted work. Each site issue wants its own, and a child issue
inherits its parent's, which is how the five came to share one.

### Do not reach for `executionWorkspacePreference`

Two fields on `PATCH /api/issues/{issueId}` look like the lever and are not.
`executionWorkspacePreference` and `executionWorkspaceSettings` are both in the
documented request body for an endpoint the spec marks `board_or_agent`, both
pass schema validation, and both are discarded on write. A valid enum value
returns `200` and reads back `null`; all six of `inherit`, `shared_workspace`,
`isolated_workspace`, `operator_branch`, `reuse_existing` and `agent_default`
behave the same way, so the drop is not the isolated-workspace flag gating one
value. `executionWorkspaceId` and `inheritExecutionWorkspaceFromIssueId` are
discarded too, and accept an id that matches no row. Garbage in
`executionWorkspacePreference` does return `400`, which places the loss after
schema validation and inside persistence.

The instance flags that would turn on isolated execution —
`enableIsolatedWorkspaces` and `enableIsolatedWorkspacesByDefault` — sit behind
`/api/instance/settings/experimental`, which the spec marks
`x-paperclip-authorization: { actor: "board" }` and which answers `403 Board
access required`. Every agent in this company is role `general` with an empty
chain of command, so no agent escalation path reaches it. Turning the flags on
is a board action, tracked on PRO-44. Note that the flags alone will not make
the two issue fields persist; those are a separate defect on the same issue.

### Isolate with a worktree and a project workspace

`projectWorkspaceId` is the one workspace field on the issue that is live for an
agent: a non-existent id answers `404 Project workspace not found`, so the write
reaches the foreign key instead of the floor. Paired with
`POST /api/projects/{projectId}/workspaces`, also `board_or_agent`, it gives a
per-issue checkout without the flag.

```sh
# A worktree, so the shared checkout's HEAD never moves under another run.
# Durable per-agent directory; not $PAPERCLIP_SCRATCH_DIR, which is removed
# when the run ends.
WT=/var/lib/paperclip/home/instances/default/workspaces/$PAPERCLIP_AGENT_ID/pro<NN>
git worktree add -b pro<NN>-<slug> "$WT" origin/pro8-source-corrections-claim-sets
```

```sh
# A project workspace on that path, then bind the issue to it.
PAPERCLIP_API_BASE="${PAPERCLIP_API_URL%/}"; PAPERCLIP_API_BASE="${PAPERCLIP_API_BASE%/api}"

curl -X POST "$PAPERCLIP_API_BASE/api/projects/$PROJECT_ID/workspaces" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" -H 'Content-Type: application/json' \
  -d '{"name":"pro<NN>","sourceType":"local_path","cwd":"<worktree path>",
       "repoUrl":"https://github.com/motleydev/provisa",
       "repoRef":"pro<NN>-<slug>","isPrimary":false,"visibility":"advanced"}'

curl -X PATCH "$PAPERCLIP_API_BASE/api/issues/$ISSUE_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" -H 'Content-Type: application/json' \
  -d '{"projectWorkspaceId":"<new workspace id>"}'
```

The create returns `201` and the bind reads back the new id, and the runner
honours the bind. Measured on PRO-67, which was bound to a workspace whose `cwd`
was a worktree: the run started with `$PAPERCLIP_WORKSPACE_CWD` and `pwd` both
at the worktree path, `$PAPERCLIP_WORKSPACE_ID` set to the bound workspace id,
and the company's execution-workspace list carried one row at the worktree
`cwd`, `sourceIssueId` the bound issue, `providerType: local_fs`, and
`metadata.workspaceRealization.local.projectWorkspaceId` the bound id. So a
per-issue checkout needs no instance flag.

Two things to expect while reading it back. The row still reports `mode:
shared_workspace` and `strategyType: project_primary`, same as the 145 primary
rows — the labels describe the strategy that resolved the path, not whether the
path is shared, so read `cwd` to tell the workspaces apart. And
`currentExecutionWorkspace` on `GET /api/issues/{id}` was `null` during the run
that owned the row, so confirm routing from
`GET /api/companies/{companyId}/execution-workspaces` instead.

### What the branch already covers

The branch carries the isolation that review needs even with no workspace work
at all, and the shared tree then only asks that two agents not hold uncommitted
work in it at once:

```sh
git switch -c pro<NN>-<slug> origin/pro8-source-corrections-claim-sets
# work, then
git add -A && git commit && git push -u origin pro<NN>-<slug>
```

Commit and push before handing off. An uncommitted file in a shared checkout is
the one piece of work nobody else can see and nobody can review. Prefer the
worktree above when another run already holds the shared checkout: `git switch`
there moves HEAD for that run too.
