import React, { useState } from 'react';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Header, OffCanvasMenu } from '../components';
import { colors, spacing, typography, layout } from '../theme';

const Tab = createBottomTabNavigator();

// Screen wrapper with Header
function ScreenWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  const [menuVisible, setMenuVisible] = useState(false);

  const menuItems = [
    {
      id: 'home',
      label: 'Inicio',
      icon: '🏠',
      onPress: () => console.log('Home'),
    },
    {
      id: 'favorites',
      label: 'Favoritos',
      icon: '⭐',
      onPress: () => console.log('Favorites'),
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: '⚙️',
      onPress: () => console.log('Settings'),
    },
    {
      id: 'logout',
      label: 'Cerrar Sesión',
      icon: '🚪',
      onPress: () => console.log('Logout'),
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Header
        title={title}
        onMenuPress={() => setMenuVisible(true)}
        rightAction={{
          icon: '🔔',
          onPress: () => console.log('Notifications'),
        }}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: layout.headerHeight, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      <OffCanvasMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        menuItems={menuItems}
        userName="Usuario Bailarín"
        userEmail="usuario@baileapp.com"
      />
    </View>
  );
}

const Screen = (title: string) => () => (
  <ScreenWrapper title={title}>
    <View style={styles.screenContent}>
      <Text style={styles.screenTitle}>{title}</Text>
      <Text style={styles.screenSubtitle}>Contenido de {title}</Text>
    </View>
  </ScreenWrapper>
);

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          borderTopColor: colors.gray[200],
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.medium,
        },
      }}
    >
      <Tab.Screen 
        name="Explore" 
        component={Screen("Explore")}
        options={{ tabBarLabel: 'Explorar', tabBarIcon: () => <Text>🔍</Text> }}
      />
      <Tab.Screen 
        name="Eventos" 
        component={Screen("Eventos")}
        options={{ tabBarIcon: () => <Text>🎉</Text> }}
      />
      <Tab.Screen 
        name="Maestros" 
        component={Screen("Maestros")}
        options={{ tabBarIcon: () => <Text>👨‍🏫</Text> }}
      />
      <Tab.Screen 
        name="Marcas" 
        component={Screen("Marcas")}
        options={{ tabBarIcon: () => <Text>🏷️</Text> }}
      />
      <Tab.Screen 
        name="Perfil" 
        component={Screen("Perfil")}
        options={{ tabBarIcon: () => <Text>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    minHeight: '100%', // Asegurar que el contenido tenga altura mínima para centrarse
  },
  screenTitle: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary[600],
    marginBottom: spacing.sm,
  },
  screenSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
  },
});

