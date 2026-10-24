# Prompts worth copying

Swap in the real paths, skills, and done checks. Informal wording works. These use Claude Code syntax. On Codex, write `$avatar-mode` for `/team-avatar:avatar-mode` and `$<skill>` for `/team-avatar:<skill>`.

## Understand

- `/team-avatar:avatar-mode read <thread>. restate the underlying issue in your own words, in plain english.`
- `/team-avatar:what-you-seek <long or messy ask>`
- `/team-avatar:sharpen-the-sword <your task>`
- `/team-avatar:avatar-mode investigate why <symptom>. give me what we know, what data you used, and your best hypotheses. don't change any code yet.`
- `use /team-avatar:seismic-sense to understand <subsystem>. then use /team-avatar:past-lives to find out why it broke recently.`
- `/team-avatar:spirit-world my work on <topic> from last week, then read <issue>.`
- `/team-avatar:white-lotus teach me why you implemented it this way and not <other way>. what did you trade off?`
- `/team-avatar:avatar-mode take over this branch. read the decision log, find what's done, and continue. don't redo finished work.`

## Build

- Bug: `/team-avatar:avatar-mode <symptom>. repro first, then fix and verify.`
- Bug in an app: `/team-avatar:avatar-mode repro this with /verify. if it repros on main, fix it and show me a video as proof.`
- Bug with a cheap test: `/team-avatar:avatar-mode repro <bug> first. if there's a cheap test path, do it test-first with push-and-pull. then fix and rerun.`
- Feature: `/team-avatar:avatar-mode add <behavior>. <current output> stays byte-identical. verify both.`
- Refactor: `/team-avatar:avatar-mode move <code> into one module, zero behavior change. record the current output first and prove it's unchanged after.`
- Perf: `/team-avatar:avatar-mode <operation> takes <time> on <fixture>. trace it, fix the measured cause, show me before and after.`

## Design and plan

- `/team-avatar:avatar-mode prototype a few options for <feature>. take screenshots or videos for me to compare.`
- `/team-avatar:avatar-mode we need <feature>. run war-room first, and answer open questions with prototypes. let me review before proceeding.`
- `/team-avatar:avatar-mode write a tutorial for how i would use <new package> first. then teach me why it beats the current one.`
- `ask /team-avatar:agni-kai for a second opinion on this thread and our approach.`
- `/team-avatar:avatar-mode turn this design into a plan. small verifiable PRs, each with its own verification steps.`
- `/team-avatar:avatar-mode plan the migration of <library> to <target>. small verifiable PRs. the result must match the original exactly, bugs included.`

## Review and ship

- `/team-avatar:lie-detector the whole branch, but skeptically. don't change anything yet. no nitpicks unless it's a real bug or regression.` Read the dismissals too.
- `/team-avatar:kyoshi-formation check every package under <dir> against its check script. one worker per package. one report.`
- `/team-avatar:avatar-mode open the pr. small ordered commits, evidence in the description.`
- `/team-avatar:avatar-mode babysit this pr. get it green.` For status only: `/team-avatar:avatar-mode check on pr <number>. anything outstanding?`
- `/team-avatar:avatar-mode land the stack.`

## Away and back

- `/team-avatar:avatar-mode im going to bed. <goal> in a fresh worktree off <base>. done means <checks>. keep a decision log. don't ask me before committing. run until done. if you're truly stuck after a few hours, stop and write up why.`
- `/team-avatar:battle-map catch me up on what you did last night.` Read its Attention section first.
- `/team-avatar:avatar-mode full autopilot on this queue. each item is independent.`
- `/team-avatar:avatar-mode autopilot these changes but stack them, don't ship. i'll land the stack.`
- `/team-avatar:meditation capture what we learned so the next run doesn't repeat it.` Approve only edits that change a future decision.
- `/team-avatar:plain-talk` restates the last reply in plain words.
