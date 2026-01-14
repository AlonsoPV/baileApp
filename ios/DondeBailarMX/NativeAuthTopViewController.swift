import UIKit

// Helper to reliably get the top-most view controller (iPad-safe).
// Used for presenting Google Sign-In UI.
extension UIApplication {
  static func topMostViewController(base: UIViewController? = UIApplication.shared.activeRootViewController()) -> UIViewController? {
    if let nav = base as? UINavigationController {
      return topMostViewController(base: nav.visibleViewController)
    }
    if let tab = base as? UITabBarController, let selected = tab.selectedViewController {
      return topMostViewController(base: selected)
    }
    if let presented = base?.presentedViewController {
      return topMostViewController(base: presented)
    }
    return base
  }

  private func activeRootViewController() -> UIViewController? {
    // Prefer foreground active window scene
    let scenes = connectedScenes.compactMap { $0 as? UIWindowScene }
    let activeScene =
      scenes.first(where: { $0.activationState == .foregroundActive }) ??
      scenes.first(where: { $0.activationState == .foregroundInactive }) ??
      scenes.first

    let keyWindow = activeScene?.windows.first(where: { $0.isKeyWindow }) ?? activeScene?.windows.first
    return keyWindow?.rootViewController
  }
}

