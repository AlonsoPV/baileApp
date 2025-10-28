import React from "react";
import { motion } from "framer-motion";
// ProfileToolbar removido: usamos el toggle unificado
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import { useAuth } from "@/contexts/AuthProvider";
import { useMyBrand, useUpsertBrand } from "../../hooks/useBrand";
import SocialMediaSection from "../../components/profile/SocialMediaSection";

const colors = {
  blue: '#30cfd0',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function BrandProfileEditor() {
  const { user } = useAuth();
  const { data: brand } = useMyBrand();
  const upsert = useUpsertBrand();
  const [form, setForm] = React.useState<{ redes_sociales: any }>({ redes_sociales: {} });

  React.useEffect(() => {
    if (brand) {
      setForm({ redes_sociales: brand.redes_sociales || {} });
    }
  }, [brand]);

  const setRS = (key: string, value: string) => {
    setForm((s) => ({ redes_sociales: { ...s.redes_sociales, [key]: value } }));
  };
  return (
    <div style={{
      minHeight: '100vh',
      background: colors.dark,
      color: colors.light,
      padding: '1.5rem'
    }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
        {/* Toolbar antigua removida */}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>
            🏷️ Editar Perfil de Marca
          </h1>
          <ProfileNavigationToggle
            currentView="edit"
            profileType="brand"
            liveHref={brand?.id ? `/marca/${brand.id}` : "/marca/"}
            editHref="/profile/brand"
            onSave={async ()=>{
              await upsert.mutateAsync({ id: brand?.id, redes_sociales: form.redes_sociales });
            }}
            isSaving={upsert.isPending}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '3rem',
            textAlign: 'center',
            background: 'rgba(48, 207, 208, 0.1)',
            borderRadius: '1rem',
            border: `1px solid ${colors.blue}33`
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏷️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
            Perfil de Marca
          </h2>
          <p style={{ opacity: 0.8 }}>
            Próximamente: Promociona tus productos, ropa y accesorios de baile
          </p>
        </motion.div>

        {/* Redes Sociales - Editor conectado + Vista previa */}
        <div style={{ marginTop: '2rem', padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>📱 Redes Sociales</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <input value={form.redes_sociales?.instagram || ''} onChange={(e)=>setRS('instagram', e.target.value)} placeholder="Instagram" style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
            <input value={form.redes_sociales?.tiktok || ''} onChange={(e)=>setRS('tiktok', e.target.value)} placeholder="TikTok" style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
            <input value={form.redes_sociales?.youtube || ''} onChange={(e)=>setRS('youtube', e.target.value)} placeholder="YouTube" style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
            <input value={form.redes_sociales?.facebook || ''} onChange={(e)=>setRS('facebook', e.target.value)} placeholder="Facebook" style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
            <input value={form.redes_sociales?.whatsapp || ''} onChange={(e)=>setRS('whatsapp', e.target.value)} placeholder="WhatsApp" style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
            <input value={form.redes_sociales?.web || ''} onChange={(e)=>setRS('web', e.target.value)} placeholder="Sitio Web" style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
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
  );
}

