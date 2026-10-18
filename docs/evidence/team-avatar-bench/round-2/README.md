# Team Avatar benchmark

Scores are 0 to 100: the mean of 3 runs per cell, with the lowest and highest run in brackets. Every run started from the same fresh repo and the same prompt. "Without" is the tool with no workflow plugins. "Installed" adds only the Team Avatar plugin and leaves the prompt alone. "Asked by name" also starts the prompt with avatar mode. Hidden graders score the work after the agent finishes, and the agent never sees them.

- **root-cause-fix.** Fixes the cause, not the symptom. Hidden tests hit the other callers of the same helper.
- **review-recall.** Share of 6 planted bugs the review reports.
- **review-subtle.** Share of 10 subtle planted bugs the review reports (races, auth, timing-safe compare, ReDoS, money floats, time zones).
- **test-strength.** Half correctness on hidden tests, half the share of 8 broken implementations the agent's own tests catch.
- **perf-without-regression.** Full score needs every hidden behavior test (NaN keys, -0, first occurrence wins) and a 10x speedup.
- **prose-quality.** Share of AI-tell phrases removed, times share of true facts kept.
- **investigate-not-guess.** Gets the real answer (3000, because NaN || 3000) and cites both lines that decide it.

| Task | Claude Code: Without Team Avatar | Claude Code: Team Avatar installed | Claude Code: Team Avatar, asked by name | Codex: Without Team Avatar | Codex: Team Avatar installed | Codex: Team Avatar, asked by name |
|------|---:|---:|---:|---:|---:|---:|
| root-cause-fix | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> |
| review-recall | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> |
| review-subtle | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> |
| test-strength | 96 <sub>(94-100)</sub> | 96 <sub>(88-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> |
| perf-without-regression | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 70 <sub>(9-100)</sub> | 10 <sub>(10-10)</sub> | 10 <sub>(10-10)</sub> |
| prose-quality | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> |
| investigate-not-guess | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> | 100 <sub>(100-100)</sub> |
| **All tasks** | **99** | **99** | **100** | **96** | **87** | **87** |

## Engineering discipline

| Tool | Setup | Bug fix ships a regression test | Perf reply reports a measured number | Replies with no long dash | Stray files left per run | Time per run | Tokens per run |
|------|-------|---:|---:|---:|---:|---:|---:|
| Claude Code | Without Team Avatar | 0% | 100% | 86% | 0.0 | 36s | 162k, $0.21 |
| Claude Code | Team Avatar installed | 0% | 100% | 86% | 0.0 | 47s | 261k, $0.33 |
| Claude Code | Team Avatar, asked by name | 33% | 100% | 100% | 0.2 | 51s | 315k, $0.44 |
| Codex | Without Team Avatar | 100% | 100% | 71% | 0.0 | 89s | 180k |
| Codex | Team Avatar installed | 100% | 100% | 90% | 0.1 | 135s | 540k |
| Codex | Team Avatar, asked by name | 100% | 100% | 100% | 1.1 | 216s | 989k |

A regression test counts only when the agent's tests fail against the original buggy code. Stray files are files outside the ones the task needed, such as scratch scripts left in the repo.

Every run, its score, and the grader's reason are in [runs.csv](runs.csv).
