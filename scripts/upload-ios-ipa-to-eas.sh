#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  pnpm upload:ios:ipa -- /path/to/app.ipa

If no path is provided, the script will try to find an IPA in:
  ./dist/*.ipa
  ./build/*.ipa

Auth:
  Uses your existing `eas login` session, or `EXPO_TOKEN` if set in env.
USAGE
}

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

IPA_PATH="${1:-}"
if [[ "${IPA_PATH:-}" == "-h" || "${IPA_PATH:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ -n "${IPA_PATH:-}" ]]; then
  # Expand relative path from repo root for convenience
  if [[ "$IPA_PATH" != /* ]]; then
    IPA_PATH="$REPO_ROOT/$IPA_PATH"
  fi
  if [[ ! -f "$IPA_PATH" ]]; then
    echo "ERROR: IPA file not found: $IPA_PATH" >&2
    exit 1
  fi
else
  shopt -s nullglob
  candidates=( "$REPO_ROOT"/dist/*.ipa "$REPO_ROOT"/build/*.ipa )
  shopt -u nullglob

  if [[ ${#candidates[@]} -eq 0 ]]; then
    echo "ERROR: No .ipa found. Provide a path, or place it under ./dist or ./build." >&2
    usage >&2
    exit 1
  fi

  # Pick the newest by mtime
  IPA_PATH="$(ls -t "${candidates[@]}" | head -n 1)"
  echo "==> Using newest IPA: $IPA_PATH"
fi

echo "==> Checking EAS CLI"
EAS_RUN=()

if command -v eas >/dev/null 2>&1; then
  EAS_RUN=(eas)
elif command -v pnpm >/dev/null 2>&1; then
  # Prefer local install if deps are installed; otherwise fall back to dlx.
  if [[ -d "$REPO_ROOT/node_modules" ]]; then
    EAS_RUN=(pnpm exec eas)
  else
    EAS_RUN=(pnpm dlx eas-cli)
  fi
elif command -v npx >/dev/null 2>&1; then
  EAS_RUN=(npx --yes eas-cli)
else
  echo "ERROR: Need one of: eas, pnpm, or npx available in PATH." >&2
  exit 1
fi

echo "==> EAS version"
("${EAS_RUN[@]}" --version) || true

echo "==> Uploading IPA to EAS (Included uploaded builds)"
set +e
UPLOAD_OUTPUT="$("${EAS_RUN[@]}" upload --platform ios --path "$IPA_PATH" --non-interactive 2>&1)"
UPLOAD_EXIT=$?
set -e

echo "$UPLOAD_OUTPUT"
if [[ $UPLOAD_EXIT -ne 0 ]]; then
  echo "ERROR: eas upload failed (exit $UPLOAD_EXIT)" >&2
  exit "$UPLOAD_EXIT"
fi

echo
echo "==> Upload summary (copy/paste friendly)"
echo "$UPLOAD_OUTPUT" | grep -E "Upload ID|upload id|uploadId|Uploaded|Build ID|ID:" || true

