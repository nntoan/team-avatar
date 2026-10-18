# Reads and checks an avatar-setup sheet. Shared by check-sheet.sh and
# show-sheet.sh. POSIX awk, run under LC_ALL=C, with the sheet already decoded
# by read-sheet.sh.

# Fills keys[1..n] with the sheet's lines in sheet order, DEFAULT[key] with
# each default value, and PANEL[key] for the list lines. Fills SHEET_EFFORT
# with the reasoning effort levels. Returns n.
function sheet_keys(keys,    n) {
  split("", keys)
  split("", DEFAULT)
  split("", PANEL)
  split("", SHEET_EFFORT)
  n = 0
  keys[++n] = "aang";           DEFAULT["aang"] = "inherit"
  keys[++n] = "sokka";          DEFAULT["sokka"] = "opus"
  keys[++n] = "toph";           DEFAULT["toph"] = "sonnet"
  keys[++n] = "toph review";    DEFAULT["toph review"] = "opus"
  keys[++n] = "katara";         DEFAULT["katara"] = "opus"
  keys[++n] = "zuko";           DEFAULT["zuko"] = "opus"
  keys[++n] = "iroh";           DEFAULT["iroh"] = "opus"
  keys[++n] = "appa";           DEFAULT["appa"] = "sonnet"
  keys[++n] = "momo";           DEFAULT["momo"] = "haiku"
  keys[++n] = "suki";           DEFAULT["suki"] = "opus"
  keys[++n] = "strongest";      DEFAULT["strongest"] = "fable"
  keys[++n] = "panel";          DEFAULT["panel"] = "opus, fable, sonnet, haiku"
  keys[++n] = "default effort"; DEFAULT["default effort"] = "session"
  keys[++n] = "session hook";   DEFAULT["session hook"] = "on"
  PANEL["panel"] = 1
  SHEET_EFFORT["low"] = 1
  SHEET_EFFORT["medium"] = 1
  SHEET_EFFORT["high"] = 1
  SHEET_EFFORT["xhigh"] = 1
  SHEET_EFFORT["max"] = 1
  return n
}

function sheet_add(line) {
  SHEET[++SHEET_N] = line
}

function sheet_trim(s) {
  sub(/^[ \t]+/, "", s)
  sub(/[ \t]+$/, "", s)
  return s
}

# The key of `key: value` at the start of a line, or "" for any other line.
function sheet_key(line) {
  return line ~ /^[^ \t#]/ && index(line, ":") ? sheet_trim(substr(line, 1, index(line, ":") - 1)) : ""
}

function sheet_value(line) {
  return sheet_trim(substr(line, index(line, ":") + 1))
}

# Checks one model entry, as in `opus` or `opus @high`. Returns "" when it is
# well formed, or a short problem. Quotes no sheet text, so a caller can print
# the result into a session safely.
function sheet_entry_problem(e,    level) {
  if (match(e, /[ \t]+@[a-z]+$/)) {
    level = substr(e, RSTART)
    sub(/^[ \t]+@/, "", level)
    if (!(level in SHEET_EFFORT)) return "an effort that is not a level"
    e = substr(e, 1, RSTART - 1)
  }
  if (e == "") return "an empty entry"
  if (e == "inherit") return ""
  if (e !~ /^[a-z0-9][a-z0-9.-]*$/) return "an entry that is not a model name"
  return ""
}

# Parses SHEET into VALUE[key] (the last line wins) and returns what is wrong
# as "; "-separated problems, or "" when the sheet is complete and well formed.
function sheet_problems(    keys, n, i, key, out, E, m, j, p) {
  n = sheet_keys(keys)
  split("", VALUE)
  for (i = 1; i <= SHEET_N; i++) {
    key = sheet_key(SHEET[i])
    if (key in DEFAULT) VALUE[key] = sheet_value(SHEET[i])
  }
  out = ""
  for (i = 1; i <= n; i++) {
    key = keys[i]
    if (!(key in VALUE)) { out = out "; missing line `" key "`"; continue }
    if (key == "session hook") {
      if (VALUE[key] != "on" && VALUE[key] != "off") out = out "; `session hook` is not on or off"
      continue
    }
    if (key == "default effort") {
      if (VALUE[key] != "session" && !(VALUE[key] in SHEET_EFFORT)) out = out "; `default effort` is not session or a level"
      continue
    }
    m = split(VALUE[key], E, ",")
    if (m == 0) { out = out "; no model in `" key "`"; continue }
    if (!(key in PANEL) && m > 1) { out = out "; `" key "` names more than one model"; continue }
    if ((key in PANEL) && m < 2) out = out "; `" key "` needs at least two entries"
    for (j = 1; j <= m; j++) {
      p = sheet_entry_problem(sheet_trim(E[j]))
      if (p != "") out = out "; `" key "` has " p
    }
  }
  return substr(out, 3)
}

# Fills VALUE with the sheet's lines and DEFAULT for every line the sheet
# lacks. FROM[key] is "sheet" or "default".
function sheet_effective(    keys, n, i, key) {
  n = sheet_keys(keys)
  split("", VALUE)
  split("", FROM)
  for (i = 1; i <= SHEET_N; i++) {
    key = sheet_key(SHEET[i])
    if (key in DEFAULT) { VALUE[key] = sheet_value(SHEET[i]); FROM[key] = "sheet" }
  }
  for (i = 1; i <= n; i++) {
    key = keys[i]
    if (!(key in VALUE)) { VALUE[key] = DEFAULT[key]; FROM[key] = "default" }
    EFFECTIVE[i] = key
  }
  return n
}
