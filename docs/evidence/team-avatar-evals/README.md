# Team Avatar end-to-end results

Claude Code passed 29 of 29. Codex passed 29 of 29.

Every case ran headless in a fresh git repo copied from `evals/team-avatar/fixtures/`, with the plugin installed the way a user installs it. Both runtimes got the same prompt and the same deterministic checks. The final reply of every run is in [replies/](replies/). [HISTORY.md](HISTORY.md) explains what earlier passes found and what changed.

| Case | Kind | Claude Code | Codex | Checks |
|------|------|-------------|-------|--------|
| `route-bug` | routing | pass (70s) | pass (34s) | route, unchanged |
| `route-perf` | routing | pass (64s) | pass (33s) | route, unchanged |
| `route-incident` | routing | pass (69s) | pass (32s) | route, unchanged |
| `route-review` | routing | pass (68s) | pass (31s) | route, unchanged |
| `route-why` | routing | pass (67s) | pass (34s) | route, unchanged |
| `route-how` | routing | pass (46s) | pass (22s) | route, unchanged |
| `route-babysit` | routing | pass (43s) | pass (21s) | route, unchanged |
| `route-fanout` | routing | pass (40s) | pass (22s) | route, unchanged |
| `route-docs` | routing | pass (40s) | pass (23s) | route, unchanged |
| `route-plan` | routing | pass (40s) | pass (26s) | route, unchanged |
| `route-prototype` | routing | pass (25s) | pass (17s) | route, unchanged |
| `route-conflicts` | routing | pass (24s) | pass (18s) | route, unchanged |
| `route-ci` | routing | pass (24s) | pass (18s) | route, unchanged |
| `route-catchup` | routing | pass (27s) | pass (18s) | route, unchanged |
| `route-models` | routing | pass (22s) | pass (17s) | route, unchanged |
| `route-blast` | routing | pass (15s) | pass (23s) | route, unchanged |
| `route-tdd` | routing | pass (27s) | pass (25s) | route, unchanged |
| `route-land` | routing | pass (16s) | pass (23s) | route, unchanged |
| `discover` | discovery | pass (16s) | pass (24s) | lists_all_skills, unchanged |
| `task-bugfix` | task | pass (31s) | pass (134s) | skill_used, cmd, file_unchanged, max_diff_lines, final_matches |
| `task-review` | task | pass (47s) | pass (74s) | skill_used, unchanged, final_matches |
| `task-investigate` | task | pass (50s) | pass (99s) | skill_used, unchanged, final_matches |
| `task-docs` | task | pass (58s) | pass (115s) | skill_used, file_lacks, file_has |
| `task-tdd` | task | pass (75s) | pass (90s) | skill_used, cmd, cmd, mutant |
| `task-plan` | task | pass (62s) | pass (350s) | skill_used, file_has, plan_units_have_checks, file_unchanged |
| `task-setup-dryrun` | task | pass (35s) | pass (36s) | skill_used, sheet_in_final, final_matches, unchanged |
| `task-dispatch` | task | pass (125s) | pass (72s) | agent_dispatched, unchanged, final_matches |
| `task-hook` | hook | pass (15s) | pass (8s) | hook_fired, final_matches |
| `invoke-loads` | discovery | pass (14s) | pass (16s) | skill_used, final_matches, unchanged |

## Failures

None.

## Rerun

```bash
node evals/team-avatar/run.mjs --runtime claude --jobs 4 --out /tmp/team-avatar-evals
```

```bash
node evals/team-avatar/run.mjs --runtime codex --jobs 4 --out /tmp/team-avatar-evals
```

```bash
node evals/team-avatar/report.mjs --in /tmp/team-avatar-evals --out docs/evidence/team-avatar-evals
```
