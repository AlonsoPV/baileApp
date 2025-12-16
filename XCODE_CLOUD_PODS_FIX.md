# Fix: "Unable to open base configuration reference file ... Pods-*.xcconfig"

If you see an error like:

- `Unable to open base configuration reference file '.../ios/Pods/Target Support Files/Pods-*/Pods-*.release.xcconfig'`

It means **CocoaPods was not installed** in the build environment, so the `ios/Pods/**` artifacts (including the `.xcconfig`) were never generated.

## What to do

### Option A (Xcode Cloud): run repo scripts in the workflow phases

In Xcode Cloud, configure these phases to run scripts **from the repository**:

- **Post-clone**: `ci_scripts/ci_post_clone.sh`
- **Pre-Xcodebuild**: `ci_scripts/ci_pre_xcodebuild.sh`

Both scripts call `ci_scripts/ensure_pods.sh`, which runs `pod install` and verifies the expected `.xcconfig` exists.

### Option B (any CI): run the pod script before `xcodebuild archive`

Add a step before the archive step:

```bash
bash ci_scripts/ensure_pods.sh
```

## Notes

- This repo avoids `pod repo update` in CI because it is slow and may fail without network access; `pod install` is usually sufficient with the CocoaPods CDN.


