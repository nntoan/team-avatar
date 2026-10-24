# check-sheet.sh's program. Run after sheet.awk with the decoded sheet as input.
{ sheet_add($0) }
END {
  problems = sheet_problems()
  if (problems != "") {
    print "sheet invalid: " problems
    exit 1
  }
  print "sheet ok"
}
