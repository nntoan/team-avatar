# Team Avatar benchmark

Scores are 0 to 100: the mean of 3 runs per cell, with the lowest and highest run in brackets. Every run started from the same fresh repo and the same prompt. "Without" is the tool with no workflow plugins. "Installed" adds only the Team Avatar plugin and leaves the prompt alone. "Asked by name" also starts the prompt with avatar mode. Hidden graders score the work after the agent finishes, and the agent never sees them.

- **root-cause-fix.** Fixes the cause, not the symptom. Hidden tests hit the other callers of the same helper.
- **review-recall.** Share of 6 planted bugs the review reports.
- **review-subtle.** Share of 10 subtle planted bugs the review reports (races, auth, timing-safe compare, ReDoS, money floats, time zones).
- **test-strength.** Half correctness on hidden tests, half the share of 8 broken implementations the agent's own tests catch.
- **perf-without-regression.** Full score needs every hidden behavior test (NaN keys, -0, first occurrence wins) and a 10x speedup.
- **prose-quality.** Share of AI-tell phrases removed, times share of true facts kept.
- **investigate-not-guess.** Gets the real answer (3000, because NaN || 3000) and cites both lines that decide it.

| Task | Claude Code: Without Team Avatar | Claude Code: Team Avatar installed | Codex: Without Team Avatar | Codex: Team Avatar installed |
|------|---:|---:|---:|---:|
| root-cause-fix | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> |
| review-recall | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> |
| review-subtle | n/a | n/a | n/a | n/a |
| test-strength | 50 <sub>(50-50)</sub> | 50 <sub>(50-50)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> |
| perf-without-regression | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 70 <sub>(11-100)</sub> | 10 <sub>(8-11)</sub> |
| prose-quality | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> |
| investigate-not-guess | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> |
| **All tasks** | **92** | **92** | **95** | **85** |

## Engineering discipline

| Tool | Setup | Bug fix ships a regression test | Perf reply reports a measured number | Replies with no long dash | Stray files left per run | Time per run | Tokens per run |
|------|-------|---:|---:|---:|---:|---:|---:|
| Claude Code | Without Team Avatar | 0% | 0% | 100% | 0.0 | 31s | 171k, $0.24 |
| Claude Code | Team Avatar installed | 0% | 0% | 100% | 0.0 | 33s | 214k, $0.29 |
| Codex | Without Team Avatar | 0% | 0% | 100% | 0.0 | 81s | 208k |
| Codex | Team Avatar installed | 0% | 0% | 100% | 0.0 | 145s | 650k |

A regression test counts only when the agent's tests fail against the original buggy code. Stray files are files outside the ones the task needed, such as scratch scripts left in the repo.

Every run, its score, and the grader's reason are in [runs.csv](runs.csv).
