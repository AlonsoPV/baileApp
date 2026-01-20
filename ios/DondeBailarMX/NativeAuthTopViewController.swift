import UIKit

// Helper to reliably get the top-most view controller (iPad-safe).
// Used for presenting Google Sign-In UI.
extension UIApplication {
  static func topMostViewController(base: UIViewController? = UIApplication.shared.activeRootViewController()) -> UIViewController? {
    // Obtener el ViewController base (intentar múltiples métodos)
    var current = base
    if current == nil {
      current = UIApplication.shared.activeRootViewController()
    }
    
    // Si aún no hay, intentar desde el window principal directamente
    if current == nil {
      if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
        // Preferir key window, luego cualquier window
        let targetWindow = windowScene.windows.first(where: { $0.isKeyWindow }) ?? windowScene.windows.first
        current = targetWindow?.rootViewController
      }
    }
    
    // Si aún no hay, intentar desde AppDelegate window (legacy) usando reflection
    if current == nil {
      if let appDelegate = UIApplication.shared.delegate,
         let window = (appDelegate as AnyObject).value(forKey: "window") as? UIWindow {
        current = window.rootViewController
      }
    }
    
    // Si aún no hay, usar el primer window scene disponible
    if current == nil {
      for scene in UIApplication.shared.connectedScenes {
        if let windowScene = scene as? UIWindowScene,
           let window = windowScene.windows.first {
          current = window.rootViewController
          break
        }
      }
    }
    
    guard let baseVC = current else {
      return nil
    }
    
    // Recursivamente encontrar el VC más superior
    if let nav = baseVC as? UINavigationController {
      return topMostViewController(base: nav.visibleViewController ?? nav.topViewController)
    }
    if let tab = baseVC as? UITabBarController, let selected = tab.selectedViewController {
      return topMostViewController(base: selected)
    }
    if let presented = baseVC.presentedViewController {
      return topMostViewController(base: presented)
    }
    
    // iPad: si es un split view controller, usar el detail o master
    if let split = baseVC as? UISplitViewController {
      if let detail = split.viewControllers.last {
        return topMostViewController(base: detail)
      }
      if let master = split.viewControllers.first {
        return topMostViewController(base: master)
      }
    }
    
    return baseVC
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

