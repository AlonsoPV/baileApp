#!/bin/bash
set -euo pipefail

# Ensure Node.js + npm exist in CI (Xcode Cloud images may not include them).
# Strategy:
# 1) If node is present, do nothing.
# 2) If brew is available, install node.
# 3) Fallback: download an official Node tarball into $HOME/.local/node and prepend PATH.

echo "==> Ensuring Node.js is available"

if command -v node >/dev/null 2>&1; then
  echo "Node already present: $(command -v node)"
  node -v || true
  npm -v || true
  exit 0
fi

if command -v brew >/dev/null 2>&1; then
  echo "brew found: $(command -v brew)"
  echo "Installing node via brew..."
  brew install node
  echo "Node installed: $(command -v node || true)"
  node -v || true
  npm -v || true
  exit 0
fi

NODE_VERSION="${NODE_VERSION:-20.11.1}"
ARCH="$(uname -m)"
case "$ARCH" in
  arm64) NODE_ARCH="arm64" ;;
  x86_64) NODE_ARCH="x64" ;;
  *)
    echo "ERROR: Unsupported architecture for Node download: $ARCH"
    exit 1
    ;;
esac

DEST="$HOME/.local/node-v${NODE_VERSION}-darwin-${NODE_ARCH}"
TARBALL="node-v${NODE_VERSION}-darwin-${NODE_ARCH}.tar.gz"
URL="https://nodejs.org/dist/v${NODE_VERSION}/${TARBALL}"

echo "Downloading Node ${NODE_VERSION} (${NODE_ARCH}) from ${URL}"
mkdir -p "$HOME/.local"
curl -fsSL "$URL" -o "$HOME/.local/$TARBALL"
tar -xzf "$HOME/.local/$TARBALL" -C "$HOME/.local"
rm -f "$HOME/.local/$TARBALL"

# The tar expands into "$HOME/.local/node-vX.Y.Z-darwin-ARCH"
export PATH="$DEST/bin:$PATH"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node install succeeded but node is still not on PATH."
  echo "PATH=$PATH"
  ls -la "$DEST" || true
  exit 1
fi

echo "Node installed: $(command -v node)"
node -v || true
npm -v || true


