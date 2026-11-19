#!/usr/bin/env bash
set -uo pipefail
# shellcheck source=../doctor-report/report.sh
. "$GITHUB_ACTION_PATH/../doctor-report/report.sh"

section "$LABEL"
require PROFILE BUNDLE_ID || finish

work=$(mktemp -d "$RUNNER_TEMP/provisioning-profile.XXXXXX")
trap 'rm -rf "$work"' EXIT
plist="$work/profile.plist"

if ! base64 --decode <<< "$PROFILE" | security cms -D > "$plist" 2> /dev/null || [ ! -s "$plist" ]; then
  fail "profile isn't a base64 encoded provisioning profile"
  finish
fi

read_key() { plutil -extract "$1" raw -o - "$plist" 2> /dev/null; }
read_entitlement() { /usr/libexec/PlistBuddy -c "Print :Entitlements:$1" "$plist" 2> /dev/null; }
sha1_of() { openssl x509 -noout -fingerprint -sha1 "$@" | cut -d= -f2 | tr -d ':'; }

info "\"$(read_key Name)\""
check_expiry "profile" "$(read_key ExpirationDate)" "$WARN_DAYS"

team=$(read_key TeamIdentifier.0)
if [ -n "$TEAM_ID" ]; then
  if [ "$team" = "$TEAM_ID" ]; then
    pass "belongs to the team"
  else
    fail "belongs to another team than team-id"
  fi
fi

# macOS profiles use com.apple.application-identifier, iOS ones application-identifier.
app_id=$(read_entitlement com.apple.application-identifier || read_entitlement application-identifier)
case $app_id in
  "$team.$BUNDLE_ID") pass "is for $BUNDLE_ID" ;;
  "$team.*") pass "is a wildcard profile, it covers $BUNDLE_ID" ;;
  *) fail "is for \"${app_id#"$team".}\", not $BUNDLE_ID" ;;
esac

if [ -n "$CERTIFICATE" ]; then
  # SHA-1 of every certificate in the .p12 (OpenSSL 3 needs -legacy for older bundles).
  base64 --decode <<< "$CERTIFICATE" > "$work/bundle.p12"
  export PASSWORD
  certs=$(openssl pkcs12 -in "$work/bundle.p12" -nokeys -passin env:PASSWORD 2> /dev/null ||
    openssl pkcs12 -legacy -in "$work/bundle.p12" -nokeys -passin env:PASSWORD 2> /dev/null)
  awk -v dir="$work" '
    /BEGIN CERTIFICATE/ { n++ }
    /BEGIN CERTIFICATE/, /END CERTIFICATE/ { print > (dir "/cert" n ".pem") }
  ' <<< "$certs"
  bundle_sha1s=$(for pem in "$work"/cert*.pem; do [ -f "$pem" ] && sha1_of -in "$pem"; done)

  if [ -z "$bundle_sha1s" ]; then
    fail "can't read the certificate bundle, check the certificate and password inputs"
  else
    included=''
    i=0
    while der=$(read_key "DeveloperCertificates.$i"); do
      sha1=$(base64 --decode <<< "$der" | sha1_of -inform der)
      grep -qx "$sha1" <<< "$bundle_sha1s" && included=yes
      i=$((i + 1))
    done
    if [ -n "$included" ]; then
      pass "includes a certificate from the bundle"
    else
      fail "includes none of the bundle's certificates, regenerate the profile with the current certificate"
    fi
  fi
fi

finish
