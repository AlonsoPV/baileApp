import React, { useEffect, useRef, useState } from "react";
import { BackHandler, Platform } from "react-native";
import {
  NavigationContainer,
  type NavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStack } from "./AuthStack";
import { MainTabs } from "./MainTabs";
import WebAppScreen from "../screens/WebAppScreen";

const Stack = createNativeStackNavigator();

/** TODO: reemplazar con lógica real de sesión (Sprint 1) */
const isLoggedIn = true;

function RootStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
        fullScreenGestureEnabled: true,
      }}
    >
      {isLoggedIn ? (
        // Para la opción 2: app Expo que muestra la web como WebView de pantalla completa
        <Stack.Screen name="WebApp" component={WebAppScreen} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const navigationRef = useRef<NavigationContainerRef<any> | null>(null);
  const [routesLength, setRoutesLength] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onBackPress = () => {
      const nav = navigationRef.current;
      if (nav && nav.canGoBack()) {
        nav.goBack();
        return true;
      }

      // Estamos en la raíz: NO cerrar la app, solo ignorar back
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [routesLength]);

  return (
    <NavigationContainer
      ref={(ref) => {
        navigationRef.current = ref;
      }}
      onStateChange={(state) => {
        setRoutesLength(state?.routes?.length ?? 0);
      }}
    >
      <RootStack />
    </NavigationContainer>
  );
}

