import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from '@/contexts/AuthProvider';
import type { Organizer } from "../types/events";
import { buildSafePatch, deepEqual, pruneEmptyDeep } from "../utils/safePatch";

export function useMyOrganizer() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["organizer", "me", user?.id],
    enabled: !!user?.id && typeof user.id === 'string' && user.id.length > 0,
    queryFn: async (): Promise<Organizer|null> => {
      if (!user?.id || typeof user.id !== 'string') {
        console.warn('[useMyOrganizer] Usuario sin ID válido');
        return null;
      }
      
      const { data, error } = await supabase
        .from("profiles_organizer")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) {
        // PGRST116 = No rows found (esperado cuando no hay perfil)
        if (error.code === 'PGRST116') {
          return null;
        }
        // Error 406 = Not Acceptable (posible problema de RLS o tabla no existe)
        const errAny = error as any;
        if (error.code === '406' || errAny.status === 406) {
          console.warn('[useMyOrganizer] Error 406 al cargar perfil (posible problema de RLS):', error);
          return null;
        }
        // Para otros errores, lanzar para que React Query los maneje
        if (process.env.NODE_ENV === 'development') {
          console.error('[useMyOrganizer] Error inesperado al cargar perfil:', error);
        }
        throw error;
      }
      return data || null;
    },
    staleTime: 30_000, // Permite reutilizar cache breve sin mantener polling constante
    refetchOnWindowFocus: true, // Refrescar al volver a la ventana si ya está stale
    placeholderData: (previousData) => previousData, // Keep previous data during transitions
    retry: (failureCount, error: any) => {
      // No reintentar si es error 406 o PGRST116
      if (error?.code === '406' || error?.code === 'PGRST116' || error?.status === 406) {
        return false;
      }
      // Reintentar hasta 2 veces para otros errores
      return failureCount < 2;
    },
  });
}

export function useUpsertMyOrganizer() {
  const { user } = useAuth(); 
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (next: Partial<Organizer>) => {
      console.log("🔍 [useOrganizer] ===== INICIO GUARDADO =====");
      console.log("📥 [useOrganizer] Datos recibidos:", next);
      
      if (!user?.id) {
        console.error("❌ [useOrganizer] No hay usuario autenticado");
        throw new Error("No user");
      }
      
      console.log("👤 [useOrganizer] Usuario ID:", user.id);
      
      // try get mine
      console.log("🔍 [useOrganizer] Buscando organizador existente...");
      const { data: existing, error: e1 } = await supabase
        .from("profiles_organizer")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
        
      console.log("📊 [useOrganizer] Resultado búsqueda:", { existing, error: e1 });
      
      if (e1) {
        console.error("❌ [useOrganizer] Error al buscar organizador:", e1);
        throw e1;
      }
      
      if (existing) {
        console.log("✅ [useOrganizer] Organizador existente encontrado, ID:", existing.id);
        
        // Usar merge profundo
        const prev = existing;
        const {
          media,
          ubicaciones,
          respuestas: nextRespuestas,
          redes_sociales: nextRedes,
          cuenta_bancaria: nextCuentaBancaria,
          faq: nextFaq,
          ...candidate
        } = next as any; // media va por otro hook, campos no existentes se filtran
        
        console.log("📋 [useOrganizer] ANÁLISIS DETALLADO:");
        console.log("  📝 nombre_publico:", {
          prev: prev.nombre_publico,
          next: next.nombre_publico,
          changed: prev.nombre_publico !== next.nombre_publico
        });
        console.log("  📄 bio:", {
          prev: prev.bio,
          next: next.bio,
          changed: prev.bio !== next.bio
        });
        console.log("  🎵 ritmos:", {
          prev: prev.ritmos,
          next: next.ritmos,
          changed: JSON.stringify(prev.ritmos) !== JSON.stringify(next.ritmos)
        });
        console.log("  📍 zonas:", {
          prev: prev.zonas,
          next: next.zonas,
          changed: JSON.stringify(prev.zonas) !== JSON.stringify(next.zonas)
        });
        console.log("  💬 respuestas:", {
          prev: prev.respuestas,
          next: nextRespuestas,
          changed: JSON.stringify(prev.respuestas) !== JSON.stringify(nextRespuestas)
        });
        console.log("  📱 redes_sociales:", {
          prev: prev.redes_sociales,
          next: nextRedes,
          changed: JSON.stringify(prev.redes_sociales) !== JSON.stringify(nextRedes)
        });
        console.log("  🖼️ media:", {
          prev: prev.media,
          next: next.media,
          changed: JSON.stringify(prev.media) !== JSON.stringify(next.media)
        });
        console.log("🔧 [useOrganizer] Creando patch...");
        console.log("  🎵 ritmos_seleccionados:", {
          prev: (prev as any).ritmos_seleccionados,
          next: (next as any).ritmos_seleccionados,
          changed: JSON.stringify((prev as any).ritmos_seleccionados) !== JSON.stringify((next as any).ritmos_seleccionados)
        });
        const patch = buildSafePatch(prev, candidate, { 
          allowEmptyArrays: ["ritmos", "zonas", "estilos", "ritmos_seleccionados", "faq"] as any 
        });

        // Cuenta bancaria (JSONB): debe comportarse como "replace" (no merge),
        // para que cambios (incluyendo vaciar campos) se reflejen.
        if (nextCuentaBancaria !== undefined) {
          const prevBank = ((prev as any).cuenta_bancaria ?? {}) as any;
          const cleanedBank = pruneEmptyDeep((nextCuentaBancaria ?? {}) as any);
          if (!deepEqual(prevBank, cleanedBank)) {
            (patch as any).cuenta_bancaria = cleanedBank;
            console.log("✅ [useOrganizer] Agregando 'cuenta_bancaria' al patch:", cleanedBank);
          }
        }

        // FAQ (JSONB array): reemplazo completo
        if (nextFaq !== undefined) {
          const prevFaq = Array.isArray((prev as any).faq) ? (prev as any).faq : [];
          if (!deepEqual(prevFaq, nextFaq)) {
            (patch as any).faq = nextFaq;
            console.log("✅ [useOrganizer] Agregando 'faq' al patch");
          }
        }
        
        console.log("📦 [useOrganizer] Patch creado:", patch);
        console.log("📊 [useOrganizer] Claves del patch:", Object.keys(patch));

        const hasRespuestasColumn = Object.prototype.hasOwnProperty.call(prev, "respuestas");
        const hasRedesSocialesColumn = Object.prototype.hasOwnProperty.call(prev, "redes_sociales");
        
        // Agregar respuestas al patch si la columna existe y hay cambios
        if (hasRespuestasColumn && nextRespuestas !== undefined) {
          const prevRespuestas = (prev as any).respuestas || {};
          const nextRespuestasObj = nextRespuestas || {};
          // Solo agregar si hay cambios
          if (JSON.stringify(prevRespuestas) !== JSON.stringify(nextRespuestasObj)) {
            (patch as any).respuestas = nextRespuestasObj;
            console.log("✅ [useOrganizer] Agregando 'respuestas' al patch:", nextRespuestasObj);
          }
        } else if (!hasRespuestasColumn && Object.prototype.hasOwnProperty.call(patch, "respuestas")) {
          console.log("⚠️ [useOrganizer] Removiendo 'respuestas' del patch porque la columna no existe en este entorno.");
          delete (patch as any).respuestas;
        }

        if (Object.prototype.hasOwnProperty.call(patch, "ubicaciones")) {
          console.log("⚠️ [useOrganizer] Removiendo 'ubicaciones' del patch porque la columna no existe.");
          delete (patch as any).ubicaciones;
        }

        // Agregar redes_sociales al patch si la columna existe y hay cambios
        if (hasRedesSocialesColumn && nextRedes !== undefined) {
          const prevRedes = (prev as any).redes_sociales || {};
          const nextRedesObj = nextRedes || {};
          // Solo agregar si hay cambios
          if (JSON.stringify(prevRedes) !== JSON.stringify(nextRedesObj)) {
            (patch as any).redes_sociales = nextRedesObj;
            console.log("✅ [useOrganizer] Agregando 'redes_sociales' al patch:", nextRedesObj);
          }
        } else if (!hasRedesSocialesColumn && Object.prototype.hasOwnProperty.call(patch, "redes_sociales")) {
          console.log("⚠️ [useOrganizer] Removiendo 'redes_sociales' del patch porque la columna no existe.");
          delete (patch as any).redes_sociales;
        }
        
        if (Object.keys(patch).length === 0) {
          console.log("ℹ️ [useOrganizer] No hay cambios para guardar");
          return existing.id;
        }

        if (hasRespuestasColumn) {
          console.log("🚀 [useOrganizer] Llamando a merge_profiles_organizer...");
          console.log("  📤 Parámetros:", {
            p_id: existing.id,
            p_owner: user.id,
            p_patch: patch
          });

          const { error } = await supabase.rpc("merge_profiles_organizer", {
            p_id: existing.id,
            p_owner: user.id,
            p_patch: patch
          });
          
          if (error) {
            console.warn("⚠️ [useOrganizer] RPC merge_profiles_organizer falló, intentando fallback update", error);
            const { error: updError } = await supabase
              .from("profiles_organizer")
              .update(patch as any)
              .eq("id", existing.id);
            if (updError) {
              console.error("❌ [useOrganizer] Fallback update falló:", updError);
              throw updError;
            }
          } else {
            // Refuerzo: si el RPC ignoró columnas nuevas como ritmos_seleccionados, redes_sociales o respuestas, aplica update directo de esas claves
            const needsDirect: any = {};
            if (Object.prototype.hasOwnProperty.call(patch, 'ritmos_seleccionados')) {
              (needsDirect as any).ritmos_seleccionados = (patch as any).ritmos_seleccionados;
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'cuenta_bancaria')) {
              (needsDirect as any).cuenta_bancaria = (patch as any).cuenta_bancaria;
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'redes_sociales')) {
              (needsDirect as any).redes_sociales = (patch as any).redes_sociales;
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'respuestas')) {
              (needsDirect as any).respuestas = (patch as any).respuestas;
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'faq')) {
              (needsDirect as any).faq = (patch as any).faq;
            }
            if (Object.keys(needsDirect).length > 0) {
              console.log("🔧 [useOrganizer] Aplicando refuerzo para campos:", Object.keys(needsDirect));
              await supabase.from("profiles_organizer").update(needsDirect).eq("id", existing.id);
            }
            console.log("✅ [useOrganizer] merge_profiles_organizer ejecutado (con refuerzo si fue necesario)");
          }
        } else {
          console.log("ℹ️ [useOrganizer] Entorno sin columna 'respuestas', aplicando update directo sin RPC.");
          const { error: directErr } = await supabase
            .from("profiles_organizer")
            .update(patch as any)
            .eq("id", existing.id);
          if (directErr) {
            console.error("❌ [useOrganizer] Update directo falló:", directErr);
            throw directErr;
          }
        }
        // Invalidar queries para forzar actualización
        qc.invalidateQueries({ queryKey: ["organizer", "me", user.id] });
        qc.invalidateQueries({ queryKey: ["organizer"] });
        
        return existing.id;
      } else {
        console.log("🆕 [useOrganizer] Creando nuevo organizador...");
        
        // Primera vez: crear directamente
        // Filtrar campos que no existen en profiles_organizer (como ubicaciones o media)
        const { media, ubicaciones, ...cleanNext } = next as any;
        
        const payload: any = { 
          user_id: user.id, 
          nombre_publico: next.nombre_publico || "Mi Organizador",
          estado_aprobacion: 'borrador', // Estado inicial por defecto
          ...cleanNext 
        };
        
        // Incluir redes_sociales y respuestas si están presentes
        if ((next as any).redes_sociales !== undefined) {
          payload.redes_sociales = (next as any).redes_sociales;
        }
        if ((next as any).respuestas !== undefined) {
          payload.respuestas = (next as any).respuestas;
        }
        
        console.log("📦 [useOrganizer] Payload para insertar:", payload);
        
        const { data, error } = await supabase
          .from("profiles_organizer")
          .insert(payload)
          .select("id")
          .single();
          
        if (error) {
          console.error("❌ [useOrganizer] Error al crear organizador:", error);
          throw error;
        }
        
        console.log("✅ [useOrganizer] Organizador creado exitosamente, ID:", data.id);
        return data.id as number;
      }
    },
    onSuccess: () => {
      // Invalidar todas las queries de organizer (usa prefijo para capturar todos los user_id)
      qc.invalidateQueries({ queryKey: ["organizer"] });
    },
  });
}

export function useSubmitOrganizerForReview() {
  const { user } = useAuth(); 
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles_organizer")
        .update({ estado_aprobacion: "en_revision" })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organizer"] }),
  });
}

export function useOrganizerPublic(id?: number) {
  return useQuery({
    queryKey: ["organizer", "public", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_organizer")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error; 
      return data;
    },
  });
}