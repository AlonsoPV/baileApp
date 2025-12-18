#!/bin/bash
set -euo pipefail

# Xcode Cloud Pre-xcodebuild wrapper.
# Delegates to the repo-maintained CI script so the workflow stays tiny.

cd "${CI_WORKSPACE:-/Volumes/workspace/repository}" 2>/dev/null || cd "$(dirname "$0")/../.." || pwd

exec bash ci_scripts/ci_pre_xcodebuild.sh


