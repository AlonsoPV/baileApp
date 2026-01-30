import Foundation
import React
import GoogleSignIn
import UIKit
import CryptoKit
import Security

@objc(GoogleSignInModule)
final class GoogleSignInModule: NSObject {
  // Required by React Native bridge (via RCT_EXTERN_MODULE)
  @objc static func requiresMainQueueSetup() -> Bool { true }

  private func shouldLog() -> Bool {
    #if DEBUG
    return true
    #else
    if let v = Bundle.main.object(forInfoDictionaryKey: "BAILEAPP_GOOGLE_SIGNIN_DEBUG") as? Bool {
      return v
    }
    if let s = Bundle.main.object(forInfoDictionaryKey: "BAILEAPP_GOOGLE_SIGNIN_DEBUG") as? String {
      return s == "1" || s.lowercased() == "true"
    }
    return false
    #endif
  }

  private func trimmed(_ s: String?) -> String {
    (s ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
  }

  private func plistValue(_ key: String) -> String {
    let v = Bundle.main.object(forInfoDictionaryKey: key) as? String
    return trimmed(v)
  }

  private func resolvedClientId(passed clientId: String) -> String {
    let t = clientId.trimmingCharacters(in: .whitespacesAndNewlines)
    if !t.isEmpty { return t }
    return plistValue("GIDClientID")
  }

  private func resolvedServerClientId() -> String {
    // Web Client ID used as serverClientID (for idToken audience)
    return plistValue("GIDServerClientID")
  }

  private func expectedGoogleScheme(from clientId: String) -> String {
    // Google iOS callback scheme is:
    //   com.googleusercontent.apps.<reversed_client_id>
    // where <reversed_client_id> is everything before ".apps.googleusercontent.com"
    // Example clientID:
    //   168113490186-xxxx.apps.googleusercontent.com
    // Expected scheme:
    //   com.googleusercontent.apps.168113490186-xxxx
    let t = clientId.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !t.isEmpty else { return "" }
    let suffix = ".apps.googleusercontent.com"
    let base: String
    if let r = t.range(of: suffix) {
      base = String(t[..<r.lowerBound])
    } else {
      base = t
    }
    return base.isEmpty ? "" : "com.googleusercontent.apps.\(base)"
  }

  private func hasURLScheme(_ scheme: String) -> Bool {
    guard !scheme.isEmpty else { return false }
    guard let urlTypes = Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes") as? [[String: Any]] else {
      return false
    }
    for t in urlTypes {
      if let schemes = t["CFBundleURLSchemes"] as? [String], schemes.contains(scheme) {
        return true
      }
    }
    return false
  }

  // MARK: - Nonce helpers (Supabase validation)

  private func randomNonceString(length: Int = 32) -> String {
    precondition(length > 0)
    let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
    var result = ""
    result.reserveCapacity(length)

    var remaining = length
    while remaining > 0 {
      var randomBytes = [UInt8](repeating: 0, count: 16)
      let status = SecRandomCopyBytes(kSecRandomDefault, randomBytes.count, &randomBytes)
      if status != errSecSuccess {
        // Fallback (should be extremely rare)
        let fallback = UUID().uuidString.replacingOccurrences(of: "-", with: "")
        return String(fallback.prefix(length))
      }
      for b in randomBytes {
        if remaining == 0 { break }
        let idx = Int(b) % charset.count
        result.append(charset[idx])
        remaining -= 1
      }
    }
    return result
  }

  private func sha256Base64URL(_ input: String) -> String {
    let data = Data(input.utf8)
    let hash = SHA256.hash(data: data)
    let hashedData = Data(hash)
    let b64 = hashedData.base64EncodedString()
    // base64url (RFC 4648)
    return b64
      .replacingOccurrences(of: "+", with: "-")
      .replacingOccurrences(of: "/", with: "_")
      .replacingOccurrences(of: "=", with: "")
  }

  @objc(signIn:requestId:resolver:rejecter:)
  func signIn(
    _ clientId: String,
    requestId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      let effectiveClientId = self.resolvedClientId(passed: clientId)
      guard !effectiveClientId.isEmpty else {
        if self.shouldLog() { print("[GoogleSignInModule] Missing clientID. requestId=\(requestId)") }
        reject("GOOGLE_MISSING_CLIENT_ID", "Falta Google iOS Client ID (configuración).", nil)
        return
      }

      if self.shouldLog() {
        print("[GoogleSignInModule] requestId=\(requestId) resolved clientID=\(effectiveClientId.prefix(10))...")
      }

      let serverClientId = self.resolvedServerClientId()
      let expectedScheme = self.expectedGoogleScheme(from: effectiveClientId)
      let schemeOK = self.hasURLScheme(expectedScheme)

      if self.shouldLog() {
        print("[GoogleSignInModule] expectedScheme=\(expectedScheme)")
        print("[GoogleSignInModule] CFBundleURLTypes=\(Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes") ?? "nil")")
        print("[GoogleSignInModule] requestId=\(requestId) clientID=\(effectiveClientId.prefix(18))... serverClientID=\(serverClientId.prefix(18))... expectedScheme=\(expectedScheme) schemeOK=\(schemeOK)")
      }

      if !schemeOK {
        reject("GOOGLE_MISSING_URL_SCHEME", "Falta URL scheme de Google en Info.plist (com.googleusercontent.apps...).", nil)
        return
      }

      guard let presentingVC = UIApplication.topMostViewController() else {
        if self.shouldLog() {
          print("[GoogleSignInModule] ERROR: No se pudo encontrar topMostViewController")
          print("[GoogleSignInModule] Window scenes: \(UIApplication.shared.connectedScenes.count)")
        }
        reject("GOOGLE_NO_PRESENTING_VC", "No se pudo mostrar la pantalla de Google. Intenta cerrar y reabrir la app.", nil)
        return
      }

      // IMPORTANT: serverClientID makes idToken audience match the Web Client ID (Supabase expects this).
      let config = GIDConfiguration(
        clientID: effectiveClientId,
        serverClientID: serverClientId.isEmpty ? nil : serverClientId
      )
      GIDSignIn.sharedInstance.configuration = config

      // IMPORTANT: Supabase validates nonce against the nonce claim in the ID token.
      // Canonical pattern (same as Apple flow):
      // - Send SHA256(base64url) of the raw nonce to the IdP (Google)
      // - Send the RAW nonce to Supabase
      let rawNonce = self.randomNonceString()
      let rawNonceSHA256 = self.sha256Base64URL(rawNonce)

      GIDSignIn.sharedInstance.signIn(
        withPresenting: presentingVC,
        hint: nil,
        additionalScopes: ["openid", "email", "profile"],
        nonce: rawNonceSHA256
      ) { result, error in
        if let error = error {
          let nsError = error as NSError
          if nsError.domain == kGIDSignInErrorDomain, nsError.code == -5 {
            reject("GOOGLE_CANCELED", "Inicio de sesión con Google cancelado.", nsError)
            return
          }
          // Include domain/code in the message so JS/CI logs can pinpoint the real failure cause.
          // Avoid logging sensitive data; domain/code/description are safe.
          reject(
            "GOOGLE_ERROR",
            "Error al iniciar sesión con Google. (domain=\(nsError.domain), code=\(nsError.code)) \(nsError.localizedDescription)",
            nsError
          )
          return
        }

        guard let result = result else {
          reject("GOOGLE_NO_RESULT", "Google Sign-In no devolvió resultado.", nil)
          return
        }

        let finishResolve: (GIDGoogleUser) -> Void = { user in
          guard let idToken = user.idToken?.tokenString, !idToken.isEmpty else {
            reject("GOOGLE_MISSING_ID_TOKEN", "Google no devolvió idToken. Revisa GIDServerClientID (Web Client ID).", nil)
            return
          }

          let accessToken = user.accessToken.tokenString
          // IMPORTANT: never include nil in payload (NSDictionary would crash with setObject:nil)
          var payload: [String: Any] = [
            "idToken": idToken,
            "accessToken": accessToken,
          ]

          // Helps JS debug Supabase invalid_jwt (aud mismatch) without exposing secrets.
          if !serverClientId.isEmpty { payload["serverClientId"] = serverClientId }
          // Needed for Supabase nonce validation (raw nonce used in the sign-in request).
          payload["rawNonce"] = rawNonce
          payload["rawNonceSHA256"] = rawNonceSHA256

          if let userId = user.userID { payload["userId"] = userId }
          if let email = user.profile?.email { payload["email"] = email }
          if let fullName = user.profile?.name { payload["fullName"] = fullName }

          if self.shouldLog() {
            let keys = payload.keys.sorted()
            print("[GoogleSignInModule] requestId=\(requestId) payload.keys=\(keys)")
            print("[GoogleSignInModule] requestId=\(requestId) missing: userId=\(user.userID == nil) email=\(user.profile?.email == nil) fullName=\(user.profile?.name == nil)")
            // Safe token debug (prefix only)
            print("[GoogleSignInModule] requestId=\(requestId) idToken.prefix=\(idToken.prefix(10)) accessToken.prefix=\(accessToken.prefix(10))")
          }

          resolve(payload)
        }

        // Sometimes idToken is nil right after sign-in; refresh once before failing.
        if result.user.idToken == nil {
          result.user.refreshTokensIfNeeded { refreshedUser, refreshError in
            if let refreshError = refreshError {
              reject("GOOGLE_MISSING_ID_TOKEN", "Google no devolvió idToken.", refreshError as NSError)
              return
            }
            finishResolve(refreshedUser ?? result.user)
          }
          return
        }

        finishResolve(result.user)
      }
    }
  }

  @objc(signOut:rejecter:)
  func signOut(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      GIDSignIn.sharedInstance.signOut()
      resolve(true)
    }
  }
}

