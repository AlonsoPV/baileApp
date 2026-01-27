import Foundation
import React
import GoogleSignIn

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

  private func mask(_ v: String) -> String {
    let t = v.trimmingCharacters(in: .whitespacesAndNewlines)
    if t.isEmpty { return "(empty)" }
    if t.count <= 10 { return "\(t.prefix(2))...\(t.suffix(2))" }
    return "\(t.prefix(6))...\(t.suffix(6))"
  }

  private func resolvedClientId(passed clientId: String) -> String {
    let trimmed = clientId.trimmingCharacters(in: .whitespacesAndNewlines)
    if !trimmed.isEmpty { return trimmed }
    // Fallback: read from Info.plist (injected at build time / Xcode settings)
    if let v = Bundle.main.object(forInfoDictionaryKey: "GIDClientID") as? String {
      let t = v.trimmingCharacters(in: .whitespacesAndNewlines)
      if !t.isEmpty { return t }
    }
    return ""
  }

  private func resolvedServerClientId() -> String {
    // If provided, Google issues an idToken whose audience matches serverClientID
    // (this is what Supabase expects when using signInWithIdToken for Google).
    if let v = Bundle.main.object(forInfoDictionaryKey: "GIDServerClientID") as? String {
      let t = v.trimmingCharacters(in: .whitespacesAndNewlines)
      if !t.isEmpty { return t }
    }
    return ""
  }

  private func allUrlSchemes() -> [String] {
    guard
      let urlTypes = Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes") as? [[String: Any]]
    else { return [] }
    var out: [String] = []
    for dict in urlTypes {
      if let schemes = dict["CFBundleURLSchemes"] as? [String] {
        out.append(contentsOf: schemes)
      }
    }
    return out
  }

  @objc(signIn:requestId:resolver:rejecter:)
  func signIn(_ clientId: String, requestId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let effectiveClientId = self.resolvedClientId(passed: clientId)
      guard !effectiveClientId.isEmpty else {
        if self.shouldLog() {
          print("[GoogleSignInModule] Missing clientID. requestId=\(requestId)")
        }
        reject("GOOGLE_MISSING_CLIENT_ID", "Falta Google iOS Client ID (configuración).", nil)
        return
      }

      // Basic sanity check: client id should be a googleusercontent client id.
      if !effectiveClientId.contains(".apps.googleusercontent.com") {
        if self.shouldLog() {
          print("[GoogleSignInModule] Suspicious clientID format. requestId=\(requestId) clientID=\(self.mask(effectiveClientId))")
        }
      }

      guard let presentingVC = UIApplication.topMostViewController() else {
        // Log para debugging
        if self.shouldLog() {
          print("[GoogleSignInModule] ERROR: No se pudo encontrar topMostViewController requestId=\(requestId)")
          print("[GoogleSignInModule] Window scenes: \(UIApplication.shared.connectedScenes.count)")
        }
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
          if self.shouldLog() {
            print("[GoogleSignInModule] Windows count: \(windowScene.windows.count)")
            print("[GoogleSignInModule] Key window: \(windowScene.windows.first(where: { $0.isKeyWindow }) != nil)")
          }
        }
        reject("GOOGLE_NO_PRESENTING_VC", "No se pudo mostrar la pantalla de Google. Intenta cerrar y reabrir la app.", nil)
        return
      }

      let serverClientId = self.resolvedServerClientId()
      if serverClientId.isEmpty {
        if self.shouldLog() {
          print("[GoogleSignInModule] ERROR: Missing GIDServerClientID (Web Client ID). requestId=\(requestId)")
        }
        reject("GOOGLE_MISSING_WEB_CLIENT_ID", "Falta GIDServerClientID (Web Client ID) en Info.plist. Es requerido para Supabase signInWithIdToken.", nil)
        return
      }
      if !serverClientId.isEmpty, serverClientId == effectiveClientId {
        if self.shouldLog() {
          print("[GoogleSignInModule] ERROR: iOS clientID equals server(web) clientID. requestId=\(requestId) clientID=\(self.mask(effectiveClientId))")
        }
        reject("GOOGLE_IOS_CLIENT_ID_IS_WEB", "El iOS Client ID parece ser el Web Client ID. Usa el client id de tipo iOS.", nil)
        return
      }

      // Validate URL scheme exists so the flow can return to the app.
      // Expected: com.googleusercontent.apps.<prefix>
      let expectedScheme: String = {
        if let prefix = effectiveClientId.components(separatedBy: ".apps.googleusercontent.com").first, !prefix.isEmpty {
          return "com.googleusercontent.apps.\(prefix)"
        }
        return ""
      }()
      if !expectedScheme.isEmpty {
        let schemes = self.allUrlSchemes()
        if self.shouldLog() {
          print("[GoogleSignInModule] requestId=\(requestId) clientID=\(self.mask(effectiveClientId)) serverClientID=\(self.mask(serverClientId)) expectedScheme=\(expectedScheme)")
        }
        if !schemes.contains(expectedScheme) {
          if self.shouldLog() {
            print("[GoogleSignInModule] ERROR: Missing URL scheme \(expectedScheme). Current schemes: \(schemes)")
          }
          reject("GOOGLE_MISSING_URL_SCHEME", "Falta el URL scheme de Google en Info.plist: \(expectedScheme)", nil)
          return
        }
      } else if self.shouldLog() {
        print("[GoogleSignInModule] Could not derive expected scheme. requestId=\(requestId) clientID=\(self.mask(effectiveClientId))")
      }

      let config = serverClientId.isEmpty
        ? GIDConfiguration(clientID: effectiveClientId)
        : GIDConfiguration(clientID: effectiveClientId, serverClientID: serverClientId)
      GIDSignIn.sharedInstance.configuration = config

      // Official in-app flow (does not open default Safari browser)
      // Request OpenID scopes explicitly to ensure idToken is available for Supabase.
      GIDSignIn.sharedInstance.signIn(withPresenting: presentingVC, hint: nil, additionalScopes: ["openid", "email", "profile"]) { result, error in
        if let error = error {
          let nsError = error as NSError
          // User cancellation is common and should not crash/loop
          // GoogleSignIn uses error domain kGIDSignInErrorDomain; cancel code is -5.
          // Some SDK versions do not expose kGIDSignInErrorCodeCanceled to Swift, so we check the numeric code.
          if nsError.domain == kGIDSignInErrorDomain, nsError.code == -5 {
            if self.shouldLog() { print("[GoogleSignInModule] CANCELED requestId=\(requestId)") }
            reject("GOOGLE_CANCELED", "Inicio de sesión con Google cancelado.", nsError)
            return
          }
          if self.shouldLog() {
            print("[GoogleSignInModule] ERROR requestId=\(requestId) domain=\(nsError.domain) code=\(nsError.code) msg=\(nsError.localizedDescription)")
          }
          reject("GOOGLE_ERROR", "Error al iniciar sesión con Google.", nsError)
          return
        }

        guard let result = result else {
          if self.shouldLog() { print("[GoogleSignInModule] NO_RESULT requestId=\(requestId)") }
          reject("GOOGLE_NO_RESULT", "Google Sign-In no devolvió resultado.", nil)
          return
        }

        let finishResolve = { (user: GIDGoogleUser) in
          guard let idToken = user.idToken?.tokenString, !idToken.isEmpty else {
            if self.shouldLog() { print("[GoogleSignInModule] MISSING_ID_TOKEN requestId=\(requestId)") }
            reject("GOOGLE_MISSING_ID_TOKEN", "Google no devolvió idToken.", nil)
            return
          }
          let accessToken = user.accessToken.tokenString
          resolve([
            "idToken": idToken,
            "accessToken": accessToken,
            "userId": user.userID,
            "email": user.profile?.email,
            "fullName": user.profile?.name,
            "requestId": requestId,
          ])
        }

        // Sometimes idToken can be nil right after sign-in; refresh tokens once before failing.
        if result.user.idToken == nil {
          if self.shouldLog() { print("[GoogleSignInModule] idToken nil after signIn; refreshing tokens requestId=\(requestId)") }
          result.user.refreshTokensIfNeeded { refreshedUser, refreshError in
            if let refreshError = refreshError {
              if self.shouldLog() { print("[GoogleSignInModule] refreshTokensIfNeeded failed requestId=\(requestId) msg=\(refreshError.localizedDescription)") }
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
  func signOut(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      // Best-effort; does not fail hard
      GIDSignIn.sharedInstance.signOut()
      resolve(true)
    }
  }
}

