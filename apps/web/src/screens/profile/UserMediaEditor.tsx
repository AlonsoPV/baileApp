import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { useUserMedia } from "../../hooks/useUserMedia";
import { supabase } from "../../lib/supabase";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot, upsertMediaSlot, removeMediaSlot, MediaItem } from "../../utils/mediaSlots";
import ImageWithFallback from "../../components/ImageWithFallback";
import { useToast } from "../../components/Toast";

export default function UserMediaEditor() {
  const { user } = useAuth();
  const { media, setMedia } = useUserMedia();
  const { showToast } = useToast();

  async function uploadFile(file: File, slot: string, kind: "photo"|"video") {
    if (!user) return;
    
    try {
      const ext = file.name.split(".").pop();
      const path = `user-media/${user.id}/${slot}.${ext}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("media")
        .upload(path, file, { upsert: true });
      
      if (error) throw error;
      
      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from("media")
        .getPublicUrl(path);

      const item: MediaItem = {
        slot,
        kind,
        url: publicUrl.publicUrl,
      };
      
      const next = upsertMediaSlot(media as any, item);
      await setMedia(next as any);
      
      showToast(`${kind === 'photo' ? 'Foto' : 'Video'} subido correctamente`, 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Error al subir el archivo', 'error');
    }
  }

  async function removeSlot(slot: string) {
    try {
      const next = removeMediaSlot(media as any, slot);
      await setMedia(next as any);
      showToast('Archivo eliminado', 'success');
    } catch (error) {
      console.error('Error removing file:', error);
      showToast('Error al eliminar el archivo', 'error');
    }
  }

  return (
    <div className="space-y-8">
      {/* Fotos */}
      <section>
        <h3 className="text-lg font-semibold mb-3 text-white">Fotos</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PHOTO_SLOTS.map((s) => {
            const it = getMediaBySlot(media as any, s);
            return (
              <div 
                key={s} 
                className="rounded-xl border border-white/10 p-3"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)'
                }}
              >
                <div className="text-xs opacity-70 mb-2 text-white">
                  Slot {s.toUpperCase()}
                </div>
                <div className="aspect-[4/3] rounded-lg overflow-hidden border border-white/10 bg-black/30 flex items-center justify-center">
                  {it ? (
                    <ImageWithFallback 
                      src={it.url} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="text-xs opacity-50 text-white">Sin imagen</div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <label className="px-3 py-2 rounded bg-blue-600 text-white text-xs cursor-pointer hover:bg-blue-700 transition-colors">
                    Subir foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e)=> {
                        const f = e.target.files?.[0];
                        if (f) uploadFile(f, s, "photo");
                      }}
                    />
                  </label>
                  {it && (
                    <button 
                      onClick={()=>removeSlot(s)} 
                      className="px-3 py-2 rounded bg-neutral-700 text-xs text-white hover:bg-neutral-600 transition-colors"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Videos */}
      <section>
        <h3 className="text-lg font-semibold mb-3 text-white">Videos</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VIDEO_SLOTS.map((s) => {
            const it = getMediaBySlot(media as any, s);
            return (
              <div 
                key={s} 
                className="rounded-xl border border-white/10 p-3"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)'
                }}
              >
                <div className="text-xs opacity-70 mb-2 text-white">
                  Slot {s.toUpperCase()}
                </div>
                <div className="aspect-[4/3] rounded-lg overflow-hidden border border-white/10 bg-black/30 flex items-center justify-center">
                  {it ? (
                    <video src={it.url} controls className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-xs opacity-50 text-white">Sin video</div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <label className="px-3 py-2 rounded bg-blue-600 text-white text-xs cursor-pointer hover:bg-blue-700 transition-colors">
                    Subir video
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e)=> {
                        const f = e.target.files?.[0];
                        if (f) uploadFile(f, s, "video");
                      }}
                    />
                  </label>
                  {it && (
                    <button 
                      onClick={()=>removeSlot(s)} 
                      className="px-3 py-2 rounded bg-neutral-700 text-xs text-white hover:bg-neutral-600 transition-colors"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

