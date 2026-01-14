import { NativeModules, Platform } from "react-native";

type AppleResult = {
  identityToken: string;
  nonce: string;
  userId?: string;
  email?: string | null;
  fullName?: string | null;
};

type GoogleResult = {
  idToken: string;
  accessToken?: string;
  userId?: string | null;
  email?: string | null;
  fullName?: string | null;
};

const { AppleSignInModule, GoogleSignInModule } = NativeModules as any;

export function isNativeAuthAvailable(): boolean {
  // iOS-only implementation for now
  return Platform.OS === "ios" && !!AppleSignInModule && !!GoogleSignInModule;
}

export async function nativeSignInWithApple(): Promise<AppleResult> {
  if (Platform.OS !== "ios") {
    throw new Error("Apple Sign-In solo está disponible en iOS.");
  }
  if (!AppleSignInModule?.signIn) {
    throw new Error("AppleSignInModule no está disponible (build iOS requerido).");
  }
  const res = (await AppleSignInModule.signIn()) as AppleResult;
  if (!res?.identityToken || !res?.nonce) {
    throw new Error("Respuesta inválida de Apple Sign-In.");
  }
  return res;
}

export async function nativeSignInWithGoogle(iosClientId: string): Promise<GoogleResult> {
  if (Platform.OS !== "ios") {
    throw new Error("Google Sign-In nativo solo está disponible en iOS en esta versión.");
  }
  if (!GoogleSignInModule?.signIn) {
    throw new Error("GoogleSignInModule no está disponible (build iOS requerido).");
  }
  const res = (await GoogleSignInModule.signIn(iosClientId)) as GoogleResult;
  if (!res?.idToken) {
    throw new Error("Google no devolvió idToken.");
  }
  return res;
}

export async function nativeGoogleSignOut(): Promise<void> {
  if (Platform.OS !== "ios") return;
  try {
    await GoogleSignInModule?.signOut?.();
  } catch {
    // best-effort
  }
}

