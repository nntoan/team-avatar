# Live mode

The fire is still burning. Instrument the live process. Do not theorize from source.

1. **Capture the live signal on the matching surface.** Use the project's verification skill (generate one with `vital-signs`) or Claude Code's `run` skill to reach the surface. Capture the artifact the symptom calls for:
   - A spinning process gets a CPU profile.
   - A leak gets a heap snapshot, ideally two or three taken over time so growth shows.
   - A visual glitch gets a Chrome DevTools Protocol (CDP) performance trace.
   - A hang gets a thread dump or spindump.
2. **Reduce the artifact to the smoking gun.** Find the function on the hot path, the retainer chain from the leaked object to a GC root, or the loop that fires without input. Parse large artifacts away from the main thread, as the rules in [../SKILL.md](../SKILL.md) describe. Keep only the reduced finding.
3. **Prove the mechanism before you believe it.** Confirm the hypothesis cheaply on the running process. Inject instrumentation through CDP `Runtime.evaluate`, add a counter or a log at the suspect site, or hotfix the live code without a reload, then watch the symptom move with it. A mechanism that survives a direct test is a cause. One that was only read off the artifact is a hypothesis.
4. **Map the finding to source.** Name the file, the symbol, and the line that allocates or schedules.
5. **Stop at the diagnosis.** Report per the reply in [../SKILL.md](../SKILL.md). Hand back to `healing-water` or `breath-of-fire` once the cause is known.
