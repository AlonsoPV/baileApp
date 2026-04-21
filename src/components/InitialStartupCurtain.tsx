import React from "react";
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInitialAppShell } from "../context/InitialAppShellContext";

/** Cortina de bienvenida solo app nativa (iOS / Android), no web. */
const IS_NATIVE_MOBILE = Platform.OS === "ios" || Platform.OS === "android";

const CURTAIN_IMAGE_URI =
  "https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/PantallaCortina.webp";

const MIN_MS_BEFORE_CLOSE_BUTTON = 1200;
const EXIT_MS = 320;

const imageSource: ImageSourcePropType = { uri: CURTAIN_IMAGE_URI };

/**
 * Capa visual inicial: imagen a pantalla, carga real del WebView en paralelo (no bloqueada).
 * Tras 1.2s aparece el botón; al pulsar, fade out y se revela el contenido ya montado detrás.
 */
export default function InitialStartupCurtain() {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const { isWebViewInitialLoadComplete } = useInitialAppShell();

  /** Cubre todo el cristal: ventana + insets (notch, Dynamic Island, home indicator). */
  const fullBleed = React.useMemo(
    () => ({
      position: "absolute" as const,
      top: -insets.top,
      left: -insets.left,
      width: winW + insets.left + insets.right,
      height: winH + insets.top + insets.bottom,
    }),
    [insets.bottom, insets.left, insets.right, insets.top, winH, winW]
  );

  const [removed, setRemoved] = React.useState(false);
  const [closeEnabled, setCloseEnabled] = React.useState(false);
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!IS_NATIVE_MOBILE || removed) return;
    Image.prefetch(CURTAIN_IMAGE_URI).catch(() => {});
  }, [removed]);

  React.useEffect(() => {
    if (!IS_NATIVE_MOBILE || removed) return;
    const t = setTimeout(() => setCloseEnabled(true), MIN_MS_BEFORE_CLOSE_BUTTON);
    return () => clearTimeout(t);
  }, [removed]);

  const dismiss = React.useCallback(() => {
    if (!closeEnabled) return;
    Animated.timing(opacity, {
      toValue: 0,
      duration: EXIT_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setRemoved(true);
    });
  }, [closeEnabled, opacity]);

  if (!IS_NATIVE_MOBILE || removed) {
    return null;
  }

  return (
    <Animated.View
      style={[fullBleed, styles.root, { opacity }]}
      pointerEvents="auto"
      accessibilityElementsHidden={false}
      importantForAccessibility="yes"
    >
      <View style={styles.imageShell} pointerEvents="none">
        <Image
          source={imageSource}
          style={styles.fullImage}
          resizeMode="cover"
        />
      </View>

      {/* Overlay suave para legibilidad del botón */}
      <View style={styles.gradientOverlay} pointerEvents="none" />

      {closeEnabled ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          {!isWebViewInitialLoadComplete ? (
            <Text style={styles.hint} accessibilityLiveRegion="polite">
              Preparando contenido… puedes continuar.
            </Text>
          ) : null}

          <Pressable
            onPress={dismiss}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Continuar a la aplicación"
          >
            <Text style={styles.buttonText}>Continuar</Text>
          </Pressable>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 100000,
    elevation: 100000,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  imageShell: {
    ...StyleSheet.absoluteFillObject,
  },
  fullImage: {
    width: "100%",
    height: "100%",
    minWidth: "100%",
    minHeight: "100%",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  hint: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    marginBottom: 10,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
  buttonPressed: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
