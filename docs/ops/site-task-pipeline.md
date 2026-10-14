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

Each site issue gets its own checkout, so two agents cannot write the same
tree. Ops sets the preference on the issue:

```sh
PATCH /api/issues/{issueId}  { "executionWorkspacePreference": "isolated_workspace" }
```

A child issue otherwise inherits its parent's workspace, which is how five
agents came to share one. Set the preference explicitly on every site issue,
including children.
