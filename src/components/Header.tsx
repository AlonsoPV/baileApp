// src/components/Header.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  colors,
  spacing,
  typography,
  layout,
  shadows,
  borderRadius,
} from '../theme';

interface HeaderProps {
  title: string;
  onMenuPress: () => void;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
}

/**
 * Header fijo en la parte superior que respeta la safe area,
 * mantiene una altura estable y se dibuja siempre por encima del contenido.
 */
export function Header({ title, onMenuPress, rightAction }: HeaderProps) {
  return (
    <>
      <StatusBar style="light" />

      {/* SafeAreaView se encarga de no pisar la status bar */}
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          {/* Fondo degradado simulado */}
          <View style={styles.gradientBg} />

          <View style={styles.content}>
            {/* Botón menú */}
            <TouchableOpacity
              onPress={onMenuPress}
              style={styles.iconButton}
              activeOpacity={0.7}
            >
              <View style={styles.hamburger}>
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
              </View>
            </TouchableOpacity>

            {/* Título */}
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>

            {/* Acción derecha (por ejemplo, botón de login / ajustes) */}
            {rightAction ? (
              <TouchableOpacity
                onPress={rightAction.onPress}
                style={styles.iconButton}
                activeOpacity={0.7}
              >
                <Text style={styles.rightIcon}>{rightAction.icon}</Text>
              </TouchableOpacity>
            ) : (
              // Placeholder para mantener alineación cuando no hay acción
              <View style={styles.iconButton} />
            )}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.primary[600],
    // Nos aseguramos de que todo el header esté por encima del contenido
    zIndex: 20,
    ...shadows.md,
    elevation: 20, // Override elevation from shadows.md
  },
  header: {
    // Altura mínima del header (puede crecer si el texto lo requiere)
    minHeight: layout.headerHeight,
    backgroundColor: colors.primary[600],
    position: 'relative',
    width: '100%',
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary[700],
    opacity: 0.2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    // Un poco de padding vertical para que no se vea aplastado
    paddingVertical: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburger: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: '100%',
    height: 3,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
  },
  title: {
    flex: 1,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.background,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  rightIcon: {
    fontSize: typography.sizes['2xl'],
    color: colors.background,
  },
});
