import Foundation
import AuthenticationServices
import CryptoKit
import React

@objc(AppleSignInModule)
final class AppleSignInModule: NSObject, RCTBridgeModule, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
  static func moduleName() -> String! { "AppleSignInModule" }
  static func requiresMainQueueSetup() -> Bool { true }

  private var currentNonce: String?
  private var resolve: RCTPromiseResolveBlock?
  private var reject: RCTPromiseRejectBlock?

  // MARK: - React Native API

  /// Starts Sign in with Apple.
  ///
  /// Returns:
  /// - identityToken: JWT string (required by Supabase signInWithIdToken)
  /// - nonce: raw nonce used to build the request (required by Supabase)
  /// - userId: Apple user identifier (stable per app)
  /// - email/fullName: only provided the first time user grants it
  @objc(signIn:rejecter:)
  func signIn(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      self.resolve = resolve
      self.reject = reject

      let nonce = Self.randomNonceString()
      self.currentNonce = nonce

      let request = ASAuthorizationAppleIDProvider().createRequest()
      request.requestedScopes = [.fullName, .email]
      request.nonce = Self.sha256(nonce)

      let controller = ASAuthorizationController(authorizationRequests: [request])
      controller.delegate = self
      controller.presentationContextProvider = self
      controller.performRequests()
    }
  }

  // MARK: - ASAuthorizationControllerDelegate

  func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
    guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
      rejectOnce(code: "APPLE_INVALID_CREDENTIAL", message: "No se pudo obtener credencial de Apple.", error: nil)
      return
    }

    guard let nonce = currentNonce else {
      rejectOnce(code: "APPLE_MISSING_NONCE", message: "Falta nonce para validar el inicio de sesión con Apple.", error: nil)
      return
    }

    guard let tokenData = credential.identityToken, let tokenString = String(data: tokenData, encoding: .utf8) else {
      rejectOnce(code: "APPLE_MISSING_ID_TOKEN", message: "Apple no devolvió identityToken.", error: nil)
      return
    }

    var fullNameString: String? = nil
    if let name = credential.fullName {
      let formatter = PersonNameComponentsFormatter()
      fullNameString = formatter.string(from: name)
    }

    let result: [String: Any?] = [
      "identityToken": tokenString,
      "nonce": nonce,
      "userId": credential.user,
      "email": credential.email,
      "fullName": fullNameString,
    ]

    resolveOnce(result)
  }

  func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
    // User cancelled is a common case; keep message user-friendly
    let nsError = error as NSError
    if nsError.domain == ASAuthorizationError.errorDomain && nsError.code == ASAuthorizationError.canceled.rawValue {
      rejectOnce(code: "APPLE_CANCELED", message: "Inicio de sesión con Apple cancelado.", error: error)
      return
    }
    rejectOnce(code: "APPLE_ERROR", message: "Error al iniciar sesión con Apple.", error: error)
  }

  // MARK: - ASAuthorizationControllerPresentationContextProviding

  func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
    // iPad-safe: use key window when possible
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let activeScene =
      scenes.first(where: { $0.activationState == .foregroundActive }) ??
      scenes.first(where: { $0.activationState == .foregroundInactive }) ??
      scenes.first

    let keyWindow = activeScene?.windows.first(where: { $0.isKeyWindow }) ?? activeScene?.windows.first
    return keyWindow ?? ASPresentationAnchor()
  }

  // MARK: - Helpers (nonce)

  private static func sha256(_ input: String) -> String {
    let inputData = Data(input.utf8)
    let hashed = SHA256.hash(data: inputData)
    return hashed.compactMap { String(format: "%02x", $0) }.joined()
  }

  // Adapted from Apple sample code
  private static func randomNonceString(length: Int = 32) -> String {
    precondition(length > 0)
    let charset: [Character] =
      Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
    var result = ""
    var remainingLength = length

    while remainingLength > 0 {
      var randoms: [UInt8] = [UInt8](repeating: 0, count: 16)
      let status = SecRandomCopyBytes(kSecRandomDefault, randoms.count, &randoms)
      if status != errSecSuccess {
        // Fallback to less-ideal randomness, but avoid crashing the app
        randoms = (0..<16).map { _ in UInt8.random(in: 0...255) }
      }

      randoms.forEach { random in
        if remainingLength == 0 { return }
        if random < charset.count {
          result.append(charset[Int(random)])
          remainingLength -= 1
        }
      }
    }
    return result
  }

  // MARK: - Promise safety

  private func resolveOnce(_ value: Any) {
    guard let r = resolve else { return }
    resolve = nil
    reject = nil
    currentNonce = nil
    r(value)
  }

  private func rejectOnce(code: String, message: String, error: Error?) {
    guard let j = reject else { return }
    resolve = nil
    reject = nil
    currentNonce = nil
    let nsError = error as NSError?
    j(code, message, nsError)
  }
}

