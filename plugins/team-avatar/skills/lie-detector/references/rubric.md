# Review rubric

Review through the lenses that apply. Not every lens fits every change.

## Correctness

Does the code do what the intent says it should?

- Edge cases. Empty inputs, null or undefined, boundary values, concurrent access.
- Error handling. Are errors caught, passed up, or silently swallowed?
- Off-by-one, type coercion, integer overflow, string encoding.
- State. Race conditions, stale closures, dangling references.
- Do both the happy path and the sad path work?
- Idempotency. What happens if the operation runs twice, or if an earlier run crashed halfway? If the answer depends on what state was left behind, a reconciliation step is missing.
- Concurrency. If several actors can touch the same mutable state (files, branches, shared data), is access serialized by structure (locks, sequential phases, exclusive ownership) or by conventions that will not hold?

When you find a possible bug, trace the execution path. Do not just flag "this could be null". Show the call chain that makes it null.

## Root causes and symptoms

Does the code fix the actual problem, or paper over a symptom?

Answering this often means reading past the changed files. Read the callers, callees, type definitions, and sibling modules, and understand the architecture the change lives in. Use Read, Grep, and Glob to follow the call chain and read the types before you judge whether the change hits the right layer.

- Guard clauses that hide a deeper invariant violation.
- Retry logic that hides a broken contract.
- Type casts that silence a modeling error.
- A workaround. Why is it needed, and what would a proper fix look like?
- A fix in module A that belongs in module B's contract.
- Instructions where structure would serve better. If the fix is a comment saying "don't do X" or a convention someone must remember, ask whether a type constraint, a lint rule, or a runtime check could make the wrong thing impossible.

## Structural integrity

Does the code fit the system it is part of?

- Boundary discipline. Is validation at the system boundaries, or scattered through business logic? Validate data once where it enters, then trust it inside.
- Abstraction level. Does the code mix high-level orchestration with low-level detail?
- Coupling. Does the change add dependencies that make future changes harder?
- Data model fit. Do the data structures match how the data is actually accessed?
- Bolted on or integrated. If the requirement had been known from the start, would the code look like this, or does it feel patched on?
- Legacy dual paths. Does the change add a new API and keep the old one alive? With no external consumers, migrate the callers and delete the old path in the same change. Do not leave compatibility layers that become permanent.

Do not penalize simple code for lacking abstraction. Premature abstraction is worse than duplication.

## Verification

Can you tell from reading that this code works?

- Are there tests? Do they test behavior or implementation details?
- Are there assertions or invariants that would catch a regression?
- For a bug fix, is there a test for the bug?
- For a change at an integration boundary, is the full path tested?
- Check the real thing, not a proxy. If the code checks liveness through a file's modified time or cached state instead of reading the actual value, that is a verification gap.
- For delegated or async work, does the code check the actual output, or does it trust self-reports and summaries?

## Complexity budget

Does what the code does justify its complexity?

- Code that could be simpler without losing correctness or clarity.
- Abstractions that serve only one call site.
- Configuration or parameters for cases that do not exist yet.
- Dead code, unused imports, vestigial parameters.
- "Just in case" code paths with no current callers.
- Compatibility paths kept alive for a migration that is done. Delete the scaffolding.
- Does the user experience justify the complexity? Every feature, control, and option earns its place. A half-finished feature is worse than a missing one.

Simpler is better unless simpler is wrong.

## Security

For each security finding, trace the input path through the code and show it.

- User input reaching a dangerous sink (SQL, shell, `eval`, `innerHTML`) without sanitizing.
- Authentication or authorization gaps in new endpoints.
- Secrets in code, logs, or error messages.
- Time-of-check to time-of-use gaps in security-critical paths.
