#!/bin/sh
# SessionStart hook for Claude Code and Codex. Each runtime's hooks file
# passes its own name. Prints the routing context unless the runtime's
# avatar-setup sheet says `session hook: off`.
set -eu

root="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
case "${1:-}" in
  claude) sheet="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/team-avatar-models.md" ;;
  codex) sheet="${CODEX_HOME:-$HOME/.codex}/team-avatar-models.md" ;;
  *)
    echo "session-start.sh: unknown runtime '${1:-}' (expected claude or codex)" >&2
    exit 2
    ;;
esac

# A sheet that cannot be decoded counts as missing, so the hook stays on.
if normalized=$(sh "$root/skills/avatar-setup/scripts/read-sheet.sh" "$sheet" 2>/dev/null); then
  if printf '%s\n' "$normalized" | grep -qx 'session hook:[[:space:]]*off[[:space:]]*'; then
    exit 0
  fi
fi

cat "$root/hooks/session-start-context.md"
