# How the SWE-bench run was done, and what it can and cannot claim

## Result

Team Avatar did not change how many SWE-bench Verified Mini tasks either tool resolved.

- **Claude Code.** 48 of 50 without Team Avatar, 50 of 50 with it installed, and 48 of 50 with avatar mode asked by name. The installed gain of 2 tasks has a paired p-value of 0.5. Asking by name resolved exactly the same 48 tasks as plain Claude Code, so the gain is most likely noise.
- **Codex.** 42 of 50 without Team Avatar and 41 of 50 with it (p = 1.0).
- **Cost.** Team Avatar costs more on both tools. On Claude Code, the mean cost per task went from $0.36 to $0.49 installed and $0.69 asked by name. On Codex, tokens per task went from 792k to 2,041k, and time from 2.7 to 4.4 minutes.

The defensible claim is that Team Avatar keeps Claude Code at a 96 to 100% resolved rate on SWE-bench Verified Mini. A claim that Team Avatar raises the SWE-bench score is not supported.

## Setup

- **Tasks.** The 50 instance IDs of [SWE-bench Verified Mini](https://huggingface.co/datasets/MariusHobbhahn/swe-bench-verified-mini) (25 Django, 25 Sphinx), taken from the official `SWE-bench/SWE-bench_Verified` dataset so the harness gets its current task images.
- **Agents.** Headless `claude -p` (Claude Code 2.1.296) and `codex exec` (Codex 0.159.0), on each tool's default model. Each task got one attempt per setup, with the same prompt (the issue text, no hints, "do not commit").
- **Setups.** "Without" turns off every workflow plugin on the machine. "Installed" adds only Team Avatar, whose session hook tells the agent to load the matching skill. "Asked by name" also starts the prompt with avatar mode. It ran on Claude Code only, because Codex already loaded skills in every installed run.
- **Grading.** The official `swebench` 5.0.2 harness, with the published amd64 task images under emulation on an arm64 Mac. Changes to files the hidden test patch rewrites are dropped from every patch, so an agent that wrote its own tests is never failed by a merge conflict.
- **Code.** `evals/team-avatar/swebench/` holds the generator, the grader driver, the isolation audit, and the summary. Every patch is in [patches/](patches/), and every grade is in [results.csv](results.csv).

## Checks on the numbers

- **The grader fails wrong answers.** Ten patches that only add a comment were all graded unresolved ([negative-control.jsonl](negative-control.jsonl)). Two gold patches graded resolved before any agent ran.
- **No run saw its own answer.** Every run shared one machine, so each run's event log was searched for paths into another setup's work, patches, or grades for the same task, and for the dataset files that hold the gold patches. The final audit found none ([isolation-audit.json](isolation-audit.json)). Six runs looked at other tasks' checkouts, usually while hunting for a Python environment. That cannot reveal their own task's fix.
- **No run could read the real fix from git history.** The first checkouts kept every branch, so `git log --all` could reach the upstream fix. Two Codex runs ran that command. Both were thrown out and rerun on checkouts that keep only the history up to the base commit, and every later checkout strips it the same way.
- **Infrastructure failures were rerun, not scored.** Four Codex attempts failed with "Selected model is at capacity". Thirteen Codex attempts collided because two of my generator processes picked up the same task and one deleted the other's checkout. All of these were thrown out and rerun cleanly. Two more runs listed file names inside another setup's checkout of the same task without opening them, and they were rerun too, to be strict. The generator now retries capacity errors on its own and claims each task so two processes cannot share one.

## Limits

- **Small sample.** With 50 tasks, two setups must disagree on about 6 tasks, nearly all in the same direction, before a gap is significant. Gaps of 1 or 2 tasks are within chance.
- **Possible memorization.** These are public 2019 to 2022 Django and Sphinx issues with merged fixes, so both models may have seen the fixes in training. That can inflate both setups' absolute scores. It affects the with-and-without comparison less, because the same model runs every setup.
- **Not a leaderboard submission.** The agents ran on a developer laptop with their default models and tools, not in the official agent scaffolds. Compare these numbers with each other, not with published leaderboard scores.
