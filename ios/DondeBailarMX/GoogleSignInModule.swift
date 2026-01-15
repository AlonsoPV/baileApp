import Foundation
import React
import GoogleSignIn

@objc(GoogleSignInModule)
final class GoogleSignInModule: NSObject, RCTBridgeModule {
  static func moduleName() -> String! { "GoogleSignInModule" }
  static func requiresMainQueueSetup() -> Bool { true }

  @objc(signIn:resolver:rejecter:)
  func signIn(_ clientId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      guard !clientId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
        reject("GOOGLE_MISSING_CLIENT_ID", "Falta Google iOS Client ID (configuración).", nil)
        return
      }

      guard let presentingVC = UIApplication.topMostViewController() else {
        reject("GOOGLE_NO_PRESENTING_VC", "No se pudo determinar el ViewController para presentar Google Sign-In (iPad).", nil)
        return
      }

      let config = GIDConfiguration(clientID: clientId)
      GIDSignIn.sharedInstance.configuration = config

      // Official in-app flow (does not open default Safari browser)
      GIDSignIn.sharedInstance.signIn(withPresenting: presentingVC) { result, error in
        if let error = error {
          let nsError = error as NSError
          // User cancellation is common and should not crash/loop
          if nsError.domain == kGIDSignInErrorDomain, nsError.code == kGIDSignInErrorCodeCanceled {
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

