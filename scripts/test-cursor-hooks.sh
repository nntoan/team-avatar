#!/usr/bin/env bash
# Feeds real beforeShellExecution payloads to hooks/guard-shell.sh and checks each reply against
# Cursor's documented schema: valid JSON, only "permission", "user_message", and "agent_message",
# and the expected decision. Cursor blocks a command when a permission hook prints invalid JSON or a
# reply that doesn't match the hook's schema.
# usage: bash scripts/test-cursor-hooks.sh
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GUARD="$ROOT/hooks/guard-shell.sh"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
fails=0

check() { # name expected-permission payload [env]
  local name="$1" want="$2" payload="$3" env="${4:-}" out
  out="$(printf '%s' "$payload" | env $env bash "$GUARD" 2>/dev/null)"
  if printf '%s' "$out" | python3 -I -c '
import json, sys
want = sys.argv[1]
d = json.loads(sys.stdin.read())
extra = set(d) - {"permission", "user_message", "agent_message"}
assert not extra, f"keys outside the schema: {sorted(extra)}"
assert d.get("permission") == want, "permission %r, wanted %r" % (d.get("permission"), want)
if want in ("deny", "ask"):
    assert d.get("user_message") and d.get("agent_message"), "a deny or ask reply needs user_message and agent_message"
' "$want" 2>"$TMP/err"; then
    printf 'PASS  %s\n' "$name"
  else
    printf 'FAIL  %s: %s\n      output: %s\n' "$name" "$(tail -1 "$TMP/err")" "$out"; fails=$((fails + 1))
  fi
}

check "plain command is allowed" allow '{"command": "ls -la", "cwd": "/tmp"}'
check "force-push to main is denied" deny '{"command": "git push --force origin main", "cwd": "/tmp"}'
check "observe mode allows and notes" allow '{"command": "git push --force origin main", "cwd": "/tmp"}' OMC_HOOKS_OBSERVE=1
check "reading an SSH key is held" ask '{"command": "cat ~/.ssh/id_rsa", "cwd": "/tmp"}'
check "observe mode allows a held read" allow '{"command": "cat ~/.ssh/id_rsa", "cwd": "/tmp"}' OMC_HOOKS_OBSERVE=1
check "unparseable payload is held" ask '{"command": broken'

# A commit whose staged code trips the anti-pattern check. The reason quotes the offending
# lines, so this proves quotes and backslashes are escaped.
git -C "$TMP" init -q && git -C "$TMP" config user.email t@t && git -C "$TMP" config user.name t
printf 'const x = y as any; // "quoted" \\ backslash\n' > "$TMP/a.ts" && git -C "$TMP" add a.ts
check "commit with anti-patterns is denied" deny "{\"command\": \"git commit -m test\", \"cwd\": \"$TMP\"}"
check "same commit in observe mode is allowed" allow "{\"command\": \"git commit -m test\", \"cwd\": \"$TMP\"}" OMC_HOOKS_OBSERVE=1

[ "$fails" -eq 0 ] && echo "all hook checks passed" || { echo "$fails hook check(s) failed"; exit 1; }
