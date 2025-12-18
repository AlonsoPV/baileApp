/**
 * Global error handler for React Native
 * 
 * Prevents SIGABRT crashes by catching unhandled JavaScript exceptions
 * and promise rejections that occur outside of React component render cycles.
 * 
 * This is critical because ErrorBoundary only catches errors during render,
 * not async errors or errors in event handlers.
 */

import { ErrorUtils } from "react-native";

type ErrorHandler = (error: Error, isFatal?: boolean) => void;

let originalErrorHandler: ErrorHandler | null = null;
let isHandlerInstalled = false;

/**
 * Enhanced error handler that prevents crashes
 * 
 * React Native's default handler calls abort() on fatal errors, causing SIGABRT.
 * This handler prevents that by catching all errors and logging them instead.
 */
function handleError(error: Error, isFatal: boolean = false) {
  // Log the error with full context
  console.error("[GlobalErrorHandler] Unhandled error:", error);
  console.error("[GlobalErrorHandler] Error name:", error.name);
  console.error("[GlobalErrorHandler] Error message:", error.message);
  console.error("[GlobalErrorHandler] Error stack:", error.stack);
  console.error("[GlobalErrorHandler] Is fatal:", isFatal);

  // Always log to help with debugging, even in production
  try {
    // Try to get more context if available
    if (error.stack) {
      console.error("[GlobalErrorHandler] Full stack trace:", error.stack);
    }
  } catch (e) {
    // Ignore errors in error logging
  }

  // In development: show red screen for fatal errors to help debugging
  // @ts-ignore - __DEV__ is a React Native global
  const isDev = typeof __DEV__ !== "undefined" && __DEV__;
  
  if (isDev && isFatal) {
    // In dev, let the original handler show the red screen for fatal errors
    // This helps developers see and fix issues during development
    try {
      if (originalErrorHandler) {
        originalErrorHandler(error, isFatal);
      }
    } catch (e) {
      // If the original handler itself crashes, log and continue
      console.error("[GlobalErrorHandler] Original handler failed:", e);
    }
    return;
  }

  // In production/TestFlight: ALWAYS prevent crash
  // Never call abort() - log the error and let the app continue
  // Individual components can handle errors gracefully via ErrorBoundary
  console.warn(
    "[GlobalErrorHandler] Error caught and handled to prevent crash. " +
    "The app will continue running. Check logs for details."
  );
  
  // Optionally, you could send error reports to a crash reporting service here
  // e.g., Sentry, Bugsnag, etc.
}

/**
 * Handle unhandled promise rejections
 */
function handleUnhandledRejection(event: PromiseRejectionEvent) {
  const error = event.reason instanceof Error 
    ? event.reason 
    : new Error(String(event.reason || "Unhandled promise rejection"));

  console.error("[GlobalErrorHandler] Unhandled promise rejection:", error);
  console.error("[GlobalErrorHandler] Reason:", event.reason);

  // Handle as a non-fatal error (promise rejections shouldn't crash the app)
  handleError(error, false);

  // Prevent default behavior (which would crash)
  event.preventDefault?.();
}

/**
 * Install the global error handler
 * Call this early in the app lifecycle (e.g., in index.js or App.tsx)
 */
export function installGlobalErrorHandler() {
  if (isHandlerInstalled) {
    console.warn("[GlobalErrorHandler] Handler already installed, skipping");
    return;
  }

  try {
    // Store the original handler
    originalErrorHandler = ErrorUtils.getGlobalHandler();

    // Set our enhanced handler
    ErrorUtils.setGlobalHandler(handleError);

    // Handle unhandled promise rejections
    if (typeof global !== "undefined") {
      // @ts-ignore - global may not have addEventListener in all environments
      if (global.addEventListener) {
        global.addEventListener("unhandledrejection", handleUnhandledRejection);
      }
    }

    isHandlerInstalled = true;
    console.log("[GlobalErrorHandler] Global error handler installed successfully");
  } catch (error) {
    console.error("[GlobalErrorHandler] Failed to install error handler:", error);
  }
}

/**
 * Uninstall the global error handler (useful for testing)
 */
export function uninstallGlobalErrorHandler() {
  if (!isHandlerInstalled) {
    return;
  }

  try {
    if (originalErrorHandler) {
      ErrorUtils.setGlobalHandler(originalErrorHandler);
      originalErrorHandler = null;
    }

    if (typeof global !== "undefined") {
      // @ts-ignore
      if (global.removeEventListener) {
        global.removeEventListener("unhandledrejection", handleUnhandledRejection);
      }
    }

    isHandlerInstalled = false;
    console.log("[GlobalErrorHandler] Global error handler uninstalled");
  } catch (error) {
    console.error("[GlobalErrorHandler] Failed to uninstall error handler:", error);
  }
}

