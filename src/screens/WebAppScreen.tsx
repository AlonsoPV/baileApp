import React from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Text,
  TouchableOpacity,
  Linking,
} from "react-native";
import * as ExpoLinking from "expo-linking";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { AuthCoordinator } from "../auth/AuthCoordinator";

// URL principal de la web que quieres mostrar dentro de la app móvil.
// Puedes ajustar esto a staging si lo necesitas.
const WEB_APP_URL = "https://dondebailar.com.mx";

export default function WebAppScreen() {
  const [loading, setLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [webViewImportError, setWebViewImportError] = React.useState<string | null>(null);
  const [webViewModule, setWebViewModule] = React.useState<any>(null);
  const [nativeAuthInProgress, setNativeAuthInProgress] = React.useState(false);
  const [nativeAuthError, setNativeAuthError] = React.useState<string | null>(null);
  const webviewRef = React.useRef<any>(null);
  const insets = useSafeAreaInsets();
  const loadWatchdogRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLoadWatchdog = React.useCallback(() => {
    if (loadWatchdogRef.current) {
      clearTimeout(loadWatchdogRef.current);
      loadWatchdogRef.current = null;
    }
  }, []);

  const armLoadWatchdog = React.useCallback(() => {
    clearLoadWatchdog();
    // Safety net: WKWebView sometimes never fires onLoadEnd/onError when a navigation is cancelled/blocked.
    // This prevents the native overlay from becoming an "infinite spinner".
    loadWatchdogRef.current = setTimeout(() => {
      console.warn("[WebAppScreen] Load watchdog fired (60s). Clearing loader and showing error overlay.");
      setLoading(false);
      setHasError(true);
      loadWatchdogRef.current = null;
    }, 60_000);
  }, [clearLoadWatchdog]);

  const mapIncomingUrlToWebUrl = React.useCallback((incomingUrl: string): string | null => {
    try {
      // Custom scheme deep link from Supabase redirect (e.g. dondebailarmx://auth/callback?code=...)
      if (incomingUrl.startsWith("dondebailarmx://")) {
        const u = new URL(incomingUrl);
        // For custom schemes, `host` is usually the first segment after `//` (e.g. "auth")
        const host = u.host ? `/${u.host}` : "";
        const path = u.pathname || "";
        const qs = u.search || "";
        const hash = u.hash || "";
        const mappedPath = `${host}${path}` || "/auth/callback";
        return `${WEB_APP_URL}${mappedPath}${qs}${hash}`;
      }

      // Universal/App link to our domain should stay in WebView
      if (
        incomingUrl.startsWith("https://dondebailar.com.mx") ||
        incomingUrl.startsWith("https://www.dondebailar.com.mx")
      ) {
        return incomingUrl;
      }

      return null;
    } catch (e) {
      console.warn("[WebAppScreen] Failed to map incoming URL:", incomingUrl, e);
      return null;
    }
  }, []);

  const navigateWebView = React.useCallback(
    (targetUrl: string) => {
      // Prefer request URL change through WebView ref when possible.
      // Fallback is to inject JS, which works even when ref APIs differ by platform.
      try {
        webviewRef.current?.stopLoading?.();
      } catch {
        // ignore
      }

      try {
        webviewRef.current?.injectJavaScript?.(
          `window.location.href = ${JSON.stringify(targetUrl)}; true;`
        );
      } catch (e) {
        console.warn("[WebAppScreen] Failed to inject navigation JS:", e);
      }
    },
    []
  );

  const handleIncomingUrl = React.useCallback(
    (incomingUrl: string) => {
      const webUrl = mapIncomingUrlToWebUrl(incomingUrl);
      if (!webUrl) return;
      console.log("[WebAppScreen] Handling auth deep link -> WebView:", webUrl);
      navigateWebView(webUrl);
    },
    [mapIncomingUrlToWebUrl, navigateWebView]
  );

  const loadWebViewModule = React.useCallback(() => {
    try {
      // Lazy require so a missing native module does not hard-crash during import.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require("react-native-webview");
      setWebViewImportError(null);
      setWebViewModule(mod);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[WebAppScreen] Failed to load react-native-webview:", e);
      setWebViewImportError(msg);
      setWebViewModule(null);
      setLoading(false);
      setHasError(true);
    }
  }, []);

  React.useEffect(() => {
    loadWebViewModule();
  }, [loadWebViewModule]);

  React.useEffect(() => {
    return () => {
      clearLoadWatchdog();
    };
  }, [clearLoadWatchdog]);

  React.useEffect(() => {
    // Handle cold start URL
    Linking.getInitialURL()
      .then((url) => {
        if (url) handleIncomingUrl(url);
      })
      .catch(() => {});

    const sub = Linking.addEventListener("url", (event) => {
      if (event?.url) handleIncomingUrl(event.url);
    });

    return () => {
      // RN >= 0.65 returns subscription with remove()
      // @ts-ignore
      sub?.remove?.();
    };
  }, [handleIncomingUrl]);

  const getGoogleIosClientId = React.useCallback((): string => {
    // Prefer Expo extra (recommended for Xcode Cloud / EAS)
    const extra = (Constants.expoConfig as any)?.extra ?? (Constants as any)?.manifest?.extra ?? (Constants as any)?.manifest2?.extra ?? {};
    return (
      extra.googleIosClientId ||
      extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
      // build-time env fallback (may be undefined at runtime)
      (process as any)?.env?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
      ""
    );
  }, []);

  const injectWebAuthError = React.useCallback((message: string) => {
    const js = `
      try {
        window.dispatchEvent(new CustomEvent('baileapp:native-auth-error', { detail: { message: ${JSON.stringify(
          message
        )} } }));
      } catch (e) {}
      true;
    `;
    try {
      webviewRef.current?.injectJavaScript?.(js);
    } catch {
      // ignore
    }
  }, []);

  const injectWebSetSession = React.useCallback((tokens: { access_token: string; refresh_token: string }) => {
    const js = `
      (async function() {
        try {
          if (window.__BAILEAPP_SET_SUPABASE_SESSION) {
            await window.__BAILEAPP_SET_SUPABASE_SESSION(${JSON.stringify(tokens)});
          } else {
            window.dispatchEvent(new CustomEvent('baileapp:native-auth-error', { detail: { message: 'No se pudo aplicar sesión en la web (bridge no disponible).' } }));
          }
        } catch (e) {
          window.dispatchEvent(new CustomEvent('baileapp:native-auth-error', { detail: { message: 'Error aplicando sesión en la web.' } }));
        }
      })();
      true;
    `;
    try {
      webviewRef.current?.injectJavaScript?.(js);
    } catch {
      // ignore
    }
  }, []);

  const handleWebMessage = React.useCallback(
    async (event: any) => {
      const raw = event?.nativeEvent?.data;
      if (!raw) return;
      let msg: any = null;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      if (nativeAuthInProgress) return;

      if (msg?.type === "NATIVE_AUTH_APPLE") {
        setNativeAuthInProgress(true);
        setNativeAuthError(null);
        try {
          const tokens = await AuthCoordinator.signInWithApple();
          injectWebSetSession(tokens);
        } catch (e: any) {
          const message = e?.message || "Error al iniciar sesión con Apple.";
          setNativeAuthError(message);
          injectWebAuthError(message);
        } finally {
          setNativeAuthInProgress(false);
        }
      }

      if (msg?.type === "NATIVE_AUTH_GOOGLE") {
        setNativeAuthInProgress(true);
        setNativeAuthError(null);
        try {
          const clientId = getGoogleIosClientId();

          const tokens = await AuthCoordinator.signInWithGoogle(clientId);
          injectWebSetSession(tokens);
        } catch (e: any) {
          // Normalizar mensajes de error para mejor UX
          let message = e?.message || "Error al iniciar sesión con Google.";
          
          // Mejorar mensajes de error específicos
          if (e?.code === "GOOGLE_MISSING_CLIENT_ID" || message.includes("Client ID")) {
            message = "Google Sign-In no está configurado. Contacta al soporte.";
          } else if (e?.code === "GOOGLE_NO_PRESENTING_VC" || message.includes("ViewController") || message.includes("iPad")) {
            message = "No se pudo mostrar la pantalla de Google. Intenta cerrar y reabrir la app.";
          } else if (e?.code === "GOOGLE_CANCELED" || message.includes("cancelado")) {
            message = "Inicio de sesión cancelado.";
          } else if (message.includes("idToken") || message.includes("token")) {
            message = "Error al obtener credenciales de Google. Intenta de nuevo.";
          }
          
          setNativeAuthError(message);
          injectWebAuthError(message);
        } finally {
          setNativeAuthInProgress(false);
        }
      }

      if (msg?.type === "NATIVE_SIGN_OUT") {
        setNativeAuthInProgress(true);
        setNativeAuthError(null);
        try {
          await AuthCoordinator.signOut();
        } catch (e: any) {
          const message = e?.message || "No se pudo cerrar sesión.";
          setNativeAuthError(message);
          injectWebAuthError(message);
        } finally {
          setNativeAuthInProgress(false);
        }
      }
    },
    [getGoogleIosClientId, injectWebAuthError, injectWebSetSession, nativeAuthInProgress]
  );

  const handleReload = () => {
    setHasError(false);
    setLoading(true);
    if (webViewImportError || !webViewModule) {
      loadWebViewModule();
      return;
    }
    webviewRef.current?.reload();
  };

  if (webViewImportError) {
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === "ios" ? insets.top + 4 : 0 }]}>
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>WebView no disponible</Text>
          <Text style={styles.errorText}>
            Esta versión de la app no pudo cargar el módulo nativo de WebView.
          </Text>
          <Text style={[styles.errorText, { fontFamily: "monospace", fontSize: 12 }]}>
            {webViewImportError}
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleReload}>
            <Text style={styles.buttonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const WebView = webViewModule?.WebView;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "ios" ? insets.top + 4 : 0,
        },
      ]}
    >
      {WebView ? (
        <WebView
          ref={webviewRef}
          source={{ uri: WEB_APP_URL }}
          style={styles.webview}
          originWhitelist={["*"]}
          onMessage={handleWebMessage}
          // Mostrar loader inicial
          startInLoadingState
          onLoadStart={() => {
            setHasError(false);
            setLoading(true);
            armLoadWatchdog();
          }}
          onLoadEnd={() => {
            clearLoadWatchdog();
            setLoading(false);
          }}
          onError={(e: any) => {
            console.log("WebView error:", e?.nativeEvent);
            clearLoadWatchdog();
            setLoading(false);
            setHasError(true);
          }}
          onHttpError={(e: any) => {
            console.log("HTTP error:", e?.nativeEvent?.statusCode, e?.nativeEvent?.description);
          }}
          // Permitir JS y almacenamiento para que la web funcione igual que en el navegador
          javaScriptEnabled
          domStorageEnabled
          // iOS (WKWebView): helps when the embedded web requests camera/mic (iOS 15+ API)
          // This is especially important on iPad where media/capture permission flows can behave differently.
          mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
          // Keep WKWebView media behavior closer to Safari
          allowsInlineMediaPlayback
          // Habilitar cookies compartidas para mejor funcionamiento de autenticación (Supabase, Google, etc.)
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          // Deshabilitar caché para evitar problemas con actualizaciones
          cacheEnabled={false}
          // En Android: permitir contenido mixto (por si hay recursos http)
          mixedContentMode="always"
          // Evitar que target="_blank" intente abrir una nueva "ventana" nativa
          setSupportMultipleWindows={false}
          // Inyectar JavaScript para forzar que window.open y redirecciones OAuth se mantengan en el WebView
          injectedJavaScript={`
            (function() {
              const isOAuthLike = (url) => {
                try {
                  if (!url) return false;
                  const s = String(url);
                  return (
                    s.includes('supabase.co/auth/v1/') ||
                    s.includes('appleid.apple.com') ||
                    s.includes('idmsa.apple.com') ||
                    s.includes('accounts.google.com') ||
                    s.includes('google.com/o/oauth2') ||
                    s.includes('oauth2.googleapis.com') ||
                    s.includes('dondebailar.com.mx')
                  );
                } catch (e) {
                  return false;
                }
              };

              // Forzar que window.open abra en la misma pestaña
              const originalOpen = window.open;
              window.open = function(url, target, features) {
                // Si es una URL de OAuth o del mismo dominio, redirigir en la misma pestaña
                if (isOAuthLike(url)) {
                  window.location.href = url;
                  return null;
                }
                // Para otras URLs, usar el comportamiento original
                return originalOpen.call(window, url, target, features);
              };
              
              // Interceptar redirecciones de OAuth que puedan usar location.replace
              const originalReplace = window.location.replace;
              window.location.replace = function(url) {
                // Si es una URL de OAuth, permitir la redirección
                if (isOAuthLike(url)) {
                  window.location.href = url;
                } else {
                  originalReplace.call(window.location, url);
                }
              };

              // Algunos flows usan location.assign
              const originalAssign = window.location.assign;
              window.location.assign = function(url) {
                if (isOAuthLike(url)) {
                  window.location.href = url;
                } else {
                  originalAssign.call(window.location, url);
                }
              };
            })();
          `}
          // Control de navegación:
          // - Dentro del WebView: sólo nuestro dominio
          // - Fuera: redes, maps, calendarios (Apple Calendar), etc. con Linking
          onShouldStartLoadWithRequest={(request: any) => {
            const url = request.url;

            // Intercept auth deep links so they don't kick user to browser
            if (url.startsWith("dondebailarmx://")) {
              handleIncomingUrl(url);
              // Navigation cancelled: make sure we don't leave native loader stuck.
              clearLoadWatchdog();
              setLoading(false);
              return false;
            }

            const isSameDomain =
              url.startsWith("https://dondebailar.com.mx") ||
              url.startsWith("https://www.dondebailar.com.mx");

            // Permitir URLs de OAuth de Supabase dentro del WebView
            const isSupabaseOAuth =
              url.includes("supabase.co/auth/v1/authorize") ||
              url.includes("supabase.co/auth/v1/callback") ||
              url.includes("supabase.co/auth/v1/verify");

            // Permitir URLs de OAuth de Apple dentro del WebView
            const isAppleOAuth =
              url.includes("appleid.apple.com") ||
              url.includes("idmsa.apple.com") ||
              url.includes("/auth/authorize") && url.includes("apple");

            // Detectar navegación a Google OAuth / cuentas (suele abrirse durante el flow)
            const isGoogleOAuth =
              url.includes("accounts.google.com") ||
              url.includes("google.com/o/oauth2") ||
              url.includes("oauth2.googleapis.com");

            // Detectar enlaces de calendario (.ics o protocolos webcal/calshow)
            const isCalendarLink =
              url.endsWith(".ics") || url.startsWith("webcal:") || url.startsWith("calshow:");

            // Para calendario, siempre pedimos al sistema que lo maneje (Apple Calendar)
            if (isCalendarLink) {
              Linking.openURL(url).catch((err) => {
                console.warn("No se pudo abrir el calendario:", err);
              });
              // Navigation cancelled: make sure we don't leave native loader stuck.
              clearLoadWatchdog();
              setLoading(false);
              return false;
            }

            // Permitir navegación dentro del mismo dominio
            if (isSameDomain) {
              return true;
            }

            // OAuth: abrir sesión de autenticación in-app (no navegador externo “normal”)
            if (isSupabaseOAuth || isAppleOAuth || isGoogleOAuth) {
              // ✅ Guideline 4.0: Do not open browser for auth.
              // Web buttons should call native auth via postMessage.
              const msg =
                "Inicio de sesión: abre usando los botones nativos (Apple/Google). Si ves este error, actualiza la app.";
              setNativeAuthError(msg);
              injectWebAuthError(msg);
              // Navigation cancelled: make sure we don't leave native loader stuck.
              clearLoadWatchdog();
              setLoading(false);
              return false;
            }

            // Protocolos y enlaces externos (redes sociales, maps, mail, tel, etc.)
            const isExternalSupportedProtocol =
              url.startsWith("http://") ||
              url.startsWith("https://") ||
              url.startsWith("mailto:") ||
              url.startsWith("tel:") ||
              url.startsWith("geo:") ||
              url.startsWith("whatsapp:") ||
              url.startsWith("maps:") ||
              url.startsWith("sms:");

            if (isExternalSupportedProtocol) {
              Linking.openURL(url).catch((err) => {
                console.warn("No se pudo abrir la URL externa:", err);
              });
              // Navigation cancelled: make sure we don't leave native loader stuck.
              clearLoadWatchdog();
              setLoading(false);
              return false;
            }

            // Cualquier otra cosa la bloqueamos por seguridad
            clearLoadWatchdog();
            setLoading(false);
            return false;
          }}
          // Mejores gestos de navegación en iOS
          allowsBackForwardNavigationGestures
          // Evitar problemas con teclado en algunos dispositivos
          automaticallyAdjustContentInsets={false}
        />
      ) : (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#f093fb" />
        </View>
      )}

      {loading && !hasError && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#f093fb" />
        </View>
      )}

      {nativeAuthInProgress && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={{ color: "#fff", marginTop: 12, fontWeight: "600" }}>
            Conectando…
          </Text>
        </View>
      )}

      {nativeAuthError && !nativeAuthInProgress && (
        <View style={styles.authErrorOverlay}>
          <Text style={styles.errorTitle}>No se pudo iniciar sesión</Text>
          <Text style={styles.errorText}>{nativeAuthError}</Text>
          <TouchableOpacity style={styles.button} onPress={() => setNativeAuthError(null)}>
            <Text style={styles.buttonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>No se pudo cargar la página</Text>
          <Text style={styles.errorText}>
            Puede ser un problema de red, DNS o SSL. Intenta de nuevo o revisa tu conexión.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleReload}>
            <Text style={styles.buttonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Match the web navbar background so the iOS safe-area/top bar doesn't show orange.
    // Web AppShell uses background: #0b0d10.
    backgroundColor: "#0b0d10",
  },
  webview: {
    flex: 1,
    // En Android a veces ayuda a evitar espacios raros
    marginTop: Platform.OS === "android" ? 0 : 0,
  },
  loaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  errorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  authErrorOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: "rgba(0,0,0,0.92)",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  errorTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    color: "#ddd",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#f093fb",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
  },
});

