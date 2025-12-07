import React, { useEffect } from "react";
import { BackHandler, Platform } from "react-native";
import {
  NavigationContainer,
  useNavigation,
  useNavigationState,
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

function BackHandlerWrapper() {
  const navigation = useNavigation();
  const routesLength = useNavigationState((state) => state?.routes?.length ?? 0);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onBackPress = () => {
      // Si hay pantallas a donde regresar
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true; // ya manejamos el evento
      }

      // Estamos en la raíz: NO cerrar la app, solo ignorar back
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => subscription.remove();
  }, [navigation, routesLength]);

  return <RootStack />;
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <BackHandlerWrapper />
    </NavigationContainer>
  );
}

