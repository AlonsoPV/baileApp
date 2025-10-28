import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { MediaItem } from "../lib/storage";
import { useTeacherMy } from "./useTeacher";

// Bucket para archivos de maestro (crear en Supabase si no existe):
// - teacher-media (público)
const BUCKET = "teacher-media";

async function uploadTeacherFile(teacherId: number, file: File): Promise<MediaItem> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const type: "image" | "video" = file.type.startsWith("image/") ? "image" : "video";
  const path = `${teacherId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
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

async function removeTeacherFile(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export function useTeacherMedia() {
  const qc = useQueryClient();
  const { data: teacher } = useTeacherMy();
  const teacherId = teacher?.id;

  const q = useQuery({
    queryKey: ["teacher", "media", teacherId],
    enabled: !!teacherId,
    queryFn: async (): Promise<MediaItem[]> => {
      if (!teacherId) return [];
      const { data, error } = await supabase
        .from("profiles_teacher")
        .select("media")
        .eq("id", teacherId)
        .maybeSingle();
      if (error) throw error;
      return (data?.media as MediaItem[]) || [];
    },
  });

  const save = async (list: MediaItem[]) => {
    if (!teacherId) return;
    const { error } = await supabase
      .from("profiles_teacher")
      .update({ media: list })
      .eq("id", teacherId);
    if (error) throw error;
  };

  const add = useMutation({
    mutationFn: async ({ file, slot }: { file: File; slot: string }) => {
      if (!teacherId) throw new Error("No teacher");
      const item = await uploadTeacherFile(teacherId, file);
      const itemWithSlot = { ...item, slot } as any;
      const existing = q.data || [];
      const filtered = existing.filter((m: any) => m.slot !== slot);
      const next = [itemWithSlot, ...filtered];
      await save(next);
      return next;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher", "media", teacherId] });
      qc.invalidateQueries({ queryKey: ["teacher", "mine"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (path: string) => {
      await removeTeacherFile(path);
      const next = (q.data || []).filter((m: any) => m.id !== path);
      await save(next);
      return next;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher", "media", teacherId] });
      qc.invalidateQueries({ queryKey: ["teacher", "mine"] });
    },
  });

  return {
    media: q.data || [],
    isLoading: q.isLoading,
    add,
    remove,
  };
}


