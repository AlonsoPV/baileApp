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
            // Log completo del error ANTES de que se pierda
            try {
              console.log("[EarlyGlobalErrorHandler] ===== FATAL ERROR CAPTURED =====");
              console.log("[EarlyGlobalErrorHandler] Message:", String(error && error.message ? error.message : (error ? String(error) : "Unknown error")));
              console.log("[EarlyGlobalErrorHandler] Name:", String(error && error.name ? error.name : "Unknown"));
              console.log("[EarlyGlobalErrorHandler] Is Fatal:", isFatal);
              console.log("[EarlyGlobalErrorHandler] Stack:", String(error && error.stack ? error.stack : "No stack"));
              console.log("[EarlyGlobalErrorHandler] ToString:", String(error ? error.toString() : "No toString"));
              
              // Intentar serializar el error de forma segura
              try {
                const errorProps = {};
                if (error && typeof error === "object") {
                  const props = Object.getOwnPropertyNames(error);
                  props.forEach(prop => {
                    try {
                      const value = error[prop];
                      errorProps[prop] = typeof value === "string" ? value : String(value);
                    } catch (e) {
                      errorProps[prop] = "[Cannot stringify]";
                    }
                  });
                }
                console.log("[EarlyGlobalErrorHandler] Error properties:", JSON.stringify(errorProps, null, 2));
              } catch (e) {
                console.log("[EarlyGlobalErrorHandler] Could not serialize error properties");
              }
              
              console.log("[EarlyGlobalErrorHandler] ================================");
            } catch (logError) {
              // Si incluso el logging falla, intentar al menos algo básico
              console.error("[EarlyGlobalErrorHandler] Error in logging:", logError);
              console.error("[EarlyGlobalErrorHandler] Original error:", error);
            }
            
            // Llamar al handler original para que también lo procese
            if (originalHandler) {
              try {
                originalHandler(error, isFatal);
              } catch (e) {
                console.error("[EarlyGlobalErrorHandler] Original handler failed:", e);
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
