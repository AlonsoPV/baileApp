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
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const baseFetch = globalThis.fetch.bind(globalThis);
      // Abort underlying requests (WKWebView / Android WebView can "hang").
      //
      // IMPORTANT:
      // - Auth refresh (/auth/v1/token) can legitimately take longer on mobile networks.
      //   If we abort too aggressively, Supabase may emit a refresh event with no session
      //   and the app will "kick out" the user.
      // - Keep non-auth requests reasonably tight to avoid endless spinners.
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

      const isRpc = inputUrl.includes("/rest/v1/rpc/");
      const isAuth = inputUrl.includes("/auth/v1/");

      // Defaults:
      // - auth: higher to prevent accidental logout on slow refresh
      // - rpc: moderate (profile saves can take a bit)
      // - other: moderate
      const timeoutMs = isAuth ? 20_000 : isRpc ? 30_000 : 12_000;
      const userSignal = init?.signal;

      // IMPORTANT: Don't rely on AbortSignal.timeout/any (not available everywhere, especially Safari).
      // Always create a controller-based timeout so requests can't hang forever.
      const controller = new AbortController();
      const timeoutId = (globalThis.setTimeout ?? setTimeout)(() => {
        try {
          controller.abort();
        } catch {}
      }, timeoutMs);

      // Forward user abort to our controller.
      if (userSignal) {
        const onAbort = () => {
          try {
            controller.abort();
          } catch {}
        };
        if (userSignal.aborted) onAbort();
        else userSignal.addEventListener('abort', onAbort, { once: true });
      }

      const combinedSignal = controller.signal;

      // DEV-only: simulate slow/hung backend to validate timeouts + UI.
      // Usage examples:
      // - Add `?dbgFetchTarget=rpc&dbgFetchDelayMs=30000` to the URL (dev only)
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
            (sp.get("dbgFetchTarget") ?? "rpc")
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
            try {
              return await baseFetch(input, { ...init, signal: combinedSignal });
            } finally {
              (globalThis.clearTimeout ?? clearTimeout)(timeoutId);
            }
          }

          const hang =
            sp.get("dbgFetchHang") === "1";
          if (hang) {
            // Simulate a request that "never responds", but still respects abort signals.
            // This is important so global AbortSignal.timeout can end the wait and the UI can recover.
            return new Promise<Response>((_resolve, reject) => {
              if (combinedSignal) {
                const onAbort = () => {
                  (globalThis.clearTimeout ?? clearTimeout)(timeoutId);
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
            sp.get("dbgFetchDelayMs") ?? "0";
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
                } finally {
                  (globalThis.clearTimeout ?? clearTimeout)(timeoutId);
                }
              }, delayMs);

              if (combinedSignal) {
                // If request aborts while we're "simulating slowness", stop early.
                const onAbort = () => {
                  (globalThis.clearTimeout ?? clearTimeout)(t);
                  (globalThis.clearTimeout ?? clearTimeout)(timeoutId);
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

      let response: Response;
      try {
        response = await baseFetch(input, {
          ...init,
          signal: combinedSignal,
        });
      } finally {
        (globalThis.clearTimeout ?? clearTimeout)(timeoutId);
      }

      // 🔄 Manejar errores de refresh token inválido
      // Si el refresh token es inválido, limpiar la sesión automáticamente
      if (inputUrl.includes('/auth/v1/token') && response.status === 400) {
        try {
          const clonedResponse = response.clone();
          const errorData = await clonedResponse.json().catch(() => null);
          const errorMessage = errorData?.error_description || errorData?.error || errorData?.message || '';
          const isRefreshTokenError = 
            errorMessage.includes('Refresh Token Not Found') ||
            errorMessage.includes('Invalid Refresh Token') ||
            errorMessage.includes('refresh_token_not_found') ||
            errorMessage.includes('refresh_token') && errorMessage.toLowerCase().includes('invalid');
          
          if (isRefreshTokenError) {
            console.warn('[supabaseClient] Refresh token inválido detectado, limpiando sesión...');
            // Limpiar sesión local sin hacer otra petición
            try {
              // Usar signOut con scope 'local' para evitar hacer otra petición al servidor
              await supabase.auth.signOut({ scope: 'local' });
            } catch (signOutError) {
              // Si falla signOut, limpiar localStorage manualmente
              try {
                const storageKey = `sb-${supabaseUrl.split('//')[1]?.split('.')[0]}-auth-token`;
                if (typeof localStorage !== 'undefined') {
                  localStorage.removeItem(storageKey);
                }
              } catch {}
            }
            // No forzar redirect aquí: puede causar "rebotes" en localhost.
            // Dejamos que el router/guards reaccionen al estado de sesión nulo.
          }
        } catch {
          // Si no podemos parsear el error, continuar normalmente
        }
      }

      return response;
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


