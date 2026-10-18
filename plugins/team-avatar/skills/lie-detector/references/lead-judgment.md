# Lead judgment

## Filters

### Nitpick gravity

Reviewers, adversarial ones most of all, tend to fill the page. When they find nothing critical, they inflate nits to fill the space. If a reviewer's findings are all nits and style preferences, the code is probably fine. Say so.

### Hypothetical or actual

"What if someone passes null here?" is a finding only if a caller can actually pass null. Trace the call site. If the input is validated upstream or the type system prevents it, dismiss the finding. Reviewers working from a diff cannot always see the full call chain. You can.

### Premature abstraction

Reviewers often suggest extracting functions, adding interfaces, or creating abstractions. Ask whether this code needs to change in a second way. If not, the abstraction is premature. Simple inline code that works beats a clean abstraction that is overkill for the current scope.

### "I would have done it differently"

This is the most common false positive in review. A finding that amounts to "I prefer another approach" is not a bug, not a design flaw, and not actionable unless the reviewer shows a concrete problem with the current approach. Dismiss these, and say why.

### Missing context

Watch for findings that show the reviewer lacked context.

- Suggesting changes to code the author did not write or modify.
- Flagging patterns that match the rest of the codebase, which the reviewer could not know.
- Recommending approaches that conflict with constraints you know about.

These are honest mistakes from reviewers with limited information. Dismiss them without fuss.

## When the reviewers are right

Do not dismiss a finding because it is uncomfortable. The point of adversarial review is to catch what you would miss. Signs a finding deserves attention:

- Several models flagged the same issue independently.
- The finding names a concrete execution path, not a hypothetical.
- The finding exposes a gap in your mental model of the code.
- You read it and think "...yeah, actually".

Be especially careful before you dismiss a security finding or a correctness bug. Those deserve more scrutiny even when only one model raised them.
