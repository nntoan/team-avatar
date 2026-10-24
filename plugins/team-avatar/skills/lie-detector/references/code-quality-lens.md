# Code quality lens

Each reviewer applies this lens on top of the rubric. It is a condensed form of the `metalbending` rubric, sized to embed in every reviewer's prompt. When that rubric changes, update this lens to match.

Above all, be ambitious about structure. Do not stop at local cleanup. Search for code judo moves, restructurings that keep behavior and make the implementation dramatically simpler, smaller, more direct, and more elegant.

## Core prompt

Start from this baseline.

> Perform a deep code quality audit of the current branch's changes.
> Rethink how to structure and implement the changes to meaningfully improve code quality without changing behavior.
> Improve abstractions and modularity, reduce spaghetti code, and improve succinctness and legibility.
> Be ambitious. If a clear path to a better implementation means restructuring some of the codebase, take it.
> Be thorough and rigorous. Measure twice, cut once.

## Dimensions

Each dimension is stated once. Apply the ones that fit.

0. **Be ambitious about structural simplification.** Do not stop at "this could be a bit cleaner". Look for reframings that make whole branches, helpers, modes, conditionals, or layers disappear. Assume a code judo move is often available. It uses the existing architecture better and makes the change dramatically simpler. If you can delete complexity rather than rearrange it, push hard for that.
1. **Do not let a PR push a file from under 1000 lines to over 1000 lines without a very strong reason.** Treat it as a strong smell. Prefer extracting helpers, subcomponents, or modules. If the diff crosses the line, ask whether the code should be decomposed first. Waive it only for a compelling structural reason where the file stays clearly organized.
2. **Do not allow spaghetti growth in existing code.** Be suspicious of new ad-hoc conditionals, scattered special cases, and one-off branches in unrelated flows. Odd `if` statements in random places are a design problem, not a style nit. Prefer moving the logic into a dedicated helper, state machine, or module over tangling an existing path.
3. **Bias toward cleaning the design, not just accepting working code.** If behavior can stay the same while the structure gets meaningfully cleaner, push for the cleaner version. Prefer simplifications that remove moving pieces over refactors that spread the same complexity around.
4. **Prefer direct, boring, maintainable code over hacky or magical code.** Brittle, ad-hoc, or magic behavior is a problem. Be skeptical of generic mechanisms that hide simple data-shape assumptions. Flag thin abstractions, identity wrappers, and pass-through helpers that add indirection without adding clarity.
5. **Push on type and boundary cleanliness when it affects maintainability.** Question needless optionality, `unknown`, `any`, and cast-heavy code when a clearer type boundary could exist. Prefer explicit typed models over loosely shaped ad-hoc objects. If a branch leans on a silent fallback to paper over an unclear invariant, ask whether the boundary should be explicit.
6. **Keep logic in the canonical layer and reuse existing helpers.** Call out feature logic leaking into shared paths and implementation details leaking through APIs. Prefer canonical utilities over bespoke one-offs. Push code toward the right package, service, or module instead of normalizing drift.
7. **Treat needless sequential orchestration and non-atomic updates as design smells when the cleaner structure is obvious.** If independent work runs in sequence for no reason, ask whether it should run in parallel. If related updates can leave state half-applied, push for a more atomic structure. Do not chase micro-optimizations, but do flag orchestration complexity that makes the code brittle.

## Output priority

Structural regressions and missed simplifications first. Then spaghetti and branching growth. Then boundary, type, and file-size concerns. Then smaller modularity and legibility issues.

## Approval bar

Do not approve because behavior seems correct. Treat each of these as a presumptive blocker unless the author justifies it.

- The PR keeps a lot of incidental complexity when a code judo move would delete it.
- It pushes a file from below 1000 lines to above 1000 lines.
- It adds ad-hoc branching that tangles an existing flow.
- It scatters feature checks across shared code.
- It adds an unnecessary abstraction, wrapper, or cast-heavy contract.
- It duplicates an existing helper or puts logic in the wrong layer when a clear canonical home exists.

When none of these apply, still leave explicit, actionable feedback and push for a cleaner decomposition.

## Tone

Be direct, serious, and demanding about quality. Do not be rude, and do not soften a major maintainability problem into a mild suggestion. If the code makes the codebase messier, say so. If the change missed an obvious dramatic simplification, say that too. Do not settle for "maybe rename this" when the real issue is structural.
