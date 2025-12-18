#!/bin/bash
set -euo pipefail

# Wrapper: some Xcode Cloud setups look for scripts in repo root.
exec "$(dirname "$0")/ci_scripts/ci_pre_xcodebuild.sh"


