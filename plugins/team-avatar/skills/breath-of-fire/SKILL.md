---
name: breath-of-fire
description: Zuko's breath of fire for performance work. Use for slowness, high latency, memory growth, CPU spin, bundle size, cloud cost, or "make this faster". Measures a baseline, finds the real limit, fixes the cheapest thing that meets the target, and reports a number it can explain.
---

# Zuko's breath of fire

Zuko's fire was wild until Iroh taught him that real power comes from the breath. Performance work is the same. Rage at the code and you burn things down. Breathe, measure, and the heat goes exactly where you aim it.

## Steps

1. **Set the target.** Name the metric, the workload, and the number that counts as done ("p95 under 200 ms on the checkout request with 1k items"). No target means no stopping point.
2. **Measure the baseline.** Run the real workload on a realistic build (release mode, production-like data). Repeat enough times to see the spread. Save the raw output.
3. **Vet the number.** Before trusting it, check the measurement itself:
   - Is it measuring the work you think, or setup, warmup, caching, or the harness?
   - Is the variance small next to the change you expect?
   - Did the build, data, and machine stay the same between runs?
4. **Find the limit.** Profile, trace, or instrument to see where time or memory actually goes. Do not optimize from reading source. Name the bottleneck with evidence.
5. **Work the mantras in order, cheapest first.** Stop at the first one that meets the target.
   1. Do not do it at all.
   2. Do it once, not again (cache, memoize, dedupe).
   3. Do less of it (batch, paginate, narrow the query).
   4. Do it later (lazy, deferred).
   5. Do it where no one waits (background, precompute).
   6. Do it concurrently.
   7. Do it cheaper (a better algorithm or data structure).
6. **One change per measurement.** Change one thing, measure again with the same harness, and keep it only if the number moves. Revert changes that do not pay.
7. **Explain the result.** Report baseline, after, delta, and spread. Say why the number moved, in terms of the bottleneck from step 4. If you cannot explain it, it is not done.
8. **Cite the measurement in the PR** and hand to `yip-yip`.

## Rules

- A number without its workload, build, and spread is not a result.
- Correctness first. A faster wrong answer is a bug (`healing-water`).
- Keep the benchmark script. It is the lever the next engineer reruns.
