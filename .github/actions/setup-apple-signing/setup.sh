#!/usr/bin/env bash
set -euo pipefail

# Signing certificates, electron-builder reads CSC_LINK and CSC_KEY_PASSWORD.
certificate="$RUNNER_TEMP/apple-certificates.p12"
base64 --decode <<< "$CERTIFICATE" > "$certificate"
{
  echo "CSC_LINK=$certificate"
  echo "CSC_KEY_PASSWORD=$PASSWORD"
} >> "$GITHUB_ENV"

# API key for notarization (electron-builder) and App Store uploads (altool looks in ~/private_keys).
mkdir -p ~/private_keys
key=~/private_keys/AuthKey_$API_KEY_ID.p8
base64 --decode <<< "$API_KEY" > "$key"
{
  echo "APPLE_API_KEY=$key"
  echo "APPLE_API_KEY_ID=$API_KEY_ID"
  echo "APPLE_API_ISSUER=$API_ISSUER"
} >> "$GITHUB_ENV"

if [ -n "$PROFILE" ]; then
  base64 --decode <<< "$PROFILE" > "$PROFILE_PATH"
fi

echo "Signing certificates, API key${PROFILE:+ and provisioning profile} installed"
