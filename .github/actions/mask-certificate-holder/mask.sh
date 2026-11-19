#!/usr/bin/env bash
set -uo pipefail

[ -n "$TEAM_ID" ] && echo "::add-mask::$TEAM_ID"

work=$(mktemp -d "$RUNNER_TEMP/mask-certificate-holder.XXXXXX")
trap 'rm -rf "$work"' EXIT

# Certificates of the bundle (OpenSSL 3 needs -legacy for older bundles), one PEM file each.
export PASSWORD
{
  openssl pkcs12 -in "$CERTIFICATE" -nokeys -passin env:PASSWORD 2> /dev/null ||
    openssl pkcs12 -legacy -in "$CERTIFICATE" -nokeys -passin env:PASSWORD 2> /dev/null
} | awk -v dir="$work" '
  /BEGIN CERTIFICATE/ { n++ }
  /BEGIN CERTIFICATE/, /END CERTIFICATE/ { print > (dir "/cert" n ".pem") }
'

# "Developer ID Application: Jane Doe (TEAM123456)" → "Jane Doe"
names=$(for pem in "$work"/cert*.pem; do
  [ -f "$pem" ] || continue
  openssl x509 -in "$pem" -noout -subject -nameopt multiline |
    sed -nE 's/^ *commonName *= [^:]+: (.+) \([A-Z0-9]+\)$/\1/p'
done | sort -u)

if [ -z "$names" ]; then
  echo "::warning::couldn't read the certificate holder's name, it may show in the logs"
  exit 0
fi

while IFS= read -r name; do echo "::add-mask::$name"; done <<< "$names"
echo "Masked $(grep -c . <<< "$names") certificate holder name(s)"
