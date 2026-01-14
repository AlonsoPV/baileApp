# CameraPresenter.swift - Uso y Configuración

## 📋 Descripción

`CameraPresenter.swift` es un helper Swift que presenta la cámara de forma segura en iOS/iPad, evitando los 3 crashes más comunes:

1. ✅ **Present fuera del main thread** - Garantiza ejecución en main thread
2. ✅ **Present desde VC no visible / doble present** - Verifica que no haya otro VC presentado
3. ✅ **Popover sin anchor (iPad)** - Configura correctamente el popover para iPad

## 🔧 Agregar al Proyecto Xcode

### Opción 1: Automático (Recomendado)

Si usas `expo prebuild`, el archivo debería detectarse automáticamente:

```bash
npx expo prebuild --platform ios --clean
```

### Opción 2: Manual

Si necesitas agregarlo manualmente en Xcode:

1. Abre `ios/DondeBailarMX.xcworkspace` en Xcode
2. Clic derecho en el grupo `DondeBailarMX` (en el navegador de archivos)
3. Selecciona "Add Files to DondeBailarMX..."
4. Navega a `ios/DondeBailarMX/CameraPresenter.swift`
5. Asegúrate de que:
   - ✅ "Copy items if needed" esté **desmarcado** (el archivo ya está en la ubicación correcta)
   - ✅ "Add to targets: DondeBailarMX" esté **marcado**
6. Click "Add"

## 💻 Uso desde Código Swift

```swift
import UIKit

class MyViewController: UIViewController {
  @IBAction func takePhotoButtonTapped() {
    CameraPresenter.presentProfileCamera(from: self)
  }
}
```

## 🔗 Integración con React Native (Opcional)

Si necesitas exponer esta funcionalidad a React Native, puedes crear un módulo bridge:

### 1. Crear Módulo Bridge

```swift
// ios/DondeBailarMX/CameraModule.swift
import Foundation
import React

@objc(CameraModule)
class CameraModule: RCTEventEmitter {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc
  func presentCamera(_ resolve: @escaping RCTPromiseResolveBlock, 
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      guard let rootVC = UIApplication.shared.windows.first?.rootViewController else {
        reject("NO_ROOT_VC", "No se pudo encontrar el view controller raíz", nil)
        return
      }
      
      CameraPresenter.presentProfileCamera(from: rootVC)
      resolve(true)
    }
  }
  
  override func supportedEvents() -> [String]! {
    return []
  }
}
```

### 2. Agregar al Bridge Header (si usas Objective-C bridge)

No necesario si todo es Swift puro.

### 3. Usar desde JavaScript/TypeScript

```typescript
import { NativeModules } from 'react-native';

const { CameraModule } = NativeModules;

// Llamar desde tu componente
const openCamera = async () => {
  try {
    await CameraModule.presentCamera();
  } catch (error) {
    console.error('Error al abrir cámara:', error);
  }
};
```

## 📝 Nota Importante

**Estado Actual**: Tu app actualmente usa `react-native-webview` que carga una web app. La cámara se accede desde el lado web usando `<input type="file" accept="image/*">`, que es manejado por WKWebView.

**Cuándo usar CameraPresenter**:
- Si necesitas control nativo más fino sobre la presentación de la cámara
- Si quieres evitar problemas específicos de iPad con WKWebView
- Si planeas crear un módulo React Native bridge para mejor integración

**Mejoras ya implementadas en WebView**:
- ✅ `mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"` en `WebAppScreen.tsx`
- ✅ Upgrade a `react-native-webview@13.16.0` (mejoras de estabilidad en iPad)

## 🧪 Testing

Para probar el helper:

1. Crea un ViewController de prueba en Xcode
2. Agrega un botón que llame a `CameraPresenter.presentProfileCamera(from: self)`
3. Ejecuta en un iPad físico o simulador
4. Verifica que:
   - ✅ Se solicite permiso correctamente
   - ✅ La cámara se presente sin crashes
   - ✅ El popover tenga anchor correcto en iPad

## 🔍 Referencias

- Estilo basado en `StartupProcedure.swift` (patrón similar de helper estático)
- [Apple - UIImagePickerController](https://developer.apple.com/documentation/uikit/uiimagepickercontroller)
- [Apple - UIPopoverPresentationController](https://developer.apple.com/documentation/uikit/uipopoverpresentationcontroller)
