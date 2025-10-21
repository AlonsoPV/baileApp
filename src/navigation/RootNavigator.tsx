import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStack } from "./AuthStack";
import { MainTabs } from "./MainTabs";

const Stack = createNativeStackNavigator();

/** TODO: reemplazar con lógica real de sesión (Sprint 1) */
const isLoggedIn = true;

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

