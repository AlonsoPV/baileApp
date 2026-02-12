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
import { assertGoogleAuthConfig } from "../auth/assertGoogleAuthConfig";
import { logHost, shouldAuthDebug } from "../utils/authDebug";

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

  const getGoogleWebClientId = React.useCallback((): string => {
    const extra =
      (Constants.expoConfig as any)?.extra ??
      (Constants as any)?.manifest?.extra ??
      (Constants as any)?.manifest2?.extra ??
      {};
    return (
      extra.googleWebClientId ||
      extra.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      (process as any)?.env?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      ""
    );
  }, []);

  const shouldGoogleSignInDebug = React.useCallback((): boolean => {
    const extra =
      (Constants.expoConfig as any)?.extra ??
      (Constants as any)?.manifest?.extra ??
      (Constants as any)?.manifest2?.extra ??
      {};
    const v = extra.BAILEAPP_GOOGLE_SIGNIN_DEBUG ?? (process as any)?.env?.BAILEAPP_GOOGLE_SIGNIN_DEBUG;
    if (typeof v === "boolean") return v;
    const s = String(v ?? "").trim().toLowerCase();
    return s === "1" || s === "true" || s === "yes";
  }, []);

  const mask = React.useCallback((v: string) => {
    const t = String(v ?? "").trim();
    if (!t) return "(empty)";
    if (t.length <= 10) return `${t.slice(0, 2)}...${t.slice(-2)}`;
    return `${t.slice(0, 6)}...${t.slice(-6)}`;
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
      
      if (shouldAuthDebug()) {
        logHost("onMessage raw", { rawLength: raw?.length, rawPreview: String(raw).slice(0, 100) });
      }
      
      let msg: any = null;
      try {
        msg = JSON.parse(raw);
      } catch {
        if (shouldAuthDebug()) {
          logHost("onMessage parse failed", { raw });
        }
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
          const requestId = String(msg?.requestId || "");
          logHost("action=NATIVE_AUTH_GOOGLE", { requestId, platform: Platform.OS });
          
          const clientId = getGoogleIosClientId();
          const webClientId = getGoogleWebClientId();

          if (__DEV__ || shouldGoogleSignInDebug()) {
            // eslint-disable-next-line no-console
            console.log("[WebAppScreen] NATIVE_AUTH_GOOGLE", {
              platform: Platform.OS,
              requestId: requestId || "(none)",
              iosClientId: mask(clientId),
              webClientId: mask(webClientId),
              iosClientIdEmpty: !String(clientId || "").trim(),
              webClientIdEmpty: !String(webClientId || "").trim(),
              note:
                Platform.OS === "ios" && !String(clientId || "").trim()
                  ? "iosClientId missing in JS; relying on Info.plist fallback"
                  : undefined,
            });
          }
          
          logHost("calling native GoogleSignIn", {
            requestId,
            iosClientId: mask(clientId),
            webClientId: mask(webClientId),
            iosClientIdEmpty: !String(clientId || "").trim(),
            webClientIdEmpty: !String(webClientId || "").trim(),
          });
          
          // Self-check: falla rápido con mensaje accionable si falta config (evita "contacta a soporte" genérico).
          assertGoogleAuthConfig({ getIosClientId: getGoogleIosClientId, getWebClientId: getGoogleWebClientId });

          const tokens = await AuthCoordinator.signInWithGoogle(String(clientId || ""), requestId, String(webClientId || ""));
          injectWebSetSession(tokens);
        } catch (e: any) {
          // Normalizar mensajes de error para mejor UX
          const requestId = String(msg?.requestId || (e as any)?.requestId || "");
          const rawMessage = String(e?.message ?? e ?? "Error al iniciar sesión con Google.");
          const rawCode = String(e?.code ?? "");
          const rawStatus = String((e as any)?.status ?? (e as any)?.statusCode ?? "");
          const rawName = String((e as any)?.name ?? "");

          if (__DEV__) {
            try {
              // eslint-disable-next-line no-console
              console.log("[WebAppScreen] Google native auth error (raw)", {
                requestId,
                code: rawCode || "(none)",
                status: rawStatus || "(none)",
                name: rawName || "(none)",
                message: rawMessage,
                keys: e && typeof e === "object" ? Object.keys(e) : [],
              });
            } catch {}
          }

          // Derivar code si el bridge no lo provee (común en algunos builds/bridges)
          const derivedCode = (() => {
            if (rawCode) return rawCode;
            if (/network\s+request\s+failed/i.test(rawMessage) || /No hay conexión/i.test(rawMessage) || /fetch\s+failed/i.test(rawMessage)) return "NETWORK_ERROR";
            if (/audience/i.test(rawMessage) || /invalid.*jwt/i.test(rawMessage) || /bad.*jwt/i.test(rawMessage)) return "invalid_jwt";
            if (/GIDServerClientID/i.test(rawMessage) || /web client id/i.test(rawMessage)) return "GOOGLE_MISSING_WEB_CLIENT_ID";
            if (/url scheme/i.test(rawMessage) || /CFBundleURLSchemes/i.test(rawMessage) || /com\.googleusercontent\.apps/i.test(rawMessage)) return "GOOGLE_MISSING_URL_SCHEME";
            if (/idtoken/i.test(rawMessage) || /id token/i.test(rawMessage)) return "GOOGLE_MISSING_ID_TOKEN";
            if (/client id/i.test(rawMessage)) return "GOOGLE_MISSING_CLIENT_ID";
            if (/nonce/i.test(rawMessage) && /mismatch/i.test(rawMessage)) return "NONCE_MISMATCH";
            // Fallbacks last (so they don't mask the real semantic error)
            if (rawStatus) return `HTTP_${rawStatus}`;
            if (rawName) return rawName;
            return "";
          })();

          let message = rawMessage;
          
          // Mensajes accionables (sin "contactar a soporte" genérico).
          if (derivedCode === "GOOGLE_MISSING_CLIENT_ID" || message.includes("Client ID")) {
            message =
              "Google Sign-In no está configurado: falta el iOS Client ID. Configura EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID en .env y en EAS/Xcode Cloud, o GIDClientID en Info.plist.";
          } else if (derivedCode === "GOOGLE_MISSING_WEB_CLIENT_ID") {
            message =
              "Google Sign-In no está configurado para Supabase: falta el Web Client ID. Añade GIDServerClientID en Info.plist o EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.";
          } else if (derivedCode === "GOOGLE_IOS_CLIENT_ID_IS_WEB") {
            message =
              "Google Sign-In mal configurado: no uses el Web Client ID como iOS Client ID. En Google Cloud usa el cliente tipo iOS para GIDClientID.";
          } else if (derivedCode === "GOOGLE_MISSING_URL_SCHEME") {
            message =
              "Google Sign-In no puede regresar a la app: añade el scheme com.googleusercontent.apps.XXX a CFBundleURLSchemes en Info.plist.";
          } else if (derivedCode === "GOOGLE_NO_PRESENTING_VC" || message.includes("ViewController") || message.includes("iPad")) {
            message = "No se pudo mostrar la pantalla de Google. Intenta cerrar y reabrir la app.";
          } else if (derivedCode === "GOOGLE_CANCELED" || message.includes("cancelado")) {
            message = "Inicio de sesión cancelado.";
          } else if (derivedCode === "GOOGLE_MISSING_ID_TOKEN" || message.includes("idToken") || message.includes("id token")) {
            message = "Google no devolvió credenciales (idToken). Verifica que el Client ID sea el de iOS y que el bundle id sea correcto.";
          } else if (derivedCode === "NETWORK_ERROR") {
            message =
              "No hay conexión o el servidor no responde. Revisa tu red e intenta de nuevo.";
          } else if (derivedCode === "NONCE_MISMATCH") {
            message =
              "Error de validación al iniciar sesión con Google. Intenta de nuevo.";
          } else if (
            derivedCode === "invalid_jwt" ||
            derivedCode === "bad_jwt" ||
            /audience/i.test(message) ||
            /invalid.*jwt/i.test(message)
          ) {
            message =
              "Supabase rechazó el token de Google (audience/JWT). Verifica que en Supabase el Provider de Google use el Web Client ID y que en Xcode Cloud esté EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.";
          }

          // If we got an HTTP-ish error (Supabase), don't mislabel it as a Google credential issue.
          if (!message) message = rawMessage;
          // Only fallback to a generic Supabase message when the backend didn't provide anything useful.
          // Otherwise keep the original error text so we can debug (e.g. invalid_jwt).
          const isUnhelpful =
            !rawMessage ||
            rawMessage === "Error" ||
            rawMessage === "AuthApiError" ||
            rawMessage === "Bad Request" ||
            rawMessage === "Request failed with status code 400";
          if (isUnhelpful) {
            if (rawStatus && (derivedCode.startsWith("HTTP_") || /Auth/i.test(rawName))) {
              message = "Error al iniciar sesión: Supabase rechazó la solicitud. Intenta de nuevo.";
            }
          }

          if (requestId || derivedCode || rawStatus) {
            const suffix = [
              derivedCode ? `code: ${derivedCode}` : null,
              rawStatus ? `status: ${rawStatus}` : null,
              requestId ? `req: ${requestId}` : null,
            ].filter(Boolean).join(", ");
            message = `${message} (${suffix})`;
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
    [getGoogleIosClientId, getGoogleWebClientId, injectWebAuthError, injectWebSetSession, nativeAuthInProgress]
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
          // Android: habilitar caché mejora mucho la velocidad percibida del WebView (login y navegación)
          // iOS: mantener comportamiento actual (WKWebView suele cachear de forma segura).
          cacheEnabled={Platform.OS === "android"}
          // @ts-ignore - prop solo aplica a Android en react-native-webview
          cacheMode={Platform.OS === "android" ? "LOAD_DEFAULT" : undefined}
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
              // iOS: for App Review compliance we keep auth in-app (native buttons).
              // Android: allow web OAuth inside the WebView (no native modules yet).
              if (Platform.OS === "android") {
                return true;
              } else {
                const msg =
                  "Inicio de sesión: abre usando los botones nativos (Apple/Google). Si ves este error, actualiza la app.";
                setNativeAuthError(msg);
                injectWebAuthError(msg);
                // Navigation cancelled: make sure we don't leave native loader stuck.
                clearLoadWatchdog();
                setLoading(false);
                return false;
              }
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

