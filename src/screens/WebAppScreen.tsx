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
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// URL principal de la web que quieres mostrar dentro de la app móvil.
// Puedes ajustar esto a staging si lo necesitas.
const WEB_APP_URL = "https://dondebailar.com.mx";
export default function WebAppScreen() {
  const [loading, setLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const webviewRef = React.useRef<WebView | null>(null);
  const insets = useSafeAreaInsets();

  const handleReload = () => {
    setHasError(false);
    setLoading(true);
    webviewRef.current?.reload();
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "ios" ? insets.top + 4 : 0,
        },
      ]}
    >
      <WebView
        ref={webviewRef}
        source={{ uri: WEB_APP_URL }}
        style={styles.webview}
        originWhitelist={["*"]}
        // Mostrar loader inicial
        startInLoadingState
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setHasError(true);
        }}
        // Permitir JS y almacenamiento para que la web funcione igual que en el navegador
        javaScriptEnabled
        domStorageEnabled
        // En Android: permitir contenido mixto (por si hay recursos http)
        mixedContentMode="always"
        // Evitar que target="_blank" intente abrir una nueva "ventana" nativa
        setSupportMultipleWindows={false}
        // Control de navegación:
        // - Dentro del WebView: sólo nuestro dominio
        // - Fuera: redes, maps, calendarios (Apple Calendar), etc. con Linking
        onShouldStartLoadWithRequest={(request) => {
          const url = request.url;

          const isSameDomain =
            url.startsWith("https://dondebailar.com.mx") ||
            url.startsWith("https://www.dondebailar.com.mx");

          // Detectar enlaces de calendario (.ics o protocolos webcal/calshow)
          const isCalendarLink =
            url.endsWith(".ics") ||
            url.startsWith("webcal:") ||
            url.startsWith("calshow:");

          // Para calendario, siempre pedimos al sistema que lo maneje (Apple Calendar)
          if (isCalendarLink) {
            Linking.openURL(url).catch((err) => {
              console.warn("No se pudo abrir el calendario:", err);
            });
            return false;
          }

          if (isSameDomain) {
            return true;
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

