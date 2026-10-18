---
name: yip-yip
description: Appa's "yip yip" for shipping. Use to open a pull request, make it easy to review, drive CI green, answer review comments, or bring an open PR to merge-ready. Also use for "ship it", "open a PR", "get this green", or "address the review".
---

# Yip yip

"Yip yip" is how the team tells Appa it is time to fly. Use it when the work is done and proven, and it is time to land it in front of a reviewer.

## Before opening the PR

1. **One coherent change.** The PR does one thing a reviewer can hold in their head. Split unrelated changes into their own PRs.
2. **Clean the diff.** Read every hunk. Remove debug output, commented-out code, stray files, and comments that narrate what the code already says. Keep a comment only for a non-obvious why.
3. **Run every check locally.** Tests, linter, type checker, build. Record the commands and their results.
4. **Self-review.** Run `earth-rumble` on your own diff. Fix blockers and majors before anyone else sees them.
5. **Gather the evidence.** The output, screenshot, recording, or benchmark that shows the change working on the real artifact.

## Opening it

1. Push the branch with `git push -u origin <branch>`.
2. Write the description with `tea-time`. Follow the repo's PR template when one exists. Otherwise write a "Before" paragraph, an "After" paragraph, a short "How", and a "Verification" section with the commands and evidence.
3. Open it as ready for review unless the user asked for a draft. Post the full URL.

## Driving it to merge-ready

1. **CI.** When a check fails, read the log, reproduce locally, and fix the cause. Do not rerun a red check hoping it turns green. A flaky test is a bug (`push-and-pull`).
2. **Review comments.** Assess each on its merits. Fix real bugs. Push back with a concrete reason on noise. Reply to every thread so the reviewer knows what happened.
3. **Conflicts.** Merge or rebase the base branch, resolve each conflict by understanding both sides, and rerun every check.
4. **Done** means checks green, every thread answered, and the description still true.

## Rules

- Never merge, force-push a shared branch, or enable auto-merge without the user's explicit word.
- Never mark a check as passing that you did not see pass.
- Push fixes as new commits during review so reviewers can see what changed.
