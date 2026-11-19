#!/usr/bin/env bash
set -uo pipefail
# shellcheck source=../doctor-report/report.sh
. "$GITHUB_ACTION_PATH/../doctor-report/report.sh"

section "App Store Connect API key"
require KEY_ID ISSUER KEY || finish

work=$(mktemp -d "$RUNNER_TEMP/app-store-connect-key.XXXXXX")
trap 'rm -rf "$work"' EXIT
export KEY_FILE="$work/AuthKey_$KEY_ID.p8"

if grep -q 'BEGIN PRIVATE KEY' <<< "$KEY"; then
  printf '%s\n' "$KEY" > "$KEY_FILE"
else
  base64 --decode <<< "$KEY" > "$KEY_FILE" 2> /dev/null
fi

if ! token=$(node "$GITHUB_ACTION_PATH/jwt.mjs" 2> /dev/null); then
  fail "key isn't a valid .p8 private key"
  finish
fi
echo "::add-mask::$token"

url='https://api.appstoreconnect.apple.com/v1/apps?fields[apps]=bundleId&limit=200'
[ -n "$BUNDLE_ID" ] && url+="&filter[bundleId]=$BUNDLE_ID"
status=$(curl -sS -g -o "$work/apps.json" -w '%{http_code}' -H "Authorization: Bearer $token" "$url")

# Apple's own explanation, e.g. "A required agreement is missing or has expired."
apple_error() { node -p 'const e = require(process.argv[1]).errors?.[0]; e ? e.title + " " + e.detail : ""' "$work/apps.json" 2> /dev/null; }

case $status in
  200)
    pass "App Store Connect accepts the key"
    if [ -n "$BUNDLE_ID" ]; then
      if [ "$(node -p 'require(process.argv[1]).data.length' "$work/apps.json")" -gt 0 ]; then
        pass "can see the $BUNDLE_ID app"
      else
        fail "can't see an app for $BUNDLE_ID, create the app record or check the key's access"
      fi
    fi
    ;;
  401) fail "App Store Connect rejected the key, check key-id, issuer and key (or the key was revoked)" ;;
  403) fail "App Store Connect refused the request (expired agreement, or the key needs the App Manager role)" ;;
  *) fail "App Store Connect answered HTTP $status" ;;
esac
[ "$status" != 200 ] && info "Apple said: $(apple_error)"

if [ "$(uname)" = Darwin ]; then
  if notary=$(xcrun notarytool history --key "$KEY_FILE" --key-id "$KEY_ID" --issuer "$ISSUER" 2>&1); then
    pass "notarytool accepts the key, notarization can run"
  else
    fail "notarytool rejected the key, notarization will fail"
    info "notarytool said: $(grep -v '^ *$' <<< "$notary" | head -n 3 | tr '\n' ' ')"
  fi
fi

finish
