# Guard the Context Window

**Applies when** context is filling up from large outputs, long files, repeated reads, or fan-out planning. Route bulk work to dispatched characters. Keep summaries in the main thread, not raw payloads.

**Why.** Context overflow degrades reasoning quality, creates compression artifacts, and halts progress.

**Pattern.**

- **Size phases and cap scope.** Limit files per phase, set turn budgets, and account for mechanism costs.
