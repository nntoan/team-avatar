# Team Avatar on Codex

The skills are the same files on Codex. Only the tool names change. Read this when a skill names a Claude Code tool or model.

## Tools

| Skill says | On Codex |
|------------|----------|
| Read a file | `shell` with `cat`, `sed -n`, or `head` |
| Edit or create a file | `apply_patch` |
| Search files | `shell` with `rg`, `find`, or `ls` |
| Run a command | `shell` |
| Search the web | `web_search` |
| Load a skill | Skills load natively. Invoke one as `$<name>`, for example `$healing-water`. |
| Todolist | `update_plan` |
| Ask a fixed-choice question | Ask in plain text. |
| Agent tool | `spawn_agent` |
| Wait for an agent | `wait_agent` |

## Dispatching a character

Codex has no `team-avatar:<name>` agent type. Dispatch a `spawn_agent` whose instructions say:

> Read `<absolute path to this plugin>/agents/<name>.md` in full and work as that character. Then read the skills it names from `<absolute path to this plugin>/skills/<skill>/SKILL.md`.

Resolve the plugin path from this file's location: the plugin root is two directories above `skills/avatar-mode/`.

Subagents need `multi_agent` enabled in `~/.codex/config.toml`:

```toml
[features]
multi_agent = true
```

Without it, do the character's work yourself in one sequential pass and say so in the reply. A thread-limit error is a capacity limit. Stop spawning, and close finished agents with `close_agent` before you try again.

## Models

Map the Claude Code model table in `avatar-mode` to your Codex models. Use your strongest model where the table says `opus`, your primary model for `sonnet`, and your fastest model for `haiku`. When a skill asks for a review panel with different models, use the distinct models you have. If only one is reachable, vary the reasoning effort and say that diversity was reduced.
