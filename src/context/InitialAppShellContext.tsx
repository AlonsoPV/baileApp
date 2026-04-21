import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type InitialAppShellContextValue = {
  /** Primera carga del documento principal en WebView (explora / home web). */
  isWebViewInitialLoadComplete: boolean;
  reportWebViewInitialLoadComplete: () => void;
};

const InitialAppShellContext = createContext<InitialAppShellContextValue | null>(null);

export function InitialAppShellProvider({ children }: { children: React.ReactNode }) {
  const [isWebViewInitialLoadComplete, setReady] = useState(false);
  const reportWebViewInitialLoadComplete = useCallback(() => {
    setReady(true);
  }, []);

  const value = useMemo(
    () => ({
      isWebViewInitialLoadComplete,
      reportWebViewInitialLoadComplete,
    }),
    [isWebViewInitialLoadComplete, reportWebViewInitialLoadComplete]
  );

  return <InitialAppShellContext.Provider value={value}>{children}</InitialAppShellContext.Provider>;
}

export function useInitialAppShell(): InitialAppShellContextValue {
  const ctx = useContext(InitialAppShellContext);
  if (!ctx) {
    throw new Error("useInitialAppShell must be used within InitialAppShellProvider");
  }
  return ctx;
}
