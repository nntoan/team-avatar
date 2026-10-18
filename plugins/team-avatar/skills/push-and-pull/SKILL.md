---
name: push-and-pull
description: Katara's push and pull for test discipline. Use when writing, changing, or reviewing tests, for test-first work ("tdd", "red green"), and when deciding what to test for a fix or feature. Tests assert observable behavior so they fail when behavior breaks and survive refactors.
---

# Katara's push and pull

Waterbending is a rhythm: push, then pull. Test-first work is the same rhythm. Push a failing test that names the behavior. Pull the code until it passes. Then let the water settle and clean up.

## The rhythm

1. **Push (red).** Write one test for one behavior a caller can observe. Run it. Confirm it fails, and that the failure message is the disagreement you predicted. An import error or a crash is not red, it is a broken instrument.
2. **Pull (green).** Write the least code that makes it pass. Run the whole nearby suite, not only the new test.
3. **Settle (refactor).** Clean the code with the tests green. Run them again after each change.
4. Repeat for the next behavior. Commit at each green when the work spans several behaviors.

## What to test

- **Behavior at the public surface.** Inputs and outputs, side effects a caller sees, errors a caller handles. Not private helpers, call counts, or internal state.
- **The bug's exact trigger.** A regression test reproduces the reported input, not a cleaned-up approximation.
- **The edges that matter.** Empty, one, many, the boundary value, the error path. Skip edges no caller can reach.
- **The real thing when cheap.** Prefer a real database, filesystem, or process in a test container over a mock. Mock only what is slow, flaky, or external.

## Check a test is worth keeping

- Revert the code change. Does the test fail? If not, it tests nothing.
- Rename an internal function. Does the test still pass? If not, it tests the implementation.
- Read the test name alone. Does it say what behavior is promised?

## Rules

- Never delete or weaken a failing test to get green. Find out why it fails.
- Never assert on log text, timing, or ordering the caller does not depend on.
- A flaky test is a bug. Fix its cause (shared state, real time, network) or quarantine it with an issue.
