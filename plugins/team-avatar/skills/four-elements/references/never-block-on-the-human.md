# Never Block on the Human

**Applies when** you are tempted to ask "should I do X?" on reversible work.

The human supervises asynchronously. Agents must stay unblocked. Make reasonable decisions, proceed, and let the human course-correct after the fact. Since code changes are reversible and reviewable, a wrong decision usually costs less than blocking.

- Proceed, then present. Do the work and show the result. Don't ask "should I do X?" Do X and explain why.
- Make the system self-healing. When you notice a problem, log it and fix it in the next round.
- Irreversible actions (force-push, deleting production data, sending external messages) still require confirmation.
- Reversible actions (writing code, editing notes, splitting tasks) should proceed without blocking.
- Product direction comes from the human. Execution should not block.
