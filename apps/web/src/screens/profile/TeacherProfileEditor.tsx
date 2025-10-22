import React from "react";
import { motion } from "framer-motion";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import ProfileToolbar from "../../components/profile/ProfileToolbar";

const colors = {
  green: '#43e97b',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function TeacherProfileEditor() {
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
            { label: 'Maestro', href: '/profile/teacher', icon: '🎓' },
            { label: 'Editar', icon: '✏️' },
          ]}
        />

        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>
          🎓 Editar Perfil de Maestro
        </h1>

        <ProfileToolbar />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '3rem',
            textAlign: 'center',
            background: 'rgba(67, 233, 123, 0.1)',
            borderRadius: '1rem',
            border: `1px solid ${colors.green}33`
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
            Perfil de Maestro
          </h2>
          <p style={{ opacity: 0.8 }}>
            Próximamente: Administra tus clases, horarios y alumnos
          </p>
        </motion.div>
      </div>
    </div>
  );
}

