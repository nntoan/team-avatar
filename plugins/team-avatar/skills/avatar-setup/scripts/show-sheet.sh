#!/bin/sh
# Prints the model lines that apply on a runtime: the sheet's line where it has
# one, the default otherwise. Each line ends with `(sheet)` or `(default)`.
# Usage: show-sheet.sh <claude|codex> [sheet]
# With no sheet argument it reads the runtime's own sheet path.
set -eu
case "${1:-}" in
  claude) path="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/team-avatar-models.md" ;;
  codex) path="${CODEX_HOME:-$HOME/.codex}/team-avatar-models.md" ;;
  *)
    echo "usage: show-sheet.sh <claude|codex> [sheet]" >&2
    exit 2
    ;;
esac
sheet=${2:-$path}
dir=$(cd "$(dirname "$0")" && pwd)
if normalized=$(sh "$dir/read-sheet.sh" "$sheet"); then
  echo "sheet: $sheet"
else
  normalized=
  echo "sheet: none at $sheet, so every line is its default"
fi
printf '%s\n' "$normalized" | LC_ALL=C awk -f "$dir/sheet.awk" -f "$dir/show-sheet.awk"
