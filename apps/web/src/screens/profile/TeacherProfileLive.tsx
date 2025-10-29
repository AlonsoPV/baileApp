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
import { ProfileShell } from './_shared';
import { mapTeacherToVM } from './_shared/profileViewModels';
import TeacherHeader from './teacher/components/ProfileHeader';
import TeacherHero from './teacher/components/ProfileHero';
import TeacherInfoGrid from './teacher/components/ProfileInfoGrid';
import TeacherClassesList from './teacher/components/ProfileClassesList';
import TeacherGallery from './teacher/components/ProfileGallery';
import UbicacionesLive from '../../components/locations/UbicacionesLive';

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

  const vm = mapTeacherToVM(teacher, teacher?.cronograma || [], teacher?.media || []);
  const ritmoNombres = getRitmoNombres(vm.ritmos || []);
  const zonaNombres = getZonaNombres(vm.ubicacion?.zonaIds || []);
  const teacherPhotos: string[] = Array.isArray(vm.media)
    ? (vm.media as any[]).filter((m: any) => m?.type === 'image').map((m: any) => m.url).filter(Boolean)
    : [];

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`, color: colors.gray[50] }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: spacing[6] }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: spacing[4] }}>
          <ProfileNavigationToggle
            currentView="live"
            profileType="teacher"
            liveHref={teacher?.id ? `/maestro/${teacher.id}` : "/profile/teacher/live"}
            editHref="/profile/teacher"
          />
        </div>

        <ProfileShell
          header={<TeacherHeader nombre={vm.nombre_publico} avatar={vm.avatar_url} tipo="teacher" redes={vm.redes} />}
          hero={<TeacherHero bannerUrl={vm.banner_url} chips={{ ritmos: ritmoNombres, zonas: zonaNombres }} bio={vm.bio} />}
        >
          <div style={{ display: 'grid', gap: spacing[6] }}>
            <TeacherInfoGrid ubicacion={vm.ubicacion?.texto} ritmos={ritmoNombres} />
            <TeacherClassesList items={vm.clases || []} ubicacionPreview={{ nombre: vm.ubicacion?.texto || undefined }} />
            <TeacherGallery items={vm.media || []} />
            <SocialMediaSection
              respuestas={{ redes: vm?.redes || {} }}
              redes_sociales={vm?.redes}
              title="Redes Sociales"
              availablePlatforms={['instagram','tiktok','youtube','facebook','whatsapp']}
              style={{ padding: spacing[6], background: 'rgba(255,255,255,0.06)', borderRadius: borderRadius['2xl'], border: '1px solid rgba(255,255,255,0.14)' }}
            />

            {/* Ubicaciones (igual que Academy) */}
            {Array.isArray((teacher as any)?.ubicaciones) && (teacher as any).ubicaciones.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                style={{
                  marginBottom: '2rem',
                  padding: '2rem',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <UbicacionesLive ubicaciones={(teacher as any).ubicaciones} />
              </motion.section>
            )}

            {/* Foto principal (slot p1) */}
            {getMediaBySlot((teacher as any)?.media || [], 'p1') && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{
                  marginBottom: '2rem',
                  padding: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <div style={{ width: '100%', maxWidth: 500, aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}>
                  <ImageWithFallback src={getMediaBySlot((teacher as any)?.media || [], 'p1')?.url || ''} alt="Foto principal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </motion.section>
            )}

            {/* Galería simple (igual criterio que Academy) */}
            {teacherPhotos.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                style={{
                  marginBottom: '2rem',
                  padding: '2rem',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>📷 Galería de Fotos</h3>
                  <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', borderRadius: 20, fontSize: '0.875rem', fontWeight: 600, color: colors.light }}>{teacherPhotos.length} fotos</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                  {teacherPhotos.map((url, i) => (
                    <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
                      <img src={url} alt={`media-${i}`} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Videos */}
            {VIDEO_SLOTS.map(s => getMediaBySlot((teacher as any)?.media || [], s)?.url).filter(Boolean).length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                style={{
                  marginBottom: '2rem',
                  padding: '2rem',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 1.5rem 0' }}>🎥 Videos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {VIDEO_SLOTS.map(s => getMediaBySlot((teacher as any)?.media || [], s)?.url).filter(Boolean).map((video: any, index: number) => (
                    <div key={index} style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.1)' }}>
                      <video src={String(video)} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </div>
        </ProfileShell>
      </div>
    </div>
  );
}


