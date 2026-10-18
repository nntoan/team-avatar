# Team Avatar on Codex

The skills are the same files on Codex. Only the tool names change. Read this when a skill names a Claude Code tool, a Claude model, a character agent, or a skill that ships with Claude Code. This file covers Codex only. Any other runtime uses its own tools, model names, and configuration paths.

## Tools

| Skill says | On Codex |
|------------|----------|
| Read a file | `shell` with `cat`, `sed -n`, `head`, or `tail` |
| Edit, create, or delete a file | `apply_patch` |
| Search files | `shell` with `rg`, `grep`, `find`, or `ls` |
| Run a command | `shell` |
| Fetch a URL | `shell` with `curl` or `wget` |
| Search the web | `web_search` |
| Load a skill (the `Skill` tool, a `/command`) | Skills load natively. Invoke one as `$<name>`, for example `$healing-water`, and follow the instructions it presents. |
| Dispatch a character (the `Agent` tool) | `spawn_agent`, as [Dispatching a character](#dispatching-a-character) below describes |
| Dispatch several characters in one turn | Several `spawn_agent` calls in one response |
| Wait for an agent | `wait_agent` |
| Free a finished agent's slot | `close_agent`, where the session exposes it. Some Codex hosts do not. |
| Todolist (`TaskCreate` and `TaskUpdate`, or `TodoWrite`) | `update_plan` |
| Ask a fixed-choice question (`AskUserQuestion`) | Ask in plain text and let the user answer. Codex has no structured-choice tool. |

## Dispatching a character

Codex has no `team-avatar:<name>` agent type. Dispatch a `spawn_agent` whose instructions say:

> Read `<absolute path to this plugin>/agents/<name>.md` in full and work as that character. Then read `<absolute path to this plugin>/skills/avatar-mode/SKILL.md` and the skills the character file names, from `<absolute path to this plugin>/skills/<skill>/SKILL.md`.

Resolve the plugin path from this file's location. This file is `skills/avatar-mode/references/codex.md`, so the plugin root is three directories above its folder.

- `spawn_agent` calls already run alongside your turn, so `run_in_background: true` has no separate flag. Issue the dispatch and continue.
- Codex has no `effort` parameter on the dispatch. When a sheet line carries `@<level>`, or the `default effort` line names a level, pass that level as `spawn_agent`'s `reasoning_effort` and keep the dispatch otherwise unchanged. `session` passes no `reasoning_effort`.
- A brief file stands in for a specialist agent type. `clear-water` dispatches Katara with `clear-water/references/comment-reviewer.md` as her brief. `earth-rumble` dispatches Toph with its rubric under `earth-rumble/references/`, and `metalbending` dispatches Toph with its rubric under `metalbending/references/`. On Codex, tell the `spawn_agent` to read the character file and then that brief in full, and to review only the diff and file contents its prompt names.
- Toph has no Edit or Write tools on Claude Code, but her Bash can still write files, so her read-only status rests on her instructions on both runtimes. Codex enforces nothing either. Say "do not edit files" in every brief you send her.
- Every character runs on this machine, so `kyoshi-formation` workers and the fan-out skills (`kyoshi-command`, `full-patrol`, `shield-wall`) isolate writers with a worktree each. The same holds on Codex.
- The rest of the policy in [Dispatching a character](../SKILL.md#dispatching-a-character) is unchanged. Pass file paths, not pasted context. Give each writer its own worktree or branch. Review every diff yourself.

Subagents need `multi_agent` enabled in `~/.codex/config.toml`:

```toml
[features]
multi_agent = true
```

Without it, `spawn_agent` is unavailable. Do the character's work yourself in one sequential pass and say so in the reply. The fan-out skills (`lie-detector`, `past-lives`, `seismic-sense`, `agni-kai`, `meditation`, `kyoshi-formation`, `war-room`) fall back to one labelled sequential pass. A required independent review does not fall back. It stays blocked, as [Dispatching a character](../SKILL.md#dispatching-a-character) says.

Enabling `multi_agent` does not lift the host's thread limit. A thread-limit error from `spawn_agent` is a capacity error, not a rejected model name, so falling back to another model does not help. After the first capacity rejection, stop spawning. Close a finished agent with `close_agent` before you try again. Where the session has no `close_agent`, do not assume a finished agent's slot is free.

## Models

The Codex sheet lives at `${CODEX_HOME:-~/.codex}/team-avatar-models.md` and holds your Codex model names. `avatar-setup` writes it, with the same lines as on Claude Code. Print the lines that apply with `sh <plugin>/skills/avatar-setup/scripts/show-sheet.sh codex`.

With no Codex sheet, the defaults name Claude models that do not resolve on Codex. Map them this way, and suggest `avatar-setup` to the user:

- `opus` lines (Sokka, Katara, Zuko, Iroh, Suki, Toph's reviews): your primary Codex model.
- `sonnet` lines (Toph, Appa): your fast code model.
- `haiku` (Momo): your fastest model.
- `strongest`: your strongest Codex model.
- `panel`: the distinct Codex models you can reach. The adversarial signal comes from model diversity. If only one model family is reachable, vary the reasoning effort instead and say in the verdict that diversity was reduced.

## Session routing hook

The plugin ships the same SessionStart routing context as on Claude Code, through `hooks/session-start.sh` on macOS and Linux and `hooks/session-start.ps1` on Windows. Codex runs the hook on startup, resume, clear, and compact after the user trusts it through `/hooks`. The hook reads the `session hook` line from the Codex sheet. `session hook: off` turns injection off. With no sheet or no line, it injects.

A skills-only install has no plugin hooks. In that case invoke `$avatar-mode` explicitly, or add a standing instruction to `AGENTS.md`.

## Skills that ship with Claude Code

| Skill or driver named in Team Avatar | On Codex |
|--------------------------------------|----------|
| `run` (drive a CLI, TUI, server, or app to see a change work) | Run the app yourself through `shell` and observe the real output. |
| A project UI driver (`.claude/skills/verify/`) | Drive the UI with the automation you have, or hand the user a concrete manual check. Never claim done without observing the artifact. |
| `loop` (recurring or self-paced re-invocation) | Codex has no `loop` skill. Rerun the step yourself on a cadence, or use a Codex scheduled task if one is available. |

## Per-skill notes

Most skills need only the tables above. These need one more mapping.

| Skill | On Codex |
|-------|----------|
| `avatar-setup` | The sheet path is the Codex one above, and the model names are your Codex models. The lines are identical. |
| `lie-detector` | The reviewer dispatch fields map to `spawn_agent`. Use the `panel` line from your Codex sheet and keep the reviewers model-diverse. |
| `clear-water` | Katara's comment-reviewer brief stands in for a specialist agent type. See Dispatching a character above. |
| `earth-rumble`, `metalbending` | Toph's rubric files stand in for specialist agent types. See Dispatching a character above. |
| `white-lotus` | Running `seismic-sense` and `past-lives` in parallel maps to `spawn_agent` fan-out. Image generation uses the Codex equivalent you have. |
| `vital-signs` | The generated skill lands under `.claude/skills/verify/` on Claude Code. Write it to Codex's project-skill location, `.agents/skills/verify/`, instead. The app-driving harness itself is runtime-neutral. |
| `checkup` | The parallel per-feature readers map to `spawn_agent` fan-out. The project-local skill lives under `.agents/skills/`, not `.claude/skills/`. |
| `long-flight` | `loop` and `AskUserQuestion` resolve through the tables above. |
| `invention-workshop`, `new-scroll` | Follow Codex's own skill-authoring guidance where it differs. Keep `name` and `description` frontmatter and progressive disclosure. |
| `war-room` | The runner panel goes through `agni-kai`, so its `spawn_agent` fan-out and model mapping apply here too. |
| `agni-kai` | The parallel candidates and the cross-judge map to `spawn_agent`. Use the `panel` line for the runners and pick the cross-judge from it. |
| `seismic-sense` | The parallel explorers and the explainer map to `spawn_agent` fan-out. |
| `meditation` | The reviewers and the synthesizer map to `spawn_agent`. The transcript finder reads Claude Code's layout under `~/.claude/projects/`, so pass the session digest the skill allows instead. |
| `kyoshi-formation` | Each worker is a `spawn_agent` call on Suki's model from your Codex sheet, and those calls already run in parallel. Give each writing worker its own worktree or output directory. |
| `past-lives` | The investigators and the synthesizer map to `spawn_agent`. List MCP servers from the tools Codex exposes to the session, not from `.mcp.json` or `claude mcp list`. |

## Scripts

The plugin's scripts run the same on Codex. Invoke them through `shell`.

- `skills/avatar-mode/scripts/check-playbooks.mjs` runs with `node`.
- `skills/avatar-setup/scripts/*.sh` run with `sh`.
- The shared toolkit under `tools/` (the `watch-pr` PR watcher and the `orch` store CLI) runs with `bun`, as the skills that use it say. It needs `bun` and `gh`. On first run it installs its one dependency into the plugin folder, so that run needs network access and a writable plugin folder. In a sandbox without either, run `bun install --frozen-lockfile` in `tools/` once outside the sandbox.
- `make-camp` and `shedding-season` ship their own `node` scripts. `shedding-season`'s worktree audit scans Codex sessions under `$CODEX_HOME/sessions` and `$CODEX_HOME/archived_sessions` (default `~/.codex`), along with any Claude Code transcript directory that exists.

## Instructions file

Where a skill says "your instructions file", on Codex that is `AGENTS.md` (the project root, plus `~/.codex/AGENTS.md` globally). On Claude Code it is `CLAUDE.md`.
