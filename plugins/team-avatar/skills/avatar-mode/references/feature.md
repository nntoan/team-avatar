# Feature

New or changed behavior, built from a named data shape.

**You own the design. Plan, review, verify.** Dispatch the implementation. Stay in the lead.

On Codex, read [codex.md](codex.md) for tool equivalents.

1. Run `seismic-sense` over the affected subsystem.
2. Run `war-room` for parallel design exploration.
3. Write the throughput checkpoint as four todo items. A dimension that does not apply (one file, no fan-out) keeps its item with `n/a: <reason>` rather than being dropped.
   - **Blocking first steps.** Gates run before fan-out.
   - **Independent workstreams.** Disjoint files, services, or layers run in parallel. Shared writes run one after another.
   - **Shared mutable state.** Default to splitting the target (Separate Before Serializing Shared State, Earth in `four-elements`). Serialize only for a real invariant.
   - **Smallest safe decomposition.** If one worker is best, name why.
4. Dispatch the code-writing to Appa on Appa's model from the avatar-setup sheet, or to the character whose discipline fits, with a specific scope. The brief names the file paths, the data shape and its organizing structure (Model the Domain, Water in `four-elements`: a state machine over scattered booleans, a table or registry over branching, a typed model over repeated shape assumptions), chosen before the delegate writes logic, and the success criteria. The hardest changes (cross-cutting design, subtle concurrency, tricky algorithms) go on the `strongest` model. Pick each dispatch's reasoning level for the job, per [Dispatching a character](../SKILL.md#dispatching-a-character). When the implementation admits several valid shapes (error handling, abstraction layer, test structure), dispatch through `agni-kai` instead, so the runners surface the alternatives and the cross-judge guards the pick.
   - This step is mandatory. It has no skip-with-reason escape, and the Laziness Protocol (Air in `four-elements`) does not override it, because the gain is review separation, not lines saved.
   - A character that runs as a subagent and may not dispatch satisfies this by owning the diff directly with the same review separation. It never replies "standing by" while it waits on a nested agent.
   - **Give every file-writing delegate its own worktree.** Dispatch it with `isolation: "worktree"`, or hand it an exclusive branch. Do not write files or run a suite in a worktree a delegate still holds.
   - On Claude Code, `isolation: "worktree"` branches from the remote default branch unless the `worktree.baseRef` setting is `"head"`. When the delegate builds on commits the default branch lacks, commit them, create its worktree with `git worktree add <path> -b <delegate-branch> HEAD`, and name that base commit in the brief.
   - Fencing a file in the brief's prose is not a lock (Separate Before Serializing Shared State, Earth in `four-elements`).
   - Comments follow [Comments](../SKILL.md#comments). Make surgical edits, and re-ground against the source for files derived from upstream. Port an improvement to a shared primitive to every consumer and verify each. Commit liberally.
5. Verify on the matching surface. "Inconclusive" or the wrong surface is not a pass. Flag it.
6. Rebase into small, ordered commits. Stack follow-ups. Use Sequence Work into Verifiable Units (Fire in `four-elements`), building, verifying, and committing each small unit before the next.
7. If the design is contested, run `lie-detector` before shipping.
8. Run `yip-yip` to open the PR.

Code-coupled work (one feature, one migration) goes to a single owner with the checkpoint inline. That owner does not fan out internally. The top-level session dispatches any further workers after the blocking phase. Fan-out from the top-level session is for slices that produce independent artifacts (audits, cross-subsystem investigations, competing experiments). Rewrite the checkpoint at phase boundaries. Dispatch a fresh owner rather than chaining interrupts.

**Reply.** What you built, what you chose and why, the throughput checkpoint, and the open decisions. Use a table for design alternatives.
