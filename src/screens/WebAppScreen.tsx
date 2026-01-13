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
import * as WebBrowser from "expo-web-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// URL principal de la web que quieres mostrar dentro de la app móvil.
// Puedes ajustar esto a staging si lo necesitas.
const WEB_APP_URL = "https://dondebailar.com.mx";

// Required for iOS auth sessions cleanup (safe to call always)
WebBrowser.maybeCompleteAuthSession();

export default function WebAppScreen() {
  const [loading, setLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [webViewImportError, setWebViewImportError] = React.useState<string | null>(null);
  const [webViewModule, setWebViewModule] = React.useState<any>(null);
  const [authSessionInProgress, setAuthSessionInProgress] = React.useState(false);
  const webviewRef = React.useRef<any>(null);
  const insets = useSafeAreaInsets();

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

  const startAuthSession = React.useCallback(
    async (startUrl: string) => {
      if (authSessionInProgress) return;
      setAuthSessionInProgress(true);
      try {
        // Must match the redirectTo configured in the web app when inside WebView
        const returnUrl = ExpoLinking.createURL("auth/callback", { scheme: "dondebailarmx" });

        const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);

        if (result.type === "success" && "url" in result && result.url) {
          handleIncomingUrl(result.url);
        } else {
          console.log("[WebAppScreen] Auth session finished:", result.type);
        }
      } catch (e) {
        console.warn("[WebAppScreen] Auth session failed:", e);
      } finally {
        setAuthSessionInProgress(false);
      }
    },
    [authSessionInProgress, handleIncomingUrl]
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
          // Mostrar loader inicial
          startInLoadingState
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(e: any) => {
            console.log("WebView error:", e?.nativeEvent);
            setLoading(false);
            setHasError(true);
          }}
          onHttpError={(e: any) => {
            console.log("HTTP error:", e?.nativeEvent?.statusCode, e?.nativeEvent?.description);
          }}
          // Permitir JS y almacenamiento para que la web funcione igual que en el navegador
          javaScriptEnabled
          domStorageEnabled
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
              // Forzar que window.open abra en la misma pestaña
              const originalOpen = window.open;
              window.open = function(url, target, features) {
                // Si es una URL de OAuth o del mismo dominio, redirigir en la misma pestaña
                if (url && (url.includes('supabase.co') || url.includes('appleid.apple.com') || url.includes('dondebailar.com.mx'))) {
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
                if (url && (url.includes('supabase.co') || url.includes('appleid.apple.com') || url.includes('dondebailar.com.mx'))) {
                  window.location.href = url;
                } else {
                  originalReplace.call(window.location, url);
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
              return false;
            }

            // Permitir navegación dentro del mismo dominio
            if (isSameDomain) {
              return true;
            }

            // OAuth: abrir sesión de autenticación in-app (no navegador externo “normal”)
            // Esto evita que el usuario “salga” de la app y garantiza retorno por deep link.
            if (isSupabaseOAuth || isAppleOAuth || isGoogleOAuth) {
              void startAuthSession(url);
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
              return false;
            }

            // Cualquier otra cosa la bloqueamos por seguridad
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
    // Usamos un color similar al de la barra superior de la web
    // para que el espacio del notch/status bar se vea integrado.
    backgroundColor: "#FF7A3C",
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

