import Foundation
import React
import GoogleSignIn

@objc(GoogleSignInModule)
final class GoogleSignInModule: NSObject {
  // Required by React Native bridge (via RCT_EXTERN_MODULE)
  @objc static func requiresMainQueueSetup() -> Bool { true }

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

  @objc(signIn:resolver:rejecter:)
  func signIn(_ clientId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let effectiveClientId = self.resolvedClientId(passed: clientId)
      guard !effectiveClientId.isEmpty else {
        reject("GOOGLE_MISSING_CLIENT_ID", "Falta Google iOS Client ID (configuración).", nil)
        return
      }

      guard let presentingVC = UIApplication.topMostViewController() else {
        // Log para debugging
        print("[GoogleSignInModule] ERROR: No se pudo encontrar topMostViewController")
        print("[GoogleSignInModule] Window scenes: \(UIApplication.shared.connectedScenes.count)")
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
          print("[GoogleSignInModule] Windows count: \(windowScene.windows.count)")
          print("[GoogleSignInModule] Key window: \(windowScene.windows.first(where: { $0.isKeyWindow }) != nil)")
        }
        reject("GOOGLE_NO_PRESENTING_VC", "No se pudo mostrar la pantalla de Google. Intenta cerrar y reabrir la app.", nil)
        return
      }

      let config = GIDConfiguration(clientID: effectiveClientId)
      GIDSignIn.sharedInstance.configuration = config

      // Official in-app flow (does not open default Safari browser)
      GIDSignIn.sharedInstance.signIn(withPresenting: presentingVC) { result, error in
        if let error = error {
          let nsError = error as NSError
          // User cancellation is common and should not crash/loop
          // GoogleSignIn uses error domain kGIDSignInErrorDomain; cancel code is -5.
          // Some SDK versions do not expose kGIDSignInErrorCodeCanceled to Swift, so we check the numeric code.
          if nsError.domain == kGIDSignInErrorDomain, nsError.code == -5 {
            reject("GOOGLE_CANCELED", "Inicio de sesión con Google cancelado.", nsError)
            return
          }
          reject("GOOGLE_ERROR", "Error al iniciar sesión con Google.", nsError)
          return
        }

        guard let result = result else {
          reject("GOOGLE_NO_RESULT", "Google Sign-In no devolvió resultado.", nil)
          return
        }

        guard let idToken = result.user.idToken?.tokenString else {
          reject("GOOGLE_MISSING_ID_TOKEN", "Google no devolvió idToken.", nil)
          return
        }

        let accessToken = result.user.accessToken.tokenString

        resolve([
          "idToken": idToken,
          "accessToken": accessToken,
          "userId": result.user.userID,
          "email": result.user.profile?.email,
          "fullName": result.user.profile?.name,
        ])
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

