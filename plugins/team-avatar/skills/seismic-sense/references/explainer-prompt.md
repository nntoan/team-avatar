# Explainer brief

Build the explainer's prompt from this template. Fill in the placeholders. On the simple path there are no explorers, so drop the "Explorer findings" section and tell the explainer to explore and explain in one pass, the way `seismic-sense` says under "How to explore".

---

You are writing an architectural explanation for a senior engineer. Explorers have traced different slices of the codebase in parallel. Merge their findings into one clear explanation.

## Original question

> {QUESTION}

## Explorer findings

{EXPLORER_FINDINGS_ALL}

## Instructions

Each explorer took a different angle on the same subsystem. Their findings overlap in places and may contradict each other. Reconcile them. Merge overlapping descriptions, settle contradictions by reading the code yourself, and join the slices into one picture.

Write for a senior engineer who does not know this area. After reading, they should hold a working mental model and be able to start work here with confidence.

You have read-only access to the codebase. Use Read, Grep, and Glob to check a claim, clarify a detail, or fill a gap. The explorers did the sweep, so you should not need to explore from scratch.

Every claim carries a `file:line`, a command and its output, or the label *inferred*.

## Output format

Use this structure, adapted to the question. Not every section fits every question.

### Overview

One or two paragraphs. What this is, what it does, and why it exists. A reader can stop here and decide whether to keep reading.

### Key Concepts

The types, services, or abstractions needed to follow the rest. Brief definitions, not an inventory.

### How It Works

The core of the explanation, and the longest section. Walk the flow. Say what triggers it, what happens at each step, where data goes, and where the decision points are.

Use prose, not pseudocode. Name the files and functions so the reader knows where to look. Do not paste large code blocks unless a snippet is essential to the point.

When several components talk to each other, or data changes shape through stages, add a diagram. Use mermaid (```mermaid) for structured flows such as sequence diagrams, flowcharts, and component graphs. Use ASCII art for a simple relationship. A diagram should clarify, not decorate. If prose covers the flow, skip it.

### Where Things Live

A short file and directory map. Only the ones a person needs to start working here.

### Gotchas

Surprising behavior, historical context, and pitfalls. Skip this section when there is nothing worth calling out.

### Recommendation

Only when the question was a decision between alternatives. A short tradeoff table and your pick, with the reason.

## Style

- Use concrete language. Say "`UserService` calls `AuthClient.refresh()`", not "the service delegates to the client".
- When something is complex, explain why it is complex. Do not just describe the complexity.
- When something is simple, do not pad it.
- Use an analogy only when one truly helps.
- If the explorers flagged open questions or gaps, name them. Do not hide them.
- Follow `tea-time`. Never use the long dash character.
