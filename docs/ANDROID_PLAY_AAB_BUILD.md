# How to build a Play-uploadable AAB

This project signs Android release builds with an **upload key** expected by Google Play. The expected upload key SHA-1 is:

**`81:AE:12:4E:EA:D6:36:11:39:CB:4A:15:3E:AC:3D:C0:A8:FC:42:17`**

If your AAB is signed with a different key, Play Console will reject it. Use the same keystore that produces this SHA-1, or complete a one-time upload key reset (see below).

---

## Option A: Build with EAS (recommended)

EAS Build uses credentials stored on Expo’s servers. To use the **correct** upload key:

1. **If you have the keystore that produces the expected SHA-1:**  
   Upload it to EAS once (interactive):  
   `npx eas credentials --platform android` → choose “Keystore” → “Set up a new keystore” or “Upload existing”, then provide the `.jks` and passwords. After that, production Android builds will be signed with that key.

2. **If you do not have that keystore:**  
   Do **not** build and upload until you either obtain the correct keystore or complete the upload key reset in Play Console (Option B below). Otherwise Play will keep rejecting the AAB.

Build command:

```bash
pnpm build:prod:android
# or: npx eas build --platform android --profile production
```

---

## Option B: Local Gradle build (after prebuild)

Use this when you want to sign locally with a specific keystore (e.g. the one that matches the expected SHA-1).

1. **Generate the Android project**
   ```bash
   npx expo prebuild --platform android
   ```

2. **Configure release signing (no secrets in repo)**  
   Copy the example and set real values only in a local file or env:

   ```bash
   # Append upload key props to android/gradle.properties (do not commit real passwords)
   cat config/android-gradle-upload.properties.example >> android/gradle.properties
   ```

   Then edit `android/gradle.properties` and set:

   - `UPLOAD_STORE_FILE` – path to your `.jks` (e.g. `../upload-keystore.jks` if the keystore is in the project root)
   - `UPLOAD_STORE_PASSWORD` – keystore password
   - `UPLOAD_KEY_ALIAS` – key alias (e.g. `upload`)
   - `UPLOAD_KEY_PASSWORD` – key password

   Or set the same names as **environment variables** instead of in `gradle.properties`. The plugin reads from `findProperty(...)` and then `System.getenv(...)`.

3. **Verify the keystore SHA-1**
   ```bash
   ./scripts/verify-upload-key.sh path/to/upload-keystore.jks your-key-alias
   ```
   Confirm the printed SHA-1 equals  
   `81:AE:12:4E:EA:D6:36:11:39:CB:4A:15:3E:AC:3D:C0:A8:FC:42:17`.

4. **Clean and build AAB**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew :app:bundleRelease
   ```
   The AAB is at `android/app/build/outputs/bundle/release/app-release.aab`.

---

## If the correct keystore is missing: Reset upload key in Play Console

If you no longer have the keystore that produces SHA-1 `81:AE:12:...:42:17`, do **not** sign with a random key. Instead, ask Google to accept a **new** upload key:

1. **Export the new certificate as PEM**  
   Use the keystore you *do* have (e.g. the one from EAS):

   - Download credentials from EAS:  
     `npx eas credentials --platform android` → “credentials.json: Upload/Download…” → “Download credentials from EAS to credentials.json”.  
     This writes e.g. `credentials/android/keystore.jks` and updates `credentials.json`.
   - From `credentials.json` note `keyAlias` and `keystorePassword`.
   - Export PEM:
     ```bash
     keytool -export -rfc -keystore credentials/android/keystore.jks -alias YOUR_KEY_ALIAS -file upload_certificate.pem
     ```
   - (On Windows use the full path to `keytool.exe`, e.g. from Android Studio’s JBR or JDK.)

2. **Request upload key reset in Play Console**
   - Play Console → your app → **Setup** → **App signing** (or **Integrity**).
   - Choose **Request upload key reset** (or equivalent).
   - Select the reason (e.g. “I lost my upload key”).
   - When asked for the new certificate, **upload `upload_certificate.pem`**.
   - Submit the request.

3. **After Google approves**  
   Only the new key (the one you exported to PEM) will be accepted for future uploads. Then:

   - For **EAS**: the keystore you downloaded (and optionally re-uploaded to EAS) is already that key; use `pnpm build:prod:android` as usual.
   - For **local builds**: use that same keystore in `UPLOAD_*` and run `./scripts/verify-upload-key.sh` to confirm SHA-1; then build with `./gradlew :app:bundleRelease`.

---

## Ensure no secrets are committed

- **Do not commit:**  
  `credentials.json`, `credentials/`, `*.jks`, `upload-keystore.jks`, `upload_certificate.pem`, or any file that contains real keystore/key passwords.

- These are already in `.gitignore`. Keep real values only in:
  - EAS (remote credentials), or
  - Local `android/gradle.properties` (after prebuild) or env vars, never committed.

---

## Summary

| Goal                         | Action |
|-----------------------------|--------|
| Build with correct key (EAS) | Use EAS credentials that hold the keystore with SHA-1 `81:AE:12:...:42:17`. |
| Build locally with correct key | Prebuild → set `UPLOAD_*` in `android/gradle.properties` or env → verify SHA-1 with `verify-upload-key.sh` → `./gradlew :app:bundleRelease`. |
| Key lost / wrong key         | Export PEM from the keystore you have → Request upload key reset in Play Console → upload PEM → after approval, use that keystore for all future uploads. |
