const isDev = import.meta.env.DEV;

/**
 * Logging helpers: log/info/debug/warn only run in development (Vite `import.meta.env.DEV`).
 * Use `error` for failures that should remain visible in production consoles.
 */
export const logger = {
  log(...args: unknown[]) {
    if (isDev) console.log(...args);
  },
  debug(...args: unknown[]) {
    if (isDev) console.debug(...args);
  },
  info(...args: unknown[]) {
    if (isDev) console.info(...args);
  },
  warn(...args: unknown[]) {
    if (isDev) console.warn(...args);
  },
  error(...args: unknown[]) {
    console.error(...args);
  },
};
