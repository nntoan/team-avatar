# SWE-bench Verified Mini: Team Avatar vs plain Claude Code and Codex

[SWE-bench Verified Mini](https://huggingface.co/datasets/MariusHobbhahn/swe-bench-verified-mini) is 50 tasks from SWE-bench Verified (25 Django, 25 Sphinx). Each task is a real GitHub issue. A task counts as resolved only when the official `swebench` harness applies the agent's patch and the project's hidden tests pass, using the published task images.

Each setup got one attempt per task: the same checkout, the same issue text, and no hints. "Without" runs the tool with no workflow plugins. "Installed" adds only the Team Avatar plugin. Changes to files that the hidden test patch rewrites are dropped from every patch, so no setup is failed by a conflict with its own new tests.

| Tool | Setup | Resolved | Django | Sphinx | Empty patches | Runs that loaded a Team Avatar skill | Time per task | Tokens per task |
|------|-------|---:|---:|---:|---:|---:|---:|---:|
| Claude Code | Without Team Avatar | **48/50 (96%)** | 24/25 | 24/25 | 0 | n/a | 1.5 min | 493k, $0.36 |
| Claude Code | Team Avatar installed | **50/50 (100%)** | 25/25 | 25/25 | 0 | 5/50 | 1.9 min | 632k, $0.49 |
| Claude Code | Team Avatar, asked by name | **48/50 (96%)** | 24/25 | 24/25 | 0 | 25/50 | 1.8 min | 933k, $0.69 |
| Codex | Without Team Avatar | **42/50 (84%)** | 24/25 | 18/25 | 0 | n/a | 2.7 min | 792k |
| Codex | Team Avatar installed | **41/50 (82%)** | 23/25 | 18/25 | 0 | 50/50 | 4.4 min | 2041k |

"Runs that loaded a Team Avatar skill" counts Skill tool calls on Claude Code and skill files read on Codex. In the asked-by-name setup the prompt itself loads `avatar-mode` in every run, so that column counts the runs that went on to load a second skill.

## Is the difference real?

The same 50 tasks ran in every setup, so the fair test is paired. It counts only the tasks one setup solved and the other did not. The p-value is an exact two-sided McNemar test. With 50 tasks, a p-value above 0.05 means the gap could be chance.

| Tool | Comparison | Net change | Solved only with Team Avatar | Solved only without | p-value |
|------|-----------|---:|---:|---:|---:|
| Claude Code | Team Avatar installed vs without | +2 tasks | 2 | 0 | 0.500 |
| Claude Code | Team Avatar, asked by name vs without | +0 tasks | 0 | 0 | 1.000 |
| Codex | Team Avatar installed vs without | -1 tasks | 1 | 2 | 1.000 |
