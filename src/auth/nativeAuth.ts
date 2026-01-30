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
  serverClientId?: string;
  rawNonce?: string;
  rawNonceSHA256?: string;
  userId?: string | null;
  email?: string | null;
  fullName?: string | null;
};

const { AppleSignInModule, GoogleSignInModule } = NativeModules as any;

function shouldLog(): boolean {
  // @ts-ignore
  return typeof __DEV__ !== "undefined" && !!__DEV__;
}

function mask(v: string): string {
  const t = String(v ?? "").trim();
  if (!t) return "(empty)";
  if (t.length <= 10) return `${t.slice(0, 2)}...${t.slice(-2)}`;
  return `${t.slice(0, 6)}...${t.slice(-6)}`;
}

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

export async function nativeSignInWithGoogleWithRequestId(
  iosClientId: string,
  requestId: string
): Promise<GoogleResult> {
  if (Platform.OS !== "ios") {
    throw new Error("Google Sign-In nativo solo está disponible en iOS en esta versión.");
  }
  if (!GoogleSignInModule?.signIn) {
    throw new Error("GoogleSignInModule no está disponible (build iOS requerido).");
  }
  const rid = String(requestId || "");
  if (shouldLog()) {
    // eslint-disable-next-line no-console
    console.log("[nativeAuth] GoogleSignInModule.signIn start", {
      requestId: rid ? `${rid.slice(0, 8)}…` : "(none)",
      iosClientId: mask(iosClientId),
    });
  }
  try {
    const res = (await GoogleSignInModule.signIn(iosClientId, rid)) as any;
    if (shouldLog()) {
      // eslint-disable-next-line no-console
      console.log("[nativeAuth] GoogleSignInModule.signIn ok", {
        requestId: rid ? `${rid.slice(0, 8)}…` : "(none)",
        hasIdToken: !!res?.idToken,
        idToken: res?.idToken ? mask(String(res.idToken)) : "(none)",
        email: res?.email ?? null,
        userId: res?.userId ?? null,
      });
    }
    if (!res?.idToken) {
      const err: any = new Error("Google no devolvió idToken.");
      err.code = "GOOGLE_MISSING_ID_TOKEN";
      err.requestId = rid;
      throw err;
    }
    return res as GoogleResult;
  } catch (e: any) {
    // Preserve native error shape + attach requestId for correlation
    if (rid) {
      try {
        (e as any).requestId = (e as any).requestId || rid;
      } catch {}
    }
    if (shouldLog()) {
      // eslint-disable-next-line no-console
      console.log("[nativeAuth] GoogleSignInModule.signIn error", {
        requestId: rid ? `${rid.slice(0, 8)}…` : "(none)",
        code: String(e?.code ?? ""),
        message: String(e?.message ?? e ?? ""),
        keys: e && typeof e === "object" ? Object.keys(e) : [],
      });
    }
    throw e;
  }
}

export async function nativeGoogleSignOut(): Promise<void> {
  if (Platform.OS !== "ios") return;
  try {
    await GoogleSignInModule?.signOut?.();
  } catch {
    // best-effort
  }
}

