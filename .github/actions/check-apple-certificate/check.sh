#!/usr/bin/env bash
set -uo pipefail
# shellcheck source=../doctor-report/report.sh
. "$GITHUB_ACTION_PATH/../doctor-report/report.sh"

section "Apple certificate"
require CERTIFICATE PASSWORD IDENTITIES || finish

work=$(mktemp -d "$RUNNER_TEMP/apple-certificate.XXXXXX")
keychain="$work/doctor.keychain-db"
cleanup() { security delete-keychain "$keychain" 2> /dev/null; rm -rf "$work"; }
trap cleanup EXIT

if ! base64 --decode <<< "$CERTIFICATE" > "$work/bundle.p12" 2> /dev/null; then
  fail "certificate isn't valid base64"
  finish
fi

keychain_password=$(openssl rand -hex 16)
security create-keychain -p "$keychain_password" "$keychain"
security unlock-keychain -p "$keychain_password" "$keychain"
if security import "$work/bundle.p12" -k "$keychain" -P "$PASSWORD" -A > /dev/null; then
  pass "bundle opens with the password"
else
  fail "bundle can't be imported, the password is wrong or it isn't a .p12 file"
  finish
fi

# Lines look like: 1) 0123ABCD... "Developer ID Application: Jane Doe (TEAM123456)" (optional trust status)
# Only the part before ":" is printed, the holder's name stays out of the public logs.
found=$(security find-identity "$keychain" | awk '/^ *[0-9]+\) [0-9A-F]{40} "/' | sort -u)
if [ -z "$found" ]; then
  fail "bundle holds no signing identity (certificate with its private key)"
  finish
fi

# One PEM file per certificate, named after its SHA-1, to read the expiry dates.
security find-certificate -a -Z -p "$keychain" | awk -v dir="$work" '
  /^SHA-1 hash:/ { file = dir "/" $3 ".pem" }
  /BEGIN CERTIFICATE/, /END CERTIFICATE/ { print > file }
'

trim() { sed -E 's/^[[:space:]]+|[[:space:]]+$//g'; }
names=$(sed -E 's/^[^"]*"([^"]*)".*$/\1/' <<< "$found")
expected_list=$(trim <<< "$IDENTITIES" | sed '/^$/d')

while IFS= read -r expected; do
  line=$(grep -F "\"$expected" <<< "$found" | head -n 1)
  if [ -z "$line" ]; then
    fail "no \"$expected\" identity in the bundle"
    continue
  fi

  hash=$(awk '{ print $2 }' <<< "$line")
  pass "has the \"$expected\" identity"

  pem="$work/$hash.pem"
  check_expiry "\"$expected\"" "$(openssl x509 -in "$pem" -noout -enddate | cut -d= -f2)" "$WARN_DAYS"

  if [ -n "$TEAM_ID" ]; then
    subject=$(openssl x509 -in "$pem" -noout -subject -nameopt RFC2253)
    if grep -qF "OU=$TEAM_ID" <<< "$subject"; then
      pass "\"$expected\" belongs to the team"
    else
      fail "\"$expected\" doesn't belong to team-id"
    fi
  fi
done <<< "$expected_list"

while IFS= read -r name; do
  matched=''
  while IFS= read -r expected; do
    [[ $name == "$expected"* ]] && matched=yes
  done <<< "$expected_list"
  [ -z "$matched" ] && info "also holds the \"${name%%:*}\" identity (not checked)"
done <<< "$names"

finish
