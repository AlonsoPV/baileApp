import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[supabaseClient] Missing Supabase URL or anon key', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
  });
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    // IMPORTANT (iPad/WKWebView): prevent "hung forever" network calls.
    // Use AbortSignal.timeout when available so the underlying fetch is actually aborted
    // (unlike Promise.race timeouts which don't cancel the request).
    fetch: (input: RequestInfo | URL, init?: RequestInit) => {
      const baseFetch = globalThis.fetch.bind(globalThis);
      // Keep this LOWER than app-level Promise timeouts, so we actually abort
      // the underlying request before UI timeouts fire (prevents "hung socket"
      // from blocking subsequent requests).
      const timeoutMs = 7_000;

      const timeoutSignal =
        // @ts-ignore - AbortSignal.timeout is not in all TS libs yet
        typeof AbortSignal !== 'undefined' && typeof (AbortSignal as any).timeout === 'function'
          // @ts-ignore
          ? (AbortSignal as any).timeout(timeoutMs)
          : undefined;

      const userSignal = init?.signal;

      // Combine signals without setTimeout (debug-mode safe)
      const combinedSignal =
        // @ts-ignore - AbortSignal.any is not in all TS libs yet
        typeof AbortSignal !== 'undefined' && typeof (AbortSignal as any).any === 'function'
          ? // @ts-ignore
            (AbortSignal as any).any([userSignal, timeoutSignal].filter(Boolean))
          : userSignal ?? timeoutSignal;

      const inputUrl = (() => {
        try {
          if (typeof input === 'string') return input;
          if (input instanceof URL) return input.toString();
          // Request
          // @ts-ignore
          if (input?.url) return String(input.url);
        } catch {}
        return '';
      })();

      // DEV-only: simulate slow/hung backend to validate timeouts + UI.
      // Usage examples:
      // - Add `?dbgFetchTarget=rpc&dbgFetchDelayMs=30000` to the URL (dev only)
      // - Or set localStorage keys: dbgFetchTarget="rpc", dbgFetchDelayMs="30000"
      // - For a hard hang: `?dbgFetchTarget=rpc&dbgFetchHang=1` (dev only)
      //
      // Targets:
      // - rpc  (default): only affects /rest/v1/rpc/* (e.g. merge_profiles_user)
      // - tags: only affects /rest/v1/tags
      // - auth: only affects /auth/v1/*
      // - all : affects everything
      if (import.meta.env.DEV) {
        try {
          const search = globalThis.location?.search ?? "";
          const sp = new URLSearchParams(search);
          const target =
            (sp.get("dbgFetchTarget") ??
              globalThis.localStorage?.getItem("dbgFetchTarget") ??
              "rpc")
              .toLowerCase()
              .trim();

          const isRpc = inputUrl.includes("/rest/v1/rpc/");
          const isTags = inputUrl.includes("/rest/v1/tags");
          const isAuth = inputUrl.includes("/auth/v1/");

          const shouldApply =
            target === "all" ||
            (target === "rpc" && isRpc) ||
            (target === "tags" && isTags) ||
            (target === "auth" && isAuth);

          if (!shouldApply) {
            return baseFetch(input, {
              ...init,
              signal: combinedSignal,
            });
          }

          const hang =
            sp.get("dbgFetchHang") === "1" ||
            globalThis.localStorage?.getItem("dbgFetchHang") === "1";
          if (hang) {
            // Simulate a request that "never responds", but still respects abort signals.
            // This is important so global AbortSignal.timeout can end the wait and the UI can recover.
            return new Promise<Response>((_resolve, reject) => {
              if (combinedSignal) {
                const onAbort = () => {
                  try {
                    reject(new DOMException("Aborted", "AbortError"));
                  } catch {
                    reject(new Error("Aborted"));
                  }
                };
                if (combinedSignal.aborted) onAbort();
                else combinedSignal.addEventListener("abort", onAbort, { once: true });
              }
              // Intentionally never resolves.
            });
          }

          const rawDelay =
            sp.get("dbgFetchDelayMs") ??
            globalThis.localStorage?.getItem("dbgFetchDelayMs") ??
            "0";
          const delayMs = Number(rawDelay);
          if (Number.isFinite(delayMs) && delayMs > 0) {
            return new Promise<Response>((resolve, reject) => {
              const t = (globalThis.setTimeout ?? setTimeout)(async () => {
                try {
                  resolve(
                    await baseFetch(input, {
                      ...init,
                      signal: combinedSignal,
                    })
                  );
                } catch (e) {
                  reject(e);
                }
              }, delayMs);

              if (combinedSignal) {
                // If request aborts while we're "simulating slowness", stop early.
                const onAbort = () => {
                  (globalThis.clearTimeout ?? clearTimeout)(t);
                  try {
                    // Best-effort AbortError; shape varies by runtime
                    reject(new DOMException("Aborted", "AbortError"));
                  } catch {
                    reject(new Error("Aborted"));
                  }
                };
                if (combinedSignal.aborted) onAbort();
                else combinedSignal.addEventListener("abort", onAbort, { once: true });
              }
            });
          }
        } catch {
          // Ignore debug flag parsing errors
        }
      }

      return baseFetch(input, {
        ...init,
        signal: combinedSignal,
      });
    },
    headers: {
      'x-client-info': 'baileapp-web',
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    // Configuración de Realtime para manejar conexiones de manera más robusta
    params: {
      eventsPerSecond: 10,
    },
    // Configuración adicional para mejorar la estabilidad de WebSocket
    // timeout: tiempo máximo para establecer conexión (30 segundos)
    // heartbeatIntervalMs: intervalo para mantener la conexión viva (30 segundos)
    // reconnectAfterMs: tiempo antes de intentar reconectar (1 segundo)
    // transport: usar 'websocket' explícitamente para mejor compatibilidad
  },
});


