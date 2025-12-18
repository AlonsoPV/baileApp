#!/bin/bash
set -euo pipefail

# Wrapper para Xcode Cloud cuando el "Project directory" es `ios/`.
# Delegamos al script real en la raíz del repo.

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

exec bash ci_scripts/ci_pre_xcodebuild.sh


