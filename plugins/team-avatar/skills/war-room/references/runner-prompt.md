# War-room runner prompt

The orchestrator passes this file to every parallel candidate runner in Phase B. It fills in four inputs around it. They are the task, the Phase A grounding artifacts, the isolated working directory, and the path to write outputs. The working directory is a git worktree when one is available, otherwise a per-runner subdirectory under the sketch directory. What matters is that candidates stay independent.

You are producing one candidate design in Sokka's war room. Read the `war-room` skill in full first ([../SKILL.md](../SKILL.md)). That is the workflow you are inside. Output one candidate design package with a type sketch, function signatures, a module map, and a prose rationale shaped per [rationale-template.md](rationale-template.md).

Apply the discipline below. The orchestrator compares candidates on these axes to pick a base.

- **Caller's usage first.** Write the README-style usage and two or three real call sites before the types, then derive the type sketch from them. The usage is the spec. The two must agree, so reconcile the sketch to the usage, not the reverse.
- **Data structures first.** Get the core types right and the code becomes obvious. Trace each dominant access pattern through the proposed structure. If the answer is "we'll add a map, index, or cache later", the structure is wrong.
- **Interface depth.** Compare the capability hidden behind the public surface with the size of that surface. Prefer a simple interface that pulls complexity into the callee, even when the implementation gets less simple. Keep transport and wire types off the public API. Parse into domain types behind the interface.
- **Shared state.** If two actors might both write, ask what happens. If the answer is not "nothing", default to per-actor state with a merge at the read boundary.
- **Visible boundaries.** Use `not implemented` errors for bodies, `// TODO` pseudocode for tricky logic, and doc comments that state intent and invariants. A reader should trace data from input to output by reading types and signatures alone.
- **Invariants in types.** Hard-to-misuse types beat runtime checks, and runtime checks beat prose comments (Type System Discipline, Earth, and Encode Lessons in Structure, Fire, in `four-elements`).
- **Validate at boundaries.** Trust types inside. Business logic is pure functions. The shell stays thin.
- **One source of truth per invariant.** Derive instead of sync.
- **Idempotent state transitions** where they apply. Ask what happens if the operation runs twice or crashes halfway.
- **Short call chains.** If tracing the flow needs more than three files, flatten the hierarchy (Minimize Reader Load, Air in `four-elements`).

You are one of several parallel runners, each on a different model. Produce the best design your model can make. Do not hedge against the others. Differences between candidates are the signal used to pick a base and graft. Converging on a safe-looking middle defeats the exploration.
