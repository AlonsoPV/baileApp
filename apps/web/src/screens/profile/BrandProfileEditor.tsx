import React from "react";
import { useNavigate } from "react-router-dom";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import { useAuth } from "@/contexts/AuthProvider";
import { useMyBrand, useUpsertBrand } from "../../hooks/useBrand";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
import ImageWithFallback from "../../components/ImageWithFallback";
import { MediaUploader } from "../../components/MediaUploader";
import { supabase } from "../../lib/supabase";

const colors = {
  dark: '#121212',
  light: '#F5F5F5',
};

export default function BrandProfileEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: brand } = useMyBrand();
  const upsert = useUpsertBrand();
  const [form, setForm] = React.useState<{ 
    nombre_publico?: string; 
    bio?: string | null; 
    redes_sociales: any; 
    productos?: any[]; 
    avatar_url?: string | null;
    size_guide?: { mx: string; us: string; eu: string }[];
    fit_tips?: { style: string; tip: string }[];
    policies?: { shipping?: string; returns?: string; warranty?: string };
    conversion?: { headline?: string; subtitle?: string; coupon?: string };
  }>({ nombre_publico: '', bio: '', redes_sociales: {}, productos: [], avatar_url: null, size_guide: [], fit_tips: [], policies: {}, conversion: {} });
  const [tab, setTab] = React.useState<'info'|'products'|'lookbook'|'policies'>('info');

  React.useEffect(() => {
    if (brand) {
      setForm({
        nombre_publico: (brand as any).nombre_publico || '',
        bio: (brand as any).bio || '',
        redes_sociales: (brand as any).redes_sociales || {},
        productos: Array.isArray((brand as any).productos) ? (brand as any).productos : [],
        avatar_url: (brand as any).avatar_url || null,
        size_guide: Array.isArray((brand as any).size_guide) ? (brand as any).size_guide : [],
        fit_tips: Array.isArray((brand as any).fit_tips) ? (brand as any).fit_tips : [],
        policies: (brand as any).policies || {},
        conversion: (brand as any).conversion || {},
      });
    }
  }, [brand]);

  const setField = (key: 'nombre_publico'|'bio', value: string) => {
    setForm((s) => ({ ...s, [key]: value }));
  };
  const setRS = (key: string, value: string) => {
    setForm((s) => ({ ...s, redes_sociales: { ...s.redes_sociales, [key]: value } }));
  };

  const handleSave = async () => {
    const payload = { 
      id: (brand as any)?.id, 
      nombre_publico: form.nombre_publico, 
      bio: form.bio, 
      redes_sociales: form.redes_sociales, 
      productos: form.productos || [],
      avatar_url: form.avatar_url || null,
      size_guide: form.size_guide || [],
      fit_tips: form.fit_tips || [],
      policies: form.policies || {},
      conversion: form.conversion || {}
    } as any;
    await upsert.mutateAsync(payload);
  };

  // --- Catálogo (fotos) ---
  const onPickCatalog = async (files: FileList) => {
    if (!(brand as any)?.id) {
      alert('Primero guarda la información básica para habilitar el catálogo.');
      return;
    }
    const brandId = (brand as any).id as number;
    const onlyImages = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (onlyImages.length === 0) return;

    const uploaded: { imagen_url: string; id: string; titulo: string }[] = [];
    for (const file of onlyImages) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${brandId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('brand-media').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      });
      if (error) {
        console.error('[BrandCatalogUpload] Error:', error);
        alert(`Error al subir una imagen: ${error.message}`);
        continue;
      }
      const { data: pub } = supabase.storage.from('brand-media').getPublicUrl(path);
      uploaded.push({ imagen_url: pub.publicUrl, id: path, titulo: '' });
    }

    if (uploaded.length > 0) {
      setForm(s => ({
        ...s,
        productos: [
          ...(Array.isArray(s.productos) ? s.productos : []),
          ...uploaded.map(u => ({ id: u.id, titulo: u.titulo, imagen_url: u.imagen_url }))
        ]
      }));
    }
  };

  const removeCatalogItem = async (prodIdOrPath: string) => {
    // prodId is the storage path we used as id
    try {
      await supabase.storage.from('brand-media').remove([prodIdOrPath]);
    } catch (e) {
      console.warn('[BrandCatalogRemove] No se pudo eliminar del storage (continuando):', e);
    }
    setForm(s => ({ ...s, productos: (s.productos || []).filter((p: any) => p.id !== prodIdOrPath) }));
  };

  // --- Logo uploader ---
  const onUploadLogo = async (file: File) => {
    if (!(brand as any)?.id) {
      alert('Primero guarda la información básica para habilitar el logo.');
      return;
    }
    const brandId = (brand as any).id as number;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `${brandId}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('brand-media').upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type || undefined });
    if (error) { alert(error.message); return; }
    const { data: pub } = supabase.storage.from('brand-media').getPublicUrl(path);
    setForm(s => ({ ...s, avatar_url: pub.publicUrl }));
  };

  // --- Lookbook manager (imágenes) ---
  const onPickLookbook = async (files: FileList) => {
    if (!(brand as any)?.id) {
      alert('Primero guarda la información básica para habilitar el lookbook.');
      return;
    }
    const brandId = (brand as any).id as number;
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imgs.length === 0) return;
    const uploadedUrls: string[] = [];
    for (const file of imgs) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${brandId}/lookbook/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('brand-media').upload(path, file, { upsert: false, cacheControl: '3600', contentType: file.type || undefined });
      if (error) { console.error(error); continue; }
      const { data: pub } = supabase.storage.from('brand-media').getPublicUrl(path);
      uploadedUrls.push(pub.publicUrl);
    }
    if (uploadedUrls.length > 0) {
      const prev = Array.isArray((brand as any)?.media) ? ((brand as any).media as any[]) : [];
      const next = [
        ...uploadedUrls.map(url => ({ type: 'image', url })),
        ...prev,
      ];
      await supabase.from('profiles_brand').update({ media: next }).eq('id', (brand as any).id);
    }
  };

  // Datos para vistas previas (reutiliza lógica del Live)
  const media: string[] = Array.isArray((brand as any)?.media)
    ? ((brand as any).media as any[]).map(m => (typeof m === 'string' ? m : m?.url)).filter(Boolean)
    : [];
  const productos: any[] = Array.isArray((brand as any)?.productos) ? ((brand as any).productos as any[]) : [];
  const featured = productos.map((p: any) => ({
    id: p.id || Math.random().toString(36).slice(2),
    name: p.titulo || 'Producto',
    price: typeof p.precio === 'number' ? `$${p.precio.toLocaleString()}` : (p.precio || ''),
    image: p.imagen_url,
    category: (p.categoria || p.category || 'ropa') as 'calzado'|'ropa'|'accesorios',
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
  }));
  const lookbook = media.map((url, i) => ({ id: i, image: url, caption: '', style: '' }));
  const policies = { shipping: undefined as any, returns: undefined as any, warranty: undefined as any };
  const partners: any[] = [];

  return (
    <>
      <style>{`
        .editor-container { min-height: 100vh; background: ${colors.dark}; color: ${colors.light}; padding: 2rem; }
        .editor-content { max-width: 1200px; margin: 0 auto; }
        .editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .editor-title { font-size: 1.75rem; font-weight: 700; margin: 0; flex: 1 1 0%; text-align: center; }
        .editor-back-btn { padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.1); color: ${colors.light}; border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .editor-section { margin-bottom: 3rem; padding: 2rem; background: rgba(255,255,255,0.05); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); }
        .editor-section-title { font-size: 1.5rem; margin-bottom: 1.5rem; color: ${colors.light}; }
        .editor-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .editor-grid-small { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
        .editor-field { display: block; margin-bottom: 0.5rem; font-weight: 600; }
        .editor-input { width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: ${colors.light}; font-size: 1rem; }
        .editor-textarea { width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: ${colors.light}; font-size: 1rem; resize: vertical; }
        .glass-card-container { opacity: 1; margin-bottom: 2rem; padding: 2rem; text-align: center; background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%); border-radius: 20px; border: 1px solid rgba(255,255,255,0.15); box-shadow: rgba(0,0,0,0.3) 0px 8px 32px; backdrop-filter: blur(10px); transform: none; }
        @media (max-width: 768px) {
          .editor-container { padding: 1rem !important; }
          .editor-content { max-width: 100% !important; }
          .editor-header { flex-direction: column !important; gap: 1rem !important; text-align: center !important; }
          .editor-title { font-size: 1.5rem !important; order: 2 !important; }
          .editor-back-btn { order: 1 !important; align-self: flex-start !important; }
          .editor-section { padding: 1rem !important; margin-bottom: 2rem !important; }
          .editor-section-title { font-size: 1.25rem !important; margin-bottom: 1rem !important; }
          .editor-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
          .editor-grid-small { grid-template-columns: 1fr !important; gap: 1rem !important; }
          .glass-card-container { padding: 1rem !important; margin-bottom: 1rem !important; border-radius: 16px !important; }
        }
        @media (max-width: 480px) {
          .editor-title { font-size: 1.25rem !important; }
          .editor-section-title { font-size: 1.1rem !important; }
          .glass-card-container { padding: 0.75rem !important; border-radius: 12px !important; }
        }
      `}</style>

      <div className="editor-container">
        <div className="editor-content">
          <div className="editor-header">
            <button onClick={() => navigate(-1)} className="editor-back-btn">← Volver</button>
            <h1 className="editor-title">🏷️ Editar Perfil de Marca</h1>
            <div style={{ width: '100px' }} />
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:'.5rem', marginBottom:'1rem', flexWrap:'wrap', justifyContent:'center' }}>
            <button onClick={()=>setTab('info')} className="editor-back-btn" style={{ background: tab==='info'?'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))':'rgba(255,255,255,0.1)' }}>Información</button>
            <button onClick={()=>setTab('products')} className="editor-back-btn" style={{ background: tab==='products'?'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))':'rgba(255,255,255,0.1)' }}>Productos</button>
            <button onClick={()=>setTab('lookbook')} className="editor-back-btn" style={{ background: tab==='lookbook'?'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))':'rgba(255,255,255,0.1)' }}>Lookbook</button>
            <button onClick={()=>setTab('policies')} className="editor-back-btn" style={{ background: tab==='policies'?'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))':'rgba(255,255,255,0.1)' }}>Políticas</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
            <ProfileNavigationToggle
              currentView="edit"
              profileType="brand"
              onSave={handleSave}
              isSaving={upsert.isPending}
            />
          </div>

          {tab==='info' && (
            <>
              <div className="editor-section glass-card-container">
                <h2 className="editor-section-title">🏷️ Información de la Marca</h2>
                <div className="editor-grid">
                  <div>
                    <label className="editor-field">Nombre Público</label>
                    <input type="text" value={form.nombre_publico || ''} onChange={(e) => setField('nombre_publico', e.target.value)} placeholder="Nombre de la marca" className="editor-input" />
                  </div>
                  <div>
                    <label className="editor-field">Biografía / Descripción</label>
                    <textarea value={form.bio || ''} onChange={(e) => setField('bio', e.target.value)} placeholder="Describe tu marca (materiales, enfoque, estilos)" rows={4} className="editor-textarea" />
                  </div>
                </div>
                {/* Logo uploader */}
                <div style={{ marginTop: '1rem', display:'flex', gap:'1rem', alignItems:'center' }}>
                  <ImageWithFallback src={(form as any).avatar_url} alt="logo" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'1px solid rgba(255,255,255,.2)' }} />
                  <label className="editor-back-btn" style={{ cursor:'pointer' }}>
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={(e)=> e.target.files?.[0] && onUploadLogo(e.target.files[0]) }/>
                    Subir logo
                  </label>
                </div>
              </div>

              <div className="editor-section glass-card-container">
                <h2 className="editor-section-title">📱 Redes Sociales</h2>
                <div className="editor-grid-small">
                  <div>
                    <label className="editor-field">📸 Instagram</label>
                    <input type="text" value={form.redes_sociales?.instagram || ''} onChange={(e)=>setRS('instagram', e.target.value)} placeholder="@tu_marca" className="editor-input" />
                  </div>
                  <div>
                    <label className="editor-field">🎵 TikTok</label>
                    <input type="text" value={form.redes_sociales?.tiktok || ''} onChange={(e)=>setRS('tiktok', e.target.value)} placeholder="@tu_marca" className="editor-input" />
                  </div>
                  <div>
                    <label className="editor-field">📺 YouTube</label>
                    <input type="text" value={form.redes_sociales?.youtube || ''} onChange={(e)=>setRS('youtube', e.target.value)} placeholder="Canal o enlace" className="editor-input" />
                  </div>
                  <div>
                    <label className="editor-field">👥 Facebook</label>
                    <input type="text" value={form.redes_sociales?.facebook || ''} onChange={(e)=>setRS('facebook', e.target.value)} placeholder="Página o perfil" className="editor-input" />
                  </div>
                  <div>
                    <label className="editor-field">💬 WhatsApp</label>
                    <input type="text" value={form.redes_sociales?.whatsapp || ''} onChange={(e)=>setRS('whatsapp', e.target.value)} placeholder="Número de teléfono" className="editor-input" />
                  </div>
                  <div>
                    <label className="editor-field">🌐 Sitio Web</label>
                    <input type="text" value={form.redes_sociales?.web || ''} onChange={(e)=>setRS('web', e.target.value)} placeholder="https://" className="editor-input" />
                  </div>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <SocialMediaSection
                    respuestas={{ redes: form.redes_sociales || {} }}
                    redes_sociales={form.redes_sociales || {}}
                    title="🔗 Vista previa de Redes"
                    availablePlatforms={['instagram','tiktok','youtube','facebook','whatsapp','web']}
                  />
                </div>
              </div>

              {/* Guía de tallas y ajuste (editable + vista previa) */}
              <div className="editor-section glass-card-container">
                <h2 className="editor-section-title">📏 Guía de tallas y ajuste</h2>
                {/* Editor de Guía de tallas */}
                <div style={{ marginBottom: '1rem' }}>
                  <h3 className="editor-section-title" style={{ fontSize: '1.1rem' }}>Equivalencias (MX / US / EU)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '.5rem', alignItems: 'center' }}>
                    <b>MX</b><b>US</b><b>EU</b><span />
                    {(form.size_guide || []).map((row, idx) => (
                      <React.Fragment key={idx}>
                        <input className="editor-input" value={row.mx} onChange={(e)=>setForm(s=>({
                          ...s,
                          size_guide: (s.size_guide||[]).map((r,i)=> i===idx ? { ...r, mx: e.target.value } : r)
                        }))} />
                        <input className="editor-input" value={row.us} onChange={(e)=>setForm(s=>({
                          ...s,
                          size_guide: (s.size_guide||[]).map((r,i)=> i===idx ? { ...r, us: e.target.value } : r)
                        }))} />
                        <input className="editor-input" value={row.eu} onChange={(e)=>setForm(s=>({
                          ...s,
                          size_guide: (s.size_guide||[]).map((r,i)=> i===idx ? { ...r, eu: e.target.value } : r)
                        }))} />
                        <button type="button" className="editor-back-btn" onClick={()=>setForm(s=>({
                          ...s,
                          size_guide: (s.size_guide||[]).filter((_,i)=> i!==idx)
                        }))}>Eliminar</button>
                      </React.Fragment>
                    ))}
                  </div>
                  <div style={{ marginTop: '.6rem' }}>
                    <button type="button" className="editor-back-btn" onClick={()=>setForm(s=>({
                      ...s,
                      size_guide: [ ...(s.size_guide||[]), { mx:'', us:'', eu:'' } ]
                    }))}>+ Agregar fila</button>
                  </div>
                </div>
                {/* Editor de Tips de ajuste */}
                <div style={{ marginBottom: '1rem' }}>
                  <h3 className="editor-section-title" style={{ fontSize: '1.1rem' }}>Consejos de ajuste por estilo</h3>
                  {(form.fit_tips || []).map((it, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 3fr auto', gap: '.5rem', alignItems: 'center', marginBottom: '.5rem' }}>
                      <input className="editor-input" placeholder="Estilo (p. ej. Bachata)" value={it.style} onChange={(e)=>setForm(s=>({
                        ...s,
                        fit_tips: (s.fit_tips||[]).map((r,i)=> i===idx ? { ...r, style: e.target.value } : r)
                      }))} />
                      <input className="editor-input" placeholder="Tip (p. ej. tacón estable, suela flexible)" value={it.tip} onChange={(e)=>setForm(s=>({
                        ...s,
                        fit_tips: (s.fit_tips||[]).map((r,i)=> i===idx ? { ...r, tip: e.target.value } : r)
                      }))} />
                      <button type="button" className="editor-back-btn" onClick={()=>setForm(s=>({
                        ...s,
                        fit_tips: (s.fit_tips||[]).filter((_,i)=> i!==idx)
                      }))}>Eliminar</button>
                    </div>
                  ))}
                  <button type="button" className="editor-back-btn" onClick={()=>setForm(s=>({
                    ...s,
                    fit_tips: [ ...(s.fit_tips||[]), { style:'', tip:'' } ]
                  }))}>+ Agregar tip</button>
                </div>

                {/* Vista previa */}
                <div className="editor-grid-small">
                  <SizeGuide rows={form.size_guide || []} />
                  <FitTips tips={form.fit_tips || []} />
                </div>
              </div>

              {/* Conversión (editable + vista previa) */}
              <div className="editor-section glass-card-container">
                <h2 className="editor-section-title">🎁 Conversión</h2>
                <div className="editor-grid-small">
                  <div>
                    <label className="editor-field">Encabezado</label>
                    <input className="editor-input" value={form.conversion?.headline || ''} onChange={(e)=>setForm(s=>({ ...s, conversion:{ ...(s.conversion||{}), headline: e.target.value } }))} placeholder="10% primera compra" />
                  </div>
                  <div>
                    <label className="editor-field">Subtítulo / Mensaje</label>
                    <input className="editor-input" value={form.conversion?.subtitle || ''} onChange={(e)=>setForm(s=>({ ...s, conversion:{ ...(s.conversion||{}), subtitle: e.target.value } }))} placeholder="Usa el cupón BAILE10" />
                  </div>
                  <div>
                    <label className="editor-field">Cupón</label>
                    <input className="editor-input" value={form.conversion?.coupon || ''} onChange={(e)=>setForm(s=>({ ...s, conversion:{ ...(s.conversion||{}), coupon: e.target.value } }))} placeholder="BAILE10" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '.75rem' }}>
                  <span style={{ fontWeight: 900 }}>{form.conversion?.headline || '10% primera compra'}</span>
                  <span style={{ opacity: .85 }}>{form.conversion?.subtitle || <>Usa el cupón <b>BAILE10</b></>}</span>
                </div>
              </div>
            </>
          )}

          <div className="editor-section glass-card-container">
            <h2 className="editor-section-title">📱 Redes Sociales</h2>
            <div className="editor-grid-small">
              <div>
                <label className="editor-field">📸 Instagram</label>
                <input type="text" value={form.redes_sociales?.instagram || ''} onChange={(e)=>setRS('instagram', e.target.value)} placeholder="@tu_marca" className="editor-input" />
              </div>
              <div>
                <label className="editor-field">🎵 TikTok</label>
                <input type="text" value={form.redes_sociales?.tiktok || ''} onChange={(e)=>setRS('tiktok', e.target.value)} placeholder="@tu_marca" className="editor-input" />
              </div>
              <div>
                <label className="editor-field">📺 YouTube</label>
                <input type="text" value={form.redes_sociales?.youtube || ''} onChange={(e)=>setRS('youtube', e.target.value)} placeholder="Canal o enlace" className="editor-input" />
              </div>
              <div>
                <label className="editor-field">👥 Facebook</label>
                <input type="text" value={form.redes_sociales?.facebook || ''} onChange={(e)=>setRS('facebook', e.target.value)} placeholder="Página o perfil" className="editor-input" />
              </div>
              <div>
                <label className="editor-field">💬 WhatsApp</label>
                <input type="text" value={form.redes_sociales?.whatsapp || ''} onChange={(e)=>setRS('whatsapp', e.target.value)} placeholder="Número de teléfono" className="editor-input" />
              </div>
              <div>
                <label className="editor-field">🌐 Sitio Web</label>
                <input type="text" value={form.redes_sociales?.web || ''} onChange={(e)=>setRS('web', e.target.value)} placeholder="https://" className="editor-input" />
              </div>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <SocialMediaSection
                respuestas={{ redes: form.redes_sociales || {} }}
                redes_sociales={form.redes_sociales || {}}
                title="🔗 Vista previa de Redes"
                availablePlatforms={['instagram','tiktok','youtube','facebook','whatsapp','web']}
              />
            </div>
          </div>

          {/* Vista previa: Catálogo */}
          {tab==='products' && (
          <div className="editor-section glass-card-container">
            <h2 className="editor-section-title">🛍️ Catálogo</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ opacity: .8 }}>Sube fotos de tus productos. Se crearán entradas en el catálogo.</div>
              <MediaUploader onPick={onPickCatalog} />
            </div>

            {/* Grid de catálogo editable */}
            {Array.isArray(form.productos) && form.productos.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginTop: '.75rem' }}>
                {form.productos.map((p: any) => (
                  <article key={p.id} style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '.75rem', background: 'rgba(255,255,255,0.05)' }}>
                    <ImageWithFallback src={p.imagen_url} alt={p.titulo || 'Producto'} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.5rem', gap: '.5rem' }}>
                      <input
                        value={p.titulo || ''}
                        onChange={(e) => setForm(s => ({
                          ...s,
                          productos: (s.productos || []).map((it: any) => it.id === p.id ? { ...it, titulo: e.target.value } : it)
                        }))}
                        placeholder="Nombre del producto (opcional)"
                        className="editor-input"
                        style={{ flex: 1 }}
                      />
                      <button type="button" onClick={() => removeCatalogItem(p.id)} className="editor-back-btn" style={{ whiteSpace: 'nowrap' }}>Eliminar</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p style={{ color: 'rgba(255,255,255,.75)', margin: 0 }}>Aún no hay productos en el catálogo.</p>
            )}

            {/* Vista previa con pestañas (usa los datos del formulario) */}
            <div style={{ marginTop: '1.5rem' }}>
              <h3 className="editor-section-title" style={{ fontSize: '1.25rem' }}>👀 Vista previa</h3>
              <CatalogTabs items={(form.productos || []).map((p: any) => ({ id: p.id, name: p.titulo || 'Producto', price: '', image: p.imagen_url, category: 'ropa', sizes: [] }))} />
            </div>
          </div>
          )}

          {/* Vista previa: Guía de tallas y ajuste */}
          <div className="editor-section glass-card-container">
            <h2 className="editor-section-title">📏 Guía de tallas y ajuste</h2>
            <div className="editor-grid-small">
              <SizeGuide />
              <FitTips />
            </div>
          </div>

          {tab==='lookbook' && (
            <div className="editor-section glass-card-container">
              <h2 className="editor-section-title">🎥 Lookbook</h2>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem', marginBottom:'1rem', flexWrap:'wrap' }}>
                <div style={{ opacity:.8 }}>Sube fotos para tu lookbook.</div>
                <MediaUploader onPick={onPickLookbook} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
                {lookbook.map((ph: any) => (
                  <div key={ph.id} style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '.75rem', background: 'rgba(255,255,255,0.05)' }}>
                    <ImageWithFallback src={ph.image} alt={ph.caption || ''} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.5rem' }}>
                      <span style={{ fontWeight: 700 }}>{ph.style || ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='policies' && (
            <div className="editor-section glass-card-container">
              <h2 className="editor-section-title">🔒 Políticas</h2>
              <div className="editor-grid">
                <div>
                  <label className="editor-field">Envíos</label>
                  <textarea className="editor-textarea" rows={3} value={form.policies?.shipping || ''} onChange={(e)=>setForm(s=>({ ...s, policies:{ ...(s.policies||{}), shipping: e.target.value } }))} placeholder="Tiempos y zonas de envío" />
                </div>
                <div>
                  <label className="editor-field">Cambios / Devoluciones</label>
                  <textarea className="editor-textarea" rows={3} value={form.policies?.returns || ''} onChange={(e)=>setForm(s=>({ ...s, policies:{ ...(s.policies||{}), returns: e.target.value } }))} placeholder="Condiciones para cambios y devoluciones" />
                </div>
                <div>
                  <label className="editor-field">Garantía</label>
                  <textarea className="editor-textarea" rows={3} value={form.policies?.warranty || ''} onChange={(e)=>setForm(s=>({ ...s, policies:{ ...(s.policies||{}), warranty: e.target.value } }))} placeholder="Cobertura de garantía" />
                </div>
              </div>
              <div style={{ marginTop: '.75rem' }}>
                <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: 1.6 }}>
                  <li><b>Envíos:</b> {form.policies?.shipping || 'Nacionales 2–5 días hábiles.'}</li>
                  <li><b>Cambios/Devoluciones:</b> {form.policies?.returns || 'Dentro de 15 días (sin uso, en caja).'}</li>
                  <li><b>Garantía:</b> {form.policies?.warranty || '30 días por defectos de fabricación.'}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Vista previa: CTA */}
          <div className="editor-section glass-card-container">
            <h2 className="editor-section-title">🎁 Conversión</h2>
            <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontWeight: 900 }}>10% primera compra</span>
              <span style={{ opacity: .85 }}>Usa el cupón <b>BAILE10</b></span>
            </div>
          </div>

          {/* Vista previa: Galería */}
          {media.length > 0 && (
            <div className="editor-section glass-card-container">
              <h2 className="editor-section-title">📷 Galería</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {media.map((url, i) => (
                  <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,.12)' }}>
                    <ImageWithFallback src={url} alt={`media-${i}`} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Subcomponentes (reutilizados del Live)
function CatalogTabs({ items = [] as any[] }: { items?: any[] }){
  const [tab, setTab] = React.useState<'calzado'|'ropa'|'accesorios'>('calzado');
  const filtered = items.filter((i: any) => i.category === tab);
  const tabs = ['calzado','ropa','accesorios'] as const;
  const btnPrimary: React.CSSProperties = { padding: '.65rem 1rem', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)', background: 'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))', color: '#fff', fontWeight: 900, cursor: 'pointer' };
  const btnGhost: React.CSSProperties = { padding: '.65rem 1rem', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 800, cursor: 'pointer' };
  const prodCard: React.CSSProperties = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '.75rem', background: 'rgba(255,255,255,0.05)' };
  const sizePill: React.CSSProperties = { border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '.15rem .45rem', fontSize: '.82rem' };
  const muted: React.CSSProperties = { color: 'rgba(255,255,255,.78)', margin: 0 };
  return (
    <div>
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.75rem', flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={t === tab ? btnPrimary : btnGhost}>{t[0].toUpperCase()+t.slice(1)}</button>
        ))}
      </div>
      {filtered.length === 0 ? <p style={muted}>Sin productos en esta categoría.</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '.9rem' }}>
          {filtered.map((p: any) => (
            <article key={p.id} style={prodCard}>
              <ImageWithFallback src={p.image} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12 }} />
              <div style={{ marginTop: '.6rem' }}>
                <div style={{ fontWeight: 800 }}>{p.name}</div>
                <div style={{ opacity: .85, margin: '.15rem 0' }}>{p.price}</div>
                {Array.isArray(p.sizes) && p.sizes.length > 0 && (
                  <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', margin: '.35rem 0' }}>
                    {p.sizes.slice(0,6).map((s: string) => (<span key={s} style={sizePill}>{s}</span>))}
                    {p.sizes.length > 6 && <span style={sizePill}>+{p.sizes.length - 6}</span>}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function SizeGuide({ rows = [] as { mx:string; us:string; eu:string }[] }){
  const data = rows.length > 0 ? rows : [
    { mx:'22', us:'5', eu:'35' },
    { mx:'23', us:'6', eu:'36-37' },
    { mx:'24', us:'7', eu:'38' },
    { mx:'25', us:'8', eu:'39-40' },
    { mx:'26', us:'9', eu:'41-42' },
  ];
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '.75rem', background: 'rgba(255,255,255,0.05)' }}>
      <b>Equivalencias (Calzado)</b>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.35rem', marginTop: '.5rem', fontSize: '.92rem' }}>
        <div>MX</div><div>US</div><div>EU</div>
        {data.map((r, i) => (
          <React.Fragment key={i}>
            <div>{r.mx}</div><div>{r.us}</div><div>{r.eu}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function FitTips({ tips = [] as { style:string; tip:string }[] }){
  const data = tips.length > 0 ? tips : [
    { style: 'Bachata', tip: 'Tacón estable, suela flexible, punta reforzada.' },
    { style: 'Salsa', tip: 'Mayor soporte lateral, giro suave (suela gamuza).' },
    { style: 'Kizomba', tip: 'Confort prolongado, amortiguación talón.' },
  ];
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '.75rem', background: 'rgba(255,255,255,0.05)' }}>
      <b>Fit recomendado por estilo</b>
      <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1rem', lineHeight: 1.6 }}>
        {data.map((it, i) => (
          <li key={i}><b>{it.style}:</b> {it.tip}</li>
        ))}
      </ul>
    </div>
  );
}

