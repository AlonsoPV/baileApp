import UIKit
import AVFoundation

enum CameraPresenter {
  static func presentProfileCamera(from vc: UIViewController) {
    print("[CameraPresenter] presentProfileCamera called from: \(type(of: vc))")
    runOnMain {
      print("[CameraPresenter] Checking camera availability...")
      guard UIImagePickerController.isSourceTypeAvailable(.camera) else {
        print("[CameraPresenter] ERROR: Camera not available on this device")
        showAlert(on: vc, title: "Cámara no disponible", message: "No se puede acceder a la cámara en este dispositivo.")
        return
      }

      let status = AVCaptureDevice.authorizationStatus(for: .video)
      print("[CameraPresenter] Camera authorization status: \(status.rawValue)")
      switch status {
      case .authorized:
        print("[CameraPresenter] Camera authorized, presenting picker...")
        presentPicker(from: vc)
      case .notDetermined:
        print("[CameraPresenter] Requesting camera permission...")
        AVCaptureDevice.requestAccess(for: .video) { granted in
          print("[CameraPresenter] Camera permission granted: \(granted)")
          runOnMain { granted ? presentPicker(from: vc) : showSettingsHint(on: vc) }
        }
      case .denied, .restricted:
        print("[CameraPresenter] Camera permission denied/restricted")
        showSettingsHint(on: vc)
      @unknown default:
        print("[CameraPresenter] Unknown camera permission status")
        showSettingsHint(on: vc)
      }
    }
  }

  private static func presentPicker(from vc: UIViewController) {
    print("[CameraPresenter] presentPicker called, finding topmost VC...")
    guard let top = topMostViewController(from: vc) else {
      print("[CameraPresenter] ERROR: Could not find topmost view controller")
      return
    }
    print("[CameraPresenter] Topmost VC: \(type(of: top))")
    
    guard top.presentedViewController == nil else {
      print("[CameraPresenter] ERROR: Another view controller is already presented: \(type(of: top.presentedViewController!))")
      showAlert(on: top, title: "Espera un momento", message: "Cierra la pantalla actual e inténtalo de nuevo.")
      return
    }

    print("[CameraPresenter] Creating UIImagePickerController...")
    let picker = UIImagePickerController()
    picker.sourceType = .camera

    // iPad-safe: Configure popover presentation controller
    if let pop = picker.popoverPresentationController {
      print("[CameraPresenter] Configuring popover for iPad (bounds: \(top.view.bounds))")
      pop.sourceView = top.view
      pop.sourceRect = CGRect(x: top.view.bounds.midX, y: top.view.bounds.midY, width: 1, height: 1)
      pop.permittedArrowDirections = []
    } else {
      print("[CameraPresenter] No popover presentation controller (iPhone or fullscreen)")
    }

    print("[CameraPresenter] Presenting camera picker...")
    top.present(picker, animated: true) {
      print("[CameraPresenter] Camera picker presented successfully")
    }
  }

  private static func topMostViewController(from vc: UIViewController) -> UIViewController? {
    var current: UIViewController? = vc
    while let presented = current?.presentedViewController { current = presented }
    if let nav = current as? UINavigationController { return nav.visibleViewController }
    if let tab = current as? UITabBarController { return tab.selectedViewController }
    return current
  }

  private static func showSettingsHint(on vc: UIViewController) {
    let alert = UIAlertController(
      title: "Permiso de cámara",
      message: "Activa el permiso de cámara en Configuración para tomar tu foto de perfil.",
      preferredStyle: .alert
    )
    alert.addAction(UIAlertAction(title: "OK", style: .default))
    vc.present(alert, animated: true)
  }

  private static func showAlert(on vc: UIViewController, title: String, message: String) {
    let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
    alert.addAction(UIAlertAction(title: "OK", style: .default))
    vc.present(alert, animated: true)
  }

  private static func runOnMain(_ block: @escaping () -> Void) {
    Thread.isMainThread ? block() : DispatchQueue.main.async(execute: block)
  }
}
