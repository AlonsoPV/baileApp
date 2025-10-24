import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface AcademyProfile {
  id: number;
  user_id: string;
  nombre_publico: string;
  bio?: string;
  estilos: number[];
  media: any[];
  redes_sociales?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
  respuestas?: {
    redes?: {
      instagram?: string;
      facebook?: string;
      whatsapp?: string;
    };
    dato_curioso?: string;
    gusta_bailar?: string;
  };
  estado_aprobacion: 'borrador' | 'en_revision' | 'aprobado' | 'rechazado';
  created_at: string;
  updated_at: string;
}

export function useMyAcademy() {
  return useQuery({
    queryKey: ["academy", "me"],
    queryFn: async (): Promise<AcademyProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles_academy")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertMyAcademy() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async (patch: Partial<AcademyProfile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      console.log('🔍 [useAcademy] ===== INICIO GUARDADO =====');
      console.log('📥 [useAcademy] Datos recibidos:', patch);

      const { data, error } = await supabase.rpc('merge_profiles_academy', {
        p_user_id: user.id,
        p_patch: patch
      });

      if (error) {
        console.error('[useAcademy] Error en RPC:', error);
        throw error;
      }

      console.log('✅ [useAcademy] merge_profiles_academy ejecutado exitosamente');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy", "me"] });
    },
  });
}

export function useAcademyMedia() {
  const qc = useQueryClient();
  const { data: academy, isLoading: academyLoading } = useMyAcademy();
  const academyId = academy?.id;
  
  console.log('🔍 [useAcademyMedia] Academy data:', { 
    academy, 
    academyId, 
    academyLoading,
    redes_sociales: academy?.redes_sociales,
    bio: academy?.bio,
    nombre_publico: academy?.nombre_publico
  });

  const q = useQuery({
    queryKey: ["academy", "media", academyId],
    enabled: !!academyId,
    queryFn: async (): Promise<any[]> => {
      if (!academyId) return [];
      const { data, error } = await supabase
        .from("profiles_academy")
        .select("media")
        .eq("id", academyId)
        .maybeSingle();
      if (error) throw error;
      return (data?.media as any[]) || [];
    }
  });

  const save = async (list: any[]) => {
    if (!academyId) return;
    console.log('[useAcademyMedia] Saving media array:', list.length, 'items');
    const { error } = await supabase
      .from("profiles_academy")
      .update({ media: list })
      .eq("id", academyId);
    if (error) {
      console.error('[useAcademyMedia] Error saving media:', error);
      throw error;
    }
    console.log('[useAcademyMedia] Media saved successfully');
  };

  const add = useMutation({
    mutationFn: async ({ file, slot }: { file: File; slot: string }) => {
      if (!academyId) throw new Error("No academy");
      
      console.log('[useAcademyMedia] Adding media file:', { fileName: file.name, academyId, slot });
      
      try {
        const item = await uploadAcademyFile(academyId, file);
        console.log('[useAcademyMedia] File uploaded successfully:', item);
        
        // Agregar el slot al item
        const itemWithSlot = { ...item, slot };
        console.log('[useAcademyMedia] Item with slot:', itemWithSlot);
        
        // Reemplazar cualquier item existente en el mismo slot
        const existingMedia = q.data || [];
        const filteredMedia = existingMedia.filter(m => m.slot !== slot);
        const next = [itemWithSlot, ...filteredMedia];
        
        console.log('[useAcademyMedia] Updating profile with media list:', next);
        
        await save(next);
        console.log('[useAcademyMedia] Media added successfully');
        
        return next;
      } catch (error) {
        console.error('[useAcademyMedia] Error in mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useAcademyMedia] Invalidating queries...');
      qc.invalidateQueries({ queryKey: ["academy", "media", academyId] });
      qc.invalidateQueries({ queryKey: ["academy", "me", academy?.user_id] });
    },
    onError: (error: any) => {
      console.error('[useAcademyMedia] Error adding media:', error);
    },
  });

  const remove = useMutation({
    mutationFn: async (path: string) => {
      console.log('[useAcademyMedia] Removing media:', path);
      
      try {
        // Primero eliminar de storage
        await removeAcademyFile(path);
        console.log('[useAcademyMedia] File removed from storage');
        
        // Luego actualizar la lista en DB
        const next = (q.data || []).filter(m => m.id !== path);
        await save(next);
        console.log('[useAcademyMedia] Media list updated in DB');
        
        return next;
      } catch (error) {
        console.error('[useAcademyMedia] Error removing media:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useAcademyMedia] Invalidating queries after media removal');
      qc.invalidateQueries({ queryKey: ["academy", "media", academyId] });
      qc.invalidateQueries({ queryKey: ["academy", "me", academy?.user_id] });
    },
    onError: (error: any) => {
      console.error('[useAcademyMedia] Error removing media:', error);
    },
  });

  return { 
    media: q.data || [], 
    isLoading: q.isLoading, 
    add, 
    remove 
  };
}

// Helper to upload to academy-media bucket
async function uploadAcademyFile(academyId: number, file: File): Promise<any> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const type: "image" | "video" = file.type.startsWith("image/") ? "image" : "video";
  const path = `${academyId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  console.log('[AcademyStorage] Uploading file:', { academyId, fileName: file.name, type, path });

  const { data, error } = await supabase.storage.from("academy-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    console.error('[AcademyStorage] Upload error:', error);
    throw new Error(`Error al subir archivo: ${error.message}`);
  }

  console.log('[AcademyStorage] Upload successful:', data);

  const { data: urlData } = supabase.storage.from("academy-media").getPublicUrl(path);

  return {
    id: path,
    url: urlData.publicUrl,
    type,
    created_at: new Date().toISOString(),
  };
}

async function removeAcademyFile(path: string) {
  const { error } = await supabase.storage.from("academy-media").remove([path]);
  if (error) throw error;
}
