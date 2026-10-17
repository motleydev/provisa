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
page's uncommitted work. Since 2026-10-17 an issue gets its own two ways: the
instance's isolation default, and a binding set by hand on an issue the default
does not cover.

### Isolation is on, and the issue preference persists

`enableIsolatedWorkspaces` and `enableIsolatedWorkspacesByDefault` were both set
to `true` on 2026-10-17 by a board operator, who read them back to confirm. No
agent can read them — see the next section — so the behaviour in this section is
the agent-side evidence that they are on.

With the flags on, `PATCH /api/issues/{issueId}` stores the issue fields that
used to be discarded. Every row measured 2026-10-17, after the change, against
this instance:

| Field on `PATCH /api/issues/{issueId}` | Sent | Answer | Fresh `GET` reads |
| --- | --- | --- | --- |
| `executionWorkspacePreference` | `isolated_workspace` | `200` | `isolated_workspace` |
| `executionWorkspacePreference` | a value outside the enum | `400 Validation error` | unchanged |
| `executionWorkspaceSettings` | `workspaceStrategy.type: git_worktree` | `200` | the object as sent |
| `executionWorkspaceId` | an id matching no row | `404 Execution workspace not found` | unchanged |
| `inheritExecutionWorkspaceFromIssueId` | an id matching no row | `200` | `null` |
| `projectWorkspaceId` | an id matching no row | `404 Project workspace not found` | unchanged |
| `projectWorkspaceId` | an id matching a row | `200` | the new id |

Before the flags, rows one, three, four and five all answered `200` and read
back `null`, for every one of the six enum values `inherit`,
`shared_workspace`, `isolated_workspace`, `operator_branch`, `reuse_existing`
and `agent_default`. The accept-and-drop was therefore the flag gating
persistence, not a second defect beside it, and an earlier revision of this
section that called it a separate defect and said not to reach for the field was
wrong on both counts. `inheritExecutionWorkspaceFromIssueId` is the one field
still measured losing a write, and only with an id matching no row — the two
foreign-key fields beside it answer `404` on one.

That contrast is worth keeping either way: a field that reaches the foreign key
answers `404` on a bad id, and a field that is dropped answers `200`. The status
of a `PATCH` is not evidence that anything was stored, so read the field back.

Two issues carry the preference as of 2026-10-17: PRO-44, where it was measured,
and PRO-52 (`Build /compare`), the open site build, which now reads
`isolated_workspace` so its next run opens its own checkout.

Three limits on the default, and one thing about it still unmeasured. What a
newly created issue comes up as has not been seen yet: every issue on the board
was created before the flags were set, PRO-78 at 18:29 against a flag change
around 18:40, and all of them read `executionWorkspacePreference: null` except
the two that were written to by hand. The next issue created answers it; until
then, read the field rather than assuming the default reached it.

- The default applies at creation. Issues already on the board keep the
  preference they had — PRO-77 reads `reuse_existing`, and PRO-44 read `null`
  until it was written.
- It does not reach a run already in flight. A run that started before the
  change keeps the workspace it opened with for its whole life.
- The enum value is a preference recorded on the issue, not a report of where a
  run landed. Confirm the workspace a run actually got from
  `GET /api/companies/{companyId}/execution-workspaces`, as below.

### The flags are board-only, and a role grant does not reach them

`/api/instance/settings/experimental` carries both flags, and the spec marks it
`x-paperclip-authorization: { actor: "board" }`. It answered `403 Board access
required` to an agent key again on 2026-10-17, after the flags had been set, so
an agent can neither read the flag state nor change it. The record of their
state is the board's own read-back and the table above.

Raising an agent's membership role does not reach them either.
`PATCH /api/companies/{companyId}/members/{memberId}/role-and-grants` was
proposed for exactly that and withdrawn on PRO-77, which established two things:
the authorization check on the experimental endpoint tests for a board session
rather than for a membership role, and that endpoint's `membershipRole` enum
(`owner`, `admin`, `operator`, `viewer`) has no entry for `member`, the role
every agent in this company holds. The grant was never made and should not be. A
flag change is a board operator in a board session, and nothing else.

### Isolate an existing issue with a worktree and a project workspace

An issue created before 2026-10-17 does not get the new default, and neither
does one whose preference reads `shared_workspace` or `reuse_existing`. For
those, `projectWorkspaceId` is the workspace field on the issue that was live
for an agent before the flags and is unchanged by them. Paired with
`POST /api/projects/{projectId}/workspaces`, also `board_or_agent`, it gives a
per-issue checkout with no instance flag involved.

`scripts/paperclip-issue-workspace.sh` runs the whole of what follows as
`create`, `status` and `teardown`, including the read-back. The steps are spelled
out here because the script arrives in its own proposal.

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

When the task's pull request has merged, tear the binding down: clear the
issue's `projectWorkspaceId`, `DELETE
/api/projects/{projectId}/workspaces/{workspaceId}` (also `board_or_agent`), and
`git worktree remove "$WT"`. PRO-67 reads `projectWorkspaceId: null` after its
teardown. A binding left behind keeps sending later runs on that issue into a
checkout nobody is maintaining.

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
