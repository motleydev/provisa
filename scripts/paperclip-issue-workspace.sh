#!/usr/bin/env bash
# One checkout per Paperclip issue, for agents that cannot reach the instance
# flags.
#
# `enableIsolatedWorkspaces` and `enableIsolatedWorkspacesByDefault` live behind
# GET/PATCH /api/instance/settings/experimental, which the OpenAPI spec marks
# `x-paperclip-authorization: { actor: "board" }` and which answers
# `403 Board access required` to every agent in this company. The per-issue
# fields that look like the lever — `executionWorkspacePreference`,
# `executionWorkspaceSettings`, `executionWorkspaceId`,
# `inheritExecutionWorkspaceFromIssueId` — return 200 on PATCH /api/issues/{id}
# and read back null. `projectWorkspaceId` is the one that persists, and
# POST /api/projects/{id}/workspaces is `board_or_agent`, so a git worktree plus
# a non-primary project workspace buys a per-issue checkout with no flag set.
# Measured on PRO-67; the procedure and its two read-back traps are written up
# in docs/ops/site-task-pipeline.md.
#
#   paperclip-issue-workspace.sh create   <issue> <branch> <base-ref>
#   paperclip-issue-workspace.sh status   <issue>
#   paperclip-issue-workspace.sh teardown <issue>
#
# <issue> is an issue UUID or an identifier such as PRO-44. Run `create` before
# the first commit on a task and `teardown` once its pull request has merged: a
# binding left behind keeps sending later runs on that issue into a checkout
# nobody maintains.

set -euo pipefail

die() { printf '%s: %s\n' "${0##*/}" "$1" >&2; exit 1; }

for var in PAPERCLIP_API_URL PAPERCLIP_API_KEY PAPERCLIP_AGENT_ID PAPERCLIP_COMPANY_ID; do
  [[ -n ${!var-} ]] || die "$var is not set; run this inside a Paperclip run"
done

API_BASE="${PAPERCLIP_API_URL%/}"
API_BASE="${API_BASE%/api}"

# Sets BODY, or exits on any non-2xx. No retry and no default body: a dropped
# write has to be visible at the call site.
api() {
  local method=$1 path=$2 body=${3-} out status
  if [[ -n $body ]]; then
    out=$(curl -sS -X "$method" "$API_BASE$path" \
      -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
      -H 'Content-Type: application/json' \
      -d "$body" -w $'\n%{http_code}')
  else
    out=$(curl -sS -X "$method" "$API_BASE$path" \
      -H "Authorization: Bearer $PAPERCLIP_API_KEY" -w $'\n%{http_code}')
  fi
  status=${out##*$'\n'}
  BODY=${out%$'\n'*}
  [[ $status == 2* ]] || die "$method $path -> HTTP $status: $BODY"
}

# Absolute path of the primary checkout's .git, so this works from a worktree.
primary_git_dir() {
  local d
  d=$(git rev-parse --git-common-dir) || die 'not inside a git repository'
  (cd "$d" && pwd)
}

# The durable per-agent directory holding this agent's worktrees. $PAPERCLIP_
# SCRATCH_DIR is removed when the run ends, so a worktree cannot live there.
worktree_root() {
  local git_dir=$1
  case $git_dir in
    */projects/*) ;;
    *) die "cannot derive the instance root from $git_dir" ;;
  esac
  printf '%s/workspaces/%s\n' "${git_dir%%/projects/*}" "$PAPERCLIP_AGENT_ID"
}

resolve_issue_id() {
  local arg=$1
  if [[ $arg =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
    printf '%s\n' "$arg"
    return
  fi
  api GET "/api/companies/$PAPERCLIP_COMPANY_ID/issues?limit=500"
  local id
  id=$(printf '%s' "$BODY" | jq -r --arg ident "$arg" \
    'map(select(.identifier == $ident)) | if length == 1 then .[0].id else empty end')
  [[ -n $id ]] || die "no single issue in this company has the identifier $arg"
  printf '%s\n' "$id"
}

cmd_create() {
  [[ $# -eq 3 ]] || die 'usage: create <issue> <branch> <base-ref>'
  local issue_arg=$1 branch=$2 base_ref=$3
  local issue_id project_id identifier
  issue_id=$(resolve_issue_id "$issue_arg")

  api GET "/api/issues/$issue_id"
  project_id=$(printf '%s' "$BODY" | jq -r '.projectId')
  identifier=$(printf '%s' "$BODY" | jq -r '.identifier')
  [[ $project_id != null ]] || die "issue $identifier has no projectId"

  local git_dir repo_url wt
  git_dir=$(primary_git_dir)
  repo_url=$(git remote get-url origin)
  wt="$(worktree_root "$git_dir")/${branch//\//-}"
  [[ ! -e $wt ]] || die "$wt already exists"

  git fetch origin
  git worktree add -b "$branch" "$wt" "$base_ref"

  api POST "/api/projects/$project_id/workspaces" "$(jq -nc \
    --arg name "$identifier" --arg cwd "$wt" --arg url "$repo_url" --arg ref "$branch" \
    '{name: $name, sourceType: "local_path", cwd: $cwd, repoUrl: $url,
      repoRef: $ref, isPrimary: false, visibility: "advanced"}')"
  local workspace_id
  workspace_id=$(printf '%s' "$BODY" | jq -r '.id')

  api PATCH "/api/issues/$issue_id" \
    "$(jq -nc --arg id "$workspace_id" '{projectWorkspaceId: $id}')"

  # Read the binding back from a fresh GET. PATCH answers 200 for the issue
  # workspace fields that are silently discarded, so the response body is not
  # evidence that this one landed.
  api GET "/api/issues/$issue_id"
  local bound
  bound=$(printf '%s' "$BODY" | jq -r '.projectWorkspaceId')
  [[ $bound == "$workspace_id" ]] || die "bind did not persist: projectWorkspaceId reads $bound"

  printf '%s bound to %s\n  branch    %s (from %s)\n  workspace %s\n' \
    "$identifier" "$wt" "$branch" "$base_ref" "$workspace_id"
  printf 'The next run on %s starts in that checkout. Tear it down once the pull request merges.\n' \
    "$identifier"
}

cmd_status() {
  [[ $# -eq 1 ]] || die 'usage: status <issue>'
  local issue_id identifier project_id workspace_id
  issue_id=$(resolve_issue_id "$1")
  api GET "/api/issues/$issue_id"
  identifier=$(printf '%s' "$BODY" | jq -r '.identifier')
  project_id=$(printf '%s' "$BODY" | jq -r '.projectId')
  workspace_id=$(printf '%s' "$BODY" | jq -r '.projectWorkspaceId')

  if [[ $workspace_id == null ]]; then
    printf '%s has no projectWorkspaceId: runs land in the project primary checkout.\n' "$identifier"
    return
  fi

  api GET "/api/projects/$project_id/workspaces"
  printf '%s\n' "$identifier"
  printf '%s' "$BODY" | jq -r --arg id "$workspace_id" \
    '(if type == "array" then . else .workspaces end)
     | map(select(.id == $id))[]
     | "  workspace \(.id)\n  cwd       \(.cwd)\n  repoRef   \(.repoRef)\n  primary   \(.isPrimary)"'

  # `mode` and `strategyType` on an execution workspace name the strategy that
  # resolved the path, not whether the path is shared, so cwd is what tells two
  # workspaces apart.
  api GET "/api/companies/$PAPERCLIP_COMPANY_ID/execution-workspaces?limit=500"
  printf '%s' "$BODY" | jq -r --arg issue "$issue_id" \
    '(if type == "array" then . else .executionWorkspaces end)
     | map(select(.sourceIssueId == $issue))
     | "  \(length) execution workspace row(s) for this issue"'
}

cmd_teardown() {
  [[ $# -eq 1 ]] || die 'usage: teardown <issue>'
  local issue_id identifier project_id workspace_id cwd
  issue_id=$(resolve_issue_id "$1")
  api GET "/api/issues/$issue_id"
  identifier=$(printf '%s' "$BODY" | jq -r '.identifier')
  project_id=$(printf '%s' "$BODY" | jq -r '.projectId')
  workspace_id=$(printf '%s' "$BODY" | jq -r '.projectWorkspaceId')
  [[ $workspace_id != null ]] || die "$identifier has no projectWorkspaceId to tear down"

  api GET "/api/projects/$project_id/workspaces"
  cwd=$(printf '%s' "$BODY" | jq -r --arg id "$workspace_id" \
    '(if type == "array" then . else .workspaces end)
     | map(select(.id == $id))
     | if length == 1 then .[0] else empty end
     | if .isPrimary then "PRIMARY" else .cwd end')
  [[ -n $cwd ]] || die "project $project_id has no single workspace $workspace_id"
  [[ $cwd != PRIMARY ]] || die "$identifier is bound to the project primary workspace; nothing to tear down"

  api PATCH "/api/issues/$issue_id" '{"projectWorkspaceId": null}'
  api GET "/api/issues/$issue_id"
  local bound
  bound=$(printf '%s' "$BODY" | jq -r '.projectWorkspaceId')
  [[ $bound == null ]] || die "unbind did not persist: projectWorkspaceId reads $bound"

  api DELETE "/api/projects/$project_id/workspaces/$workspace_id"

  # No --force: uncommitted or unpushed work in the worktree stops the removal
  # rather than being thrown away.
  git worktree remove "$cwd"
  printf '%s unbound; workspace %s deleted; worktree %s removed\n' "$identifier" "$workspace_id" "$cwd"
}

[[ $# -ge 1 ]] || die 'usage: paperclip-issue-workspace.sh {create|status|teardown} ...'
subcommand=$1
shift
case $subcommand in
  create) cmd_create "$@" ;;
  status) cmd_status "$@" ;;
  teardown) cmd_teardown "$@" ;;
  *) die "unknown subcommand $subcommand" ;;
esac
