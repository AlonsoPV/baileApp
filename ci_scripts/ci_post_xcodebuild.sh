#!/bin/bash
set -euo pipefail

echo "==> Xcode Cloud post-xcodebuild diagnostics"

cd "$(dirname "$0")/.."

export LANG="${LANG:-en_US.UTF-8}"
export LC_ALL="${LC_ALL:-en_US.UTF-8}"

echo "==> Repo root: $(pwd)"
echo "==> CI_XCODEBUILD_ACTION: ${CI_XCODEBUILD_ACTION:-<unset>}"
echo "==> CI_ARCHIVE_PATH: ${CI_ARCHIVE_PATH:-<unset>}"
echo "==> CI_RESULT_BUNDLE_PATH: ${CI_RESULT_BUNDLE_PATH:-<unset>}"

echo "==> ios/ listing (top-level)"
ls -la ios || true

echo "==> If build failed, dump xcresult issues (high-signal)"
if [ -n "${CI_RESULT_BUNDLE_PATH:-}" ] && [ -d "${CI_RESULT_BUNDLE_PATH:-}" ]; then
  echo "==> CI_RESULT_BUNDLE_PATH exists: ${CI_RESULT_BUNDLE_PATH}"
  echo "==> Extracting build errors/warnings from xcresult..."
  set +e
  xcrun xcresulttool get --format json --path "${CI_RESULT_BUNDLE_PATH}" > /tmp/xcresult.json 2>/dev/null
  XCRES=$?
  set -e
  if [ "$XCRES" -ne 0 ]; then
    echo "WARN: xcresulttool failed (code=$XCRES)."
  else
    python3 - <<'PY'
import json, sys

path = "/tmp/xcresult.json"
with open(path, "r", encoding="utf-8") as f:
  data = json.load(f)

def walk(obj):
  if isinstance(obj, dict):
    for k, v in obj.items():
      yield (k, v)
      yield from walk(v)
  elif isinstance(obj, list):
    for it in obj:
      yield from walk(it)

def val(x):
  if isinstance(x, dict) and "_value" in x:
    return x["_value"]
  return x

errors = []
warnings = []

for k, v in walk(data):
  if k in ("errorSummaries", "warningSummaries"):
    items = val(v) or []
    if isinstance(items, list):
      for it in items:
        itv = val(it)
        if isinstance(itv, dict):
          msg = val(itv.get("message")) or ""
          doc = val(itv.get("documentLocationInCreatingWorkspace")) or {}
          url = val(doc.get("url")) if isinstance(doc, dict) else ""
          line = val(doc.get("startingLineNumber")) if isinstance(doc, dict) else ""
          col = val(doc.get("startingColumnNumber")) if isinstance(doc, dict) else ""
          entry = f"{msg} [{url}:{line}:{col}]".strip()
          if k == "errorSummaries":
            errors.append(entry)
          else:
            warnings.append(entry)

print("=== xcresult: errors ===")
for e in errors[:200]:
  print("-", e)
if len(errors) > 200:
  print(f"... ({len(errors)-200} more)")

print("=== xcresult: warnings (first 50) ===")
for w in warnings[:50]:
  print("-", w)
if len(warnings) > 50:
  print(f"... ({len(warnings)-50} more)")
PY
  fi
else
  echo "==> CI_RESULT_BUNDLE_PATH missing/unavailable; skipping xcresult dump."
fi

echo "==> Done (post-xcodebuild)"


