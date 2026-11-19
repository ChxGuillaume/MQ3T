#!/usr/bin/env bash
set -uo pipefail
# shellcheck source=../doctor-report/report.sh
. "$GITHUB_ACTION_PATH/../doctor-report/report.sh"

section "Snap Store credentials"
require CREDENTIALS || finish
export SNAPCRAFT_STORE_CREDENTIALS=$CREDENTIALS

# Prints email, username, id, permissions, channels, packages and expires, one per line.
if ! whoami=$(snapcraft whoami 2>&1); then
  fail "Snap Store rejected the credentials, run \`snapcraft export-login\` again"
  info "snapcraft said: $(grep -v '^ *$' <<< "$whoami" | head -n 3 | tr '\n' ' ')"
  finish
fi
field() { sed -n "s/^$1: *//p" <<< "$whoami"; }

pass "Snap Store accepts the credentials"
check_expiry "login" "$(field expires)" "$WARN_DAYS"

permissions=$(field permissions)
for permission in package_push package_release; do
  if grep -qw "$permission" <<< "$permissions"; then
    pass "has the $permission permission"
  else
    fail "lacks the $permission permission, \`snapcraft upload --release\` will fail"
  fi
done

if [ -n "$SNAP_NAME" ]; then
  if snapcraft status "$SNAP_NAME" > /dev/null 2>&1; then
    pass "can reach the $SNAP_NAME snap"
  else
    fail "can't reach the $SNAP_NAME snap, the login may be restricted to other packages"
  fi
fi

finish
