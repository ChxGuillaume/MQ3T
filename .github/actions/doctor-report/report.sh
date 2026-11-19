# Shared helpers for the check-* actions. Source it, don't run it.
#
#   . "$GITHUB_ACTION_PATH/../doctor-report/report.sh"
#   section "Apple certificate"
#   pass "..." / warn "..." / fail "..." / info "..."
#   check_expiry "Developer ID Application" "$end_date" "$WARN_DAYS"
#   finish
#
# Every result is printed to the log and added to the job summary.
# fail marks the check as broken, finish then exits 1.
# warn only adds an annotation, the job stays green.

DOCTOR_FAILURES=0

_summary() { echo "$1" >> "${GITHUB_STEP_SUMMARY:-/dev/null}"; }

section() {
  echo "── $1"
  _summary ""
  _summary "### $1"
  _summary ""
  _summary "| | Check |"
  _summary "|---|---|"
}

pass() { echo "✅ $1"; _summary "| ✅ | $1 |"; }
info() { echo "ℹ️ $1"; _summary "| ℹ️ | $1 |"; }
warn() { echo "::warning::$1"; _summary "| ⚠️ | $1 |"; }
fail() { echo "::error::$1"; _summary "| ❌ | $1 |"; DOCTOR_FAILURES=$((DOCTOR_FAILURES + 1)); }

# Fails when any of the named environment variables is empty.
require() {
  local missing=0 name
  for name in "$@"; do
    if [ -z "${!name:-}" ]; then
      fail "input \`$(tr '[:upper:]_' '[:lower:]-' <<< "$name")\` is empty, is the secret set?"
      missing=1
    fi
  done
  return "$missing"
}

# Days from now until a date (ISO 8601 or OpenSSL's "Nov 19 12:00:00 2026 GMT").
days_until() {
  node -e 'const t = Date.parse(process.argv[1]); if (isNaN(t)) process.exit(1); console.log(Math.floor((t - Date.now()) / 864e5))' "$1"
}

# check_expiry <label> <end date> <warn days>
check_expiry() {
  local what=$1 end=$2 threshold=$3 days
  if ! days=$(days_until "$end"); then
    fail "$what: can't read the expiry date \"$end\""
  elif [ "$days" -lt 0 ]; then
    fail "$what expired on $end"
  elif [ "$days" -lt "$threshold" ]; then
    warn "$what expires in $days days ($end)"
  else
    pass "$what is valid for $days more days ($end)"
  fi
}

finish() {
  if [ "$DOCTOR_FAILURES" -gt 0 ]; then
    echo "$DOCTOR_FAILURES check(s) failed"
    exit 1
  fi
}
