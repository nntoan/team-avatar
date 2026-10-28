#!/usr/bin/env bash
# beforeShellExecution hook — guards the agent's shell calls.
#
# Reads a JSON payload on stdin (fields: command, cwd, hook_event_name, ...) and prints a
# JSON decision on stdout per Cursor's hook protocol:
#   {"permission": "allow|deny|ask", "user_message": "...", "agent_message": "..."}
# Cursor 3.27 blocks the command when a permission hook prints invalid JSON or keys outside that
# schema, so every message goes through json_str and only the documented keys are printed.
#
# Blocks (deny) clearly destructive commands and commits that contain the anti-patterns
# Team Avatar agents are told never to introduce.
#
# Robustness notes (learned from validation on Cursor 3.8.23):
#  - Cursor runs hooks with the GUI app's PATH, which often LACKS /opt/homebrew/bin, so we
#    cannot assume `python3` or `jq` are on PATH. We try jq, then python3 at known absolute
#    paths, then /usr/bin/perl (always present on macOS). If the payload can't be parsed we
#    return "ask" (surface) rather than silently allowing.
#  - We cd into the payload's `cwd` before running git checks so `git diff --cached` resolves
#    in the agent's actual worktree.
#  - Pair with "failClosed": true in hooks.json so a script error denies instead of allowing.
#
# Env switches:
#   OMC_HOOKS_OBSERVE=1  run non-blocking: downgrade every deny to allow + an informational note.
#   OMC_HOOKS_DEBUG=1    append each invocation's command to hooks/last-invocation.log (proves firing).

set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT="$(cat)"

# --- Robust JSON string-field extraction (no reliance on PATH) ---
json_field() {
  local field="$1" data="$2" out py
  if command -v jq >/dev/null 2>&1; then
    if out="$(printf '%s' "$data" | jq -r --arg f "$field" '.[$f] // empty' 2>/dev/null)"; then
      printf '%s' "$out"; return 0
    fi
  fi
  for py in python3 /opt/homebrew/bin/python3 /usr/local/bin/python3 /usr/bin/python3; do
    if "$py" -c '' >/dev/null 2>&1; then
      if out="$(printf '%s' "$data" | "$py" -c "import sys,json;print(json.load(sys.stdin).get('$field',''))" 2>/dev/null)"; then
        printf '%s' "$out"; return 0
      fi
    fi
  done
  if [ -x /usr/bin/perl ]; then
    printf '%s' "$data" | /usr/bin/perl -0777 -ne 'if(/"'"$field"'"\s*:\s*"((?:[^"\\]|\\.)*)"/s){my $x=$1;$x=~s/\\n/\n/g;$x=~s/\\t/\t/g;$x=~s/\\(.)/$1/g;print $x}' 2>/dev/null
    return 0
  fi
  return 1
}

COMMAND="$(json_field command "$INPUT")"; PARSE_RC=$?
CWD="$(json_field cwd "$INPUT")"

if [ "${OMC_HOOKS_DEBUG:-}" = "1" ]; then
  printf '%s\t%s\n' "$(date '+%FT%T' 2>/dev/null)" "${COMMAND:-<unparsed>}" >> "$HERE/last-invocation.log" 2>/dev/null || true
fi

# Escapes a value for a JSON string: backslashes and quotes, with control characters as spaces.
json_str() { printf '%s' "$1" | LC_ALL=C tr '\000-\037' ' ' | LC_ALL=C sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }
allow() { printf '{"permission": "allow"}\n'; exit 0; }
ask() { local m; m="$(json_str "$1")"; printf '{"permission": "ask", "user_message": "%s", "agent_message": "%s"}\n' "$m" "$m"; exit 0; }
decide() {
  local reason; reason="$(json_str "$1")"
  if [ "${OMC_HOOKS_OBSERVE:-}" = "1" ]; then
    printf '{"permission": "allow", "agent_message": "[observe] would block: %s"}\n' "$reason"
    exit 0
  fi
  printf '{"permission": "deny", "user_message": "Blocked by oh-my-cursor: %s", "agent_message": "Denied by policy: %s. Adjust hooks/guard-shell.sh or set OMC_HOOKS_OBSERVE=1 to override."}\n' "$reason" "$reason"
  exit 0
}
# Surface for human approval (deterministic "hold for review"). Used where the auto-review
# classifier is unreliable, e.g. reading credential/secret files.
hold() {
  local reason; reason="$(json_str "$1")"
  if [ "${OMC_HOOKS_OBSERVE:-}" = "1" ]; then
    printf '{"permission": "allow", "agent_message": "[observe] would hold for review: %s"}\n' "$reason"
    exit 0
  fi
  printf '{"permission": "ask", "user_message": "Held by oh-my-cursor for review: %s", "agent_message": "Held for review: %s. Approve only if this credential/secret access is intended."}\n' "$reason" "$reason"
  exit 0
}

# Received a payload but couldn't parse the command -> surface instead of silently allowing.
if [ -n "$INPUT" ] && { [ "$PARSE_RC" -ne 0 ] || { [ -z "$COMMAND" ] && printf '%s' "$INPUT" | grep -q '"command"'; }; }; then
  [ "${OMC_HOOKS_OBSERVE:-}" = "1" ] && allow
  ask "oh-my-cursor guard could not parse the shell command; review before running"
fi

[ -z "$COMMAND" ] && allow

# Resolve git checks in the agent's real worktree. A plugin hook starts in the plugin's folder, and
# Cursor 3.27 sends an empty cwd when the shell call names no directory, so fall back to the
# workspace root.
for dir in "$CWD" "${CURSOR_PROJECT_DIR:-}"; do
  if [ -n "$dir" ] && [ -d "$dir" ] && cd "$dir" 2>/dev/null; then break; fi
done

# --- Destructive command denylist (unambiguous, always guarded) ---
case "$COMMAND" in
  *"rm -rf /"*|*"rm -rf ~"*|*"rm -rf /*"*|*":(){ :|:& };:"*) decide "destructive filesystem command" ;;
  *"git push"*"--force"*"main"*|*"git push"*"--force"*"master"*|*"git push -f"*"main"*|*"git push -f"*"master"*) decide "force-push to a protected branch" ;;
  *"git reset --hard origin/main"*|*"git reset --hard origin/master"*) decide "hard reset of a shared branch" ;;
  *"chmod -R 777 /"*|*"mkfs"*|*"dd if="*"of=/dev/"*) decide "system-level destructive command" ;;
esac

# --- Commit anti-pattern guard ---
# The check reads what is staged before the command runs, so a command that also stages files
# would commit changes the check never saw.

# Prints the pathspecs of a `git commit <paths>` command, one per line. A `git commit <file>`
# records the working-tree contents of the named files even when nothing is staged, so the
# index check alone misses anti-patterns there. Option values (-m, -F, --author, ...) are not
# paths. Best-effort: quotes are honored, nothing is eval'd, and only existing paths print.
commit_pathspecs() {
  local cmd="$1" word="" in_s=0 in_d=0 esc=0 i ch w
  local -a words=()
  for ((i = 0; i < ${#cmd}; i++)); do
    ch="${cmd:$i:1}"
    if [ "$esc" -eq 1 ]; then word="${word}${ch}"; esc=0; continue; fi
    if [ "$in_s" -eq 1 ]; then
      if [ "$ch" = "'" ]; then in_s=0; else word="${word}${ch}"; fi
      continue
    fi
    if [ "$in_d" -eq 1 ]; then
      if [ "$ch" = '"' ]; then in_d=0; elif [ "$ch" = "\\" ]; then esc=1; else word="${word}${ch}"; fi
      continue
    fi
    case "$ch" in
      "'") in_s=1 ;;
      '"') in_d=1 ;;
      "\\") esc=1 ;;
      [[:space:]]) if [ -n "$word" ]; then words+=("$word"); word=""; fi ;;
      *) word="${word}${ch}" ;;
    esac
  done
  if [ -n "$word" ]; then words+=("$word"); fi

  local seen_git=0 seen_commit=0 after_dd=0 skip_next=0 n=${#words[@]}
  for ((i = 0; i < n; i++)); do
    w="${words[$i]}"
    if [ "$seen_commit" -eq 0 ]; then
      if [ "$seen_git" -eq 0 ]; then
        [ "$w" = "git" ] && seen_git=1
      elif [ "$w" = "commit" ]; then
        seen_commit=1
      fi
      continue
    fi
    if [ "$skip_next" -eq 1 ]; then skip_next=0; continue; fi
    if [ "$after_dd" -eq 0 ]; then
      case "$w" in
        --) after_dd=1; continue ;;
        # Options whose value is the next token: the value is not a pathspec.
        -m|--message|-F|--file|--author|--date|-c|--reedit-message|-C|--reuse-message|-t|--template|--cleanup|-S|--gpg-sign|--fixup|--squash|-u|--untracked-files)
          skip_next=1; continue ;;
        --*=*) continue ;;            # --author="A U Thor" and friends
        -[mFcCtSu]?*) continue ;;     # attached values: -m"msg", -uno, ...
        -*) continue ;;               # valueless flags: -n, -s, -e, -q, -v, --amend, ...
      esac
    fi
    [ -e "$w" ] && printf '%s\n' "$w"
  done
}

case "$COMMAND" in
  *"git commit"*)
    if [[ "$COMMAND" == *"git add"* || "$COMMAND" == *"git stage"* ]] ||
      [[ "$COMMAND" =~ git[[:space:]]+commit.*[[:space:]](-[A-Za-z]*a[A-Za-z]*|--all)([[:space:]]|$) ]]; then
      decide "commit in the same command that stages files; run git add first, then git commit in a separate command"
    fi
    if [ -x "$HERE/pre-commit-check.sh" ]; then
      COMMIT_PATHS="$(commit_pathspecs "$COMMAND")"
      CHECK_INDEX=1
      # -i/--include commits the index on top of the named files, so check both then.
      if [ -n "$COMMIT_PATHS" ] && ! [[ "$COMMAND" =~ git[[:space:]]+commit.*[[:space:]](-[A-Za-z]*i[A-Za-z]*|--include)([[:space:]]|$) ]]; then
        CHECK_INDEX=0
      fi
      if [ -n "$COMMIT_PATHS" ]; then
        PATH_ARGS=()
        while IFS= read -r p; do
          [ -n "$p" ] && PATH_ARGS+=("$p")
        done <<< "$COMMIT_PATHS"
        if ! OUT="$("$HERE/pre-commit-check.sh" ${PATH_ARGS[@]+"${PATH_ARGS[@]}"} 2>&1)"; then
          decide "commit contains forbidden anti-patterns ($(printf '%s' "$OUT" | tr '\n' ' ' | cut -c1-160))"
        fi
      fi
      if [ "$CHECK_INDEX" -eq 1 ]; then
        if ! OUT="$("$HERE/pre-commit-check.sh" 2>&1)"; then
          decide "commit contains forbidden anti-patterns ($(printf '%s' "$OUT" | tr '\n' ' ' | cut -c1-160))"
        fi
      fi
    fi
    ;;
esac

# --- Credential / secret access guard (hold for review) ---
# The permissions.json auto-review classifier is best-effort and let `cat ~/.ssh/config`
# through during E2E test C2, so enforce a deterministic hold here regardless of the classifier.
case "$COMMAND" in
  *"/.ssh/"*|*"/.aws/"*|*"/.gnupg/"*|*"id_rsa"*|*"id_dsa"*|*"id_ecdsa"*|*"id_ed25519"*|*".pem"*|*".netrc"*|*".pgpass"*|*"/.kube/config"*|*"kubeconfig"*|*"/.docker/config.json"*|*"/.config/gcloud/"*|*".aws/credentials"*)
    hold "command accesses a credential/secret file" ;;
esac

allow
