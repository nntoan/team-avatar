---
name: earth-rumble
description: Toph's Earth Rumble review. Use to review a diff, a branch, a PR, or a design for correctness bugs, breaking changes, security holes, and maintainability. Blunt, severity-ranked, and every finding verified before it is reported. Also use for "review this", "audit this", or "is this safe to merge".
---

# Toph's Earth Rumble

Toph does not care about your feelings. She cares whether the code holds when someone pushes on it. Review like a champion who has already seen every trick: find what breaks, prove it breaks, and say it plainly.

## Steps

1. **Get the whole change.** Read the full diff against its base, plus the full contents of every touched file, plus the callers of every changed signature. A review of a hunk without its context misses half the bugs.
2. **Learn the intent.** Read the PR description, the linked issue, or ask what the change is for. Judge the code against the intent, not against your taste.
3. **Push on it from every side.** Run the passes below. When stakes are high, dispatch reviewers on separate passes or on different models (see `avatar-mode`), then merge their findings.
4. **Verify every finding.** For each candidate, construct the concrete input and state that triggers it, then confirm it by reading the path or running it. Drop anything you cannot make concrete.
5. **Rank and report.**

## Passes

- **Correctness.** Wrong results, off-by-one, null and empty cases, error paths, retries that duplicate work, races between concurrent actors.
- **Contracts.** Changed signatures, return shapes, config keys, database schemas, CLI flags, and events. Who calls this, and do they all still work?
- **Security.** Untrusted input reaching a query, a shell, a path, or a template. Secrets in logs or code. Authorization checked at the boundary, not assumed.
- **Tests.** Does a test fail if this change is reverted? Do the tests assert behavior or implementation details?
- **Structure.** Layers with one caller, duplicated decisions, dead code, names that lie, files that grew past what a reader can hold. Apply Air and Water from `four-elements`.

## Report shape

One line per finding, most severe first:

```
[severity] path:line  What breaks, for whom, and the input that triggers it.
```

Severities: `blocker` (wrong behavior or security hole), `major` (breaks a caller or a likely case), `minor` (edge case or maintainability), `nit` (style, optional).

End with a verdict: **ship**, **ship after blockers**, or **rethink**, with one sentence of reason.

## Rules

- No finding without a concrete failure scenario.
- Say what is good only when it changes the verdict.
- Review the change you were given. Do not redesign the feature.
- When the user authorized fixes, fix blockers and majors in the smallest diff, rerun the checks, and report each finding as fixed or skipped with a reason.
