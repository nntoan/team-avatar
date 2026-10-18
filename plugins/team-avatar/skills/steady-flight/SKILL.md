---
name: steady-flight
description: Appa's steady flight for executing a plan. Use when a plan, spec, or list of units already exists and needs faithful step-by-step implementation, including refactors with a behavior-preserving check. Executes each unit, verifies it, and stops rather than improvising when the plan stops matching reality.
---

# Appa's steady flight

Appa carries the whole team across the world, one steady wingbeat at a time. He does not take detours, and he does not drop anyone. Execute the plan the same way.

## Steps

1. **Load the plan.** Read the full plan from `master-plan`, the spec, or the user's list. Copy each unit into the todolist with its check.
2. **Confirm the ground.** Run the existing tests and the build once before changing anything. Record what already fails so you do not take blame for it, or credit for fixing it.
3. **For each unit, in order:**
   1. Read every file the unit touches before you edit.
   2. Make the change, matching the patterns already in the code.
   3. Run the unit's check. Then run the nearby tests and the linter or type checker.
   4. Mark the unit done only when its check passes on the real artifact.
   5. Commit when the work spans several units, one commit per unit, so each is reviewable.
4. **Parallelize only what is disjoint.** Units that touch different files and do not depend on each other can be dispatched at once (see `avatar-mode`). Units that share a file run one after another.
5. **Finish clean.** Remove debug output and scratch files. Run the full check suite one more time. Hand to `yip-yip`.

## When the plan stops matching reality

Stop. Do not fill the gap with a guess. Write what you expected, what you found, and the smallest plan change that would fix it. Send that back to the planner (`master-plan`), or to the user if they wrote the plan. Then continue with the revised unit.

## For a refactor

Before the first edit, capture the behavior you must preserve: the test suite, a snapshot of outputs for representative inputs, or a recorded API response. After the last edit, run the same capture and diff it. An empty diff is the proof.

## Rules

- No unplanned features, no drive-by refactors, no architecture changes.
- No suppressed type errors, no skipped tests, no empty catch blocks.
- Three failures on one unit means stop, revert to the last green state, and report what failed.
