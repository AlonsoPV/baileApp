import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { MediaItem } from "../lib/storage";
import { useMyAcademy } from "./useAcademy";

const BUCKET = "academy-media";

// Helper to upload to academy-media bucket
async function uploadAcademyFile(academyId: number, file: File): Promise<MediaItem> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const type: "image" | "video" = file.type.startsWith("image/") ? "image" : "video";
  const path = `${academyId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  console.log('[AcademyMediaStorage] Uploading file:', { academyId, fileName: file.name, type, path });

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    console.error('[AcademyMediaStorage] Upload error:', error);
    throw new Error(`Error al subir archivo: ${error.message}`);
  }

  console.log('[AcademyMediaStorage] Upload successful:', data);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    id: path,
    url: urlData.publicUrl,
    type,
    created_at: new Date().toISOString(),
  };
}

async function removeAcademyFile(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
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
    queryFn: async (): Promise<MediaItem[]> => {
      if (!academyId) return [];
      const { data, error } = await supabase
        .from("profiles_academy")
        .select("media")
        .eq("id", academyId)
        .maybeSingle();
      if (error) throw error;
      return (data?.media as MediaItem[]) || [];
    }
  });

  const save = async (list: MediaItem[]) => {
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
