import React from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { useUserProfileById } from "../../hooks/useUserProfileById";
import { useTags } from "../../hooks/useTags";
import { MediaGrid } from "../../components/MediaGrid";
import { ProfileHero } from "../../components/profile/ProfileHero";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function UserPublicProfile() {
  const { id } = useParams<{ id: string }>(); // user_id (UUID)
  const { data: profile, isLoading, error } = useUserProfileById(id);
  const { ritmos: catRitmos } = useTags("ritmo");
  const { zonas: catZonas } = useTags("zona");

  const mapNames = (ids: number[], cat: {id: number; nombre: string}[] = []) =>
    ids?.map(i => cat.find(c => c.id === i)?.nombre).filter(Boolean) as string[];

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.dark,
        color: colors.light,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.dark,
        color: colors.light,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>❌</div>
          <p>Perfil no encontrado</p>
        </div>
      </div>
    );
  }

  const ritmosNombres = mapNames(profile.ritmos || [], catRitmos || []);
  const zonasNombres = mapNames(profile.zonas || [], catZonas || []);

  // Crear chips para ritmos y zonas
  const ritmoChips = ritmosNombres.slice(0, 3).map((nombre, index) => (
    <motion.div
      key={`ritmo-${nombre}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      style={{
        padding: '8px 16px',
        borderRadius: '20px',
        background: `${colors.coral}cc`,
        border: `2px solid ${colors.coral}`,
        color: colors.light,
        fontSize: '0.875rem',
        fontWeight: '700',
        backdropFilter: 'blur(10px)',
        boxShadow: `0 2px 10px ${colors.coral}66`,
      }}
    >
      🎵 {nombre}
    </motion.div>
  ));

  const zonaChips = zonasNombres.slice(0, 2).map((nombre, index) => (
    <motion.div
      key={`zona-${nombre}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.05 }}
      style={{
        padding: '8px 16px',
        borderRadius: '20px',
        background: `${colors.yellow}cc`,
        border: `2px solid ${colors.yellow}`,
        color: colors.dark,
        fontSize: '0.875rem',
        fontWeight: '700',
        backdropFilter: 'blur(10px)',
        boxShadow: `0 2px 10px ${colors.yellow}66`,
      }}
    >
      📍 {nombre}
    </motion.div>
  ));

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.dark,
      color: colors.light,
    }}>
      {/* Hero Section */}
      <ProfileHero
        coverUrl={(Array.isArray(profile.media) && profile.media.length > 0) 
          ? profile.media[0]?.url 
          : profile.avatar_url
        }
        title={profile.display_name || "Usuario"}
        subtitle={profile.bio || undefined}
        chipsLeft={[...ritmoChips, ...zonaChips]}
      />

      {/* Content Sections */}
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        {/* About Section */}
        {profile.bio && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              marginBottom: '32px',
              padding: '24px',
              background: `${colors.dark}ee`,
              borderRadius: '16px',
              border: `1px solid ${colors.light}22`,
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: '600' }}>
              💬 Sobre mí
            </h3>
            <p style={{ lineHeight: 1.6, opacity: 0.85 }}>
              {profile.bio}
            </p>
          </motion.section>
        )}

        {/* Galería */}
        {Array.isArray(profile.media) && profile.media.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              marginTop: '32px',
            }}
          >
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              marginBottom: '16px',
            }}>
              📸 Galería
            </h2>
            <MediaGrid items={profile.media} />
          </motion.section>
        )}

        {/* Empty State para galería */}
        {(!profile.media || (Array.isArray(profile.media) && profile.media.length === 0)) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              marginTop: '32px',
              padding: '32px',
              background: `${colors.dark}aa`,
              borderRadius: '16px',
              border: `1px dashed ${colors.light}22`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📷</div>
            <p style={{ opacity: 0.6 }}>
              Este usuario aún no ha subido fotos a su galería
            </p>
          </motion.section>
        )}
      </div>
    </div>
  );
}
