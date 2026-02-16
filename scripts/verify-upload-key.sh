#!/usr/bin/env bash
# Prints SHA-1 of the given keystore alias and instructs to confirm it matches
# the upload key expected by Google Play.
# Usage: ./scripts/verify-upload-key.sh <keystore-path> [<alias>]
# Example: ./scripts/verify-upload-key.sh credentials/android/keystore.jks 726eebd78793f575a61aaf6a086b1825

set -euo pipefail

EXPECTED_SHA1="81:AE:12:4E:EA:D6:36:11:39:CB:4A:15:3E:AC:3D:C0:A8:FC:42:17"

KEYSTORE_PATH="${1:-}"
ALIAS="${2:-}"

if [[ -z "$KEYSTORE_PATH" ]]; then
  echo "Usage: $0 <keystore-path> [<alias>]"
  echo "  keystore-path  Path to .jks or .keystore file"
  echo "  alias         Key alias (if omitted, keytool -list will show all aliases)"
  exit 1
fi

if [[ ! -f "$KEYSTORE_PATH" ]]; then
  echo "Error: Keystore file not found: $KEYSTORE_PATH"
  exit 1
fi

echo "==> Keystore: $KEYSTORE_PATH"
echo "==> Alias: ${ALIAS:-<all>}"
echo ""

if [[ -n "$ALIAS" ]]; then
  echo "==> SHA-1 of alias '$ALIAS':"
  keytool -list -v -keystore "$KEYSTORE_PATH" -alias "$ALIAS" 2>/dev/null | grep -E "SHA1:|SHA256:" || true
  echo ""
  GOT=$(keytool -list -v -keystore "$KEYSTORE_PATH" -alias "$ALIAS" 2>/dev/null | grep "SHA1:" | sed 's/.*SHA1: *//' | tr -d ' \r')
  if [[ -n "$GOT" ]]; then
    if [[ "$GOT" == "$EXPECTED_SHA1" ]]; then
      echo "✅ SHA-1 matches the upload key expected by Google Play."
    else
      echo "⚠️  SHA-1 does NOT match the upload key expected by Google Play."
      echo "   Expected: $EXPECTED_SHA1"
      echo "   Got:      $GOT"
      echo "   To use this keystore for Play uploads, request an upload key reset in Play Console"
      echo "   and submit the .pem exported from this keystore."
    fi
  fi
else
  keytool -list -v -keystore "$KEYSTORE_PATH"
  echo ""
  echo "Confirm SHA-1 above equals: $EXPECTED_SHA1"
fi

echo ""
echo "Expected upload key SHA-1 (Play Console): $EXPECTED_SHA1"
