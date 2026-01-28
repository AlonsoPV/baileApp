import { supabase } from "../lib/supabase";
import { nativeGoogleSignOut, nativeSignInWithApple, nativeSignInWithGoogleWithRequestId } from "./nativeAuth";

export type AuthStatus = "loading" | "loggedOut" | "loggedIn" | "error";

export type AuthState = {
  status: AuthStatus;
  error?: string | null;
};

export type AuthSessionTokens = {
  access_token: string;
  refresh_token: string;
};

type Listener = (state: AuthState) => void;

function normalizeErrorMessage(e: unknown, fallback: string) {
  if (e instanceof Error) return e.message || fallback;
  if (typeof e === "string") return e;
  return fallback;
}

function preserveErrorDetails(original: unknown, msg: string) {
  const err = new Error(msg);
  try {
    const anyOrig = original as any;
    if (anyOrig?.code) (err as any).code = anyOrig.code;
    if (anyOrig?.status) (err as any).status = anyOrig.status;
    if (anyOrig?.name) (err as any).name = anyOrig.name;
    if (anyOrig?.details) (err as any).details = anyOrig.details;
    if (anyOrig?.message && !msg) (err as any).message = anyOrig.message;
    (err as any).cause = original;
  } catch {
    // ignore
  }
  return err;
}

/**
 * Single coordinator for native auth flows.
 * - Apple: ASAuthorizationController (via iOS native module)
 * - Google: GoogleSignIn SDK (via iOS native module)
 * - Supabase: signInWithIdToken to mint app session tokens
 */
class AuthCoordinatorImpl {
  private state: AuthState = { status: "loggedOut", error: null };
  private listeners = new Set<Listener>();

  getState(): AuthState {
    return this.state;
  }

  subscribe(cb: Listener): () => void {
    this.listeners.add(cb);
    cb(this.state);
    return () => this.listeners.delete(cb);
  }

  private setState(next: AuthState) {
    this.state = next;
    for (const l of this.listeners) l(this.state);
  }

  async signInWithApple(): Promise<AuthSessionTokens> {
    this.setState({ status: "loading", error: null });
    try {
      const apple = await nativeSignInWithApple();
      if (!supabase) throw new Error("Supabase no está configurado en la app.");

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: apple.identityToken,
        nonce: apple.nonce,
      });

      if (error) throw error;
      const sess = data.session;
      if (!sess?.access_token || !sess?.refresh_token) {
        throw new Error("No se pudo obtener sesión de Supabase (Apple).");
      }

      this.setState({ status: "loggedIn", error: null });
      return { access_token: sess.access_token, refresh_token: sess.refresh_token };
    } catch (e) {
      const msg = normalizeErrorMessage(e, "Error al iniciar sesión con Apple.");
      this.setState({ status: "error", error: msg });
      throw preserveErrorDetails(e, msg);
    }
  }

  async signInWithGoogle(iosClientId: string, requestId: string = ""): Promise<AuthSessionTokens> {
    this.setState({ status: "loading", error: null });
    try {
      const rid = String(requestId || "");
      console.log("[AuthCoordinator] Google native sign-in start", { requestId: rid ? `${rid.slice(0, 8)}…` : "(none)" });
      const google = await nativeSignInWithGoogleWithRequestId(iosClientId, rid);
      if (!supabase) throw new Error("Supabase no está configurado en la app.");
      // @ts-ignore
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        // eslint-disable-next-line no-console
        console.log("[AuthCoordinator] Google token received; calling Supabase", {
          requestId: rid ? `${rid.slice(0, 8)}…` : "(none)",
          hasIdToken: !!google?.idToken,
          tokenLen: String(google?.idToken ?? "").length,
        });
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: google.idToken,
      });

      if (error) throw error;
      const sess = data.session;
      if (!sess?.access_token || !sess?.refresh_token) {
        throw new Error("No se pudo obtener sesión de Supabase (Google).");
      }
      // @ts-ignore
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        // eslint-disable-next-line no-console
        console.log("[AuthCoordinator] Supabase session OK", {
          requestId: rid ? `${rid.slice(0, 8)}…` : "(none)",
          hasAccess: !!sess?.access_token,
          hasRefresh: !!sess?.refresh_token,
        });
      }

      this.setState({ status: "loggedIn", error: null });
      return { access_token: sess.access_token, refresh_token: sess.refresh_token };
    } catch (e) {
      const msg = normalizeErrorMessage(e, "Error al iniciar sesión con Google.");
      this.setState({ status: "error", error: msg });
      const rid = String(requestId || "");
      const anyE = e as any;
      // @ts-ignore
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        try {
          // eslint-disable-next-line no-console
          console.log("[AuthCoordinator] Google sign-in error (raw)", {
            requestId: rid ? `${rid.slice(0, 8)}…` : "(none)",
            code: String(anyE?.code ?? ""),
            message: String(anyE?.message ?? anyE ?? ""),
            keys: anyE && typeof anyE === "object" ? Object.keys(anyE) : [],
          });
        } catch {}
      }

      // Prefer throwing the original error if it already has a code (keeps native reject codes like GOOGLE_MISSING_ID_TOKEN).
      if (anyE && (anyE.code || anyE.domain || anyE.status)) {
        if (rid) {
          try { anyE.requestId = anyE.requestId || rid; } catch {}
        }
        throw anyE;
      }

      const err = preserveErrorDetails(e, msg) as any;
      if (rid) err.requestId = String((err as any).requestId || rid);
      throw err;
    }
  }

  async signOut(): Promise<void> {
    this.setState({ status: "loading", error: null });
    try {
      // Best-effort sign out in native SDKs
      await nativeGoogleSignOut();
      if (supabase) {
        // Best-effort; web will also sign out its own session
        await supabase.auth.signOut({ scope: "local" });
      }
      this.setState({ status: "loggedOut", error: null });
    } catch (e) {
      const msg = normalizeErrorMessage(e, "No se pudo cerrar sesión.");
      this.setState({ status: "error", error: msg });
      throw preserveErrorDetails(e, msg);
    }
  }
}

export const AuthCoordinator = new AuthCoordinatorImpl();

