# iOS Build Configuration

## `.xcode.env` File

### Purpose

The `ios/.xcode.env` file is used by React Native and CocoaPods build scripts to locate the Node.js executable. This file is **required** for Archive builds to succeed.

### Location

- **Path**: `ios/.xcode.env`
- **Versioned**: Yes (committed to repository)
- **Local Override**: `ios/.xcode.env.local` (optional, not versioned)

### Content

The file exports `NODE_BINARY` with the path to the Node.js executable, including fallbacks for Xcode environments that don't load shell profiles:

```bash
export NODE_BINARY="$(command -v node)"

# Fallbacks for Xcode environments that don't load shell profiles (nvm/zshrc)
if [ -z "$NODE_BINARY" ]; then
  for CAND in \
    /opt/homebrew/bin/node \
    /usr/local/bin/node \
    /usr/bin/node \
    /bin/node
  do
    if [ -x "$CAND" ]; then
      NODE_BINARY="$CAND"
      break
    fi
  done
fi

# Optional: add common PATH locations then retry
if [ -z "$NODE_BINARY" ]; then
  export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
  NODE_BINARY="$(command -v node)"
fi

# Final validation: ensure NODE_BINARY is not empty
if [ -z "$NODE_BINARY" ]; then
  echo "ERROR: NODE_BINARY is empty. Node not found in PATH." >&2
  echo "PATH=$PATH" >&2
  exit 1
fi

# Additional validation: ensure the binary exists and is executable
if [ ! -x "$NODE_BINARY" ]; then
  echo "ERROR: NODE_BINARY is not executable: $NODE_BINARY" >&2
  exit 1
fi

export NODE_BINARY
```

### Why It Exists

1. **React Native Requirement**: React Native build scripts (especially "Bundle React Native code and images") require `NODE_BINARY` to be set.
2. **CocoaPods Scripts**: Some CocoaPods scripts (e.g., `hermes-engine`, `React-runtimescheduler`) use Node.js and need `NODE_BINARY` defined.
3. **Xcode Cloud Compatibility**: In CI environments, Node.js may not be in the default PATH, so we need an explicit path.
4. **Archive Builds**: Archive requires `NODE_BINARY`; Xcode may not load shell PATH (nvm/zshrc), so we resolve node via `.xcode.env` with fallbacks to common locations.

### How It's Generated

#### Local Development

The file is committed to the repository. If you need to regenerate it:

```bash
cd ios
echo 'export NODE_BINARY="$(command -v node)"' > .xcode.env
# Add validation (see content above)
```

#### CI (Xcode Cloud)

The file is automatically generated in `ci_scripts/ci_post_clone.sh` after Node.js is installed. This ensures:

1. Node.js is available (via `ensure_node.sh`)
2. `.xcode.env` is created with the correct path
3. The file is validated before the build starts

### Troubleshooting

#### Error: "You need to configure your node path in the `.xcode.env` file"

**Cause**: `NODE_BINARY` is not set or is empty.

**Solution**:
1. Verify Node.js is installed: `command -v node`
2. Regenerate `.xcode.env`: `cd ios && echo 'export NODE_BINARY="$(command -v node)"' > .xcode.env`
3. Ensure the file has validation (see Content section above)

#### Error: "Script-*.sh: line X: : command not found"

**Cause**: A build script is trying to use `NODE_BINARY` but it's empty or undefined.

**Solution**:
1. Verify `.xcode.env` exists and has content
2. Check that the script sources `.xcode.env` before using `NODE_BINARY`
3. Run `pod install` to regenerate CocoaPods scripts (they should be patched to load `.xcode.env`)

#### Error: "PhaseScriptExecution failed with a nonzero exit code"

**Cause**: A build phase script failed. Check the build logs to identify which script.

**Solution**:
1. Look for the script name in the error message (e.g., "Bundle React Native code and images", "Generate Hermes dSYM")
2. Verify `NODE_BINARY` is defined: Add `echo "NODE_BINARY=$NODE_BINARY"` to the failing script
3. Check that Node.js is accessible: `"$NODE_BINARY" --version`

### Related Files

- `ios/.xcode.env.local` - Local overrides (not versioned, optional)
- `ci_scripts/ci_post_clone.sh` - Generates `.xcode.env` in CI
- `ios/Podfile` - Patches CocoaPods scripts to load `.xcode.env`
- `ios/DondeBailarMX.xcodeproj/project.pbxproj` - Contains build phase scripts that use `NODE_BINARY`

### Notes

- The file uses `$(command -v node)` to dynamically resolve Node.js path, ensuring it works in both local and CI environments.
- Validation is included to fail fast with clear error messages instead of silent failures.
- The file is versioned to ensure consistency across team members and CI.

### Archive Builds and app.config.ts

**Important**: Archive evaluates `app.config.ts` during the build process. To avoid initialization errors:

1. **Avoid Temporal Dead Zone (TDZ)**: Functions used in `app.config.ts` must be declared before their first use. Use `function` declarations (hoisted) instead of `const` arrow functions when possible.

2. **Avoid Circular Imports**: Ensure `app.config.ts` doesn't import modules that themselves import Expo config, as this can cause initialization order issues.

3. **NODE_ENV**: The build phase script "Bundle React Native code and images" sets `NODE_ENV` automatically:
   - `NODE_ENV=development` for Debug builds
   - `NODE_ENV=production` for Release/Archive builds
   
   This ensures Expo config evaluation has the expected environment variable.
