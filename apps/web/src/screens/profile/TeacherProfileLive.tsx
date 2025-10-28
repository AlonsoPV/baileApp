import React from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import SocialMediaSection from '../../components/profile/SocialMediaSection';
import { useTags } from '../../hooks/useTags';
import { ProfileNavigationToggle } from '../../components/profile/ProfileNavigationToggle';
import '@/styles/organizer.css';
import { useTeacherMy, useTeacherPublic } from '@/hooks/useTeacher';
import { Chip } from '../../components/profile/Chip';
import { colors as themeColors, typography, spacing, borderRadius, transitions } from '../../theme/colors';
import CostosyHorarios from './CostosyHorarios';
import ImageWithFallback from '../../components/ImageWithFallback';
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from '../../utils/mediaSlots';
import ClasesLive from '../../components/events/ClasesLive';

const colors = themeColors;

export default function TeacherProfileLive() {
  const { teacherId } = useParams();
  const teacherIdNum = teacherId ? parseInt(teacherId, 10) : undefined;
  const { data: teacherMy, isLoading: myLoading } = useTeacherMy();
  const { data: teacherPub, isLoading: pubLoading } = useTeacherPublic(teacherIdNum as any);
  const teacher: any = teacherIdNum ? teacherPub : teacherMy;
  const { data: allTags } = useTags() as any;

  const getRitmoNombres = (ids: number[] = []) =>
    ids.map(id => allTags?.find((t: any) => t.id === id && t.tipo === 'ritmo')?.nombre).filter(Boolean) as string[];

  const getZonaNombres = (ids: number[] = []) =>
    ids.map(id => allTags?.find((t: any) => t.id === id && t.tipo === 'zona')?.nombre).filter(Boolean) as string[];

  if (myLoading || pubLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: colors.dark[400], color: colors.gray[50] }}>⏳ Cargando…</div>
    );
  }

  if (!teacher) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: colors.dark[400], color: colors.gray[50] }}>No se encontró el perfil</div>
    );
  }

  const ritmoNombres = getRitmoNombres(teacher.ritmos || []);
  const zonaNombres = getZonaNombres(teacher.zonas || []);
  const teacherPhotos: string[] = Array.isArray((teacher as any)?.media)
    ? ((teacher as any).media as any[]).filter(m => m?.type === 'image').map(m => m.url).filter(Boolean)
    : [];

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`, color: colors.gray[50], position: 'relative' }}>
      {/* Toggle */}
      <div className="profile-toggle" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <ProfileNavigationToggle
          currentView="live"
          profileType="teacher"
          liveHref={teacher?.id ? `/maestro/${teacher.id}` : "/profile/teacher/live"}
          editHref="/profile/teacher"
        />
      </div>

      {/* Banner similar al de organizador */}
      <motion.div className="org-banner" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} style={{ margin: `${spacing[20]} auto 0 auto` }}>
        <div className="org-banner-grid">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.6 }} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '220px', height: '220px', borderRadius: '50%', overflow: 'hidden', border: `4px solid rgba(255,255,255,0.2)`, background: 'linear-gradient(135deg,#1E88E5,#00BCD4)', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
              {teacher?.avatar_url ? (
                <img src={teacher.avatar_url} alt="Foto del maestro" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🎓</div>
              )}
              <div className="shimmer-effect" style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.6 }} style={{ display: 'flex', flexDirection: 'column', gap: spacing[6], justifyContent: 'center' }}>
            <h1 className="gradient-text" style={{ fontSize: typography.fontSize['5xl'], fontWeight: typography.fontWeight.black, margin: 0, lineHeight: typography.lineHeight.tight }}> {teacher?.nombre_publico || 'Maestro'} </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[2] }}>
              {ritmoNombres.map((nombre) => (<Chip key={`r-${nombre}`} label={nombre} icon="🎵" variant="ritmo" />))}
              {zonaNombres.map((nombre) => (<Chip key={`z-${nombre}`} label={nombre} icon="📍" variant="zona" />))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="org-container" style={{ padding: spacing[8], position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        {/* Video principal (slot v1) */}
        {getMediaBySlot((teacher as any)?.media || [], 'v1') && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[6], borderRadius: borderRadius['2xl'] }}>
            <h3 style={{ fontSize: typography.fontSize['xl'], margin: 0, marginBottom: spacing[4], fontWeight: typography.fontWeight.bold }}>🎥 Video Principal</h3>
            <div style={{ width: '100%', maxWidth: 640, aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}>
              <video src={getMediaBySlot((teacher as any)?.media || [], 'v1')?.url || ''} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </motion.section>
        )}

        {/* Carrusel de fotos */}
        {teacherPhotos.length > 0 && (
          <motion.section id="user-profile-photo-gallery" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], marginBottom: spacing[6] }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: typography.fontSize['2xl'] }}>📷</div>
              <div>
                <h3 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, margin: 0 }}>Galería</h3>
                <p style={{ fontSize: typography.fontSize.sm, opacity: 0.8, margin: 0 }}>{teacherPhotos.length} elemento{teacherPhotos.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {/* Carousel */}
            <div style={{ position: 'relative', maxWidth: 1000, margin: '0 auto' }}>
              {/* Main image */}
              <div style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)' }}>
                <ImageWithFallback src={teacherPhotos[0]} alt="Foto 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {/* Thumbnails */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {teacherPhotos.map((p, i) => (
                  <div key={i} style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)' }}>
                    <img src={p} alt={`Miniatura ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
        {teacher?.bio && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}>
            <h3 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[4], fontWeight: typography.fontWeight.bold }}>💬 Sobre mí</h3>
            <p style={{ lineHeight: typography.lineHeight.relaxed, opacity: 0.9, fontSize: typography.fontSize.lg }}>{teacher.bio}</p>
          </motion.section>
        )}
        <div>
          <SocialMediaSection
            respuestas={{ redes: teacher?.redes_sociales || {} }}
            redes_sociales={teacher?.redes_sociales}
            title="Redes Sociales"
            availablePlatforms={['instagram','tiktok','youtube','facebook','whatsapp']}
            style={{ marginBottom: spacing[8], padding: spacing[8], background: 'rgba(255,255,255,0.06)', borderRadius: borderRadius['2xl'], border: '1px solid rgba(255,255,255,0.14)' }}
          />
        </div>

        {/* FAQ estilo Organizer */}
        {Array.isArray(teacher?.faq) && teacher.faq.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], marginBottom: spacing[6] }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg,#FB8C00,#FF7043)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: typography.fontSize['2xl'] }}>❓</div>
              <div>
                <h3 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, margin: 0 }}>Información para Estudiantes</h3>
                <p style={{ fontSize: typography.fontSize.sm, opacity: 0.8, margin: 0 }}>Preguntas frecuentes</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
              {teacher.faq.map((faq: any, index: number) => (
                <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} style={{ padding: spacing[4], background: 'rgba(255,255,255,0.06)', borderRadius: borderRadius.xl, border: '1px solid rgba(255,255,255,0.12)' }}>
                  <h4 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, margin: 0, marginBottom: spacing[2] }}>{faq.q}</h4>
                  <p style={{ fontSize: typography.fontSize.base, opacity: 0.85, margin: 0, lineHeight: typography.lineHeight.relaxed }}>{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
        {Array.isArray(teacher?.media) && teacher.media.length > 0 && (
          <motion.section id="user-profile-photo-gallery" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], marginBottom: spacing[6] }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: typography.fontSize['2xl'] }}>📷</div>
              <div>
                <h3 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, margin: 0 }}>Galería</h3>
                <p style={{ fontSize: typography.fontSize.sm, opacity: 0.8, margin: 0 }}>{teacher.media.length} elemento{teacher.media.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing[4] }}>
              {teacher.media.map((item: any, index: number) => (
                <div key={index} style={{ borderRadius: borderRadius.xl, overflow: 'hidden', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  {item.type === 'image' ? (
                    <img src={item.url} alt={`Imagen ${index + 1}`} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                  ) : (
                    <video src={item.url} controls style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Clases & Tarifas (visual) */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}>
          <ClasesLive
            cronograma={(teacher as any)?.cronograma || []}
            costos={(teacher as any)?.costos || []}
            ubicacion={{
              nombre: (teacher as any)?.ubicaciones?.[0]?.nombre,
              direccion: (teacher as any)?.ubicaciones?.[0]?.direccion,
              ciudad: (teacher as any)?.ubicaciones?.[0]?.ciudad,
              referencias: (teacher as any)?.ubicaciones?.[0]?.referencias
            }}
          />
        </motion.section>
      </div>
    </div>
  );
}


