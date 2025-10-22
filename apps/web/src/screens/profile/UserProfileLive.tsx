import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useTags } from "../../hooks/useTags";
import { useUserMedia } from "../../hooks/useUserMedia";
import { useMyRSVPs } from "../../hooks/useMyRSVPs";
import { MediaGrid } from "../../components/MediaGrid";
import { EventInviteStrip } from "../../components/EventInviteStrip";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export const UserProfileLive: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { data: allTags } = useTags();
  const { media } = useUserMedia();
  const { data: rsvps } = useMyRSVPs();

  // Preparar items para EventInviteStrip
  const inviteItems = (rsvps || [])
    .filter(r => r.parent && r.date)
    .map((r) => ({
      title: r.parent?.nombre || "Evento",
      date: format(new Date(r.date.fecha), "EEE d MMM", { locale: es }),
      place: r.date.lugar || r.date.ciudad || "",
      href: `/events/date/${r.date.id}`,
      cover: Array.isArray(r.date.media) && r.date.media.length > 0 
        ? (r.date.media[0] as any)?.url || r.date.media[0]
        : undefined,
    }));

  // Get tag names from IDs
  const getRitmoNombres = () => {
    if (!allTags || !profile?.ritmos) return [];
    return profile.ritmos
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  const getZonaNombres = () => {
    if (!allTags || !profile?.zonas) return [];
    return profile.zonas
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'zona'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: colors.dark,
        color: colors.light,
      }}
    >
      {/* Cover Image */}
      <div style={{ 
        position: 'relative', 
        height: '500px', 
        overflow: 'hidden',
        maxWidth: '800px',
        margin: '0 auto',
        borderRadius: '0 0 24px 24px',
      }}>
        <img
          src={profile?.avatar_url || "/default-cover.jpg"}
          alt={profile?.display_name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.7,
          }}
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/500x500/121212/F5F5F5?text=Avatar';
          }}
        />

        {/* Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to bottom, transparent 40%, ${colors.dark})`,
          }}
        />

        {/* Floating Info */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            left: '24px',
            right: '24px',
            zIndex: 10,
          }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: colors.light,
              margin: '0 0 8px 0',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            }}
          >
            {profile?.display_name}
          </motion.h1>

          {profile?.bio && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                fontSize: '1rem',
                color: colors.light,
                opacity: 0.85,
                margin: '0 0 16px 0',
                lineHeight: 1.5,
                textShadow: '0 1px 5px rgba(0,0,0,0.5)',
              }}
            >
              {profile.bio}
            </motion.p>
          )}

          {/* Tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
          >
            {getRitmoNombres().map((nombre) => (
              <span
                key={nombre}
                style={{
                  padding: '6px 14px',
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
              </span>
            ))}
            {getZonaNombres().map((nombre) => (
              <span
                key={nombre}
                style={{
                  padding: '6px 14px',
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
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Social Media Section */}
      {profile?.redes_sociales && (
        Object.values(profile.redes_sociales).some(v => v) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
              📱 Redes Sociales
            </h3>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              {profile.redes_sociales.instagram && (
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  href={profile.redes_sociales.instagram.startsWith('http') 
                    ? profile.redes_sociales.instagram 
                    : `https://instagram.com/${profile.redes_sociales.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, #E4405F, #C13584)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.light,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(228,64,95,0.5)',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </motion.a>
              )}
              {profile.redes_sociales.facebook && (
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  href={profile.redes_sociales.facebook.startsWith('http') 
                    ? profile.redes_sociales.facebook 
                    : `https://facebook.com/${profile.redes_sociales.facebook.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: '#1877F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.light,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(24,119,242,0.5)',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </motion.a>
              )}
              {profile.redes_sociales.whatsapp && (
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  href={profile.redes_sociales.whatsapp.startsWith('http') 
                    ? profile.redes_sociales.whatsapp 
                    : `https://wa.me/${profile.redes_sociales.whatsapp.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: '#25D366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.light,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(37,211,102,0.5)',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </motion.a>
              )}
            </div>
          </motion.div>
        )
      )}

      {/* Content Sections */}
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        {/* About Section */}
        {profile?.bio && (
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

        {/* Acompáñame a estos eventos */}
        <EventInviteStrip items={inviteItems} />

        {/* Galería Section */}
        {media && media.length > 0 && (
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
              color: colors.light,
            }}>
              📸 Galería
            </h2>
            <MediaGrid items={media} />
          </motion.section>
        )}
      </div>
    </div>
  );
};
