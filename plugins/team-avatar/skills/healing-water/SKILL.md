---
name: healing-water
description: Katara's healing for bugs. Use for a reported defect, a failing test, a crash, a regression, or "this is broken". Reproduces it, finds the root cause with runtime evidence, ships the smallest fix, and proves it on the same surface.
---

# Katara's healing water

A healer does not treat the symptom she can see. She finds where the energy is blocked and works there, with the least force that heals. Every line of a fix traces to evidence.

## Steps

1. **Reproduce it yourself.** Run the failing command, test, request, or UI path on the surface where it was reported. Capture the exact failing output. If it will not reproduce, tighten the conditions, synthesize the trigger, or add logging until it does. Ask the user only when you can name the specific thing you cannot reach.
2. **Write the failing check.** Turn the repro into the cheapest automated check that fails for the right reason (see `push-and-pull`). Confirm it fails with the symptom, not with a typo or a setup error. Skip only when a test would be far costlier than the fix, and say so.
3. **Binary-search the cause.** List the candidate hypotheses. Each pass, pick the test that rules out the most of them, get runtime evidence (logs, a debugger, a bisect, a minimal input), and eliminate. Use `seismic-sense` to understand the code involved and `git log` or `git bisect` for regressions.
4. **Name the mechanism.** Write one sentence: "X happens because Y, introduced by Z." Confirm it with evidence before writing the fix. A plausible story is a hypothesis, not a cause.
5. **Fix at the root.** Change the first place the system went wrong. A guard downstream is a fix only when the state it handles is legitimate. If the fix crosses a module boundary, run `war-room` first.
6. **Prove it on the same surface.** The failing check now passes, the original repro now succeeds, and the nearby tests still pass. Wrong surface or "inconclusive" is not a pass.
7. **Order the history.** The failing check lands in a commit before the fix, so the history proves the fix. Then hand to `yip-yip`.

## Rules

- When evidence refutes a hypothesis, revert the changes it motivated.
- No belt-and-suspenders code that "might help". It is a hypothesis, and it does not ship.
- No suppressed errors, no deleted tests, no `as any` to make red turn green.
- Two failed fixes on one premise means stop and test the premise (Air in `four-elements`).

## Reply

What was broken, the mechanism, the fix, and how you proved it. Quote the decisive failing and passing output, trimmed to the assertion and the counts.
