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
          </div>
        </ProfileShell>
      </div>
    </div>
  );
}


