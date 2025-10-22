import React from "react";
import { motion } from "framer-motion";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import ProfileToolbar from "../../components/profile/ProfileToolbar";

const colors = {
  blue: '#30cfd0',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function BrandProfileEditor() {
  return (
    <div style={{
      minHeight: '100vh',
      background: colors.dark,
      color: colors.light,
      padding: '1.5rem'
    }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/', icon: '🏠' },
            { label: 'Marca', href: '/profile/brand', icon: '🏷️' },
            { label: 'Editar', icon: '✏️' },
          ]}
        />

        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>
          🏷️ Editar Perfil de Marca
        </h1>

        <ProfileToolbar />

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

