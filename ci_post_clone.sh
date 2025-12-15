#!/bin/bash
set -euo pipefail

# Wrapper: keep compatibility no matter whether Xcode Cloud looks in repo root
# or under `ci_scripts/`.
exec "$(dirname "$0")/ci_scripts/ci_post_clone.sh"


