# Artifact mode

The fire is out. Only the ashes remain. The capture already exists and is a fixed dataset, so read it and do not re-run it. Keep the tooling generic: a DevTools or trace parser for a cpuprofile or a `.json.gz` trace, a text editor for a spindump, and your heap tooling for a heap snapshot.

1. **Identify the format and load it with the right tool.** Parse large artifacts away from the main thread, as the rules in [../SKILL.md](../SKILL.md) describe, and keep the reduced finding in the main thread.
2. **Transform the raw artifact into a form you can query.** Dump the trace or heap snapshot into sqlite, one row per sample, frame, or node. Reach the queryable shape before you read. Write the loader as a short script with no dependencies beyond the runtime, so a reviewer can rerun it on the same file.
3. **Narrow to the cause.**
   - For CPU, query for the frames that hold the most self and total time, then walk the call tree to the hot path.
   - For a leak, follow the retainer chain from the leaked object to a GC root.
   - For a spindump, find the thread stuck on CPU or blocked, and its wait reason.
4. **Attribute to source.** Map the hot frame to file, symbol, and line through the artifact's own symbols or source maps. A frame with no source mapping is not yet a diagnosis. Resolve the symbols, or say plainly that the artifact does not carry them.
5. **Confirm with a paired capture if you have one.** Diff the before and after artifacts with the same queries. Without a pair, mark the finding as the strongest hypothesis the artifact supports, not a confirmed cause.
6. **Hand back a cited diagnosis,** with no fix unless asked. Report per the reply in [../SKILL.md](../SKILL.md), and say whether a paired capture confirmed it. Route to `healing-water` or `breath-of-fire` once the cause is known.
