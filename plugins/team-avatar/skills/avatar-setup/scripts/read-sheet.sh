#!/bin/sh
# Decode the avatar-setup sheet once, before any consumer reads its lines.
# PowerShell 5.1 writes UTF-16LE. Other writers may add a UTF-8 BOM or CRLF
# line endings. Prints the sheet as plain UTF-8 lines, or exits 1 when the
# file is missing or unreadable.
# Usage: read-sheet.sh <sheet>
set -eu
sheet=$1
[ -f "$sheet" ] && [ -r "$sheet" ] || exit 1
if [ "$(od -An -tx1 -N2 "$sheet" | tr -d ' ')" = fffe ]; then
  text=$(iconv -f UTF-16LE -t UTF-8 "$sheet")
else
  text=$(cat "$sheet")
fi
bom=$(printf '\357\273\277')
cr=$(printf '\r')
printf '%s\n' "$text" | sed -e "1s/^$bom//" -e "s/$cr\$//"
