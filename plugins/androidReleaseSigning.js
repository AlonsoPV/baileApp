/**
 * Expo config plugin: Android release signing from env / gradle.properties
 * Ensures buildTypes.release uses signingConfigs.release (not debug).
 * Values: UPLOAD_STORE_FILE, UPLOAD_STORE_PASSWORD, UPLOAD_KEY_ALIAS, UPLOAD_KEY_PASSWORD
 * (from gradle.properties or environment variables).
 */
const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs").promises;
const path = require("path");

const MARKER = "// @baileapp androidReleaseSigning plugin";

function ensureReleaseSigningInBuildGradle(contents) {
  if (contents.includes("UPLOAD_STORE_FILE") && contents.includes("signingConfigs.release")) {
    return contents;
  }

  const signingConfigsReleaseBlock = `
    ${MARKER} - release signing from gradle.properties or env
    release {
      def uploadStoreFile = findProperty('UPLOAD_STORE_FILE') ?: System.getenv('UPLOAD_STORE_FILE')
      def uploadStorePassword = findProperty('UPLOAD_STORE_PASSWORD') ?: System.getenv('UPLOAD_STORE_PASSWORD')
      def uploadKeyAlias = findProperty('UPLOAD_KEY_ALIAS') ?: System.getenv('UPLOAD_KEY_ALIAS')
      def uploadKeyPassword = findProperty('UPLOAD_KEY_PASSWORD') ?: System.getenv('UPLOAD_KEY_PASSWORD')
      if (uploadStoreFile != null && uploadStorePassword != null && uploadKeyAlias != null && uploadKeyPassword != null) {
        storeFile file(uploadStoreFile)
        storePassword uploadStorePassword
        keyAlias uploadKeyAlias
        keyPassword uploadKeyPassword
      }
    }
`;

  let next = contents;

  if (!next.includes("UPLOAD_STORE_FILE")) {
    const signingConfigsMatch = next.match(
      /(\bsigningConfigs\s*\{\s*)(\bdebug\s*\{[\s\S]*?keyPassword\s+['"][^'"]*['"]\s*\}\s*)(\})/
    );
    if (signingConfigsMatch) {
      const [, open, debugBlock, close] = signingConfigsMatch;
      next = next.replace(
        signingConfigsMatch[0],
        `${open}${debugBlock}${signingConfigsReleaseBlock}\n    ${close}`
      );
    }
  }

  if (next.includes("signingConfig signingConfigs.debug") && next.includes("buildTypes")) {
    next = next.replace(
      /(\brelease\s*\{[^}]*?)signingConfig\s+signingConfigs\.debug/,
      "$1signingConfig signingConfigs.release"
    );
  }

  return next;
}

function withAndroidReleaseSigning(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const buildGradlePath = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "build.gradle"
      );
      try {
        let contents = await fs.readFile(buildGradlePath, "utf8");
        contents = ensureReleaseSigningInBuildGradle(contents);
        await fs.writeFile(buildGradlePath, contents);
      } catch (err) {
        console.warn("[androidReleaseSigning] Could not modify app/build.gradle:", err);
      }
      return config;
    },
  ]);
}

module.exports = withAndroidReleaseSigning;
