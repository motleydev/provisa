CRITICAL: Never add fallback values or silent error handling. Caused repeated production issues.
CRITICAL: V1 development. Never add migrations.
CRITICAL: Maximum brevity. No pleasantries. No explanations unless asked. Code and facts only.
CRITICAL: All Playwright tests must import `test` from `./coverage`, never directly from `@playwright/test`. The base fixture in `provisa-ui/e2e/coverage.ts` catches uncaught browser exceptions automatically.
CRITICAL: Test errors must be resolved whether preexisting or not. Never skip or ignore failing tests.

# Requirements Tracking
On any new requirement, constraint, feature, or design decision: append inline a requirements-tracking step. Read `agents/requirements-tracker.md` for format, then add the requirement to `docs/arch/requirements.yaml` and run `make sync-reqs`. Silent — skip implementation details, bugs, questions.

`docs/arch/requirements.md` is generated from that YAML. Writing the `.md` loses the requirement at the next regeneration.

# Swarm Mode (Self-Claim)

Read `refs/swarm-mode.md`. These rules used to be written out here and imported
from nowhere; `CLAUDE.md` pointed at a copy that did not exist. The reference is
now the one copy both files read.

# Roles
When acting in a named role, read the corresponding `agents/<name>.md` file before proceeding.

Available roles: agent-writer, architect, bug-fixer, code-reviewer, debugger, doc-writer, marketer, refactorer, requirements-tracker, sql-analyst, test-strategist

# Skills
Before applying a skill, read the corresponding `skills/<name>/SKILL.md` file.

Available skills: anti-patterns, async-patterns, audit-workflow, bug-reporter, code-review, commit-message, debug-python, dependency-rules, domain-model, github-issue, next-phase, project-layout, puppeteer-debugging, pytest-patterns, python-style, react-graphql, test-first, test-tiers, venv-setup

Every name above has a file. Three were cited from elsewhere and are now on the list too:
`github-issue` (`CLAUDE.md`), `puppeteer-debugging` (`agents/debugger.md`,
`agents/bug-fixer.md`) and `react-graphql` (`provisa-ui/eslint.config.js`). Do not add a
name here without the file — a pointer to a missing skill is the silent error handling the
first `CRITICAL` above bans.
