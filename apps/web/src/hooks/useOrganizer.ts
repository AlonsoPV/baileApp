import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from '@/contexts/AuthProvider';
import type { Organizer } from "../types/events";
import { buildSafePatch } from "../utils/safePatch";

export function useMyOrganizer() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["organizer", "me", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Organizer|null> => {
      const { data, error } = await supabase
        .from("profiles_organizer")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data || null;
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
        const { media, ...candidate } = next; // media va por otro hook
        
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
          next: next.respuestas,
          changed: JSON.stringify(prev.respuestas) !== JSON.stringify(next.respuestas)
        });
        console.log("  📱 redes_sociales:", {
          prev: prev.redes_sociales,
          next: next.redes_sociales,
          changed: JSON.stringify(prev.redes_sociales) !== JSON.stringify(next.redes_sociales)
        });
        console.log("  🖼️ media:", {
          prev: prev.media,
          next: next.media,
          changed: JSON.stringify(prev.media) !== JSON.stringify(next.media)
        });
        
        console.log("🔧 [useOrganizer] Creando patch...");
        const patch = buildSafePatch(prev, candidate, { 
          allowEmptyArrays: ["ritmos", "zonas", "estilos"] as any 
        });
        
        console.log("📦 [useOrganizer] Patch creado:", patch);
        console.log("📊 [useOrganizer] Claves del patch:", Object.keys(patch));
        
        if (Object.keys(patch).length === 0) {
          console.log("ℹ️ [useOrganizer] No hay cambios para guardar");
          return existing.id;
        }

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
          console.error("❌ [useOrganizer] Error en merge_profiles_organizer:");
          console.error("  📊 Código:", error.code);
          console.error("  📝 Mensaje:", error.message);
          console.error("  🔍 Detalles:", error.details);
          console.error("  💡 Hint:", error.hint);
          console.error("  📋 Error completo:", error);
          throw error;
        }
        
        console.log("✅ [useOrganizer] merge_profiles_organizer ejecutado exitosamente");
        return existing.id;
      } else {
        console.log("🆕 [useOrganizer] Creando nuevo organizador...");
        
        // Primera vez: crear directamente
        const payload = { 
          user_id: user.id, 
          nombre_publico: next.nombre_publico || "Mi Organizador", 
          ...next 
        };
        
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
      qc.invalidateQueries({ queryKey: ["organizer"] });
      qc.invalidateQueries({ queryKey: ["organizer", "me"] });
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