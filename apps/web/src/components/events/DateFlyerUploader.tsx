import React, { useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { resizeImageIfNeeded } from "../../lib/imageResize";

type Props = {
  value?: string | null;
  onChange: (url: string | null) => void;
  dateId?: number;     // opcional para nombrado
  parentId?: number;   // opcional para nombrado
};

export default function DateFlyerUploader({ value, onChange, dateId, parentId }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setErr(null);

    // Validaciones básicas
    const allowed = ["image/jpeg","image/png","image/jpg"];
    if (!allowed.includes(file.type)) {
      setErr("Formato no permitido. Usa JPG o PNG.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setErr("El archivo supera 6MB.");
      return;
    }

    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("No hay sesión.");

      // Redimensionar imagen si es necesario (máximo 800px de ancho)
      const processedFile = await resizeImageIfNeeded(file, 800);

      // Ruta: media/event-flyers/USERID/{parentId}/{dateId}_flyer.ext
      const ext = processedFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeParent = parentId ? String(parentId) : "no-parent";
      const safeDate = dateId ? String(dateId) : String(Date.now());
      const path = `media/event-flyers/${user.id}/${safeParent}/${safeDate}_flyer.${ext}`;

      console.log('[DateFlyerUploader] Uploading to path:', path);
      console.log('[DateFlyerUploader] File type:', processedFile.type);
      console.log('[DateFlyerUploader] Original size:', file.size, 'Processed size:', processedFile.size);

      const { data: up, error: upErr } = await supabase.storage
        .from("media")
        .upload(path, processedFile, { upsert: true, contentType: processedFile.type });

      if (upErr) {
        console.error('[DateFlyerUploader] Upload error:', upErr);
        throw upErr;
      }

      console.log('[DateFlyerUploader] Upload successful:', up);

      const { data: pub } = supabase.storage.from("media").getPublicUrl(up.path);
      console.log('[DateFlyerUploader] Public URL:', pub.publicUrl);
      
      onChange(pub.publicUrl || null);
    } catch (e: any) {
      console.error('[DateFlyerUploader] Error:', e);
      setErr(e?.message || "Error subiendo el flyer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ 
        fontSize: '1.25rem', 
        fontWeight: '600', 
        marginBottom: '0.5rem',
        color: '#F5F5F5'
      }}>
        🎟️ Flyer de la Fecha
      </h3>
      <p style={{ 
        fontSize: '0.875rem', 
        opacity: 0.8, 
        marginBottom: '0.75rem',
        color: '#F5F5F5'
      }}>
        Recomendado: <b>1080 × 1350 px</b> (proporción <b>4:5</b>). Formato JPG o PNG.
      </p>

      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '4rem', 
        flexWrap: 'wrap' 
      }}>
        {/* Preview / Placeholder con aspect 4/5 */}
        <div
          style={{
            width: '100%',
            maxWidth: '320px',
            aspectRatio: '4/5',
            border: '2px dashed rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.05)',
            maxHeight: '420px'
          }}
        >
          {value ? (
            <img 
              src={value} 
              alt="Flyer" 
              style={{ 
                height: '100%', 
                width: '100%', 
                objectFit: 'cover' 
              }} 
            />
          ) : (
            <div style={{ 
              height: '100%', 
              width: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '0.875rem', 
              opacity: 0.7,
              color: '#F5F5F5'
            }}>
              Sin flyer
            </div>
          )}
        </div>

        {/* Controles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handlePick}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              background: loading ? '#6B7280' : '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              opacity: loading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#1D4ED8';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#2563EB';
              }
            }}
          >
            {loading ? "Subiendo..." : (value ? "Cambiar flyer" : "Subir flyer")}
          </button>

          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                background: '#374151',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#4B5563';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#374151';
              }}
            >
              Quitar flyer
            </button>
          )}

          {err && (
            <div style={{ 
              color: '#EF4444', 
              fontSize: '0.875rem' 
            }}>
              {err}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/png, image/jpeg"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      </div>
    </div>
  );
}
