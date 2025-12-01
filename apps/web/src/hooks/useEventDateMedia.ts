import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { MediaItem } from "../lib/storage";
import { resizeImageIfNeeded } from "../lib/imageResize";

const BUCKET = "org-media";

// Helper to upload to org-media bucket
async function uploadEventDateFile(dateId: number, file: File): Promise<MediaItem> {
  // Redimensionar imagen si es necesario (máximo 800px de ancho)
  const processedFile = await resizeImageIfNeeded(file, 800);
  
  const ext = processedFile.name.split(".").pop()?.toLowerCase() || "bin";
  const type: "image" | "video" = processedFile.type.startsWith("image/") ? "image" : "video";
  const path = `event-dates/${dateId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  console.log('[EventDateMedia] Uploading file:', { dateId, fileName: processedFile.name, type, path, originalSize: file.size, processedSize: processedFile.size });

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, processedFile, {
    cacheControl: "3600",
    upsert: false,
    contentType: processedFile.type || undefined,
  });

  if (error) {
    console.error('[EventDateMedia] Upload error:', error);
    throw new Error(`Error al subir archivo: ${error.message}`);
  }

  console.log('[EventDateMedia] Upload successful:', data);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    id: path,
    url: urlData.publicUrl,
    type,
    created_at: new Date().toISOString(),
  };
}

async function removeEventDateFile(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export function useEventDateMedia(dateId?: number) {
  const qc = useQueryClient();
  
  const q = useQuery({
    queryKey: ["event-date", "media", dateId],
    enabled: !!dateId,
    queryFn: async (): Promise<MediaItem[]> => {
      if (!dateId) return [];
      const { data, error } = await supabase
        .from("events_date")
        .select("media")
        .eq("id", dateId)
        .maybeSingle();
      if (error) throw error;
      return (data?.media as MediaItem[]) || [];
    }
  });

  const save = async (list: MediaItem[]) => {
    if (!dateId) return;
    console.log('[useEventDateMedia] Saving media array:', list.length, 'items');
    const { error } = await supabase
      .from("events_date")
      .update({ media: list })
      .eq("id", dateId);
    if (error) {
      console.error('[useEventDateMedia] Error saving media:', error);
      throw error;
    }
    console.log('[useEventDateMedia] Media saved successfully');
  };

  const add = useMutation({
    mutationFn: async ({ file, slot }: { file: File; slot: string }) => {
      if (!dateId) throw new Error("No date ID");
      
      console.log('[useEventDateMedia] Adding media file:', { fileName: file.name, dateId, slot });
      
      try {
        const item = await uploadEventDateFile(dateId, file);
        console.log('[useEventDateMedia] File uploaded successfully:', item);
        
        // Agregar el slot al item
        const itemWithSlot = { ...item, slot };
        console.log('[useEventDateMedia] Item with slot:', itemWithSlot);
        
        // Reemplazar cualquier item existente en el mismo slot
        const existingMedia = q.data || [];
        const filteredMedia = existingMedia.filter(m => m.slot !== slot);
        const next = [itemWithSlot, ...filteredMedia];
        
        console.log('[useEventDateMedia] Updating event date with media list:', next);
        
        await save(next);
        console.log('[useEventDateMedia] Media added successfully');
        
        return next;
      } catch (error) {
        console.error('[useEventDateMedia] Error in mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useEventDateMedia] Invalidating queries...');
      qc.invalidateQueries({ queryKey: ["event-date", "media", dateId] });
      qc.invalidateQueries({ queryKey: ["event", "date", dateId] });
      qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
    },
    onError: (error: any) => {
      console.error('[useEventDateMedia] Error adding media:', error);
    },
  });

  const remove = useMutation({
    mutationFn: async (path: string) => {
      console.log('[useEventDateMedia] Removing media:', path);
      
      try {
        // Primero eliminar de storage
        await removeEventDateFile(path);
        console.log('[useEventDateMedia] File removed from storage');
        
        // Luego actualizar la lista en DB
        const next = (q.data || []).filter(m => m.id !== path);
        await save(next);
        console.log('[useEventDateMedia] Media list updated in DB');
        
        return next;
      } catch (error) {
        console.error('[useEventDateMedia] Error removing media:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useEventDateMedia] Invalidating queries after media removal');
      qc.invalidateQueries({ queryKey: ["event-date", "media", dateId] });
      qc.invalidateQueries({ queryKey: ["event", "date", dateId] });
      qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
    },
    onError: (error: any) => {
      console.error('[useEventDateMedia] Error removing media:', error);
    },
  });

  return { 
    media: q.data || [], 
    isLoading: q.isLoading, 
    add, 
    remove 
  };
}
