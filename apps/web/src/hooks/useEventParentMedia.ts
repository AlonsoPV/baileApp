import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { MediaItem } from "../lib/storage";

const BUCKET = "org-media";

// Helper to upload to org-media bucket
async function uploadEventFile(eventId: number, file: File): Promise<MediaItem> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const type: "image" | "video" = file.type.startsWith("image/") ? "image" : "video";
  const path = `events/${eventId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  console.log('[EventMedia] Uploading file:', { eventId, fileName: file.name, type, path });

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    console.error('[EventMedia] Upload error:', error);
    throw new Error(`Error al subir archivo: ${error.message}`);
  }

  console.log('[EventMedia] Upload successful:', data);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    id: path,
    url: urlData.publicUrl,
    type,
    created_at: new Date().toISOString(),
  };
}

async function removeEventFile(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export function useEventParentMedia(eventId?: number) {
  const qc = useQueryClient();
  
  const q = useQuery({
    queryKey: ["event-parent", "media", eventId],
    enabled: !!eventId,
    queryFn: async (): Promise<MediaItem[]> => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("events_parent")
        .select("media")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return (data?.media as MediaItem[]) || [];
    }
  });

  const save = async (list: MediaItem[]) => {
    if (!eventId) return;
    console.log('[useEventParentMedia] Saving media array:', list.length, 'items');
    const { error } = await supabase
      .from("events_parent")
      .update({ media: list })
      .eq("id", eventId);
    if (error) {
      console.error('[useEventParentMedia] Error saving media:', error);
      throw error;
    }
    console.log('[useEventParentMedia] Media saved successfully');
  };

  const add = useMutation({
    mutationFn: async ({ file, slot }: { file: File; slot: string }) => {
      if (!eventId) throw new Error("No event ID");
      
      console.log('[useEventParentMedia] Adding media file:', { fileName: file.name, eventId, slot });
      
      try {
        const item = await uploadEventFile(eventId, file);
        console.log('[useEventParentMedia] File uploaded successfully:', item);
        
        // Agregar el slot al item
        const itemWithSlot = { ...item, slot };
        console.log('[useEventParentMedia] Item with slot:', itemWithSlot);
        
        // Reemplazar cualquier item existente en el mismo slot
        const existingMedia = q.data || [];
        const filteredMedia = existingMedia.filter(m => m.slot !== slot);
        const next = [itemWithSlot, ...filteredMedia];
        
        console.log('[useEventParentMedia] Updating event with media list:', next);
        
        await save(next);
        console.log('[useEventParentMedia] Media added successfully');
        
        return next;
      } catch (error) {
        console.error('[useEventParentMedia] Error in mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useEventParentMedia] Invalidating queries...');
      qc.invalidateQueries({ queryKey: ["event-parent", "media", eventId] });
      qc.invalidateQueries({ queryKey: ["event", "parent", eventId] });
      qc.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });
    },
    onError: (error: any) => {
      console.error('[useEventParentMedia] Error adding media:', error);
    },
  });

  const remove = useMutation({
    mutationFn: async (path: string) => {
      console.log('[useEventParentMedia] Removing media:', path);
      
      try {
        // Primero eliminar de storage
        await removeEventFile(path);
        console.log('[useEventParentMedia] File removed from storage');
        
        // Luego actualizar la lista en DB
        const next = (q.data || []).filter(m => m.id !== path);
        await save(next);
        console.log('[useEventParentMedia] Media list updated in DB');
        
        return next;
      } catch (error) {
        console.error('[useEventParentMedia] Error removing media:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useEventParentMedia] Invalidating queries after media removal');
      qc.invalidateQueries({ queryKey: ["event-parent", "media", eventId] });
      qc.invalidateQueries({ queryKey: ["event", "parent", eventId] });
      qc.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });
    },
    onError: (error: any) => {
      console.error('[useEventParentMedia] Error removing media:', error);
    },
  });

  return { 
    media: q.data || [], 
    isLoading: q.isLoading, 
    add, 
    remove 
  };
}
