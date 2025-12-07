import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from '../theme';

const Stack = createNativeStackNavigator();

function LoginScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>¡Bienvenido a BaileApp! 💃</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
      </View>
    </View>
  );
}

function SignupScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Crear Cuenta 🎉</Text>
        <Text style={styles.subtitle}>Únete a la comunidad de baile</Text>
      </View>
    </View>
  );
}

export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary[600],
        },
        headerTintColor: colors.background,
        headerTitleStyle: {
          fontWeight: typography.weights.bold,
        },
        gestureEnabled: true,
        gestureDirection: "horizontal",
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ title: 'Iniciar Sesión' }}
      />
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen}
        options={{ title: 'Registro' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary[600],
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

