# How the results got here

The first full pass ran all 28 cases on both runtimes. Codex passed 25 and Claude Code passed 23. All 18 routing cases and the discovery case passed on both. Each failure was one of two kinds.

**A real gap in the skills.** On Claude Code, `avatar-mode` picked the right specialist skill for a task but then did the work from the route table without loading that skill. The bug fix, investigation, and test-first runs all skipped their skill this way, even though the work itself was right. `avatar-mode` now says to load the routed skill before anything else, on both runtimes. The rerun loaded the right skill every time.

**The runner graded wrong.** These were fixed in the runner or the case, never in the skills:

- The fixture repo has a planted failing test, so "the whole suite passes" could never be true for the test-first case. That case now runs the slug tests only.
- The plan check counted the "Units" heading as a unit and wanted the literal word "Check". It now counts numbered units and accepts a runnable check.
- Codex does not print `spawn_agent` calls in `codex exec --json`. The runner now finds the child agent's own session file, which names its parent thread and the `agents/toph.md` brief it read.
- A Claude Code slash command loads the whole skill without a tool call. On Codex, `$name` only names the skill, so the runner requires Codex to read the skill file.
- Other plugins on this machine create `.omc/` folders in any repo they touch. The "no files changed" check ignores them.
- Two reply checks wanted exact words ("inject", "slice") where the agent described the same finding in other words. They now accept the equivalent phrasing.

The final run on the final code passed 29 of 29 on both runtimes.
