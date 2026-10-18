# Team Avatar benchmark: what the numbers say

This is an A/B benchmark. The same tasks ran in Claude Code and Codex, three times each, with and without Team Avatar, and hidden graders scored the work. The runner is `evals/team-avatar/bench/`. [round-1](round-1/README.md) and [round-2](round-2/README.md) hold every number and every run.

## Headline

There is no task-score lift to market yet. Round 2 scored 99 / 99 / 100 on Claude Code and 96 / 87 / 87 on Codex. Each trio reads without Team Avatar, then installed, then asked by name.

- **The tasks are too easy.** Both tools already reach 100 on most of them without help. That includes a review with 10 subtle planted bugs. A ceiling like this cannot show a lift. Small synthetic repos do not separate frontier agents, which is why the next step is SWE-bench Verified.
- **Codex with Team Avatar refused one task.** On the performance task, Codex found the 250x faster fix every time. But the prompt said "do not change its behavior", and the fix calls the key function fewer times. So Codex left the code alone and asked whether that was allowed. Plain Codex shipped the fix in 2 of 3 runs. The grader counts this as a loss. A reader can argue it is the more careful answer.

## Where Team Avatar does change behavior

| Measure | Claude Code without, installed, asked by name | Codex without, installed, asked by name |
|---------|--------------------|--------------|
| Replies with no long dash | 86%, 86%, 100% | 71%, 90%, 100% |
| Bug fix ships a regression test that fails on the old code | 0%, 0%, 33% | 100%, 100%, 100% |
| Tokens per run | 162k, 261k, 315k | 180k, 540k, 989k |
| Time per run | 36s, 47s, 51s | 89s, 135s, 216s |

The style rules take hold fully when the user asks for avatar mode by name. Team Avatar also costs more. On Claude Code it adds 40% time and about 2x tokens. On Codex it takes up to 2.4x time and 5x tokens. Codex with Team Avatar also left scratch benchmark folders in the repo (1.1 stray files per run when asked by name).

## How the rounds changed the plugin

- Round 1 showed that installing the plugin made Claude Code load no skills at all. The old session hook told it to skip skills for small tasks. The hook now tells it to load the matching skill for any engineering task. In round 2, Claude Code loaded a skill in every installed run.
- Round 1 showed the Codex refusal. A new `breath-of-fire` rule says to ship and name an unstated detail, instead of asking about it. That rule did not change Codex's answer, because the user's explicit "do not change behavior" outranks it.

## Fairness

- Every setup ran with the other workflow plugins on this machine switched off (pstack, tstack, oh-my-claudecode), so Team Avatar is the only difference.
- Prompts never name a skill, except in the "asked by name" setup.
- Each grader was checked against a known-good and a known-bad answer before any agent ran. For example, a symptom patch scores 38 and a root-cause fix scores 100.
- N is 3 per cell. Treat a gap smaller than one run's swing as noise.
