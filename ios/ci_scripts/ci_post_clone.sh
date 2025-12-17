#!/bin/bash
set -euo pipefail

# Wrapper for Xcode Cloud setups where the "project/source directory" is `ios/`.
# Delegates to the repo-root script.
exec "$(dirname "$0")/../../ci_scripts/ci_post_clone.sh"


