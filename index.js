// index.js
// ✅ EARLY LOGGER: Debe estar ANTES de cualquier import
// Esto captura errores fatales en TestFlight antes de que se pierdan
// Se ejecuta en el momento más temprano posible, antes de que cualquier módulo se cargue
(function setupEarlyErrorHandler() {
  try {
    const anyGlobal = typeof global !== "undefined" ? global : {};
    const ErrorUtils = anyGlobal?.ErrorUtils;

    if (ErrorUtils?.setGlobalHandler) {
      const defaultHandler = ErrorUtils.getGlobalHandler?.();
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        try {
          const msg = error?.message ?? String(error);
          const stack = error?.stack ?? "";
          console.log("[GlobalError] fatal?", !!isFatal);
          console.log("[GlobalError] message:", msg);
          console.log("[GlobalError] stack:", stack);
          
          if (error?.name) {
            console.log("[GlobalError] name:", error.name);
          }

          // Persist to disk so we can debug without Xcode Device Logs (VM limitation).
          try {
            // Lazy require so missing module doesn't crash during import.
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const FileSystem = require("expo-file-system/legacy");
            const uri = `${FileSystem.documentDirectory ?? ""}last_fatal_error.json`;
            const rec = {
              ts: new Date().toISOString(),
              isFatal: !!isFatal,
              name: error?.name,
              message: msg,
              stack,
            };
            FileSystem.writeAsStringAsync(uri, JSON.stringify(rec, null, 2)).catch(() => {});
            anyGlobal.__LAST_FATAL_ERROR__ = rec;
          } catch (e) {
            // ignore
          }
        } catch (e) {
          console.log("[GlobalError] failed to print", e);
        }
        // ✅ No abort en producción/TestFlight: no llames al defaultHandler en errores fatales.
        // (El default handler termina en RCTFatal -> abort()).
        const isDev = typeof __DEV__ !== "undefined" && __DEV__;
        if (isDev) {
          defaultHandler?.(error, isFatal);
        } else {
          if (!isFatal) defaultHandler?.(error, isFatal);
        }
      });
      console.log("[EarlyGlobalErrorHandler] Early logger installed successfully");
    }

    // Promises no-catcheadas
    if (anyGlobal?.onunhandledrejection == null) {
      anyGlobal.onunhandledrejection = (event) => {
        const reason = event?.reason;
        console.log("[UnhandledRejection]", reason?.message ?? String(reason ?? event));
        if (reason?.stack) {
          console.log("[UnhandledRejection] stack:", reason.stack);
        }
      };
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
