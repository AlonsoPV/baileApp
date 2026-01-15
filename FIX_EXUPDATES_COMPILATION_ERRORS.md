# Fix: EXUpdates Compilation Errors - StartupProcedure Not Found

## Error Description

**Issue:** 5 compilation errors in `EXUpdates` / `EnabledAppController`:
- "Cannot find type 'StartupProcedureDelegate' in scope" (1 instance)
- "Cannot find type 'StartupProcedure' in scope" (4 instances)

## Root Cause

The `StartupProcedure` and `StartupProcedureDelegate` types are part of `expo-updates@29.0.15`, but they're not being found by `EnabledAppController`. This typically happens when:

1. Pods are out of sync with the installed npm packages
2. Xcode cache is stale
3. Pods need to be reinstalled after dependency changes

## Solution

### Option 1: Clean and Reinstall Pods (Recommended)

**On macOS (if you have access):**

```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
```

**Or via EAS Build (if building in cloud):**

The build process should handle this automatically, but you can ensure it by:

1. **Clean build cache in EAS:**
   ```bash
   eas build --platform ios --profile production --clear-cache
   ```

2. **Or ensure pods are reinstalled** - Check that `ci_scripts/ensure_pods.sh` runs `pod install`

### Option 2: Verify expo-updates Version

**Check version consistency:**

```bash
# Verify package.json has:
"expo-updates": "^29.0.16"

# Verify Podfile.lock has:
EXUpdates (29.0.15)
```

**Note:** Minor version differences (29.0.15 vs 29.0.16) are normal - the Pod uses the installed npm package version.

### Option 3: Check CI Script

**Verify `ci_scripts/ensure_pods.sh` includes:**

```bash
cd ios
pod install
```

## Verification Steps

After applying the fix:

1. **Clean Xcode build:**
   - Product > Clean Build Folder (Cmd+Shift+K)
   - Close and reopen Xcode

2. **Verify Pods:**
   ```bash
   cd ios
   pod install
   ```

3. **Check for errors:**
   - Build the project in Xcode
   - Verify no compilation errors remain

## If Building with EAS

**EAS Build should handle this automatically**, but if errors persist:

1. **Clear cache:**
   ```bash
   eas build --platform ios --profile production --clear-cache
   ```

2. **Verify build script** includes pod install:
   - Check `eas-build-post-install` script in `package.json`
   - Should run `ci_scripts/ensure_pods.sh`

## Expected Result

After fixing:
- ✅ No compilation errors in `EXUpdates`
- ✅ `StartupProcedure` and `StartupProcedureDelegate` types found
- ✅ Project builds successfully

## Additional Notes

- These types are internal to `expo-updates` and should be automatically available
- If errors persist after pod reinstall, it may indicate a version mismatch
- The `StartupProcedure` code you saw earlier was reference code, not part of your project

---

**Status:** Requires pod reinstall or EAS build with cache clear
