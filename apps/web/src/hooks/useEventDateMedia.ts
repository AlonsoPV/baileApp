// path: src/hooks/useEventDateMedia.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { MediaItem } from "../lib/storage";
import { resizeImageIfNeeded } from "../lib/imageResize";

type MediaItemWithSlot = MediaItem & { slot?: string };

const BUCKET = "org-media";

function qk(dateId?: number) {
  return ["event-date", "media", dateId] as const;
}

async function uploadEventDateFile(dateId: number, file: File): Promise<MediaItem> {
  // ✅ Solo resize para imágenes (evita CPU heavy / crashes en video)
  const isImage = file.type.startsWith("image/");
  const processedFile = isImage ? await resizeImageIfNeeded(file, 800) : file;

  const ext =
    processedFile.name.split(".").pop()?.toLowerCase() ||
    (isImage ? "jpg" : "mp4");

  const type: "image" | "video" = isImage ? "image" : "video";
  const path = `event-dates/${dateId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, processedFile, {
    cacheControl: "31536000",
    upsert: false,
    contentType: processedFile.type || undefined,
  });

  if (error) throw new Error(`Error al subir archivo: ${error.message}`);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    id: path, // usamos path como id estable
    url: urlData.publicUrl,
    type,
    created_at: new Date().toISOString(),
  };
}

async function removeEventDateFile(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

async function saveMediaList(dateId: number, list: MediaItemWithSlot[]) {
  const { error } = await supabase
    .from("events_date")
    .update({ media: list })
    .eq("id", dateId);

  if (error) throw error;
}

export function useEventDateMedia(dateId?: number) {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: qk(dateId),
    enabled: !!dateId,
    queryFn: async (): Promise<MediaItemWithSlot[]> => {
      if (!dateId) return [];
      const { data, error } = await supabase
        .from("events_date")
        .select("media")
        .eq("id", dateId)
        .maybeSingle();
      if (error) throw error;
      return ((data?.media as MediaItemWithSlot[]) || []).filter(Boolean);
    },
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });

  const add = useMutation({
    mutationFn: async ({ file, slot }: { file: File; slot: string }) => {
      if (!dateId) throw new Error("No date ID");

      // Upload primero
      const item = await uploadEventDateFile(dateId, file);
      const itemWithSlot: MediaItemWithSlot = { ...item, slot };

      // ✅ Fuente “actual” desde cache (evita q.data stale)
      const current = (qc.getQueryData(qk(dateId)) as MediaItemWithSlot[] | undefined) ?? q.data ?? [];

      // ✅ Reemplazar solo el slot; mantener el resto
      const filtered = current.filter((m) => (m as any)?.slot !== slot);
      const next = [itemWithSlot, ...filtered];

      await saveMediaList(dateId, next);
      return next;
    },

    // ✅ Optimistic update para que la UI responda instantáneo
    onMutate: async ({ slot }) => {
      if (!dateId) return;

      await qc.cancelQueries({ queryKey: qk(dateId) });
      const previous = (qc.getQueryData(qk(dateId)) as MediaItemWithSlot[] | undefined) ?? [];

      // placeholder visual opcional (no sube nada, solo UI)
      // Si no quieres placeholder, bórralo.
      const optimistic: MediaItemWithSlot = {
        id: `optimistic-${slot}-${Date.now()}`,
        url: "",
        type: "image",
        created_at: new Date().toISOString(),
        slot,
      };
      const next = [optimistic, ...previous.filter((m) => m.slot !== slot)];
      qc.setQueryData(qk(dateId), next);

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (!dateId) return;
      if (ctx?.previous) qc.setQueryData(qk(dateId), ctx.previous);
    },

    onSuccess: (next) => {
      if (!dateId) return;
      qc.setQueryData(qk(dateId), next);

      // ✅ Invalida solo lo necesario
      qc.invalidateQueries({ queryKey: ["event", "date", dateId] });

      // ⚠️ Evita invalidar listas enormes en cada upload.
      // qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (path: string) => {
      if (!dateId) throw new Error("No date ID");

      // ✅ cache actual
      const current = (qc.getQueryData(qk(dateId)) as MediaItemWithSlot[] | undefined) ?? q.data ?? [];

      // Optimistic: quitar de la lista
      const next = current.filter((m) => m.id !== path);

      // Borrar en storage + guardar lista
      await removeEventDateFile(path);
      await saveMediaList(dateId, next);

      return next;
    },

    onMutate: async (path) => {
      if (!dateId) return;

      await qc.cancelQueries({ queryKey: qk(dateId) });
      const previous = (qc.getQueryData(qk(dateId)) as MediaItemWithSlot[] | undefined) ?? [];

      qc.setQueryData(
        qk(dateId),
        previous.filter((m) => m.id !== path)
      );

      return { previous };
    },

    onError: (_err, _path, ctx) => {
      if (!dateId) return;
      if (ctx?.previous) qc.setQueryData(qk(dateId), ctx.previous);
    },

    onSuccess: (next) => {
      if (!dateId) return;
      qc.setQueryData(qk(dateId), next);
      qc.invalidateQueries({ queryKey: ["event", "date", dateId] });
    },
  });

  return {
    media: (q.data || []) as MediaItemWithSlot[],
    isLoading: q.isLoading,
    add,
    remove,
  };
}