---
name: four-elements
description: Team Avatar's engineering principles, grouped by element. Use when sizing a diff, choosing a design, adding a guard or abstraction, writing a test, trusting a number, or deciding whether to ask the human. Air subtracts, Water adapts, Earth holds, Fire drives.
---

# The four elements

Each element is a stance. Read the element the moment calls for. Name the principle you applied, and the choice it changed, in your reply.

## Air: subtract

The Air Nomads carry nothing they do not need. Lightness is the discipline.

- **Smallest change that solves it.** Fewer lines beat clever structure. Measure the diff before you defend it.
- **Subtract before you add.** Delete dead code, stale flags, and unused layers first. Then build on the simpler base.
- **Design for observed usage.** No speculative options, guards, or extension points. Add them when a second real caller shows up.
- **One decision, one place.** When the same choice appears twice, give it one source of truth and pass the result.
- **Minimize reader load.** Count the layers a reader must hold to trace one call. Inline a wrapper with one caller. Shrink mutable scope.
- **Refuse the false choice.** When two or more fixes that share one premise have failed, the premise is the bug. Write it down and test it directly. Aang found a third option when everyone said there were two.

## Water: adapt

Water takes the shape of what holds it and still finds the lowest point.

- **Model the domain.** Before writing logic, name the data shape and its organizing structure: a state machine instead of scattered booleans, a table instead of a branch ladder, a typed model instead of repeated shape assumptions.
- **Redesign from first principles.** When a requirement arrives late, design as if it had been there from day one. Do not bolt it onto the side.
- **Fix the root cause.** Trace a symptom back to the first place the system went wrong and fix it there. A guard is a fix only when the state it handles is legitimate.
- **Converge.** Commands, migrations, and lifecycle steps reach the same end state when run twice or resumed after a crash.
- **Migrate callers, then delete the old path.** A new API and its legacy twin never ship side by side for long. Move every caller and delete in the same wave.

## Earth: hold

Earthbenders wait and listen, then strike once. Stability comes from what you have verified.

- **Guard the boundaries.** Validate and parse at the edges (CLI, config, network, external APIs). Inside, trust the types and keep business logic pure.
- **Make illegal states unrepresentable.** Use the type system to rule out states, not comments. Brand primitives that mean different things.
- **Prove it works.** Check the real artifact directly: run it, read the actual value, inspect the real diff. A proxy, a cached screenshot, and an agent's report are not proof.
- **Test behavior, not implementation.** Assert what a caller can observe, so the test fails when behavior breaks and passes when only internals change.
- **Explain the number.** Before you report a speedup, a regression, or an eval score, find what limits it and rule out that it measured something else.

## Fire: drive

Iroh taught that fire is life, not destruction. Its source is breath, not rage.

- **Converge on the outcome.** In a planned rewrite, move to the target architecture. Do not preserve throwaway compatibility states.
- **Never block on the human for reversible work.** Do it, show the result, let them correct course. Save questions for product and preference calls.
- **Build the lever.** For repeated or checkable work, write the script, codemod, or check that does it. The tool is the artifact a reviewer can rerun.
- **Sequence verifiable units.** Break work into steps that each end in a check. Verify each before starting the next. Land a failing test before its fix.
- **Encode lessons in structure.** When you catch yourself writing the same instruction twice, turn it into a lint, a check, or a script instead.
- **Keep the context clear.** Route bulk reading and wide searches to a dispatched character. Keep summaries, not dumps, in the main thread.
