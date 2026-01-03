import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { useWelcomeCurtain } from '../hooks/useWelcomeCurtain';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// URL del logo desde Supabase Storage
const LOGO_URL = 'https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/icono%20(2).png';

/**
 * Cortina de bienvenida que se muestra solo en cold start
 * 
 * Características:
 * - Cubre 100% de la pantalla útil
 * - NO oculta ni modifica la navbar
 * - Logo centrado
 * - Botón de cierre abajo-centro
 * - Animaciones suaves
 */
export function WelcomeCurtain() {
  const { shouldShow, isReady, markAsSeen } = useWelcomeCurtain();
  const insets = useSafeAreaInsets();
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // Mostrar animación de entrada
  useEffect(() => {
    if (shouldShow && isReady) {
      // Delay inicial para que se vea el logo aparecer
      const timer = setTimeout(() => {
        // Animación de entrada
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          // Mostrar botón después de un delay
          Animated.sequence([
            Animated.delay(300),
            Animated.timing(buttonOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [shouldShow, isReady, fadeAnim, logoScale, buttonOpacity]);

  // Función para cerrar con animación
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      markAsSeen();
    });
  };

  // No renderizar si no debe mostrarse o no está listo
  if (!shouldShow || !isReady) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Fondo con color de navbar */}
      <View style={[styles.background, { backgroundColor: colors.primary[600] }]} />

      {/* Contenido centrado */}
      <View style={styles.content}>
        {/* Logo centrado */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={{ uri: LOGO_URL }}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Botón de cierre abajo-centro */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: buttonOpacity,
              paddingBottom: Math.max(insets.bottom, 32),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
            accessibilityLabel="Cerrar cortina de bienvenida"
            accessibilityRole="button"
          >
            <View style={styles.closeIcon}>
              <View style={[styles.closeLine, { transform: [{ rotate: '45deg' }] }]} />
              <View style={[styles.closeLine, { transform: [{ rotate: '-45deg' }] }]} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 9999,
    elevation: 9999, // Android
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 80, // Espacio para el botón
  },
  logo: {
    width: 120,
    height: 120,
    // Sombra sutil para destacar el logo
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  closeIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLine: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
});

