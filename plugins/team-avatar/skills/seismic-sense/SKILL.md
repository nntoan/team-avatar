---
name: seismic-sense
description: Toph's seismic sense for read-only investigation. Use for "how does X work", "where does Y live", "why is Z like this", "are we sure", code walkthroughs before a change, and ownership or layering questions. Produces a cited explanation, never a code change.
---

# Toph's seismic sense

Toph cannot see, so she never guesses. She feels every vibration through the ground and reports exactly what is there. Investigate the same way: read the code, run it, and cite what you found.

## Steps

1. **Restate the question.** Write the literal question and the decision it serves. "How does auth work" usually means "where do I add a check without breaking sessions".
2. **Sweep wide, then narrow.** Search by name, by string literal, by config key, and by caller. Run independent searches in parallel. For a large or unfamiliar codebase, dispatch Toph on separate areas (see `avatar-mode`), and keep only her summaries in your context.
3. **Follow one real path end to end.** Pick a concrete input and trace it from the entry point to the side effect: the route or command, each function it passes through, the data it reads and writes.
4. **Run it when reading is not enough.** A test, a REPL call, a log line, or a debugger confirms what the code does. Reading tells you what it seems to do.
5. **Check history for "why" questions.** `git log -S`, `git blame`, linked PRs and issues, and design docs. Quote the commit or PR that made the decision. If no record exists, say so rather than inventing a motive.
6. **Write the answer.**

## Answer shape

- **Short answer.** Two or three sentences that settle the question.
- **How it works.** The traced path, one step per line, each with a `file:line`.
- **Where things live.** The files and modules a person would edit, and who owns them.
- **Gotchas.** Surprising behavior, hidden coupling, dead code, missing tests.
- **Recommendation.** Only when the question was a decision. Include a short tradeoff table and your pick.

## Rules

- Every claim carries a `file:line`, a command and its output, or the label *inferred*.
- Never describe code you have not opened.
- If the premise of the question is wrong, say so first. "That function is never called" is a valid answer.
- No edits. If the investigation shows a change is needed, hand back to `avatar-mode` to route it.
