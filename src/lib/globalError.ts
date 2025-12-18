/**
 * Global Error Logging for React Native
 * 
 * Captures unhandled JS exceptions and promise rejections BEFORE they cause SIGABRT.
 * This is critical for debugging crashes in TestFlight where errors are lost.
 */

/**
 * Install global error logging that prints stack traces
 * 
 * This should be called as early as possible (in index.js or top of App.tsx)
 * before any large imports that might fail.
 */
export function installGlobalErrorLogging() {
  const anyGlobal: any = global;
  const ErrorUtils = anyGlobal?.ErrorUtils;

  if (ErrorUtils?.setGlobalHandler) {
    const defaultHandler = ErrorUtils.getGlobalHandler?.();
    ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      try {
        const msg = error?.message ?? String(error);
        const stack = error?.stack ?? "";
        console.log("[GlobalError] fatal?", !!isFatal);
        console.log("[GlobalError] message:", msg);
        console.log("[GlobalError] stack:", stack);
        
        // Log error name if available
        if (error?.name) {
          console.log("[GlobalError] name:", error.name);
        }
        
        // Log toString if different from message
        const errorString = String(error);
        if (errorString !== msg) {
          console.log("[GlobalError] toString:", errorString);
        }
      } catch (e) {
        console.log("[GlobalError] failed to print", e);
      }
      // ✅ Importante: en Release/TestFlight NO queremos abort() por errores fatales.
      // Deja que nuestros guardrails mantengan viva la app para poder ver el log.
      // @ts-ignore - __DEV__ is a React Native global
      const isDev = typeof __DEV__ !== "undefined" && __DEV__;
      if (isDev) {
        defaultHandler?.(error, isFatal);
      } else {
        // En prod, solo delegar a default handler si NO es fatal.
        if (!isFatal) defaultHandler?.(error, isFatal);
      }
    });
  }

  // Promises no-catcheadas
  if (anyGlobal?.onunhandledrejection == null) {
    anyGlobal.onunhandledrejection = (event: any) => {
      const reason = event?.reason;
      console.log("[UnhandledRejection]", reason?.message ?? String(reason ?? event));
      if (reason?.stack) {
        console.log("[UnhandledRejection] stack:", reason.stack);
      }
    };
  }
}

