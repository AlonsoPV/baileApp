import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { MediaItem } from "../lib/storage";
import { useMyOrganizer } from "./useOrganizer";
import { resizeImageIfNeeded } from "../lib/imageResize";

const BUCKET = "media"; // ✅ Bucket unificado

type MediaItemWithSlot = MediaItem & { slot?: string };

function safeRandomId(): string {
  try {
    const c = (globalThis as any)?.crypto;
    if (c?.randomUUID && typeof c.randomUUID === "function") {
      return c.randomUUID();
    }
  } catch {}
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Helper to upload to media bucket (organizer media)
async function uploadOrgFile(orgId: number, file: File): Promise<MediaItem> {
  // Redimensionar imagen si es necesario (máximo 800px de ancho)
  const processedFile = await resizeImageIfNeeded(file, 800);
  
  const ext = processedFile.name.split(".").pop()?.toLowerCase() || "bin";
  const type: "image" | "video" = processedFile.type.startsWith("image/") ? "image" : "video";
  // `BUCKET` ya es "media", así que el key NO debe volver a incluir "media/".
  const path = `organizer-media/${orgId}/${Date.now()}-${safeRandomId()}.${ext}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, processedFile, {
    cacheControl: "31536000",
    upsert: false,
    contentType: processedFile.type || undefined,
  });

  if (error) throw new Error(`Error al subir archivo: ${error.message}`);

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

  const q = useQuery({
    queryKey: ["organizer", "media", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<MediaItemWithSlot[]> => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("profiles_organizer")
        .select("media")
        .eq("id", orgId)
        .maybeSingle();
      if (error) throw error;
      return ((data?.media as any[]) || []) as MediaItemWithSlot[];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const save = async (list: MediaItemWithSlot[]) => {
    if (!orgId) return;
    const { error } = await supabase
      .from("profiles_organizer")
      .update({ media: list })
      .eq("id", orgId);
    if (error) throw error;
  };

  const add = useMutation({
    mutationFn: async ({ file, slot }: { file: File; slot: string }) => {
      if (!orgId) throw new Error("No organizer");
      const item = await uploadOrgFile(orgId, file);
      const itemWithSlot: MediaItemWithSlot = { ...item, slot };
      const existingMedia = (q.data || []) as MediaItemWithSlot[];
      const filteredMedia = existingMedia.filter((m) => m.slot !== slot);
      const next = [itemWithSlot, ...filteredMedia];
      await save(next);
      return next;
    },
    onSuccess: (next) => {
      qc.setQueryData(["organizer", "media", orgId], next);
      qc.invalidateQueries({ queryKey: ["organizer", "media", orgId] });
      qc.invalidateQueries({ queryKey: ["organizer", "me", organizer?.user_id] });
      qc.invalidateQueries({ queryKey: ["organizer"] });
      qc.refetchQueries({ queryKey: ["organizer", "media", orgId] });
    },
  });

  const remove = useMutation({
    mutationFn: async (path: string) => {
      await removeOrgFile(path);
      const next = (q.data || []).filter(m => m.id !== path);
      await save(next);
      return next;
    },
    onSuccess: (next) => {
      qc.setQueryData(["organizer", "media", orgId], next);
      qc.invalidateQueries({ queryKey: ["organizer", "media", orgId] });
      qc.invalidateQueries({ queryKey: ["organizer", "me", organizer?.user_id] });
      qc.invalidateQueries({ queryKey: ["organizer"] });
      qc.refetchQueries({ queryKey: ["organizer", "media", orgId] });
    },
  });

  const replaceMedia = useMutation({
    mutationFn: async (nextList: MediaItemWithSlot[]) => {
      if (!orgId) throw new Error("No organizer");
      await save(nextList);
      return nextList;
    },
    onMutate: async (nextList) => {
      const key = ["organizer", "media", orgId] as const;
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<MediaItemWithSlot[]>(key);
      qc.setQueryData(key, nextList);
      return { previous };
    },
    onError: (_error, _nextList, context) => {
      const key = ["organizer", "media", orgId] as const;
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSuccess: (nextList) => {
      qc.setQueryData(["organizer", "media", orgId], nextList);
      qc.invalidateQueries({ queryKey: ["organizer", "media", orgId] });
      qc.invalidateQueries({ queryKey: ["organizer", "me", organizer?.user_id] });
      qc.invalidateQueries({ queryKey: ["organizer"] });
    },
  });

  return { 
    media: q.data || [], 
    isLoading: q.isLoading || organizerLoading,
    add, 
    remove,
    replaceMedia,
  };
}
