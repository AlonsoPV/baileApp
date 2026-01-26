import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from '@/contexts/AuthProvider';
import { buildSafePatch } from "../utils/safePatch";
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
const PROFILE_UPDATE_TIMEOUT_MS = 7_000;

export function useUserProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: KEY(user?.id),
    enabled: !!user?.id && typeof user.id === 'string' && user.id.length > 0,
    queryFn: async () => {
      if (!user?.id || typeof user.id !== 'string') {
        throw new Error('Usuario sin ID válido');
      }
      
      const { data, error } = await withTimeout(
        supabase
          .from("profiles_user")
          .select("user_id, display_name, bio, avatar_url, rol_baile, ritmos_seleccionados, ritmos, zonas, respuestas, redes_sociales, updated_at, created_at")
          .eq("user_id", user.id)
          .maybeSingle(),
        PROFILE_QUERY_TIMEOUT_MS,
        "Load profile"
      );
      if (error) throw error;
      return data as ProfileUser | null;
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
      if (!user?.id) throw new Error("No user");
      
      try {
        const prev = profile.data || {};
        
        // 🚫 Blindaje: JAMÁS mandar media ni onboarding_complete desde aquí
        const { media, onboarding_complete, ...candidate } = next;

        // Normalizar datos antes del patch
        const normalizedCandidate = {
          ...candidate,
          respuestas: {
            ...candidate.respuestas,
            redes: normalizeSocialInput(candidate.respuestas?.redes || {}),
            ...normalizeQuestions(candidate.respuestas || {})
          }
        };

        // Usar buildSafePatch para merge inteligente
        const patch = buildSafePatch(prev, normalizedCandidate, { 
          allowEmptyArrays: ["ritmos_seleccionados", "ritmos", "zonas"] as any 
        });

        if (Object.keys(patch).length === 0) {
          console.log("[useUserProfile] No changes to save");
          return;
        }

        // Diagnóstico en desarrollo
        if (import.meta.env.MODE === "development") {
          console.log("[useUserProfile] PATCH:", patch);
        }

        // Usar RPC merge para actualizaciones seguras (ya hace upsert internamente)
        const __rpcT0 = Date.now();
        let rpcError: any = null;
        try {
          const res = await withTimeout(
            supabase.rpc("merge_profiles_user", {
              p_user_id: user.id,
              p_patch: patch,
            }),
            PROFILE_UPDATE_TIMEOUT_MS,
            "Save profile (RPC)"
          );
          rpcError = (res as any)?.error ?? null;
        } catch (e: any) {
          // If the RPC hangs/times out (common on flaky networks/WebViews),
          // IMPORTANT: if the network layer is hung, a follow-up upsert often hangs too.
          // So for timeouts/aborts, fail fast (UI can show error + allow retry).
          const msg = String(e?.message ?? e ?? '');
          const isAbort = String(e?.name ?? '').toLowerCase().includes('abort') || msg.toLowerCase().includes('aborted');
          const isTimeout = msg.toLowerCase().includes('timed out') || msg.toLowerCase().includes('timeout');
          if (!isTimeout && !isAbort) {
            throw e;
          }

          // Throw a user-visible error; UI should stop loading + allow retry.
          const err2 = new Error('La conexión está tardando demasiado. Intenta de nuevo.');
          (err2 as any).code = 'NETWORK_TIMEOUT';
          throw err2;
        }
        
        if (rpcError) {
          console.error("[useUserProfile] RPC error:", rpcError);
          
          // Si el RPC falla, intentar upsert directo como fallback
          if (import.meta.env.MODE === "development") {
            console.warn("[useUserProfile] RPC failed, trying direct upsert:", rpcError);
          }
          
          // Limpiar valores undefined del patch antes del upsert
          const cleanPatch: any = {};
          for (const [key, value] of Object.entries(patch)) {
            if (value !== undefined) {
              cleanPatch[key] = value === null ? null : value;
            }
          }
          
          const { error: upsertError } = await withTimeout(
            supabase
              .from("profiles_user")
              .upsert({ user_id: user.id, ...cleanPatch }, { onConflict: 'user_id' }),
            PROFILE_UPDATE_TIMEOUT_MS,
            "Save profile (upsert fallback)"
          );
            
          if (upsertError) {
            console.error("[useUserProfile] Upsert fallback failed:", upsertError);
            
            // Crear un error más descriptivo
            const errorMessage = upsertError.message || 'Error al guardar el perfil';
            const error = new Error(errorMessage);
            (error as any).code = upsertError.code;
            (error as any).details = upsertError.details;
            throw error;
          }
        }
      } catch (e: any) {
        console.error("[useUserProfile] Caught error:", e);
        throw e;
      }
    },
    onSuccess: async () => {
      // Invalidar queries en paralelo para mejor rendimiento (no bloquea la UI)
      Promise.all([
        qc.invalidateQueries({ queryKey: KEY(user?.id) }),
        qc.invalidateQueries({ queryKey: ["onboarding-status", user?.id] }),
        qc.invalidateQueries({ queryKey: ["profile", "media", user?.id] }),
      ]).catch(err => {
        if (import.meta.env.MODE === "development") {
          console.warn("[useUserProfile] Error invalidating queries:", err);
        }
      });
    },
  });

  async function refetchProfile() {
    return qc.fetchQuery({ queryKey: KEY(user?.id) });
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
