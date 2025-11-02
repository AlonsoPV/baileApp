import React from "react";
import { useNavigate } from "react-router-dom";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import { useAuth } from "@/contexts/AuthProvider";
import { useMyBrand, useUpsertBrand } from "../../hooks/useBrand";
import SocialMediaSection from "../../components/profile/SocialMediaSection";

const colors = {
  dark: '#121212',
  light: '#F5F5F5',
};

export default function BrandProfileEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: brand } = useMyBrand();
  const upsert = useUpsertBrand();
  const [form, setForm] = React.useState<{ nombre_publico?: string; bio?: string | null; redes_sociales: any }>({ nombre_publico: '', bio: '', redes_sociales: {} });

  React.useEffect(() => {
    if (brand) {
      setForm({
        nombre_publico: (brand as any).nombre_publico || '',
        bio: (brand as any).bio || '',
        redes_sociales: (brand as any).redes_sociales || {}
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
    await upsert.mutateAsync({ id: (brand as any)?.id, nombre_publico: form.nombre_publico, bio: form.bio, redes_sociales: form.redes_sociales });
  };

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

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
            <ProfileNavigationToggle
              currentView="edit"
              profileType="brand"
              onSave={handleSave}
              isSaving={upsert.isPending}
            />
          </div>

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
        </div>
      </div>
    </>
  );
}

