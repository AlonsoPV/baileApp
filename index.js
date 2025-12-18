// index.js
// ✅ EARLY LOGGER: Debe estar ANTES de cualquier import
// Esto captura errores fatales en TestFlight antes de que se pierdan
// Se ejecuta en el momento más temprano posible, antes de que cualquier módulo se cargue
(function setupEarlyErrorHandler() {
  try {
    // ErrorUtils puede no estar disponible inmediatamente, así que lo intentamos varias veces
    const setupHandler = () => {
      if (typeof global !== "undefined" && global.ErrorUtils && typeof global.ErrorUtils.getGlobalHandler === "function") {
        try {
          const originalHandler = global.ErrorUtils.getGlobalHandler();
          global.ErrorUtils.setGlobalHandler((error, isFatal) => {
            // Log mínimo viable del error ANTES de que se pierda
            // Formato simple para que aparezca en logs de TestFlight/Xcode
            console.log("[GlobalError]", String(error?.message ?? error ?? "Unknown error"), "fatal?", !!isFatal);
            
            // Log adicional si está disponible
            if (error?.stack) {
              console.log("[GlobalError] Stack:", error.stack);
            }
            if (error?.name) {
              console.log("[GlobalError] Name:", error.name);
            }
            
            // Llamar al handler original para que también lo procese
            if (originalHandler) {
              try {
                originalHandler(error, isFatal);
              } catch (e) {
                console.error("[GlobalError] Original handler failed:", e);
              }
            }
          });
          console.log("[EarlyGlobalErrorHandler] Early logger installed successfully");
          return true;
        } catch (e) {
          console.error("[EarlyGlobalErrorHandler] Failed to setup handler:", e);
          return false;
        }
      }
      return false;
    };
    
    // Intentar inmediatamente
    if (!setupHandler()) {
      // Si no está disponible, intentar después de un pequeño delay
      setTimeout(() => {
        if (!setupHandler()) {
          console.warn("[EarlyGlobalErrorHandler] ErrorUtils not available, will rely on errorHandler.ts");
        }
      }, 0);
    }
  } catch (e) {
    console.error("[EarlyGlobalErrorHandler] Failed to setup early logger:", e);
  }
})();

import { registerRootComponent } from "expo";
import { installGlobalErrorHandler } from "./src/lib/errorHandler";
import App from "./App";

// ✅ Install global error handler BEFORE registering the app
// This prevents SIGABRT crashes from unhandled JavaScript exceptions
installGlobalErrorHandler();

registerRootComponent(App);
