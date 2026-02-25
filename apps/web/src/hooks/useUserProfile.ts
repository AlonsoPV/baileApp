// path: src/hooks/useUserProfile.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "@/contexts/AuthProvider";
import { buildSafePatch, deepMerge } from "../utils/safePatch";
import { normalizeSocialInput, normalizeQuestions } from "../utils/normalize";
import { withTimeout } from "../utils/withTimeout";

export type ProfileUser = {
  user_id: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  rol_baile?: "lead" | "follow" | "ambos" | null;
  ritmos_seleccionados?: string[]; // NOT NULL en DB (según error)
  ritmos?: number[];
  zonas?: number[];
  media?: any[]; // ⚠️ NO actualizar desde este hook
  onboarding_complete?: boolean; // ⚠️ NO actualizar desde este hook
  respuestas?: Record<string, any>;
  redes_sociales?: Record<string, any>;
  updated_at?: string;
  created_at?: string;
};

const KEY = (uid?: string) => ["profile", "me", uid];
const PROFILE_QUERY_TIMEOUT_MS = 15_000;
const PROFILE_UPDATE_TIMEOUT_MS = 30_000;

function cleanUndefined(obj: Record<string, any>) {
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/**
 * DB has NOT NULL constraints; never send null for these.
 */
function enforceNotNullArrays(patchOrCandidate: Record<string, any>) {
  const out: any = { ...patchOrCandidate };

  // IMPORTANT: according to DB error ritmos_seleccionados is NOT NULL
  if (out.ritmos_seleccionados === null) out.ritmos_seleccionados = [];
  // If undefined, leave it undefined (so patch builder can omit it)
  // But if you want to ALWAYS send a value, uncomment:
  // if (out.ritmos_seleccionados === undefined) out.ritmos_seleccionados = [];

  if (out.ritmos === null) out.ritmos = [];
  if (out.zonas === null) out.zonas = [];

  return out;
}

export function useUserProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  async function fetchProfileByUserId(userId: string) {
    const { data, error } = await withTimeout<any>(
      (supabase
        .from("profiles_user")
        .select(
          "user_id, display_name, bio, avatar_url, rol_baile, ritmos_seleccionados, ritmos, zonas, respuestas, redes_sociales, updated_at, created_at"
        )
        .eq("user_id", userId)
        .maybeSingle() as any),
      PROFILE_QUERY_TIMEOUT_MS,
      "Load profile"
    );
    if (error) throw error;
    return data as ProfileUser | null;
  }

  async function upsertFallback(patch: Record<string, any>, prev: any) {
    if (!uid) throw new Error("No user");

    // Limpiar undefined + BLINDAJE not-null arrays
    let cleanPatch: any = cleanUndefined(patch);
    cleanPatch = enforceNotNullArrays(cleanPatch);

    // Preservar JSON anidados
    if (cleanPatch.respuestas && typeof cleanPatch.respuestas === "object" && !Array.isArray(cleanPatch.respuestas)) {
      cleanPatch.respuestas = deepMerge(prev?.respuestas ?? {}, cleanPatch.respuestas);
    }
    if (cleanPatch.redes_sociales && typeof cleanPatch.redes_sociales === "object" && !Array.isArray(cleanPatch.redes_sociales)) {
      cleanPatch.redes_sociales = deepMerge(prev?.redes_sociales ?? {}, cleanPatch.redes_sociales);
    }

    // (Opcional) Si DB también tiene defaults y quieres forzar siempre:
    // if (cleanPatch.ritmos_seleccionados === undefined) cleanPatch.ritmos_seleccionados = prev?.ritmos_seleccionados ?? [];

    const { error: upsertError } = await withTimeout<any>(
      (supabase.from("profiles_user").upsert({ user_id: uid, ...cleanPatch }, { onConflict: "user_id" }) as any),
      PROFILE_UPDATE_TIMEOUT_MS,
      "Save profile (upsert fallback)"
    );

    if (upsertError) {
      console.error("[useUserProfile] Upsert fallback failed:", upsertError);
      const err = new Error(upsertError.message || "Error al guardar el perfil");
      (err as any).code = upsertError.code;
      (err as any).details = upsertError.details;
      throw err;
    }
  }

  const profile = useQuery<ProfileUser | null>({
    queryKey: KEY(uid),
    enabled: !!uid && typeof uid === "string" && uid.length > 0,
    queryFn: async () => {
      if (!uid || typeof uid !== "string") throw new Error("Usuario sin ID válido");
      return fetchProfileByUserId(uid);
    },
    staleTime: 30_000,
    gcTime: 300_000,
    retry: 1,
    retryDelay: 500,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
  });

  // path: src/hooks/useUserProfile.ts
const updateFields = useMutation({
  mutationFn: async (next: Partial<ProfileUser>) => {
    if (!uid) throw new Error("No user");

    const prev = (profile.data || {}) as ProfileUser;

    // 🚫 Blindaje: no aceptar media/onboarding_complete aquí
    const { media, onboarding_complete, ...candidateRaw } = next as any;

    // ✅ Redes: SOLO en columna redes_sociales.
    // Compat: si aún llega respuestas.redes, lo tomamos pero NO lo guardamos en respuestas.
    const incomingRedes =
      (candidateRaw as any).redes_sociales ??
      (candidateRaw as any).respuestas?.redes ??
      {};

    const normalizedRedes = normalizeSocialInput(incomingRedes);

    // ✅ Respuestas: SOLO preguntas (sin redes)
    let normalizedRespuestas: Record<string, any> | undefined = undefined;
    if ((candidateRaw as any).respuestas) {
      const rawResp: Record<string, any> = { ...(candidateRaw as any).respuestas };
      delete rawResp.redes; // <-- nunca persistir redes dentro de respuestas

      const nq = normalizeQuestions(rawResp);
      normalizedRespuestas = deepMerge(prev.respuestas ?? {}, nq);
    }

    // ✅ Candidate normalizado
    const normalizedCandidate: Partial<ProfileUser> = enforceNotNullArrays({
      ...candidateRaw,
      respuestas: normalizedRespuestas,
      redes_sociales: deepMerge(prev.redes_sociales ?? {}, normalizedRedes),
    });

    // ✅ Patch
    const patchRaw = buildSafePatch(prev, normalizedCandidate, {
      allowEmptyArrays: ["ritmos_seleccionados", "ritmos", "zonas"] as any,
    });

    const patch = enforceNotNullArrays(patchRaw);

    if (import.meta.env.MODE === "development") {
      console.log("[useUserProfile] PREV:", prev);
      console.log("[useUserProfile] NEXT:", next);
      console.log("[useUserProfile] NORMALIZED:", normalizedCandidate);
      console.log("[useUserProfile] PATCH:", patch);
    }

    if (Object.keys(patch).length === 0) {
      console.log("[useUserProfile] No changes to save");
      return { patch: {} as Record<string, any> };
    }

    // RPC merge → fallback upsert
    try {
      const res = await withTimeout(
        (supabase.rpc("merge_profiles_user", { p_user_id: uid, p_patch: patch }) as any),
        PROFILE_UPDATE_TIMEOUT_MS,
        "Save profile (RPC)"
      );

      const rpcError = (res as any)?.error ?? null;
      if (rpcError) {
        console.error("[useUserProfile] RPC failed, trying direct upsert:", rpcError);
        await upsertFallback(patch, prev);
      }
    } catch (e: any) {
      const msg = String(e?.message ?? e ?? "");
      const isAbort =
        String(e?.name ?? "").toLowerCase().includes("abort") ||
        msg.toLowerCase().includes("aborted");
      const isTimeout =
        msg.toLowerCase().includes("timed out") ||
        msg.toLowerCase().includes("timeout");

      if (!isTimeout && !isAbort) throw e;

      if (import.meta.env.MODE === "development") {
        console.warn("[useUserProfile] RPC timed out/aborted; trying upsert fallback...");
      }
      await upsertFallback(patch, prev);
    }

    return { patch };
  },

  onSuccess: async (result) => {
    const patch = (result as any)?.patch || {};
    if (!uid) return;

    // Optimistic cache update sin falsificar updated_at
    if (patch && Object.keys(patch).length > 0) {
      qc.setQueryData(KEY(uid), (old: any) => {
        if (!old) return old;
        return deepMerge(old, patch);
      });
      qc.setQueryData(["profile", "public", uid], (old: any) => {
        if (!old) return old;
        return deepMerge(old, patch);
      });
    }

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