---
name: war-room
description: Sokka's war room for architecture decisions. Use when a change crosses a module or service boundary, when there are two or more plausible designs, or when someone asks "how should we build this" or "which approach". Explores competing designs, compares them on evidence, and records the decision.
---

# Sokka's war room

Before the invasion, Sokka laid every option on the table and argued each one out loud. Do the same before you commit to a design that other code will depend on.

## Steps

1. **Frame the decision.** One sentence on what must be decided, and the constraints that cannot move (deadlines, compatibility, performance budgets, team ownership).
2. **Read the terrain.** Run `seismic-sense` on the code the decision touches. Note the existing patterns a new design should match or deliberately break.
3. **Draft two or three designs.** Make them genuinely different, not variations of one idea. Always include the smallest design that could work. For each, write:
   - The data shape and who owns it.
   - The public interface, as signatures or a short example call.
   - What changes for existing callers.
   - What it makes easy and what it makes hard later.
4. **Run them in parallel when stakes are high.** Dispatch one character per design to sketch it in isolation (see Dispatching in `avatar-mode`). Use different models when you can, since disagreement between models is signal.
5. **Settle facts by experiment.** If a question has an observable answer (latency, memory, ergonomics of a call site), run `scouting-flight` instead of arguing.
6. **Compare in one table.** Rows are the designs. Columns are the criteria that matter for this decision, plus reversibility and diff size. Mark each cell with evidence or *inferred*.
7. **Attack the favorite.** Before deciding, have `earth-rumble` review the leading design as if it were already merged. Answer each finding or change the design.
8. **Decide and record.** Pick one. Write a short decision record with `tea-time`:

```markdown
# Decision: <title>

Context: <the problem and its constraints>
Options: <one line each>
Decision: <the pick>
Why: <the deciding evidence>
Consequences: <what gets easier, what gets harder, what to revisit and when>
```

## Rules

- Prefer the design that is easiest to reverse when the evidence is close.
- A design that needs a new abstraction must name its second real caller.
- If the human must choose (a product or preference call), present the table and your recommendation. Do not ask an open question.
