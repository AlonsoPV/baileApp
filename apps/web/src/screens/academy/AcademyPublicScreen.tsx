import React from 'react';
import { useParams } from 'react-router-dom';
import { useAcademyPublic } from '../../hooks/useAcademy';
import { useTags } from '../../hooks/useTags';
import SocialMediaSection from '../../components/profile/SocialMediaSection';
import { Chip } from '../../components/profile/Chip';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';
import { ProfileNavigationToggle } from '../../components/profile/ProfileNavigationToggle';
import '@/styles/organizer.css';

const DIAS_SEMANA = [
  { value: 'Lun', label: 'Lunes' },
  { value: 'Mar', label: 'Martes' },
  { value: 'Mie', label: 'Miércoles' },
  { value: 'Jue', label: 'Jueves' },
  { value: 'Vie', label: 'Viernes' },
  { value: 'Sab', label: 'Sábado' },
  { value: 'Dom', label: 'Domingo' }
];

export default function AcademyPublicScreen() {
  const { academyId } = useParams();
  const id = Number(academyId);
  const { data: academy, isLoading } = useAcademyPublic(id);
  const { data: allTags } = useTags();

  // Obtener nombres de tags
  const getRitmoNombres = () => {
    if (!allTags || !academy?.ritmos) return [];
    return academy.ritmos
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  const getZonaNombres = () => {
    if (!allTags || !academy?.zonas) return [];
    return academy.zonas
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'zona'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  const getDiaLabel = (dia: string) => {
    return DIAS_SEMANA.find(d => d.value === dia)?.label || dia;
  };

  if (isLoading) {
    return (
      <div style={{
        padding: spacing[12],
        textAlign: 'center',
        color: colors.light,
        background: '#000000',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>⏳</div>
        <p style={{ fontSize: typography.fontSize.lg }}>Cargando academia...</p>
      </div>
    );
  }

  if (!academy) {
    return (
      <div style={{
        padding: spacing[12],
        textAlign: 'center',
        color: colors.light,
        background: '#000000',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>❌</div>
        <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[4] }}>
          Academia no disponible
        </h2>
        <p style={{ marginBottom: spacing[6], opacity: 0.7, fontSize: typography.fontSize.lg }}>
          Esta academia no existe o no está aprobada
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000000', color: colors.light }}>
      {/* Toggle */}
      <div className="profile-toggle" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <ProfileNavigationToggle
          currentView="live"
          profileType="academy"
          liveHref={id ? `/academia/${id}` : "/profile/academy/live"}
          editHref="/profile/academy"
        />
      </div>

      {/* Banner */}
      <div className="org-banner" style={{ background: academy?.portada_url ? `url(${academy.portada_url}) center/cover` : undefined }}>
        <div className="org-banner-grid">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '220px', height: '220px', borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(255,255,255,0.2)', background: 'linear-gradient(135deg,#1E88E5,#00BCD4)' }}>
              {academy?.avatar_url ? (
                <img src={academy.avatar_url} alt={academy?.nombre_publico} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🎓</div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6], justifyContent: 'center' }}>
            <h1 className="gradient-text" style={{ fontSize: typography.fontSize['5xl'], fontWeight: typography.fontWeight.black, margin: 0 }}>{academy?.nombre_publico}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[2] }}>
              {getRitmoNombres().map((nombre) => (<Chip key={`r-${nombre}`} label={nombre} icon="🎵" variant="ritmo" />))}
              {getZonaNombres().map((nombre) => (<Chip key={`z-${nombre}`} label={nombre} icon="📍" variant="zona" />))}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="org-container" style={{ padding: spacing[8], maxWidth: '900px', margin: '0 auto' }}>
        {academy?.bio && (
          <section className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}>
            <h3 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[4], fontWeight: typography.fontWeight.bold }}>💬 Sobre la academia</h3>
            <p style={{ lineHeight: typography.lineHeight.relaxed, opacity: 0.9, fontSize: typography.fontSize.lg }}>{academy.bio}</p>
          </section>
        )}

        <section className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}>
          <h3 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[4], fontWeight: typography.fontWeight.bold }}>🔗 Redes</h3>
          <SocialMediaSection availablePlatforms={['instagram','tiktok','youtube','facebook','whatsapp']} respuestas={{ redes: academy?.redes_sociales }} />
        </section>

        {academy?.ubicaciones?.length > 0 && (
          <section className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}>
            <h3 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[4], fontWeight: typography.fontWeight.bold }}>📍 Ubicaciones</h3>
            {academy.ubicaciones.map((u, i) => (
              <div key={i} style={{ padding: spacing[3], borderBottom: i < academy.ubicaciones.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none' }}>
                <div style={{ fontWeight: typography.fontWeight.semibold }}>{u.sede || 'Sede'}</div>
                {u.direccion && <div style={{ opacity: 0.9 }}>{u.direccion}</div>}
                {u.ciudad && <div style={{ opacity: 0.7, fontSize: typography.fontSize.sm }}>{u.ciudad}</div>}
              </div>
            ))}
          </section>
        )}

        {academy?.horarios?.length > 0 && (
          <section className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}>
            <h3 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[4], fontWeight: typography.fontWeight.bold }}>🕒 Horarios</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing[4] }}>
              {academy.horarios.map((h, i) => (
                <div key={i} style={{ padding: spacing[3], background: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.lg, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontWeight: typography.fontWeight.semibold }}>{h.dia}</div>
                  <div style={{ opacity: 0.8, fontSize: typography.fontSize.sm }}>{h.desde && h.hasta ? `${h.desde} - ${h.hasta}` : 'Horario por confirmar'}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {Array.isArray(academy?.media) && academy.media.length > 0 && (
          <section className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], marginBottom: spacing[6] }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: typography.fontSize['2xl'] }}>📷</div>
              <div>
                <h3 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, margin: 0 }}>Galería</h3>
                <p style={{ fontSize: typography.fontSize.sm, opacity: 0.8, margin: 0 }}>{academy.media.length} elemento{academy.media.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing[4] }}>
              {academy.media.map((item: any, index: number) => (
                <div key={index} style={{ borderRadius: borderRadius.xl, overflow: 'hidden', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  {item.type === 'image' ? (
                    <img src={item.url} alt={`Imagen ${index + 1}`} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                  ) : (
                    <video src={item.url} controls style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}