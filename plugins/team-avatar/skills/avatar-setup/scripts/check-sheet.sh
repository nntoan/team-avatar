#!/bin/sh
# Checks an avatar-setup sheet. Every line is present, every model entry is
# `inherit` or a model name with an optional `@<level>`, `panel` has at least
# two entries, `default effort` is session or a level, and `session hook` is
# on or off. Prints `sheet ok`, or `sheet invalid: <problems>` and exits 1.
# Usage: check-sheet.sh <sheet>
set -eu
sheet=${1:?usage: check-sheet.sh <sheet>}
dir=$(cd "$(dirname "$0")" && pwd)
if ! normalized=$(sh "$dir/read-sheet.sh" "$sheet"); then
  echo "sheet invalid: cannot read $sheet"
  exit 1
fi
printf '%s\n' "$normalized" | LC_ALL=C awk -f "$dir/sheet.awk" -f "$dir/check-sheet.awk"
