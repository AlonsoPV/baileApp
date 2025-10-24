import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { MediaItem } from "../lib/storage";
import { useMyOrganizer } from "./useOrganizer";

const BUCKET = "org-media";

// Helper to upload to org-media bucket
async function uploadOrgFile(orgId: number, file: File): Promise<MediaItem> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const type: "image" | "video" = file.type.startsWith("image/") ? "image" : "video";
  const path = `${orgId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  console.log('[OrgStorage] Uploading file:', { orgId, fileName: file.name, type, path });

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    console.error('[OrgStorage] Upload error:', error);
    throw new Error(`Error al subir archivo: ${error.message}`);
  }

  console.log('[OrgStorage] Upload successful:', data);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    id: path,
    url: urlData.publicUrl,
    type,
    created_at: new Date().toISOString(),
  };
}

async function removeOrgFile(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export function useOrganizerMedia() {
  const qc = useQueryClient();
  const { data: organizer, isLoading: organizerLoading } = useMyOrganizer();
  const orgId = organizer?.id;
  
  // Debug logs removed to prevent infinite loop

  const q = useQuery({
    queryKey: ["organizer", "media", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<MediaItem[]> => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("profiles_organizer")
        .select("media")
        .eq("id", orgId)
        .maybeSingle();
      if (error) throw error;
      return (data?.media as MediaItem[]) || [];
    }
  });

  const save = async (list: MediaItem[]) => {
    if (!orgId) return;
    console.log('[useOrganizerMedia] Saving media array:', list.length, 'items');
    const { error } = await supabase
      .from("profiles_organizer")
      .update({ media: list })
      .eq("id", orgId);
    if (error) {
      console.error('[useOrganizerMedia] Error saving media:', error);
      throw error;
    }
    console.log('[useOrganizerMedia] Media saved successfully');
  };

  const add = useMutation({
    mutationFn: async ({ file, slot }: { file: File; slot: string }) => {
      if (!orgId) throw new Error("No organizer");
      
      console.log('[useOrganizerMedia] Adding media file:', { fileName: file.name, orgId, slot });
      
      try {
        const item = await uploadOrgFile(orgId, file);
        console.log('[useOrganizerMedia] File uploaded successfully:', item);
        
        // Agregar el slot al item
        const itemWithSlot = { ...item, slot };
        console.log('[useOrganizerMedia] Item with slot:', itemWithSlot);
        
        // Reemplazar cualquier item existente en el mismo slot
        const existingMedia = q.data || [];
        const filteredMedia = existingMedia.filter(m => m.slot !== slot);
        const next = [itemWithSlot, ...filteredMedia];
        
        console.log('[useOrganizerMedia] Updating profile with media list:', next);
        
        await save(next);
        console.log('[useOrganizerMedia] Media added successfully');
        
        return next;
      } catch (error) {
        console.error('[useOrganizerMedia] Error in mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useOrganizerMedia] Invalidating queries...');
      qc.invalidateQueries({ queryKey: ["organizer", "media", orgId] });
      qc.invalidateQueries({ queryKey: ["organizer", "me", organizer?.user_id] });
    },
    onError: (error: any) => {
      console.error('[useOrganizerMedia] Error adding media:', error);
    },
  });

  const remove = useMutation({
    mutationFn: async (path: string) => {
      console.log('[useOrganizerMedia] Removing media:', path);
      
      try {
        // Primero eliminar de storage
        await removeOrgFile(path);
        console.log('[useOrganizerMedia] File removed from storage');
        
        // Luego actualizar la lista en DB
        const next = (q.data || []).filter(m => m.id !== path);
        await save(next);
        console.log('[useOrganizerMedia] Media list updated in DB');
        
        return next;
      } catch (error) {
        console.error('[useOrganizerMedia] Error removing media:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useOrganizerMedia] Invalidating queries after media removal');
      qc.invalidateQueries({ queryKey: ["organizer", "media", orgId] });
      qc.invalidateQueries({ queryKey: ["organizer", "me", organizer?.user_id] });
    },
    onError: (error: any) => {
      console.error('[useOrganizerMedia] Error removing media:', error);
    },
  });

  return { 
    media: q.data || [], 
    isLoading: q.isLoading, 
    add, 
    remove 
  };
}
