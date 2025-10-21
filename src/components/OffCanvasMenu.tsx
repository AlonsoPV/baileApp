// src/components/OffCanvasMenu.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';
import { colors, spacing, borderRadius, typography, layout, shadows } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  onPress: () => void;
}

interface OffCanvasMenuProps {
  visible: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  userName?: string;
  userEmail?: string;
}

export function OffCanvasMenu({
  visible,
  onClose,
  menuItems,
  userName = 'Usuario',
  userEmail,
}: OffCanvasMenuProps) {
  const translateX = useRef(new Animated.Value(-layout.menuWidth)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 100,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -layout.menuWidth,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible && translateX._value === -layout.menuWidth) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <StatusBar backgroundColor={visible ? 'rgba(0,0,0,0.5)' : 'transparent'} />
      
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayOpacity,
            },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Menu Panel */}
      <Animated.View
        style={[
          styles.menuPanel,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        {/* Header with gradient */}
        <View style={styles.menuHeader}>
          <View style={styles.gradientOverlay} />
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.userName}>{userName}</Text>
            {userEmail && <Text style={styles.userEmail}>{userEmail}</Text>}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContent}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => {
                item.onPress();
                onClose();
              }}
              activeOpacity={0.7}
            >
              {item.icon && <Text style={styles.menuIcon}>{item.icon}</Text>}
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.menuFooter}>
          <Text style={styles.footerText}>BaileApp v1.0.0</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  menuPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: layout.menuWidth,
    backgroundColor: colors.background,
    ...shadows.xl,
  },
  menuHeader: {
    height: 180,
    backgroundColor: colors.primary[600],
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary[700],
    opacity: 0.3,
  },
  userInfo: {
    zIndex: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondary[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  avatarText: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.background,
  },
  userName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.background,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    color: colors.primary[100],
  },
  menuContent: {
    flex: 1,
    paddingTop: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    fontSize: typography.sizes.xl,
    marginRight: spacing.md,
  },
  menuLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  menuFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
});

