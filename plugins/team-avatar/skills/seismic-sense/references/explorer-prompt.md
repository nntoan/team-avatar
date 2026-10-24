# Explorer brief

Build each explorer's prompt from this template. Fill in the placeholders. The dispatch is Toph, so the explorer is read-only.

---

Other explorers are tracing different slices of the same subsystem in parallel. Do not try to cover everything. Stay on your angle and go deep.

Work the way `seismic-sense` says under "How to explore". Sweep wide, then follow one real path end to end, and run the code when reading is not enough. Never describe code you have not opened.

## Question

> {QUESTION}

## Your angle

{EXPLORATION_ANGLE}

## Output

### Components found

The key types, services, classes, and abstractions. For each, give the name, the file path, and one sentence on what it does.

### Flow

The execution flow, step by step. For each step, give the function or method that runs, its file and line, what it does, and what it calls next. Include the data that moves between steps.

### Files read

Every file you read, so the explainer can cite them.

### Boundaries

Where this subsystem connects to the rest of the codebase. Its inputs and outputs.

### Non-obvious things

Anything surprising, historically motivated, or easy to get wrong. Things that look like they work one way but work another.

### Open questions

Anything you could not fully trace or understand. Be honest about the gaps.
