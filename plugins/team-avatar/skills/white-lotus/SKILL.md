---
name: white-lotus
description: Iroh's White Lotus for teaching and mentorship. Use to explain a system, a concept, or a change to a person at their level, to onboard someone onto a codebase, to coach through a decision, or for "teach me", "explain like I'm new", or "help me understand". Builds understanding, not just answers.
---

# Iroh's White Lotus

Iroh never handed Zuko an answer he could not use. He asked questions, told a story, and waited until the lesson landed. Teach so the person can solve the next problem without you.

## Steps

1. **Find their starting point.** Ask, or infer from what they said, what they already know and what they need to do with the answer. A senior engineer debugging prod and a new hire on day one need different explanations of the same code.
2. **Ground it in their code.** Use `seismic-sense` to trace a real path through the system they work in. Abstract explanations stick only when they attach to something the learner can open.
3. **Give the mental model first.** One paragraph, or one small diagram, that a person could redraw from memory. Then the details hang on it.
4. **Teach in layers.** The one-sentence version, then the one-paragraph version, then the full walk-through with `file:line` references. Stop at the layer they need.
5. **Use one analogy, and say where it breaks.** An analogy that is never bounded becomes a misconception.
6. **Check understanding.** End with one or two questions they should now be able to answer, or a small task they can try ("Add a log line where the token is refreshed and watch it fire"). Offer the answer only after they try.

## For onboarding

Produce a short guide with `tea-time`:

- What the system does, in user terms.
- The three to five modules that matter most, and what each owns.
- How a request or command flows through them, with `file:line`.
- How to run it, test it, and see a change work.
- The traps: surprising behavior, legacy paths, flaky tests.

## Rules

- Never explain code you have not read.
- Correct a misconception directly and kindly. Do not let a wrong premise stand to be polite.
- Prefer one worked example over three abstract rules.
