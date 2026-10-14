CRITICAL: Never add fallback values or silent error handling. Caused repeated production issues.
CRITICAL: V1 development. Never add migrations.
CRITICAL: Maximum brevity. No pleasantries. No explanations unless asked. Code and facts only.
CRITICAL: All Playwright tests must import `test` from `./coverage`, never directly from `@playwright/test`. The base fixture in `provisa-ui/e2e/coverage.ts` catches uncaught browser exceptions automatically.
CRITICAL: Test errors must be resolved whether preexisting or not. Never skip or ignore failing tests.

# Requirements Tracking
On any new requirement, constraint, feature, or design decision: append inline a requirements-tracking step. Read `agents/requirements-tracker.md` for format, then append to `docs/arch/requirements.md`. Silent — skip implementation details, bugs, questions.

# Swarm Mode (Self-Claim)

Read `refs/swarm-mode.md`. These rules used to be written out here and imported
from nowhere; `CLAUDE.md` pointed at a copy that did not exist. The reference is
now the one copy both files read.

# Site Tasks

One branch and one pull request per site task, cut from the integration branch, gated by `.github/workflows/site-review.yml` and `.github/workflows/site-review-browser.yml`. An issue is `done` when its pull request merges, not when its commits exist locally. Read `docs/ops/site-task-pipeline.md` before starting a site task.

# Roles
When acting in a named role, read the corresponding `agents/<name>.md` file before proceeding.

Available roles: agent-writer, architect, bug-fixer, code-reviewer, debugger, doc-reviewer, doc-writer, marketer, refactorer, requirements-tracker, sql-analyst, test-strategist

# Skills
Before applying a skill, read the corresponding `skills/<name>/SKILL.md` file.

Available skills: anti-patterns, async-patterns, audit-workflow, bug-reporter, code-review, commit-message, debug-python, dependency-rules, domain-model, next-phase, project-layout, pytest-patterns, python-style, test-first, test-tiers, venv-setup
