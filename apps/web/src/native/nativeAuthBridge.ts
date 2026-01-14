import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    __BAILEAPP_SET_SUPABASE_SESSION?: (tokens: { access_token: string; refresh_token: string }) => Promise<void>;
    __BAILEAPP_NATIVE_SIGN_OUT?: () => Promise<void>;
  }
}

function dispatchNativeAuthError(message: string) {
  try {
    window.dispatchEvent(new CustomEvent("baileapp:native-auth-error", { detail: { message } }));
  } catch {
    // ignore
  }
}

/**
 * Bridge used by the React Native WebView host to set a Supabase session
 * without opening any external browser for OAuth.
 */
export function installNativeAuthBridge() {
  if (typeof window === "undefined") return;

  // Idempotent install
  if (window.__BAILEAPP_SET_SUPABASE_SESSION) return;

  window.__BAILEAPP_SET_SUPABASE_SESSION = async (tokens) => {
    try {
      if (!tokens?.access_token || !tokens?.refresh_token) {
        throw new Error("Tokens inválidos.");
      }
      await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
      // Reuse existing web callback logic (profile/onboarding/pin)
      window.location.replace("/auth/callback");
    } catch (e: any) {
      const msg = e?.message || "Error aplicando sesión.";
      dispatchNativeAuthError(msg);
      throw e;
    }
  };

  window.__BAILEAPP_NATIVE_SIGN_OUT = async () => {
    try {
      await supabase.auth.signOut();
      window.location.replace("/auth/login");
    } catch (e: any) {
      dispatchNativeAuthError(e?.message || "No se pudo cerrar sesión.");
    }
  };
}

