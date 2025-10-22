import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useExploreFilters, ExploreType } from '../../state/exploreFilters';

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

type CategoryCard = {
  type: ExploreType;
  label: string;
  icon: string;
  gradient: string;
  description: string;
};

const categories: CategoryCard[] = [
  {
    type: 'eventos',
    label: 'Eventos',
    icon: '📅',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    description: 'Sociales, clases y workshops'
  },
  {
    type: 'organizadores',
    label: 'Organizadores',
    icon: '🎤',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    description: 'Encuentra quién organiza eventos'
  },
  {
    type: 'usuarios',
    label: 'Bailarines',
    icon: '💃',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    description: 'Conecta con la comunidad'
  },
  {
    type: 'maestros',
    label: 'Maestros',
    icon: '🎓',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    description: 'Profesores y coreógrafos'
  },
  {
    type: 'academias',
    label: 'Academias',
    icon: '🏫',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    description: 'Escuelas y studios de baile'
  },
  {
    type: 'marcas',
    label: 'Marcas',
    icon: '🏷️',
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    description: 'Ropa, zapatos y accesorios'
  },
];

export default function ExploreHomeScreen() {
  const navigate = useNavigate();
  const { set, reset } = useExploreFilters();

  const handleSelectType = (type: ExploreType) => {
    console.log('[ExploreHome] Selected type:', type);
    reset(); // Limpiar filtros anteriores
    set({ type }); // Establecer nuevo tipo
    navigate('/explore/list');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.dark,
      color: colors.light,
      padding: '2rem 1.5rem'
    }}>
      {/* Header */}
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🔍 Explora BaileApp
          </h1>
          <p style={{
            fontSize: '1.125rem',
            opacity: 0.8,
            maxWidth: '42rem',
            margin: '0 auto'
          }}>
            Descubre eventos, organizadores, bailarines y más en tu comunidad
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {categories.map((cat, index) => (
            <motion.div
              key={cat.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectType(cat.type)}
              style={{
                background: cat.gradient,
                borderRadius: '1.5rem',
                padding: '2rem',
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Icono */}
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {cat.icon}
              </div>

              {/* Título */}
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '0.5rem',
                textAlign: 'center',
                color: 'white',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}>
                {cat.label}
              </h3>

              {/* Descripción */}
              <p style={{
                fontSize: '0.875rem',
                opacity: 0.95,
                textAlign: 'center',
                color: 'white'
              }}>
                {cat.description}
              </p>

              {/* Efecto de brillo */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />
            </motion.div>
          ))}
        </div>

        {/* Footer hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            marginTop: '3rem',
            textAlign: 'center',
            fontSize: '0.875rem',
            opacity: 0.6
          }}
        >
          💡 Tip: Selecciona una categoría para comenzar a explorar
        </motion.div>
      </div>
    </div>
  );
}

