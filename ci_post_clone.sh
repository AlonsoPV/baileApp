#!/bin/bash
set -euo pipefail

# Single entrypoint: keep post-clone logic in one place
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/ci_scripts/ci_post_clone.sh"
