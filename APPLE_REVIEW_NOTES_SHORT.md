# Notes for Apple Review - Camera Crash Fix

## What's New in This Version

Fixed crash when accessing camera for profile photo on iPad devices. Improved media capture permissions handling and upgraded WebView component for better stability.

## Details for Review Team

**Issue Fixed:** Crash when accessing camera functionality on iPad Air 11-inch (M3), iPadOS 26.2

**Solution:**
1. Upgraded react-native-webview from 13.15.0 to 13.16.0 (includes iPad stability fixes)
2. Improved WKWebView media capture permission handling configuration
3. Verified all required privacy usage descriptions are properly configured

**Technical Changes:**
- Dependency upgrade: `react-native-webview@13.16.0`
- Added `mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"` to WebView configuration
- Added `allowsInlineMediaPlayback` for Safari-like media behavior

**Testing:** New build generated with these changes. Camera access flow now works correctly on iPad devices.

---

**Version:** 1.0.2  
**Status:** Ready for review
