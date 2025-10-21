// src/components/Header.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { colors, spacing, typography, layout, shadows } from '../theme';

interface HeaderProps {
  title: string;
  onMenuPress: () => void;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
}

export function Header({ title, onMenuPress, rightAction }: HeaderProps) {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary[600]} />
      <View style={styles.header}>
        {/* Gradient background simulation */}
        <View style={styles.gradientBg} />
        
        <View style={styles.content}>
          {/* Menu Button */}
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

          {/* Title */}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          {/* Right Action */}
          {rightAction ? (
            <TouchableOpacity
              onPress={rightAction.onPress}
              style={styles.iconButton}
              activeOpacity={0.7}
            >
              <Text style={styles.rightIcon}>{rightAction.icon}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButton} />
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    height: layout.headerHeight,
    backgroundColor: colors.primary[600],
    position: 'relative',
    ...shadows.md,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary[700],
    opacity: 0.2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
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
  },
});

