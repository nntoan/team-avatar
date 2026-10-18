---
name: master-plan
description: Sokka's master plan. Use for multi-step features, migrations, multi-PR programs, or any work that should be broken into verifiable units before code is written. Produces a written plan where every unit ends in a check.
---

# Sokka's master plan

Sokka has no bending. He wins with a plan, a map, and a willingness to throw the plan out when the ground changes. A plan is worth writing only if each step can be checked.

## Steps

1. **State the outcome.** One sentence on what the user can do when this is done, and one sentence on what the next maintainer inherits.
2. **Survey the ground.** Run `seismic-sense` over every area the work touches. List the callers, the data shapes, and the tests that exist today. No plan rests on unread code.
3. **Name the data shape.** Write the core types, states, and ownership the work introduces or changes. If there are two plausible designs, run `war-room` before going further.
4. **Cut the work into units.** Each unit is one reviewable change that leaves the system working. For each unit write:
   - **Goal.** What changes, in one line.
   - **Files.** The paths it touches.
   - **Check.** The command, test, or observation that proves it. A check you cannot name means the unit is too vague.
   - **Depends on.** The units that must land first.
5. **Order for proof.** Subtraction first (dead code, stale paths), then scaffolding, then behavior. A failing test lands before the fix it proves. Units with disjoint files can run in parallel. Units that write the same file run one after another.
6. **Mark the risks.** Name the step most likely to fail, how you will know early, and what you will do instead. Name any irreversible step so it waits for the human.
7. **Write it down.** Save the plan as Markdown beside the work (for example `docs/plans/<slug>.md`, or a scratch file for short work). Use `tea-time` for the prose.
8. **Hand it to Appa.** Execution follows `steady-flight`. When a unit's check fails in a way the plan did not predict, stop and revise the plan rather than improvising around it.

## Plan template

```markdown
# <Outcome in a few words>

Outcome: <what the user can do>
Inherits: <what the maintainer gets>
Data shape: <types, states, ownership>

## Units
1. <Goal>
   Files: <paths>
   Check: <command or observation>
   Depends on: <none | unit numbers>

## Risks
- <risk>: <early signal>, <fallback>
```

## Rules

- A unit without a check is not a unit. Split it or name the check.
- Do not plan past what you have read. Mark unknowns as unknowns and schedule the investigation as its own unit.
- Keep the plan shorter than the change it describes.
