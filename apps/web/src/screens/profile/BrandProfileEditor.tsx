// src/pages/brand/BrandProfileEditor.tsx
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import { useAuth } from "@/contexts/AuthProvider";
import { useMyBrand, useUpsertBrand } from "../../hooks/useBrand";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
import ImageWithFallback from "../../components/ImageWithFallback";
import { MediaUploader } from "../../components/MediaUploader";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../components/Toast";

/* Por qué: Tipos fuertes + reducer = menos bugs al mutar estructuras anidadas. */
type Category = "calzado" | "ropa" | "accesorios";
type Gender = "caballero" | "dama" | "unisex";
type BrandPolicies = { shipping?: string; returns?: string; warranty?: string };
type FitTip = { style: string; tip: string };
type SizeRow = { mx: string; us: string; eu: string };
type ProductItem = { id: string; titulo: string; descripcion?: string; imagen_url: string; category: Category; gender?: Gender; price?: string; sizes?: string[] };
type Conversion = { headline?: string; subtitle?: string; coupons?: string[] };
type BrandForm = {
  nombre_publico: string;
  bio: string | null;
  redes_sociales: Record<string, string>;
  productos: ProductItem[];
  avatar_url: string | null;
  size_guide: SizeRow[];
  fit_tips: FitTip[];
  policies: BrandPolicies;
  conversion: Conversion;
};

const colors = { dark: '#121212', light: '#F5F5F5' };

type Action =
  | { type: 'SET_ALL'; payload: Partial<BrandForm> }
  | { type: 'SET_FIELD'; key: 'nombre_publico' | 'bio'; value: string }
  | { type: 'SET_RS'; key: string; value: string }
  | { type: 'SET_AVATAR'; url: string | null }
  | { type: 'ADD_SIZE' }
  | { type: 'UPDATE_SIZE'; index: number; key: keyof SizeRow; value: string }
  | { type: 'REMOVE_SIZE'; index: number }
  | { type: 'ADD_FIT_TIP' }
  | { type: 'UPDATE_FIT_TIP'; index: number; key: keyof FitTip; value: string }
  | { type: 'REMOVE_FIT_TIP'; index: number }
  | { type: 'SET_CONVERSION'; value: Partial<Conversion> }
  | { type: 'SET_POLICIES'; value: Partial<BrandPolicies> }
  | { type: 'SET_PRODUCTS'; value: ProductItem[] }
  | { type: 'UPDATE_PRODUCT'; id: string; value: Partial<ProductItem> }
  | { type: 'REMOVE_PRODUCT'; id: string };

const initialForm: BrandForm = {
  nombre_publico: '',
  bio: '',
  redes_sociales: {},
  productos: [],
  avatar_url: null,
  size_guide: [],
  fit_tips: [],
  policies: {},
  conversion: {},
};

function formReducer(state: BrandForm, action: Action): BrandForm {
  switch (action.type) {
    case 'SET_ALL': return { ...state, ...action.payload };
    case 'SET_FIELD': return { ...state, [action.key]: action.value } as BrandForm;
    case 'SET_RS': return { ...state, redes_sociales: { ...state.redes_sociales, [action.key]: action.value } };
    case 'SET_AVATAR': return { ...state, avatar_url: action.url };
    case 'ADD_SIZE': return { ...state, size_guide: [...state.size_guide, { mx:'', us:'', eu:'' }] };
    case 'UPDATE_SIZE':
      return { ...state, size_guide: state.size_guide.map((r,i)=> i===action.index ? { ...r, [action.key]: action.value } : r) };
    case 'REMOVE_SIZE': return { ...state, size_guide: state.size_guide.filter((_,i)=> i!==action.index) };
    case 'ADD_FIT_TIP': return { ...state, fit_tips: [...state.fit_tips, { style:'', tip:'' }] };
    case 'UPDATE_FIT_TIP':
      return { ...state, fit_tips: state.fit_tips.map((r,i)=> i===action.index ? { ...r, [action.key]: action.value } : r) };
    case 'REMOVE_FIT_TIP': return { ...state, fit_tips: state.fit_tips.filter((_,i)=> i!==action.index) };
    case 'SET_CONVERSION': return { ...state, conversion: { ...(state.conversion||{}), ...action.value } };
    case 'SET_POLICIES': return { ...state, policies: { ...(state.policies||{}), ...action.value } };
    case 'SET_PRODUCTS': return { ...state, productos: action.value };
    case 'UPDATE_PRODUCT': return { ...state, productos: state.productos.map(p=> p.id===action.id ? { ...p, ...action.value } : p) };
    case 'REMOVE_PRODUCT': return { ...state, productos: state.productos.filter(p=> p.id!==action.id) };
    default: return state;
  }
}

export default function BrandProfileEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: brand } = useMyBrand();
  const upsert = useUpsertBrand();
  const { showToast } = useToast();

  const [form, dispatch] = React.useReducer(formReducer, initialForm);
  const [tab, setTab] = React.useState<'info'|'products'|'policies'>('info');
  const [catFilter, setCatFilter] = React.useState<Category | 'all'>('all');

  React.useEffect(() => {
    if (brand) {
      dispatch({
        type: 'SET_ALL',
        payload: {
          nombre_publico: (brand as any).nombre_publico || '',
          bio: (brand as any).bio || '',
          redes_sociales: (brand as any).redes_sociales || {},
          productos: Array.isArray((brand as any).productos) ? (brand as any).productos : [],
          avatar_url: (brand as any).avatar_url || null,
          size_guide: Array.isArray((brand as any).size_guide) ? (brand as any).size_guide : [],
          fit_tips: Array.isArray((brand as any).fit_tips) ? (brand as any).fit_tips : [],
          policies: (brand as any).policies || {},
          conversion: (brand as any).conversion || {},
        }
      });
    }
  }, [brand]);

  const setField = (key: 'nombre_publico'|'bio', value: string) => dispatch({ type:'SET_FIELD', key, value });
  const setRS = (key: string, value: string) => dispatch({ type:'SET_RS', key, value });

  const handleSave = async () => {
    try {
      // Crear payload limpio con SOLO los campos que existen en profiles_brand
      // NO incluir 'id' porque es GENERATED ALWAYS
      const redesSanitizadas = Object.entries(form.redes_sociales || {}).reduce<Record<string, string>>((acc, [key, value]) => {
        if (typeof value !== 'string') return acc;
        const trimmed = value.trim();
        if (!trimmed) return acc;
        acc[key] = trimmed;
        return acc;
      }, {});

      const payload: any = { 
        nombre_publico: form.nombre_publico, 
        bio: form.bio, 
        redes_sociales: redesSanitizadas,
        avatar_url: form.avatar_url || null,
        estado_aprobacion: 'aprobado'
      };

      // Agregar campos opcionales solo si existen en la tabla
      // (requiere ejecutar FIX_BRAND_COLUMNS.sql primero)
      if (form.productos) {
        payload.productos = form.productos;
      }
      if (form.size_guide && form.size_guide.length > 0) {
        payload.size_guide = form.size_guide;
      }
      if (form.fit_tips && form.fit_tips.length > 0) {
        payload.fit_tips = form.fit_tips;
      }
      if (form.policies && Object.keys(form.policies).length > 0) {
        payload.policies = form.policies;
      }
      if (form.conversion && Object.keys(form.conversion).length > 0) {
        payload.conversion = form.conversion;
      }

      console.log('📦 [BrandProfileEditor] Payload limpio:', payload);
      console.log('✅ [BrandProfileEditor] Estado de aprobación:', payload.estado_aprobacion);
      await upsert.mutateAsync(payload);
      showToast('✅ Perfil guardado exitosamente', 'success');
    } catch (error: any) {
      console.error('❌ [BrandProfileEditor] Error guardando:', error);
      showToast(`❌ Error al guardar: ${error.message || 'Intenta nuevamente'}`, 'error');
    }
  };

  // --- Uploaders ---
  const onPickCatalog = async (files: FileList) => {
    if (!(brand as any)?.id) { 
      showToast('⚠️ Primero guarda la información básica para habilitar el catálogo.', 'error'); 
      return; 
    }
    const brandId = (brand as any).id as number;
    const onlyImages = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (onlyImages.length === 0) {
      showToast('⚠️ Por favor selecciona al menos una imagen', 'error');
      return;
    }

    showToast('📤 Subiendo imágenes...', 'info');
    const uploaded: ProductItem[] = [];
    for (const file of onlyImages) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `brand/${brandId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('media').upload(path, file, {
        cacheControl: '3600', 
        upsert: false, 
        contentType: file.type || undefined,
      });
      if (error) { 
        console.error('[BrandCatalogUpload] Error:', error); 
        showToast(`❌ Error al subir ${file.name}: ${error.message}`, 'error'); 
        continue; 
      }
      const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
      uploaded.push({ 
        id: path, 
        titulo: '', 
        descripcion: '',
        imagen_url: pub.publicUrl, 
        category: 'ropa',
        gender: 'unisex',
        price: '',
        sizes: []
      });
    }
    if (uploaded.length > 0) {
      dispatch({ type:'SET_PRODUCTS', value: [...form.productos, ...uploaded] });
      showToast(`✅ ${uploaded.length} imagen(es) subida(s) exitosamente`, 'success');
    }
  };

  const removeCatalogItem = async (prodIdOrPath: string) => {
    try { await supabase.storage.from('media').remove([prodIdOrPath]); }
    catch (e) { console.warn('[BrandCatalogRemove] No se pudo eliminar del storage (continuando):', e); }
    dispatch({ type:'REMOVE_PRODUCT', id: prodIdOrPath });
  };

  const onUploadLogo = async (file: File) => {
    if (!(brand as any)?.id) { alert('Primero guarda la información básica para habilitar el logo.'); return; }
    const brandId = (brand as any).id as number;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `${brandId}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type || undefined });
    if (error) { alert(error.message); return; }
    const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
    dispatch({ type:'SET_AVATAR', url: pub.publicUrl });
    // Persistir inmediatamente (fallback a user_id si fuera necesario)
    try {
      let { data, error: uerr } = await supabase
        .from('profiles_brand')
        .update({ avatar_url: pub.publicUrl })
        .eq('id', (brand as any).id)
        .select('id')
        .maybeSingle();
      if (uerr || !data) {
        const { data: data2, error: uerr2 } = await supabase
          .from('profiles_brand')
          .update({ avatar_url: pub.publicUrl })
          .eq('user_id', (user as any)?.id)
          .select('id')
          .maybeSingle();
        if (uerr2 || !data2) throw uerr2 || new Error('No se pudo guardar el logo');
      }
    } catch (e:any) {
      console.error('[BrandEditor] Error guardando logo:', e);
      alert('No se pudo guardar el logo. Intenta nuevamente.');
    }
  };


  return (
    <>
      <style>{`
        .editor-container { min-height: 100vh; background: ${colors.dark}; color: ${colors.light}; padding: 2rem; }
        .editor-content { max-width: 1200px; margin: 0 auto; }
        .editor-content h2,
        .editor-content h3 {
          color: ${colors.light};
          text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px;
        }
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
        .brand-info-grid { display: grid; grid-template-columns: auto 1fr; gap: 2rem; align-items: start; }
        .brand-social-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
        @media (max-width: 768px) {
          .brand-info-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; justify-items: center !important; }
          .brand-social-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
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
          img, [style*="objectFit"] { max-width: 100% !important; height: auto !important; object-fit: contain !important; }
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

          {/* ProfileNavigationToggle */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.5rem' }}>
            <ProfileNavigationToggle currentView="edit" profileType="brand" onSave={handleSave} isSaving={upsert.isPending} />
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:'.5rem', marginBottom:'1.5rem', flexWrap:'wrap', justifyContent:'center' }}>
            <button onClick={()=>setTab('info')} className="editor-back-btn" style={{ background: tab==='info'?'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))':'rgba(255,255,255,0.1)' }}>Información</button>
            <button onClick={()=>setTab('products')} className="editor-back-btn" style={{ background: tab==='products'?'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))':'rgba(255,255,255,0.1)' }}>Productos</button>
            <button onClick={()=>setTab('policies')} className="editor-back-btn" style={{ background: tab==='policies'?'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))':'rgba(255,255,255,0.1)' }}>Políticas</button>
          </div>

          {/* Banner de Bienvenida (solo para perfiles nuevos) */}
          {!brand && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '1.5rem',
                marginBottom: '2rem',
                background: 'linear-gradient(135deg, rgba(229, 57, 53, 0.2) 0%, rgba(251, 140, 0, 0.2) 100%)',
                border: '2px solid rgba(229, 57, 53, 0.4)',
                borderRadius: '16px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏷️</div>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700',
                marginBottom: '0.5rem',
                background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ¡Bienvenido, Marca!
              </h3>
              <p style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '1rem' }}>
                Completa tu información básica y haz clic en <strong>💾 Guardar</strong> arriba para crear tu perfil
              </p>
              <div style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                👆 Mínimo requerido: <strong>Nombre de la Marca</strong>
              </div>
            </motion.div>
          )}

          {/* === INFO === */}
          {tab==='info' && (
            <>
              <div className="editor-section glass-card-container">
                <h2 className="editor-section-title">🏷️ Información de la Marca</h2>
                
                {/* Layout de dos columnas: Logo | Nombre + Descripción */}
                <div className="brand-info-grid">
                  {/* Columna 1: Logo */}
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                  <div style={{ 
                    width: '160px', 
                    height: '160px', 
                    borderRadius: '24px', 
                    overflow: 'hidden',
                    border: '3px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    background: 'linear-gradient(135deg, #E53935, #FB8C00)'
                  }}>
                      {form.avatar_url ? (
                        <ImageWithFallback 
                          src={form.avatar_url} 
                          alt="logo" 
                          width={160}
                          height={160}
                          sizes="160px"
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'contain',
                            backgroundColor: 'rgba(0,0,0,0.35)'
                          }} 
                        />
                      ) : (
                        <div style={{ 
                          width: '100%', 
                          height: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '4rem'
                        }}>
                          🏷️
                        </div>
                      )}
                    </div>
                    <label className="editor-back-btn" style={{ 
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))',
                      border: '1px solid rgba(255,255,255,0.3)',
                      fontWeight: '700',
                      whiteSpace: 'nowrap'
                    }}>
                      <input type="file" accept="image/*" style={{ display:'none' }} onChange={(e)=> e.target.files?.[0] && onUploadLogo(e.target.files[0]) }/>
                      📸 Subir Logo
                    </label>
                  </div>

                  {/* Columna 2: Nombre + Descripción */}
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                      <label className="editor-field" style={{ 
                        fontSize: '1rem',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        🏷️ Nombre de la Marca *
                      </label>
                      <input 
                        type="text" 
                        value={form.nombre_publico || ''} 
                        onChange={(e) => setField('nombre_publico', e.target.value)} 
                        placeholder="Ej: Zapatos Elegantes MX" 
                        className="editor-input"
                        style={{
                          fontSize: '1.1rem',
                          padding: '1rem',
                          fontWeight: '600'
                        }}
                      />
                    </div>
                    <div>
                      <label className="editor-field" style={{ 
                        fontSize: '1rem',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        📝 Biografía / Descripción
                      </label>
                      <textarea 
                        value={form.bio || ''} 
                        onChange={(e) => setField('bio', e.target.value)} 
                        placeholder="Describe tu marca: historia, materiales, enfoque, estilos que representas, qué te hace único..." 
                        rows={2} 
                        className="editor-textarea"
                        style={{
                          fontSize: '1rem',
                          padding: '1rem',
                          lineHeight: '1.6'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Redes Sociales — Diseño mejorado */}
              <div className="editor-section glass-card-container">
                <h2 className="editor-section-title">📱 Redes Sociales</h2>
                
                {/* Grid de 2 columnas para inputs */}
                <div className="brand-social-grid">
                  <div>
                    <label className="editor-field" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      fontSize: '0.95rem'
                    }}>
                      📸 Instagram
                    </label>
                    <input 
                      type="text" 
                      value={form.redes_sociales?.instagram || ''} 
                      onChange={(e)=>setRS('instagram', e.target.value)} 
                      placeholder="@tu_marca" 
                      className="editor-input"
                      style={{ padding: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label className="editor-field" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      fontSize: '0.95rem'
                    }}>
                      🎵 TikTok
                    </label>
                    <input 
                      type="text" 
                      value={form.redes_sociales?.tiktok || ''} 
                      onChange={(e)=>setRS('tiktok', e.target.value)} 
                      placeholder="@tu_marca" 
                      className="editor-input"
                      style={{ padding: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label className="editor-field" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      fontSize: '0.95rem'
                    }}>
                      📺 YouTube
                    </label>
                    <input 
                      type="text" 
                      value={form.redes_sociales?.youtube || ''} 
                      onChange={(e)=>setRS('youtube', e.target.value)} 
                      placeholder="Canal o enlace" 
                      className="editor-input"
                      style={{ padding: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label className="editor-field" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      fontSize: '0.95rem'
                    }}>
                      👥 Facebook
                    </label>
                    <input 
                      type="text" 
                      value={form.redes_sociales?.facebook || ''} 
                      onChange={(e)=>setRS('facebook', e.target.value)} 
                      placeholder="Página o perfil" 
                      className="editor-input"
                      style={{ padding: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label className="editor-field" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      fontSize: '0.95rem'
                    }}>
                      💬 WhatsApp
                    </label>
                    <input 
                      type="text" 
                      value={form.redes_sociales?.whatsapp || ''} 
                      onChange={(e)=>setRS('whatsapp', e.target.value)} 
                      placeholder="Número de teléfono" 
                      className="editor-input"
                      style={{ padding: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label className="editor-field" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      fontSize: '0.95rem'
                    }}>
                      🌐 Sitio Web
                    </label>
                    <input 
                      type="text" 
                      value={form.redes_sociales?.web || ''} 
                      onChange={(e)=>setRS('web', e.target.value)} 
                      placeholder="https://" 
                      className="editor-input"
                      style={{ padding: '0.875rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Guía de tallas y ajuste - Diseño optimizado */}
              <div className="editor-section glass-card-container">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  marginBottom: '1.5rem' 
                }}>
                  <div style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #4CAF50, #8BC34A)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '1.75rem',
                    boxShadow: '0 8px 24px rgba(76, 175, 80, 0.4)'
                  }}>
                    📏
                  </div>
                  <div>
                    <h2 className="editor-section-title" style={{ margin: 0 }}>Guía de Tallas y Ajuste</h2>
                    <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: '0.25rem 0 0 0' }}>
                      Ayuda a tus clientes a elegir la talla correcta
                    </p>
                  </div>
                </div>

                {/* Editor de Equivalencias */}
                <div style={{ 
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '700', 
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    📐 Equivalencias de Tallas (MX / US / EU)
                  </h3>
                  
                  {/* Tabla de tallas */}
                  {(form.size_guide || []).length > 0 && (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr 1fr auto', 
                      gap: '0.75rem', 
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', opacity: 0.8 }}>MX</div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', opacity: 0.8 }}>US</div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', opacity: 0.8 }}>EU</div>
                      <span />
                      {(form.size_guide || []).map((row, idx) => (
                        <React.Fragment key={idx}>
                          <input 
                            className="editor-input" 
                            value={row.mx} 
                            onChange={(e)=>dispatch({ type:'UPDATE_SIZE', index: idx, key:'mx', value:e.target.value })}
                            placeholder="22"
                            style={{ padding: '0.75rem', fontSize: '0.95rem' }}
                          />
                          <input 
                            className="editor-input" 
                            value={row.us} 
                            onChange={(e)=>dispatch({ type:'UPDATE_SIZE', index: idx, key:'us', value:e.target.value })}
                            placeholder="5"
                            style={{ padding: '0.75rem', fontSize: '0.95rem' }}
                          />
                          <input 
                            className="editor-input" 
                            value={row.eu} 
                            onChange={(e)=>dispatch({ type:'UPDATE_SIZE', index: idx, key:'eu', value:e.target.value })}
                            placeholder="35"
                            style={{ padding: '0.75rem', fontSize: '0.95rem' }}
                          />
                          <button 
                            type="button" 
                            className="editor-back-btn" 
                            onClick={()=>dispatch({ type:'REMOVE_SIZE', index: idx })}
                            style={{ 
                              background: 'rgba(244, 67, 54, 0.2)',
                              border: '1px solid rgba(244, 67, 54, 0.4)',
                              color: '#F44336',
                              padding: '0.75rem',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            🗑️
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      className="editor-back-btn" 
                      onClick={()=>dispatch({ type:'ADD_SIZE' })}
                      style={{ 
                        background: 'linear-gradient(135deg, #4CAF50, #8BC34A)',
                        fontWeight: '700'
                      }}
                    >
                      ➕ Agregar Talla
                    </button>
                    <button 
                      type="button" 
                      className="editor-back-btn" 
                      onClick={async ()=>{
                        if (!(brand as any)?.id) { 
                          showToast('Primero guarda la información básica.', 'error'); 
                          return; 
                        }
                        try {
                          await supabase.from('profiles_brand').update({ size_guide: form.size_guide || [] }).eq('id', (brand as any).id);
                          showToast('✅ Guía de tallas guardada', 'success');
                        } catch (e: any) {
                          showToast('❌ Error al guardar guía', 'error');
                        }
                      }}
                      style={{ fontWeight: '700' }}
                    >
                      💾 Guardar Guía
                    </button>
                  </div>
                </div>

                {/* Editor de Consejos de Ajuste */}
                <div style={{ 
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '700', 
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    💡 Consejos de Ajuste por Estilo
                  </h3>
                  
                  {(form.fit_tips || []).map((it, idx) => (
                    <div key={idx} style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '200px 1fr auto', 
                      gap: '0.75rem', 
                      alignItems: 'start', 
                      marginBottom: '0.75rem',
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <input 
                        className="editor-input" 
                        placeholder="Ej: Bachata" 
                        value={it.style} 
                        onChange={(e)=>dispatch({ type:'UPDATE_FIT_TIP', index: idx, key:'style', value:e.target.value })}
                        style={{ padding: '0.75rem', fontSize: '0.95rem', fontWeight: '600' }}
                      />
                      <textarea 
                        className="editor-textarea" 
                        placeholder="Ej: Tacón estable, suela flexible, punta reforzada..." 
                        value={it.tip} 
                        onChange={(e)=>dispatch({ type:'UPDATE_FIT_TIP', index: idx, key:'tip', value:e.target.value })}
                        rows={2}
                        style={{ padding: '0.75rem', fontSize: '0.9rem', lineHeight: '1.5' }}
                      />
                      <button 
                        type="button" 
                        className="editor-back-btn" 
                        onClick={()=>dispatch({ type:'REMOVE_FIT_TIP', index: idx })}
                        style={{ 
                          background: 'rgba(244, 67, 54, 0.2)',
                          border: '1px solid rgba(244, 67, 54, 0.4)',
                          color: '#F44336',
                          padding: '0.75rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}

                  {/* Botones de acción */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <button 
                      type="button" 
                      className="editor-back-btn" 
                      onClick={()=>dispatch({ type:'ADD_FIT_TIP' })}
                      style={{ 
                        background: 'linear-gradient(135deg, #4CAF50, #8BC34A)',
                        fontWeight: '700'
                      }}
                    >
                      ➕ Agregar Consejo
                    </button>
                    <button 
                      type="button" 
                      className="editor-back-btn" 
                      onClick={async ()=>{
                        if (!(brand as any)?.id) { 
                          showToast('Primero guarda la información básica.', 'error'); 
                          return; 
                        }
                        try {
                          await supabase.from('profiles_brand').update({ fit_tips: form.fit_tips || [] }).eq('id', (brand as any).id);
                          showToast('✅ Consejos guardados', 'success');
                        } catch (e: any) {
                          showToast('❌ Error al guardar consejos', 'error');
                        }
                      }}
                      style={{ fontWeight: '700' }}
                    >
                      💾 Guardar Consejos
                    </button>
                  </div>
                </div>

                {/* Vista previa */}
                {((form.size_guide || []).length > 0 || (form.fit_tips || []).length > 0) && (
                  <div style={{ 
                    marginTop: '1.5rem',
                    padding: '1.25rem',
                    background: 'rgba(76, 175, 80, 0.08)',
                    border: '2px solid rgba(76, 175, 80, 0.2)',
                    borderRadius: '12px'
                  }}>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: '600', 
                      opacity: 0.7, 
                      marginBottom: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      👀 Vista Previa
                    </div>
                    <div className="editor-grid-small">
                      <SizeGuide rows={form.size_guide || []} />
                      <FitTips tips={form.fit_tips || []} />
                    </div>
                  </div>
                )}
              </div>

              {/* Conversión - Diseño optimizado */}
              <div className="editor-section glass-card-container">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  marginBottom: '1.5rem' 
                }}>
                  <div style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #FB8C00, #FF7043)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '1.75rem',
                    boxShadow: '0 8px 24px rgba(251, 140, 0, 0.4)'
                  }}>
                    🎁
                  </div>
                  <div>
                    <h2 className="editor-section-title" style={{ margin: 0 }}>Conversión</h2>
                    <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: '0.25rem 0 0 0' }}>
                      Promociones y cupones para tus clientes
                    </p>
                  </div>
                </div>

                {/* Inputs de conversión */}
                <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label className="editor-field" style={{ 
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      ✨ Encabezado de la Promoción
                    </label>
                    <input 
                      className="editor-input" 
                      value={form.conversion?.headline || ''} 
                      onChange={(e)=>dispatch({ type:'SET_CONVERSION', value:{ headline: e.target.value } })} 
                      placeholder="Ej: 10% de descuento en tu primera compra"
                      style={{ padding: '0.875rem', fontSize: '1rem' }}
                    />
                  </div>
                  <div>
                    <label className="editor-field" style={{ 
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      💬 Subtítulo / Mensaje
                    </label>
                    <input 
                      className="editor-input" 
                      value={form.conversion?.subtitle || ''} 
                      onChange={(e)=>dispatch({ type:'SET_CONVERSION', value:{ subtitle: e.target.value } })} 
                      placeholder="Ej: Usa el cupón BAILE10 al finalizar tu compra"
                      style={{ padding: '0.875rem', fontSize: '1rem' }}
                    />
                  </div>
                </div>

                {/* Editor de cupones */}
                <div style={{ 
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '700', 
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    🎟️ Cupones Activos
                  </h3>
                  <CouponEditor
                    coupons={(form.conversion?.coupons || []) as string[]}
                    onChange={(arr)=> dispatch({ type:'SET_CONVERSION', value:{ coupons: arr } })}
                    onSave={async (arr)=>{
                      if (!(brand as any)?.id) { 
                        showToast('Primero guarda la información básica.', 'error'); 
                        return; 
                      }
                      try {
                        const next = { ...(form.conversion||{}), coupons: arr };
                        await supabase.from('profiles_brand').update({ conversion: next }).eq('id', (brand as any).id);
                        showToast('✅ Cupones guardados', 'success');
                      } catch (e: any) {
                        showToast('❌ Error al guardar cupones', 'error');
                      }
                    }}
                  />
                </div>

                {/* Vista previa */}
                <div style={{ 
                  marginTop: '1.5rem',
                  padding: '1.25rem',
                  background: 'rgba(251, 140, 0, 0.08)',
                  border: '2px solid rgba(251, 140, 0, 0.2)',
                  borderRadius: '12px'
                }}>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: '600', 
                    opacity: 0.7, 
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    👀 Vista Previa
                  </div>
                  <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ 
                      fontWeight: 900, 
                      fontSize: '1.1rem',
                      background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {form.conversion?.headline || '10% primera compra'}
                    </span>
                    <span style={{ opacity: .85, fontSize: '0.95rem' }}>
                      {form.conversion?.subtitle || 'Usa uno de tus cupones'}
                    </span>
                  </div>
                  {(form.conversion?.coupons || []).length > 0 && (
                    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                      {(form.conversion?.coupons || []).map((c: string) => (
                        <span key={c} style={{ 
                          padding: '0.5rem 1rem',
                          background: 'rgba(255, 255, 255, 0.15)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '20px',
                          fontWeight: '700',
                          fontSize: '0.9rem',
                          letterSpacing: '0.05em'
                        }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* === PRODUCTS === */}
          {tab==='products' && (
            <div className="editor-section glass-card-container">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                marginBottom: '1.5rem' 
              }}>
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #9C27B0, #E91E63)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '1.75rem',
                  boxShadow: '0 8px 24px rgba(156, 39, 176, 0.4)'
                }}>
                  🛍️
                </div>
                <div>
                  <h2 className="editor-section-title" style={{ margin: 0 }}>Catálogo de Productos</h2>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: '0.25rem 0 0 0' }}>
                    Gestiona tu inventario y muestra tus productos
                  </p>
                </div>
              </div>

              {/* Botón de subir fotos */}
              <div style={{ 
                padding: '1.25rem',
                background: 'rgba(156, 39, 176, 0.08)',
                border: '2px dashed rgba(156, 39, 176, 0.3)',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📸</div>
                <p style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: '1rem' }}>
                  Sube fotos de tus productos para crear entradas en el catálogo
                </p>
                <MediaUploader onPick={onPickCatalog} />
              </div>

              {/* Filtro por categoría */}
              <div style={{ 
                display:'flex', 
                gap:'.75rem', 
                flexWrap:'wrap', 
                marginBottom:'1.5rem',
                justifyContent: 'center'
              }}>
                {(['all','calzado','ropa','accesorios'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={()=>setCatFilter(cat)}
                    className="editor-back-btn"
                    style={{ 
                      background: catFilter===cat 
                        ? 'linear-gradient(135deg, #9C27B0, #E91E63)' 
                        : 'rgba(255,255,255,0.1)',
                      padding: '0.75rem 1.5rem',
                      fontWeight: '700',
                      fontSize: '0.95rem'
                    }}
                  >
                    {cat==='all' ? '🔍 Todos' : 
                     cat==='calzado' ? '👟 Calzado' : 
                     cat==='ropa' ? '👕 Ropa' : '💍 Accesorios'}
                  </button>
                ))}
              </div>

              {/* Grid de productos */}
              {Array.isArray(form.productos) && form.productos.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  {form.productos
                    .filter(p => catFilter==='all' ? true : p.category===catFilter)
                    .map((p: any) => (
                    <article key={p.id} style={{ 
                      border: '1px solid rgba(255,255,255,0.15)', 
                      borderRadius: 16, 
                      padding: '1rem', 
                      background: 'rgba(255,255,255,0.05)',
                      transition: 'all 0.3s ease'
                    }}>
                      {/* Imagen del producto */}
                      <div style={{ 
                        position: 'relative',
                        marginBottom: '1rem',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: 'rgba(0,0,0,0.2)',
                        minHeight: '200px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <ImageWithFallback 
                          src={p.imagen_url} 
                          alt={p.titulo || 'Producto'} 
                          width={400}
                          height={320}
                          sizes="(max-width: 768px) 100vw, 400px"
                          style={{ 
                            width: '100%', 
                            height: 'auto', 
                            maxHeight: '350px',
                            minHeight: '200px',
                            objectFit: 'contain',
                            display:'block' 
                          }} 
                        />
                        {/* Badges de categoría y género */}
                        <div style={{
                          position: 'absolute',
                          top: '0.75rem',
                          right: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          alignItems: 'flex-end'
                        }}>
                          {/* Badge categoría */}
                          <div style={{
                            padding: '0.5rem 1rem',
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            textTransform: 'capitalize'
                          }}>
                            {p.category === 'calzado' ? '👟' : p.category === 'ropa' ? '👕' : '💍'} {p.category}
                          </div>
                          {/* Badge género */}
                          {p.gender && (
                            <div style={{
                              padding: '0.5rem 1rem',
                              background: 'rgba(156, 39, 176, 0.8)',
                              backdropFilter: 'blur(10px)',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              textTransform: 'capitalize'
                            }}>
                              {p.gender === 'caballero' ? '👔' : p.gender === 'dama' ? '👗' : '👥'} {p.gender}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Formulario del producto */}
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {/* Nombre */}
                        <div>
                          <label style={{ 
                            display: 'block', 
                            fontSize: '0.85rem', 
                            fontWeight: '600', 
                            marginBottom: '0.5rem',
                            opacity: 0.8
                          }}>
                            📝 Nombre del Producto
                          </label>
                          <input
                            value={p.titulo || ''}
                            onChange={(e) => dispatch({ type:'UPDATE_PRODUCT', id:p.id, value:{ titulo:e.target.value } })}
                            placeholder="Ej: Zapatos de Bachata Pro"
                            className="editor-input"
                            style={{ 
                              width: '100%', 
                              padding: '0.75rem',
                              fontSize: '0.95rem',
                              fontWeight: '600'
                            }}
                          />
                        </div>

                        {/* Descripción */}
                        <div>
                          <label style={{ 
                            display: 'block', 
                            fontSize: '0.85rem', 
                            fontWeight: '600', 
                            marginBottom: '0.5rem',
                            opacity: 0.8
                          }}>
                            💬 Descripción
                          </label>
                          <textarea
                            value={p.descripcion || ''}
                            onChange={(e) => dispatch({ type:'UPDATE_PRODUCT', id:p.id, value:{ descripcion:e.target.value } })}
                            placeholder="Describe las características, materiales, beneficios..."
                            className="editor-textarea"
                            rows={3}
                            style={{ 
                              width: '100%', 
                              padding: '0.75rem',
                              fontSize: '0.9rem',
                              lineHeight: '1.5'
                            }}
                          />
                        </div>

                        {/* Precio */}
                        <div>
                          <label style={{ 
                            display: 'block', 
                            fontSize: '0.85rem', 
                            fontWeight: '600', 
                            marginBottom: '0.5rem',
                            opacity: 0.8
                          }}>
                            💰 Precio
                          </label>
                          <input
                            value={p.price || ''}
                            onChange={(e) => dispatch({ type:'UPDATE_PRODUCT', id:p.id, value:{ price:e.target.value } })}
                            placeholder="Ej: $1,299 MXN"
                            className="editor-input"
                            style={{ 
                              width: '100%', 
                              padding: '0.75rem',
                              fontSize: '0.95rem'
                            }}
                          />
                        </div>

                        {/* Categoría y Género en grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          {/* Categoría */}
                          <div>
                            <label style={{ 
                              display: 'block', 
                              fontSize: '0.85rem', 
                              fontWeight: '600', 
                              marginBottom: '0.5rem',
                              opacity: 0.8
                            }}>
                              🏷️ Categoría
                            </label>
                            <select
                              className="editor-input"
                              value={p.category || 'ropa'}
                              onChange={(e)=> dispatch({ type:'UPDATE_PRODUCT', id:p.id, value:{ category: e.target.value as Category } })}
                              style={{ 
                                width: '100%', 
                                padding: '0.75rem',
                                fontSize: '0.95rem',
                                fontWeight: '600'
                              }}
                            >
                              <option value="calzado">👟 Calzado</option>
                              <option value="ropa">👕 Ropa</option>
                              <option value="accesorios">💍 Accesorios</option>
                            </select>
                          </div>

                          {/* Género */}
                          <div>
                            <label style={{ 
                              display: 'block', 
                              fontSize: '0.85rem', 
                              fontWeight: '600', 
                              marginBottom: '0.5rem',
                              opacity: 0.8
                            }}>
                              👤 Género
                            </label>
                            <select
                              className="editor-input"
                              value={p.gender || 'unisex'}
                              onChange={(e)=> dispatch({ type:'UPDATE_PRODUCT', id:p.id, value:{ gender: e.target.value as Gender } })}
                              style={{ 
                                width: '100%', 
                                padding: '0.75rem',
                                fontSize: '0.95rem',
                                fontWeight: '600'
                              }}
                            >
                              <option value="caballero">👔 Caballero</option>
                              <option value="dama">👗 Dama</option>
                              <option value="unisex">👥 Unisex</option>
                            </select>
                          </div>
                        </div>

                        {/* Botón eliminar */}
                        <button 
                          type="button" 
                          onClick={() => removeCatalogItem(p.id)} 
                          className="editor-back-btn" 
                          style={{ 
                            width: '100%',
                            background: 'rgba(244, 67, 54, 0.2)',
                            border: '1px solid rgba(244, 67, 54, 0.4)',
                            color: '#F44336',
                            fontWeight: '700',
                            padding: '0.75rem',
                            marginTop: '0.5rem'
                          }}
                        >
                          🗑️ Eliminar Producto
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📦</div>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Catálogo vacío
                  </p>
                  <p style={{ fontSize: '0.95rem', opacity: 0.7, margin: 0 }}>
                    Sube fotos de tus productos para comenzar
                  </p>
                </div>
              )}

              {/* Vista previa con pestañas */}
              {form.productos.length > 0 && (
                <div style={{ 
                  marginTop: '1.5rem',
                  padding: '1.25rem',
                  background: 'rgba(156, 39, 176, 0.08)',
                  border: '2px solid rgba(156, 39, 176, 0.2)',
                  borderRadius: '12px'
                }}>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: '600', 
                    opacity: 0.7, 
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    👀 Vista Previa del Catálogo
                  </div>
                  <CatalogTabs items={(form.productos || []).map((p: any) => ({ 
                    id: p.id, 
                    name: p.titulo || 'Producto', 
                    description: p.descripcion || '',
                    price: p.price || '', 
                    image: p.imagen_url, 
                    category: (p.category || 'ropa') as any,
                    gender: (p.gender || 'unisex') as any,
                    sizes: p.sizes || [] 
                  }))} />
                </div>
              )}

               {/* Botón guardar catálogo */}
               {form.productos.length > 0 && (
                 <div style={{ marginTop: '1.5rem', display:'flex', justifyContent:'flex-end' }}>
                   <button 
                     type="button" 
                     className="editor-back-btn" 
                     onClick={async ()=>{
                       if (!(brand as any)?.id) { showToast('Primero guarda la información básica.', 'error'); return; }
                       try {
                         let { data, error } = await supabase
                           .from('profiles_brand')
                           .update({ productos: form.productos })
                           .eq('id', (brand as any).id)
                           .select('id')
                           .maybeSingle();
                         if (error || !data) {
                           const { data: d2, error: e2 } = await supabase
                             .from('profiles_brand')
                             .update({ productos: form.productos })
                             .eq('user_id', (user as any)?.id)
                             .select('id')
                             .maybeSingle();
                           if (e2 || !d2) throw e2 || new Error('No se pudo guardar catálogo');
                         }
                         showToast('✅ Catálogo guardado exitosamente', 'success');
                       } catch (e:any) {
                         console.error('[BrandEditor] Error guardando catálogo:', e);
                         showToast('❌ Error al guardar el catálogo', 'error');
                       }
                     }}
                     style={{ 
                       background: 'linear-gradient(135deg, #9C27B0, #E91E63)',
                       fontWeight: '700',
                       padding: '0.875rem 1.75rem',
                       fontSize: '1rem'
                     }}
                   >
                     💾 Guardar Catálogo
                   </button>
                 </div>
               )}
            </div>
          )}

          {/* === POLICIES === */}
          {tab==='policies' && (
            <div className="editor-section glass-card-container">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                marginBottom: '1.5rem' 
              }}>
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #1E88E5, #00BCD4)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '1.75rem',
                  boxShadow: '0 8px 24px rgba(30, 136, 229, 0.4)'
                }}>
                  🔒
                </div>
                <div>
                  <h2 className="editor-section-title" style={{ margin: 0 }}>Políticas</h2>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: '0.25rem 0 0 0' }}>
                    Envíos, cambios y garantías de tu marca
                  </p>
                </div>
              </div>

              {/* Grid de políticas */}
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Envíos */}
                <div style={{ 
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <label className="editor-field" style={{ 
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '700'
                  }}>
                    📦 Política de Envíos
                  </label>
                  <textarea 
                    className="editor-textarea" 
                    rows={2} 
                    value={form.policies?.shipping || ''} 
                    onChange={(e)=>dispatch({ type:'SET_POLICIES', value:{ shipping: e.target.value } })} 
                    placeholder="Ej: Envíos nacionales 2-5 días hábiles. Envío gratis en compras mayores a $1,000 MXN."
                    style={{ padding: '1rem', fontSize: '0.95rem', lineHeight: '1.6' }}
                  />
                </div>

                {/* Cambios/Devoluciones */}
                <div style={{ 
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <label className="editor-field" style={{ 
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '700'
                  }}>
                    🔄 Cambios y Devoluciones
                  </label>
                  <textarea 
                    className="editor-textarea" 
                    rows={2} 
                    value={form.policies?.returns || ''} 
                    onChange={(e)=>dispatch({ type:'SET_POLICIES', value:{ returns: e.target.value } })} 
                    placeholder="Ej: Aceptamos cambios y devoluciones dentro de 15 días. El producto debe estar sin uso y en su empaque original."
                    style={{ padding: '1rem', fontSize: '0.95rem', lineHeight: '1.6' }}
                  />
                </div>

                {/* Garantía */}
                <div style={{ 
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <label className="editor-field" style={{ 
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '700'
                  }}>
                    ✅ Garantía
                  </label>
                  <textarea 
                    className="editor-textarea" 
                    rows={2} 
                    value={form.policies?.warranty || ''} 
                    onChange={(e)=>dispatch({ type:'SET_POLICIES', value:{ warranty: e.target.value } })} 
                    placeholder="Ej: 30 días de garantía por defectos de fabricación. No cubre desgaste por uso normal."
                    style={{ padding: '1rem', fontSize: '0.95rem', lineHeight: '1.6' }}
                  />
                </div>
              </div>

              {/* Botón de guardar */}
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="editor-back-btn" 
                  onClick={async ()=>{
                    if (!(brand as any)?.id) { 
                      showToast('Primero guarda la información básica.', 'error'); 
                      return; 
                    }
                    try {
                      await supabase.from('profiles_brand').update({ policies: form.policies || {} }).eq('id', (brand as any).id);
                      showToast('✅ Políticas guardadas', 'success');
                    } catch (e: any) {
                      showToast('❌ Error al guardar políticas', 'error');
                    }
                  }}
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))',
                    fontWeight: '700',
                    padding: '0.875rem 1.75rem'
                  }}
                >
                  💾 Guardar Políticas
                </button>
              </div>

              {/* Vista previa */}
              <div style={{ 
                marginTop: '1.5rem',
                padding: '1.25rem',
                background: 'rgba(30, 136, 229, 0.08)',
                border: '2px solid rgba(30, 136, 229, 0.2)',
                borderRadius: '12px'
              }}>
                <div style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: '600', 
                  opacity: 0.7, 
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  👀 Vista Previa
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: 1.8, fontSize: '0.95rem' }}>
                  <li>
                    <b>📦 Envíos:</b> {form.policies?.shipping || 'Nacionales 2–5 días hábiles.'}
                  </li>
                  <li>
                    <b>🔄 Cambios/Devoluciones:</b> {form.policies?.returns || 'Dentro de 15 días (sin uso, en caja).'}
                  </li>
                  <li>
                    <b>✅ Garantía:</b> {form.policies?.warranty || '30 días por defectos de fabricación.'}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Subcomponentes
function CatalogTabs({ items = [] as any[] }: { items?: any[] }){
  const [tab, setTab] = React.useState<'calzado'|'ropa'|'accesorios'>('calzado');
  const filtered = items.filter((i: any) => i.category === tab);
  const tabs = ['calzado','ropa','accesorios'] as const;
  const btnPrimary: React.CSSProperties = { padding: '.75rem 1.5rem', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)', background: 'linear-gradient(135deg, #9C27B0, #E91E63)', color: '#fff', fontWeight: 900, cursor: 'pointer', fontSize: '0.95rem' };
  const btnGhost: React.CSSProperties = { padding: '.75rem 1.5rem', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' };
  const prodCard: React.CSSProperties = { border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: '1rem', background: 'rgba(255,255,255,0.05)', display:'flex', flexDirection:'column' };
  const sizePill: React.CSSProperties = { border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '.25rem .6rem', fontSize: '.85rem', fontWeight: '600' };
  const muted: React.CSSProperties = { color: 'rgba(255,255,255,.78)', margin: 0, textAlign: 'center', padding: '2rem' };
  return (
    <div>
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={t === tab ? btnPrimary : btnGhost}>
            {t === 'calzado' ? '👟 Calzado' : t === 'ropa' ? '👕 Ropa' : '💍 Accesorios'}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? <p style={muted}>Sin productos en esta categoría.</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '1.25rem' }}>
          {filtered.map((p: any) => (
            <article key={p.id} style={prodCard}>
              <div style={{ 
                position: 'relative',
                marginBottom: '0.75rem',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.2)',
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ImageWithFallback 
                  src={p.image} 
                  alt={p.name} 
                  width={360}
                  height={300}
                  sizes="(max-width: 768px) 100vw, 360px"
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    maxHeight: '300px',
                    minHeight: '200px',
                    objectFit: 'contain',
                    borderRadius: 12 
                  }} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: 800, 
                  fontSize: '1.05rem', 
                  marginBottom: '0.5rem',
                  lineHeight: '1.3'
                }}>
                  {p.name || 'Producto sin nombre'}
                </div>
                {/* Badge de género */}
                {p.gender && (
                  <div style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(156, 39, 176, 0.2)',
                    border: '1px solid rgba(156, 39, 176, 0.4)',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    marginBottom: '0.5rem',
                    textTransform: 'capitalize'
                  }}>
                    {p.gender === 'caballero' ? '👔' : p.gender === 'dama' ? '👗' : '👥'} {p.gender}
                  </div>
                )}
                {p.description && (
                  <div style={{ 
                    fontSize: '0.9rem', 
                    opacity: .8, 
                    marginBottom: '0.75rem',
                    lineHeight: '1.5'
                  }}>
                    {p.description}
                  </div>
                )}
                {p.price && (
                  <div style={{ 
                    fontSize: '1.15rem',
                    fontWeight: 900,
                    color: '#fff',
                    marginBottom: '0.5rem',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
                  }}>
                    {p.price}
                  </div>
                )}
                {Array.isArray(p.sizes) && p.sizes.length > 0 && (
                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
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

function CouponEditor({ coupons = [] as string[], onChange, onSave }:{ coupons?: string[]; onChange:(arr:string[])=>void; onSave?:(arr:string[])=>Promise<void>|void }){
  const [val, setVal] = React.useState('');
  const add = () => {
    const v = val.trim();
    if (!v) return;
    if (coupons.includes(v)) return;
    onChange([ ...coupons, v ]);
    setVal('');
  };
  const remove = (c:string) => onChange(coupons.filter(x=>x!==c));
  return (
    <div>
      <div style={{ display:'flex', gap:'.5rem', alignItems:'center', marginBottom:'.5rem' }}>
        <input className="editor-input" placeholder="Código (p. ej. BAILE10)" value={val} onChange={(e)=>setVal(e.target.value)} />
        <button type="button" className="editor-back-btn" onClick={add}>Agregar</button>
        {onSave && <button type="button" className="editor-back-btn" onClick={()=>onSave(coupons)}>Guardar cupones</button>}
      </div>
      <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
        {coupons.map(c => (
          <span key={c} style={{ border:'1px solid rgba(255,255,255,.2)', borderRadius:999, padding:'.25rem .6rem', display:'inline-flex', alignItems:'center', gap:'.4rem' }}>
            <b>{c}</b>
            <button type="button" className="editor-back-btn" onClick={()=>remove(c)}>✕</button>
          </span>
        ))}
      </div>
    </div>
  );
}
