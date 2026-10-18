# show-sheet.sh's program. Run after sheet.awk with the decoded sheet as input.
{ sheet_add($0) }
END {
  n = sheet_effective()
  for (i = 1; i <= n; i++) print EFFECTIVE[i] ": " VALUE[EFFECTIVE[i]] " (" FROM[EFFECTIVE[i]] ")"
}
