# Team Avatar

Principal-level engineering skills for Claude Code and Codex. Each skill belongs to a character from *Avatar: The Last Airbender*, and each character owns the discipline that fits who they are. Aang routes the work through `avatar-mode`. The rest of the team does the part they are best at.

The approach draws on pstack's poteto mode: read before you claim, name the data shape before you write logic, ship the smallest change the evidence justifies, and prove it on the real artifact.

## The team

| Character | Why them | Discipline | Skills |
|-----------|----------|------------|--------|
| Aang | The Avatar balances all four elements and refuses false choices. | Orchestration and the final call | `avatar-mode`, `four-elements` |
| Sokka | No bending, just plans, maps, and a boomerang that comes back. | Planning and architecture | `master-plan`, `war-room` |
| Toph | Blind, sees everything through vibrations, and does not care about your feelings. | Investigation and blunt review | `seismic-sense`, `earth-rumble` |
| Katara | A healer who finds the blockage and uses the least force that heals. | Debugging and tests | `healing-water`, `push-and-pull` |
| Zuko | Learned that fire comes from the breath, and that honor comes from owning mistakes. | Performance and incidents | `breath-of-fire`, `redemption-arc` |
| Iroh | Explains hard things simply and never wastes a word or a tea leaf. | Writing and teaching | `tea-time`, `white-lotus` |
| Appa | Carries the whole team, steadily, the whole way. | Faithful execution and shipping | `steady-flight`, `yip-yip` |
| Momo | Flies ahead, looks, and comes back fast. | Throwaway spikes and quick tasks | `scouting-flight` |

## The skills

| Skill | Use it for |
|-------|------------|
| `avatar-mode` | The entry point. Routes any nontrivial task and sets the non-negotiables. |
| `four-elements` | The principles. Air subtracts, Water adapts, Earth holds, Fire drives. |
| `master-plan` | Breaking multi-step work into units that each end in a check. |
| `war-room` | Comparing competing designs and recording the decision. |
| `seismic-sense` | Read-only investigation with a `file:line` for every claim. |
| `earth-rumble` | Severity-ranked review where every finding is verified. |
| `healing-water` | Reproduce, root-cause, and fix a bug with runtime evidence. |
| `push-and-pull` | Test-first rhythm and tests that assert behavior. |
| `breath-of-fire` | Performance work against a measured baseline. |
| `redemption-arc` | Incident response and blameless postmortems. |
| `tea-time` | Docs, PR descriptions, commit messages, and every reply. |
| `white-lotus` | Teaching, explaining, and onboarding. |
| `steady-flight` | Executing an existing plan one verified unit at a time. |
| `yip-yip` | Opening a PR and driving it to merge-ready. |
| `scouting-flight` | Prototypes that settle a question by observation. |

## Install

### Claude Code

```bash
claude plugin marketplace add tmcfarlane/oh-my-cursor
claude plugin install team-avatar@team-avatar
```

Start a session and ask for avatar mode, or call a skill directly, for example `/team-avatar:healing-water`. The characters are available as subagents named `team-avatar:<character>`.

To try a local checkout without installing, run `claude --plugin-dir plugins/team-avatar` from the repository root.

### Codex

```bash
codex plugin marketplace add tmcfarlane/oh-my-cursor
codex plugin add team-avatar@team-avatar
```

Start a session and ask for `$avatar-mode`, or call a skill directly, for example `$earth-rumble`. Codex reads [skills/avatar-mode/references/codex.md](skills/avatar-mode/references/codex.md) for its tool and subagent equivalents. Character subagents need `multi_agent = true` under `[features]` in `~/.codex/config.toml`.

To try a local checkout, pass its path instead of `tmcfarlane/oh-my-cursor`.

## Develop

Run the validator before you commit:

```bash
node scripts/validate-team-avatar.mjs
```

It checks skill and agent frontmatter, that every referenced skill exists, that every skill appears in the `avatar-mode` team table, that links resolve, that all manifests agree on name and version, and that no file uses a long dash. CI runs it on every pull request that touches the plugin.
