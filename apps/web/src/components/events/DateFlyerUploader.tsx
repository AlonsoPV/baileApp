import React, { useRef, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { resizeImageIfNeeded } from "../../lib/imageResize";

type Props = {
  value?: string | null;
  onChange: (url: string | null) => void;
  dateId?: number;     // opcional para nombrado
  parentId?: number;   // opcional para nombrado
  onStatusChange?: (status: 'PENDING' | 'UPLOADING' | 'DONE' | 'ERROR', errorMessage?: string) => void;
};

export default function DateFlyerUploader({ value, onChange, dateId, parentId, onStatusChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  
  // Agregar timestamp solo cuando cambia el valor para evitar caché del navegador
  const imageUrlWithCacheBust = useMemo(() => {
    if (!value) return null;
    // Si la URL ya tiene query params, agregar el timestamp como otro param
    // Si no, agregarlo como el primer query param
    const separator = value.includes('?') ? '&' : '?';
    // Usar un hash del valor para crear un timestamp estable que solo cambie cuando cambie la URL
    const cacheKey = value.split('?')[0].split('#')[0].split('/').pop() || '';
    return `${value}${separator}_t=${Date.now()}`;
  }, [value]);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setErr(null);

    // Validaciones básicas
    const allowed = ["image/jpeg","image/png","image/jpg","image/webp"];
    if (!allowed.includes(file.type)) {
      const msg = "Formato no permitido. Usa JPG, PNG o WebP.";
      setErr(msg);
      onStatusChange?.('ERROR', msg);
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      const msg = "El archivo supera 6MB.";
      setErr(msg);
      onStatusChange?.('ERROR', msg);
      return;
    }

    setLoading(true);
    onStatusChange?.('UPLOADING');
    try {
      // getUser() pega a la red y puede ser lento; getSession() es local/cache.
      const user = (await supabase.auth.getSession()).data.session?.user;
      if (!user) throw new Error("No hay sesión.");

      // Redimensionar imagen si es necesario (recomendación 1080x1350, ratio 4:5)
      // Mantener 1080px de ancho para buena calidad, pero comprimir para subir rápido.
      const processedFile = await resizeImageIfNeeded(file, 1080, 0.82);

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
      
      onStatusChange?.('DONE');
      onChange(pub.publicUrl || null);
    } catch (e: any) {
      console.error('[DateFlyerUploader] Error:', e);
      const msg = e?.message || "Error subiendo el flyer.";
      setErr(msg);
      onStatusChange?.('ERROR', msg);
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
          {value && imageUrlWithCacheBust ? (
            <img 
              key={value}
              src={imageUrlWithCacheBust}
              alt="Flyer" 
              style={{ 
                height: '100%', 
                width: '100%', 
                objectFit: 'cover' 
              }}
              onError={(e) => {
                console.error('[DateFlyerUploader] Error loading image:', imageUrlWithCacheBust);
                // Si falla con cache bust, intentar sin él
                const img = e.currentTarget;
                if (img.src.includes('_t=')) {
                  img.src = value;
                }
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
              onClick={() => {
                onStatusChange?.('PENDING');
                onChange(null);
              }}
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
