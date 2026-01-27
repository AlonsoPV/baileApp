import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from '@/contexts/AuthProvider';
import { buildSafePatch, deepMerge } from "../utils/safePatch";
import { normalizeSocialInput, normalizeQuestions } from "../utils/normalize";
import { withTimeout } from "../utils/withTimeout";

export type ProfileUser = {
  user_id: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  rol_baile?: 'lead' | 'follow' | 'ambos' | null;
  ritmos_seleccionados?: string[]; // catálogo (RITMOS_CATALOG)
  ritmos?: number[];
  zonas?: number[];
  media?: any[]; // ⚠️ NO actualizar desde este hook
  onboarding_complete?: boolean; // ⚠️ NO actualizar desde este hook
  respuestas?: Record<string, any>;
  redes_sociales?: Record<string, any>;
  updated_at?: string; // Para rehidratación confiable
  created_at?: string; // Para mostrar "miembro desde" en el perfil
};

const KEY = (uid?: string) => ["profile", "me", uid];
const PROFILE_QUERY_TIMEOUT_MS = 15_000;
// Keep this aligned with the global fetch abort (supabaseClient.ts)
// so users don't sit on an endless-looking spinner.
// Increased timeout for profile updates to handle slow networks and complex patches
const PROFILE_UPDATE_TIMEOUT_MS = 30_000;

export function useUserProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  async function upsertFallback(patch: Record<string, any>, prev: any) {
    // Limpiar valores undefined del patch antes del upsert
    const cleanPatch: any = {};
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) {
        cleanPatch[key] = value === null ? null : value;
      }
    }

    // ✅ Importante: preservar JSON anidados al hacer upsert (evita pérdida si el backend no hace deep-merge)
    if (cleanPatch.respuestas && typeof cleanPatch.respuestas === "object" && !Array.isArray(cleanPatch.respuestas)) {
      cleanPatch.respuestas = deepMerge(prev?.respuestas ?? {}, cleanPatch.respuestas);
    }
    if (cleanPatch.redes_sociales && typeof cleanPatch.redes_sociales === "object" && !Array.isArray(cleanPatch.redes_sociales)) {
      cleanPatch.redes_sociales = deepMerge(prev?.redes_sociales ?? {}, cleanPatch.redes_sociales);
    }

    const { error: upsertError } = await withTimeout(
      (supabase
        .from("profiles_user")
        .upsert({ user_id: uid, ...cleanPatch }, { onConflict: "user_id" }) as any),
      PROFILE_UPDATE_TIMEOUT_MS,
      "Save profile (upsert fallback)"
    );

    if (upsertError) {
      console.error("[useUserProfile] Upsert fallback failed:", upsertError);
      const errorMessage = upsertError.message || "Error al guardar el perfil";
      const error = new Error(errorMessage);
      (error as any).code = upsertError.code;
      (error as any).details = upsertError.details;
      throw error;
    }
  }

  async function fetchProfileByUserId(userId: string) {
    const { data, error } = await withTimeout(
      (supabase
        .from("profiles_user")
        .select("user_id, display_name, bio, avatar_url, rol_baile, ritmos_seleccionados, ritmos, zonas, respuestas, redes_sociales, updated_at, created_at")
        .eq("user_id", userId)
        .maybeSingle() as any),
      PROFILE_QUERY_TIMEOUT_MS,
      "Load profile"
    );
    if (error) throw error;
    return data as ProfileUser | null;
  }

  const profile = useQuery({
    queryKey: KEY(uid),
    enabled: !!uid && typeof uid === 'string' && uid.length > 0,
    queryFn: async () => {
      if (!uid || typeof uid !== 'string') {
        throw new Error('Usuario sin ID válido');
      }
      return fetchProfileByUserId(uid);
    },
    staleTime: 1000 * 30, // 30 segundos - perfil puede cambiar pero no tan frecuentemente
    gcTime: 1000 * 60 * 5, // 5 minutos en cache
    retry: 1, // Reducir retries para onboarding más rápido
    retryDelay: 500, // Reducir delay entre retries
    refetchOnWindowFocus: false, // No refetch automático en onboarding
    refetchOnMount: false, // Usar cache si está disponible
    placeholderData: (previousData) => previousData, // Keep previous data during transitions
  });

  const updateFields = useMutation({
    mutationFn: async (next: Partial<ProfileUser>) => {
      if (!uid) throw new Error("No user");
      
      try {
        const prev = profile.data || {};
        
        // 🚫 Blindaje: JAMÁS mandar media ni onboarding_complete desde aquí
        const { media, onboarding_complete, ...candidate } = next;

        // Normalizar datos antes del patch
        // Nota: Si candidate.respuestas.redes ya viene normalizado desde UserProfileEditor,
        // normalizarlo de nuevo no debería causar problemas (es idempotente)
        const normalizedCandidate = {
          ...candidate,
          respuestas: candidate.respuestas ? {
            ...(prev.respuestas || {}), // Preservar respuestas existentes
            ...candidate.respuestas,
            // Normalizar redes sociales (siempre usar las del candidate si están presentes)
            redes: normalizeSocialInput(candidate.respuestas?.redes || {}),
            // Normalizar preguntas (excluyendo redes que ya se normalizaron)
            ...Object.fromEntries(
              Object.entries(normalizeQuestions(candidate.respuestas || {}))
                .filter(([key]) => key !== 'redes')
            )
          } : undefined
        };

        // Usar buildSafePatch para merge inteligente
        const patch = buildSafePatch(prev, normalizedCandidate, { 
          allowEmptyArrays: ["ritmos_seleccionados", "ritmos", "zonas"] as any 
        });

        // Diagnóstico mejorado
        if (import.meta.env.MODE === "development") {
          console.log("[useUserProfile] PREV:", prev);
          console.log("[useUserProfile] CANDIDATE:", candidate);
          console.log("[useUserProfile] NORMALIZED:", normalizedCandidate);
          console.log("[useUserProfile] PATCH:", patch);
        }

        if (Object.keys(patch).length === 0) {
          console.log("[useUserProfile] No changes to save");
          return { patch: {} as Record<string, any> };
        }

        // Usar RPC merge para actualizaciones seguras (ya hace upsert internamente)
        let rpcError: any = null;
        try {
          const res = await withTimeout(
            (supabase.rpc("merge_profiles_user", {
              p_user_id: uid,
              p_patch: patch,
            }) as any),
            PROFILE_UPDATE_TIMEOUT_MS,
            "Save profile (RPC)"
          );
          rpcError = (res as any)?.error ?? null;
        } catch (e: any) {
          // If the RPC hangs/times out (common on flaky networks/WebViews),
          // try direct upsert as fallback (often succeeds when RPC endpoint is slow).
          const msg = String(e?.message ?? e ?? '');
          const isAbort = String(e?.name ?? '').toLowerCase().includes('abort') || msg.toLowerCase().includes('aborted');
          const isTimeout = msg.toLowerCase().includes('timed out') || msg.toLowerCase().includes('timeout');
          if (!isTimeout && !isAbort) throw e;

          if (import.meta.env.MODE === "development") {
            console.warn("[useUserProfile] RPC timed out/aborted; trying upsert fallback...");
          }

          // Fallback: direct upsert with deep-merged JSON
          await upsertFallback(patch, prev);
          return { patch };
        }
        
        if (rpcError) {
          console.error("[useUserProfile] RPC error:", rpcError);
          
          // Si el RPC falla, intentar upsert directo como fallback
          if (import.meta.env.MODE === "development") {
            console.warn("[useUserProfile] RPC failed, trying direct upsert:", rpcError);
          }

          await upsertFallback(patch, prev);
        }
        return { patch };
      } catch (e: any) {
        console.error("[useUserProfile] Caught error:", e);
        throw e;
      }
    },
    onSuccess: async (result) => {
      const patch = (result as any)?.patch || {};
      if (!uid) return;

      // ✅ UX: aplicar patch al cache inmediatamente (sin esperar refetch / staleTime)
      // Usar deepMerge para preservar objetos anidados (respuestas.redes, etc.)
      if (patch && Object.keys(patch).length > 0) {
        const nowIso = new Date().toISOString();
        qc.setQueryData(KEY(uid), (old: any) => {
          if (!old) return old;
          // Usar deepMerge para hacer merge profundo de objetos anidados
          const merged = deepMerge(old, patch);
          return { ...merged, updated_at: nowIso };
        });
        // Live/Public screen usa otra key
        qc.setQueryData(["profile", "public", uid], (old: any) => {
          if (!old) return old;
          // Usar deepMerge para hacer merge profundo de objetos anidados
          const merged = deepMerge(old, patch);
          return { ...merged, updated_at: nowIso };
        });
      }

      // Invalidar queries en paralelo para mejor rendimiento (no bloquea la UI)
      Promise.all([
        qc.invalidateQueries({ queryKey: KEY(uid) }),
        qc.invalidateQueries({ queryKey: ["profile", "public", uid] }),
        qc.invalidateQueries({ queryKey: ["onboarding-status", uid] }),
        qc.invalidateQueries({ queryKey: ["profile", "media", uid] }),
      ]).catch((err) => {
        if (import.meta.env.MODE === "development") {
          console.warn("[useUserProfile] Error invalidating queries:", err);
        }
      });
    },
  });

  async function refetchProfile() {
    if (!uid) return null;
    // Force: mark stale + fetch from network even if staleTime window hasn't elapsed.
    await qc.invalidateQueries({ queryKey: KEY(uid) });
    return qc.fetchQuery({
      queryKey: KEY(uid),
      queryFn: () => fetchProfileByUserId(uid),
      staleTime: 0,
    });
  }

  return {
    profile: profile.data,
    isLoading: profile.isLoading,
    updateProfileFields: updateFields.mutateAsync,
    refetch: profile.refetch,
    refetchProfile,
  };
}

// ---- Test helper (lightweight, non-React) ----
// Used by a tiny script test to ensure we never "wait forever" on a hung save.
// IMPORTANT: Do not pass secrets/PII into errors; this only maps timeout → user-friendly error.
export async function __test_failFastOnSaveTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const t0 = Date.now();
  try {
    return await withTimeout(promise, timeoutMs, "Save profile (RPC)");
  } catch (e: any) {
    const msg = String(e?.message ?? e ?? "");
    const isAbort =
      String(e?.name ?? "").toLowerCase().includes("abort") || msg.toLowerCase().includes("aborted");
    const isTimeout = msg.toLowerCase().includes("timed out") || msg.toLowerCase().includes("timeout");
    if (!isTimeout && !isAbort) throw e;

    const err2 = new Error("La conexión está tardando demasiado. Intenta de nuevo.");
    (err2 as any).code = "NETWORK_TIMEOUT";
    (err2 as any).elapsedMs = Date.now() - t0;
    throw err2;
  }
}
