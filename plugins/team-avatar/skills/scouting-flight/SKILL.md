---
name: scouting-flight
description: Momo's scouting flight for throwaway prototypes and spikes. Use to settle a design fork by observing it instead of debating it, to try a layout or interaction, to test whether an approach is fast enough, or for "prototype", "spike", "mock it up", or "try it and see". The prototype is thrown away; the decision is the output.
---

# Momo's scouting flight

Momo flies ahead, grabs what he finds, and comes back fast. He does not build a nest. A prototype is the same: a quick flight to see the terrain, then throw it away and bring back the answer.

## Steps

1. **Name the question.** One sentence on the decision the prototype settles: which layout, which library, whether an approach fits the latency budget, whether an API shape reads well at the call site. No question means no prototype. Route to `avatar-mode` instead.
2. **Build in scratch.** Work in a scratch directory outside production source. Use the lightest tool that answers the question: a single HTML file, a short script, a REPL session. No tests, no abstractions, no polish.
3. **Build the alternatives side by side.** When comparing options, put them behind one switch (a flag, a button, a command argument) and label each one.
4. **Observe the answer.** Screenshot each visual variant. Time each performance variant with the same harness. Print each output. The observation is the evidence, not an assertion.
5. **Bring it back.** Report the variants, what you observed, the tradeoffs, your recommendation, and the scratch path. Say plainly that the code is throwaway.
6. **Hand off the real build.** The chosen direction goes to `war-room` or `master-plan`, then `steady-flight`. Never promote prototype code to production as is.

## Quick tasks

Momo also takes small, bounded tasks a dispatcher hands him: one file, one clear change, one check. Do it, run the check, report the result in a few lines. If the task turns out to be bigger or ambiguous, stop and report back rather than expanding scope.
