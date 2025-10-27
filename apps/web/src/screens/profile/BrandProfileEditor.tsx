import React from "react";
import { motion } from "framer-motion";
// ProfileToolbar removido: usamos el toggle unificado
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import { useAuth } from "@/contexts/AuthProvider";
import { useMyBrand, useUpsertBrand } from "../../hooks/useBrand";

const colors = {
  blue: '#30cfd0',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function BrandProfileEditor() {
  const { user } = useAuth();
  const { data: brand } = useMyBrand();
  const upsert = useUpsertBrand();
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
            liveHref="/marca/" /* fallback if brand id unknown */
            editHref="/profile/brand"
            onSave={async ()=>{
              await upsert.mutateAsync({ id: brand?.id });
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
      </div>
    </div>
  );
}

