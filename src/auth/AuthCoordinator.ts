import { supabase } from "../lib/supabase";
import { nativeGoogleSignOut, nativeSignInWithApple, nativeSignInWithGoogleWithRequestId } from "./nativeAuth";
import Constants from "expo-constants";

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
    if (anyOrig?.statusCode) (err as any).statusCode = anyOrig.statusCode;
    if (anyOrig?.name) (err as any).name = anyOrig.name;
    if (anyOrig?.details) (err as any).details = anyOrig.details;
    if (anyOrig?.message && !msg) (err as any).message = anyOrig.message;
    (err as any).cause = original;
  } catch {
    // ignore
  }
  return err;
}

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;
    const b64url = parts[1];
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64url.length + 3) % 4);
    let json = "";
    // RN: atob exists in Hermes in many setups, but not guaranteed. Fallback to Buffer if present.
    // @ts-ignore
    if (typeof global !== "undefined" && typeof (global as any).atob === "function") {
      // @ts-ignore
      json = (global as any).atob(b64);
    } else if (typeof Buffer !== "undefined") {
      // @ts-ignore
      json = Buffer.from(b64, "base64").toString("utf8");
    } else {
      return null;
    }
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function maskAud(v: string): string {
  const t = String(v ?? "").trim();
  if (!t) return "(empty)";
  if (t.length <= 14) return `${t.slice(0, 6)}…`;
  return `${t.slice(0, 10)}…${t.slice(-8)}`;
}

function maskNonce(v: string): string {
  const t = String(v ?? "").trim();
  if (!t) return "(empty)";
  if (t.length <= 10) return `${t.slice(0, 4)}…`;
  return `${t.slice(0, 6)}…${t.slice(-4)}`;
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
  private googleSignInInFlight = false;

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

  async signInWithGoogle(
    iosClientId: string,
    requestId: string = "",
    webClientId: string = ""
  ): Promise<AuthSessionTokens> {
    const rid = String(requestId || "");
    if (this.googleSignInInFlight) {
      const err: any = new Error("Google Sign-In ya está en progreso. Evita tocar el botón dos veces.");
      err.code = "GOOGLE_IN_PROGRESS";
      err.status = 409;
      err.requestId = rid;
      throw err;
    }
    this.googleSignInInFlight = true;
    this.setState({ status: "loading", error: null });
    try {
      console.log("[AuthCoordinator] Google native sign-in start", { requestId: rid ? `${rid.slice(0, 8)}…` : "(none)" });
      const google = await nativeSignInWithGoogleWithRequestId(iosClientId, rid);
      const sb = supabase;
      if (!sb) {
        // Diagnóstico detallado para ayudar a debuggear en producción
        const extra = (Constants.expoConfig as any)?.extra ?? {};
        const hasUrl = !!(extra.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl);
        const hasKey = !!(extra.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey);
        const urlIsEmpty = extra.EXPO_PUBLIC_SUPABASE_URL === '' || extra.supabaseUrl === '';
        const keyIsEmpty = extra.EXPO_PUBLIC_SUPABASE_ANON_KEY === '' || extra.supabaseAnonKey === '';
        
        console.error("[AuthCoordinator] Supabase client is null", {
          hasUrl,
          hasKey,
          urlIsEmpty,
          keyIsEmpty,
          extraExists: !!Constants.expoConfig?.extra,
        });
        
        if (urlIsEmpty || keyIsEmpty) {
          throw new Error("Supabase no está configurado: las variables EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY deben estar configuradas en Xcode Cloud environment variables. Verifica que ci_post_clone.sh creó el archivo .env correctamente.");
        }
        throw new Error("Supabase no está configurado en la app.");
      }
      // @ts-ignore
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        // eslint-disable-next-line no-console
        console.log("[AuthCoordinator] Google token received; calling Supabase", {
          requestId: rid ? `${rid.slice(0, 8)}…` : "(none)",
          hasIdToken: !!google?.idToken,
          tokenLen: String(google?.idToken ?? "").length,
        });
      }

      // Preflight: decode JWT audience so we can catch the common invalid_jwt root cause before hitting Supabase.
      const payload = decodeJwtPayload(google.idToken);
      const aud = String(payload?.aud ?? "");
      const azp = String(payload?.azp ?? "");
      const tokenNonce = String(payload?.nonce ?? "");
      // @ts-ignore
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        // eslint-disable-next-line no-console
        console.log("[AuthCoordinator] Google idToken decoded", {
          requestId: rid ? `${rid.slice(0, 8)}…` : "(none)",
          aud: maskAud(aud),
          azp: maskAud(azp),
          nonce: maskNonce(tokenNonce),
          iss: String(payload?.iss ?? ""),
        });
      }
      const expectedAud = String(webClientId || google?.serverClientId || "").trim();
      if (expectedAud && aud && aud !== expectedAud) {
        const err: any = new Error(
          `Supabase va a rechazar el token: idToken.aud (${maskAud(aud)}) no coincide con Web Client ID (${maskAud(expectedAud)}).`
        );
        err.code = "invalid_jwt";
        err.status = 400;
        err.requestId = rid;
        (err as any).idTokenAud = aud;
        (err as any).expectedAud = expectedAud;
        throw err;
      }

      const tokenNonceTrimmed = tokenNonce.trim();
      const rawNonce = String((google as any)?.rawNonce ?? "").trim();
      const rawNonceSHA256 = String((google as any)?.rawNonceSHA256 ?? "").trim();

      // Supabase rule:
      // - If id_token has nonce claim, request MUST include nonce.
      // - If id_token has NO nonce claim, request MUST NOT include nonce.
      const hasTokenNonce = !!tokenNonceTrimmed;
      if (hasTokenNonce && !rawNonce) {
        const err: any = new Error("Google idToken trae nonce pero la app no recibió rawNonce del módulo nativo.");
        err.code = "GOOGLE_NONCE_MISSING_RAW";
        err.status = 400;
        err.requestId = rid;
        throw err;
      }

      // @ts-ignore
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        // eslint-disable-next-line no-console
        console.log("[AuthCoordinator] Google nonce check", {
          requestId: rid ? `${rid.slice(0, 8)}…` : "(none)",
          tokenNonce: maskNonce(tokenNonceTrimmed),
          rawNonce: maskNonce(rawNonce),
          rawNonceSHA256: maskNonce(rawNonceSHA256),
          tokenNonceEqualsRaw: tokenNonceTrimmed && rawNonce ? tokenNonceTrimmed === rawNonce : false,
          tokenNonceEqualsSHA: tokenNonceTrimmed && rawNonceSHA256 ? tokenNonceTrimmed === rawNonceSHA256 : false,
        });
      }

      const isNonceMismatchError = (e: any): boolean => {
        const msg = String(e?.message ?? e ?? "");
        return /nonces?\s+mismatch/i.test(msg) || /Passed nonce and nonce in id_token/i.test(msg);
      };

      const nonceDebugSuffix = () => {
        const parts = [
          `tokenNonce=${maskNonce(tokenNonceTrimmed)}`,
          `rawNonce=${maskNonce(rawNonce)}`,
          `rawNonceSHA256=${maskNonce(rawNonceSHA256)}`,
          `eqRaw=${tokenNonceTrimmed && rawNonce ? String(tokenNonceTrimmed === rawNonce) : "n/a"}`,
          `eqSHA=${tokenNonceTrimmed && rawNonceSHA256 ? String(tokenNonceTrimmed === rawNonceSHA256) : "n/a"}`,
        ];
        return parts.join(" ");
      };

      const callSupabase = async (nonceToSend: string | undefined) => {
        const payloadForSupabase: any = { provider: "google", token: google.idToken };
        if (nonceToSend) payloadForSupabase.nonce = nonceToSend;
        return await sb.auth.signInWithIdToken(payloadForSupabase);
      };

      // Deterministic behavior + one safe fallback:
      // - If token has nonce claim -> try RAW nonce first (Supabase canonical)
      // - If Supabase reports nonce mismatch -> retry once with token's nonce claim (covers providers that expect direct compare)
      // - If token has no nonce claim -> do not send nonce
      let data: any;
      let error: any;
      try {
        if (!hasTokenNonce) {
          ({ data, error } = await callSupabase(undefined));
        } else {
          ({ data, error } = await callSupabase(rawNonce));
        }
        if (error) throw error;
      } catch (e: any) {
        if (hasTokenNonce && isNonceMismatchError(e) && tokenNonceTrimmed && tokenNonceTrimmed !== rawNonce) {
          try {
            ({ data, error } = await callSupabase(tokenNonceTrimmed));
            if (error) throw error;
          } catch (e2: any) {
            const msg2 = normalizeErrorMessage(e2, "Error al iniciar sesión con Google (nonce).");
            const err2: any = preserveErrorDetails(e2, `${msg2} (${nonceDebugSuffix()}, req: ${rid || "?"})`);
            err2.code = String((e2 as any)?.code ?? "NONCE_MISMATCH");
            err2.status = Number((e2 as any)?.status ?? (e2 as any)?.statusCode ?? 400);
            err2.requestId = rid;
            throw err2;
          }
        }
        const msg = normalizeErrorMessage(e, "Error al iniciar sesión con Google (nonce).");
        const err: any = preserveErrorDetails(e, `${msg} (${nonceDebugSuffix()}, req: ${rid || "?"})`);
        err.code = String((e as any)?.code ?? "NONCE_MISMATCH");
        err.status = Number((e as any)?.status ?? (e as any)?.statusCode ?? 400);
        err.requestId = rid;
        throw err;
      }

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
      const anyE = e as any;
      // @ts-ignore
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        try {
          // eslint-disable-next-line no-console
          console.log("[AuthCoordinator] Google sign-in error (raw)", {
            requestId: rid ? `${rid.slice(0, 8)}…` : "(none)",
            code: String(anyE?.code ?? ""),
            status: String(anyE?.status ?? anyE?.statusCode ?? ""),
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
    } finally {
      this.googleSignInInFlight = false;
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

