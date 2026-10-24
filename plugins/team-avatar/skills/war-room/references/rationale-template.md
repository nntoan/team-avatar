# Rationale template

The prose that ships beside the type sketch. It is the war room's decision record. One page. Sentence-case headings, no boilerplate. Replace each italic note with real content.

## Problem

*One paragraph. What we are trying to do, and what about the existing system or its constraints makes the shape non-obvious. If [Phase A](../SKILL.md#phase-a-ground-the-problem) surfaced constraints the design must honor (existing types to interoperate with, callers we cannot break, invariants that cross our boundary), name them here so the reader sees the same constraints you saw.*

## Usage (caller's view)

*Write this first, before the type sketch. Show the README or quickstart the consumer reads, plus two or three realistic call sites in their own code. What they import, what they call, what comes back. The type sketch in [Shape](#shape) is derived from this. The two must agree. When they diverge, reconcile the sketch to the usage, not the reverse. The caller's experience is the spec. The types serve it.*

## Shape

*The recommended architecture. Data structures first. Then how data flows through the signatures. Name the load-bearing decisions. State which invariants the types encode, where validation lives, and what the system deliberately does not do. Judge interface depth explicitly. State what complexity the public surface hides, what stays exposed to callers, and why the interface is no larger than it needs to be. Cite the principle from `four-elements` behind each decision (for example, "per Boundary Discipline, Earth"). Do not restate it.*

## Synthesis decision

*Filled in from the design bakeoff. Record which candidate became the base and why, what was adapted from each of the others, and what was rejected and why.*

## Tradeoffs accepted

*One bullet per tradeoff the chosen shape makes, in the form "we accept X in exchange for Y". Name anything a future reader might mistake for an oversight, including what looks like premature optimization or premature simplification.*

## Alternatives considered

*Required. Name at least one concrete alternative shape, with one line on why it lost. Judge each alternative on interface depth, not implementation simplicity alone. Name the complexity it exposes to callers and the complexity it hides. Two or three alternatives belong here when the design space had real contenders. One is fine when the constraints forced the answer, with the conclusion phrased as "this was the only viable shape because...". Do not list flavors of one shape. This section covers design alternatives the chosen shape weighed and rejected, not other runner candidates.*

## Implementation reconciliation

*During implementation, record accepted deviations and their acceptance sources here, and update the affected usage, outcome contracts, signatures, and ownership in this design. Record why each local deviation leaves the shared contract valid. Keep unaccepted changes marked unresolved. Reconcile before closing a unit or handing its contract to the next worker.*

## Open questions and risks

*What you noticed during the sketch that the human needs to weigh in on, and risks worth flagging before implementation starts. Phrase each as a question, not an assertion, so the human's answer is the resolution.*

## Next implementation step

*The first thing to build against the sketch, in one sentence. What you would start writing right after synthesis, or after sign-off when a checkpoint was requested.*
