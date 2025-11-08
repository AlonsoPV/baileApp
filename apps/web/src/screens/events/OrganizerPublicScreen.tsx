import React from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { useTags } from "../../hooks/useTags";
import { supabase } from '@/lib/supabase';
import NotFound from '@/screens/system/NotFound';
import ImageWithFallback from "../../components/ImageWithFallback";
import RitmosChips from "../../components/RitmosChips";
import { Chip } from '../../components/profile/Chip';
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import { normalizeRitmosToSlugs } from "../../utils/normalizeRitmos";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
import InvitedMastersSection from "../../components/profile/InvitedMastersSection";
import AddToCalendarWithStats from "../../components/AddToCalendarWithStats";
import RequireLogin from "@/components/auth/RequireLogin";
import { useEventParentsByOrganizer, useEventDatesByOrganizer } from "../../hooks/useEventParentsByOrganizer";
import { fmtDate, fmtTime } from "../../utils/format";
import { colors, typography, spacing, borderRadius, transitions } from "../../theme/colors";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import { BioSection } from "../../components/profile/BioSection";

const isUUID = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

// FAQ Accordion (mismo diseño)
const FAQAccordion: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ borderRadius: borderRadius.xl, border: `1px solid ${colors.glass.medium}`, overflow: 'hidden', transition: transitions.normal }}>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', padding: spacing[5], background: 'transparent', border: 'none', color: colors.gray[50], cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, textAlign: 'left', transition: transitions.normal }}>
        <span>{question}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.primary[500] }}>▼</motion.span>
      </motion.button>
      <motion.div initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ overflow: 'hidden' }}>
        <div style={{ padding: `0 ${spacing[5]} ${spacing[5]} ${spacing[5]}`, borderTop: `1px solid ${colors.glass.medium}`, background: colors.glass.light }}>
          <p style={{ lineHeight: typography.lineHeight.relaxed, opacity: 0.9, fontSize: typography.fontSize.base, margin: 0, color: colors.gray[100] }}>{answer}</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Carrusel de fotos (mismo diseño)
const CarouselComponent: React.FC<{ photos: string[] }> = ({ photos }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  if (!photos?.length) return null;
  const nextPhoto = () => setCurrentIndex((p) => (p + 1) % photos.length);
  const prevPhoto = () => setCurrentIndex((p) => (p - 1 + photos.length) % photos.length);
  const goToPhoto = (i: number) => setCurrentIndex(i);
  return (
    <div style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: borderRadius['2xl'], overflow: 'hidden', border: `2px solid ${colors.glass.medium}`, background: colors.dark[400], boxShadow: colors.shadows.glass }}>
        <motion.div key={currentIndex} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <ImageWithFallback src={photos[currentIndex]} alt={`Foto ${currentIndex + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => setIsFullscreen(true)} />
        </motion.div>
        <div style={{ position: 'absolute', top: spacing[4], right: spacing[4], background: colors.glass.darker, color: colors.gray[50], padding: `${spacing[2]} ${spacing[4]}`, borderRadius: borderRadius.full, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, backdropFilter: 'blur(10px)' }}>{currentIndex + 1} / {photos.length}</div>
        {photos.length > 1 && (
          <>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={prevPhoto} style={{ position: 'absolute', left: spacing[4], top: '50%', transform: 'translateY(-50%)', background: colors.glass.darker, color: colors.light, border: 'none', borderRadius: borderRadius.full, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: typography.fontSize.xl, transition: transitions.normal, backdropFilter: 'blur(10px)' }}>‹</motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={nextPhoto} style={{ position: 'absolute', right: spacing[4], top: '50%', transform: 'translateY(-50%)', background: colors.glass.darker, color: colors.light, border: 'none', borderRadius: borderRadius.full, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: typography.fontSize.xl, transition: transitions.normal, backdropFilter: 'blur(10px)' }}>›</motion.button>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div style={{ display: 'flex', gap: spacing[2], marginTop: spacing[4], justifyContent: 'center', flexWrap: 'wrap' }}>
          {photos.map((photo, index) => (
            <motion.button key={index} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => goToPhoto(index)} style={{ width: 60, height: 60, borderRadius: borderRadius.lg, overflow: 'hidden', border: currentIndex === index ? `3px solid ${colors.primary[500]}` : `2px solid ${colors.glass.medium}`, cursor: 'pointer', background: 'transparent', padding: 0, transition: transitions.normal }}>
              <ImageWithFallback src={photo} alt={`Miniatura ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </motion.button>
          ))}
        </div>
      )}
      {isFullscreen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: colors.glass.darker, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: spacing[8] }} onClick={() => setIsFullscreen(false)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', borderRadius: borderRadius['2xl'], overflow: 'hidden' }}>
            <ImageWithFallback src={photos[currentIndex]} alt={`Foto ${currentIndex + 1} - Pantalla completa`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsFullscreen(false)} style={{ position: 'absolute', top: spacing[4], right: spacing[4], background: colors.glass.darker, color: colors.light, border: 'none', borderRadius: borderRadius.full, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, backdropFilter: 'blur(10px)' }}>×</motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export function OrganizerPublicScreen() {
  const { id, organizerId } = useParams<{ id?: string; organizerId?: string }>();
  const routeId = id || organizerId || '';
  const navigate = useNavigate();
  const { ritmos: allRitmos = [], zonas: allZonas = [] } = useTags();
  const [copied, setCopied] = React.useState(false);

  const { data: org, isLoading, isError } = useQuery({
    queryKey: ['org-public', routeId],
    enabled: !!routeId,
    queryFn: async () => {
      if (!routeId) return null;
      // Intentar como ID numérico primero
      const numId = parseInt(routeId, 10);
      if (!isNaN(numId)) {
        const { data, error } = await supabase.from('v_organizers_public').select('*').eq('id', numId).maybeSingle();
        if (error) throw error;
        if (data) return data;
      }
      // Intentar como UUID
      if (isUUID(routeId)) {
        const { data, error } = await supabase.from('v_organizers_public').select('*').eq('user_id', routeId).maybeSingle();
        if (error) throw error;
        if (data) return data;
      }
      // Intentar como slug
      const { data, error } = await supabase.from('v_organizers_public').select('*').eq('slug', routeId).maybeSingle();
      if (error) throw error;
      return data ?? null;
    }
  });

  const { data: parents = [] } = useEventParentsByOrganizer((org as any)?.id);
  const { data: eventDates = [] } = useEventDatesByOrganizer((org as any)?.id);

  const media = (org as any)?.media || [];
  const carouselPhotos = PHOTO_SLOTS.map(slot => getMediaBySlot(media as any, slot)?.url).filter(Boolean) as string[];
  const videos = VIDEO_SLOTS.map(slot => getMediaBySlot(media as any, slot)?.url).filter(Boolean) as string[];

  const getRitmoNombres = () => {
    const names: string[] = [];
    if (Array.isArray((org as any)?.ritmos_seleccionados) && (org as any).ritmos_seleccionados.length > 0) {
      const labelById = new Map<string, string>();
      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelById.set(i.id, i.label)));
      names.push(...((org as any).ritmos_seleccionados as string[]).map(id => labelById.get(id)).filter(Boolean) as string[]);
    }
    if (names.length === 0) {
      const r = (org as any)?.ritmos || (org as any)?.estilos || [];
      if (Array.isArray(r) && r.length > 0) {
        names.push(...r.map((tid: number) => allRitmos.find(t => t.id === tid)?.nombre).filter(Boolean) as string[]);
      }
    }
    return names;
  };

  const getZonaNombres = () => {
    if (!(org as any)?.zonas) return [];
    return ((org as any).zonas as number[]).map(id => allZonas.find(t => t.id === id)?.nombre).filter(Boolean) as string[];
  };

  // Construir items de Fechas para slider
  const inviteItems = (() => {
    const items: any[] = [];
    (eventDates as any[])?.forEach((date) => {
      const nombre = (date as any).nombre || `Fecha ${fmtDate(date.fecha)}`;
      const horaFormateada = date.hora_inicio && date.hora_fin ? `${date.hora_inicio} - ${date.hora_fin}` : (date.hora_inicio || '');
      items.push({
        id: date.id,
        nombre,
        date: fmtDate(date.fecha),
        time: horaFormateada,
        place: date.lugar || date.ciudad || '',
        href: `/social/fecha/${date.id}`,
        cover: Array.isArray(date.media) && date.media.length > 0 ? (date.media[0] as any)?.url || date.media[0] : undefined,
        flyer: (date as any).flyer_url || (Array.isArray(date.media) && date.media.length > 0 ? (date.media[0] as any)?.url || date.media[0] : undefined),
        price: (() => {
          const costos = (date as any)?.costos;
          if (Array.isArray(costos) && costos.length) {
            const nums = costos.map((c: any) => (typeof c?.precio === 'number' ? c.precio : null)).filter((n: any) => n !== null);
            if (nums.length) { const min = Math.min(...(nums as number[])); return min >= 0 ? `$${min.toLocaleString()}` : undefined; }
          }
          return undefined;
        })(),
        fecha: date.fecha,
        hora_inicio: date.hora_inicio,
        hora_fin: date.hora_fin,
        lugar: date.lugar || date.ciudad || date.direccion,
        biografia: (date as any).biografia
      });
    });
    return items;
  })();

  // Slider de flyer vertical (mismo diseño)
  const DateFlyerSlider: React.FC<{ items: any[]; onOpen: (href: string) => void }> = ({ items, onOpen }) => {
    const [idx, setIdx] = React.useState(0);
    if (!items?.length) return null;
    const ev = items[idx % items.length];
    const calendarStart = (() => {
      try {
        if (!ev.fecha) return new Date();
        const fechaStr = ev.fecha.includes('T') ? ev.fecha.split('T')[0] : ev.fecha;
        const hora = (ev.hora_inicio || '20:00').split(':').slice(0, 2).join(':');
        const parsed = new Date(`${fechaStr}T${hora}:00`);
        return isNaN(parsed.getTime()) ? new Date() : parsed;
      } catch { return new Date(); }
    })();
    const calendarEnd = (() => {
      try {
        if (!ev.fecha) { const d = new Date(calendarStart); d.setHours(d.getHours() + 2); return d; }
        const fechaStr = ev.fecha.includes('T') ? ev.fecha.split('T')[0] : ev.fecha;
        const hora = (ev.hora_fin || ev.hora_inicio || '23:59').split(':').slice(0, 2).join(':');
        const parsed = new Date(`${fechaStr}T${hora}:00`);
        if (isNaN(parsed.getTime())) { const d = new Date(calendarStart); d.setHours(d.getHours() + 2); return d; }
        return parsed;
      } catch { const d = new Date(calendarStart); d.setHours(d.getHours() + 2); return d; }
    })();
    return (
      <div style={{ display: 'grid', placeItems: 'center', gap: spacing[3] }}>
        <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="glass-card" onClick={() => onOpen(ev.href)} style={{ position: 'relative', borderRadius: borderRadius.xl, cursor: 'pointer', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
          <div style={{ width: 350, maxWidth: '80vw' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: 'rgba(0,0,0,0.3)' }}>
              {ev.flyer && (
                <img src={ev.flyer} alt={ev.nombre} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
              )}
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing[4], background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.0) 100%)', color: '#fff' }}>
                <div style={{ 
                  fontSize: typography.fontSize.lg, 
                  fontWeight: 700, 
                  marginBottom: spacing[2], 
                  textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6), -1px -1px 0 rgba(0,0,0,0.8), 1px -1px 0 rgba(0,0,0,0.8), -1px 1px 0 rgba(0,0,0,0.8), 1px 1px 0 rgba(0,0,0,0.8)',
                  color: '#FFFFFF',
                  letterSpacing: '0.02em'
                }}>{ev.nombre}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], fontSize: typography.fontSize.sm, marginBottom: spacing[2] }}>
                  {ev.date && <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background: 'rgb(25 25 25 / 89%)', padding: '8px 8px', borderRadius: 999 }}>📅 {ev.date}</span>}
                  {ev.time && <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background: 'rgb(25 25 25 / 89%)', padding: '8px 8px', borderRadius: 999 }}>🕒 {ev.time}</span>}
                  {ev.place && <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background:'rgb(25 25 25 / 89%)', padding: '8px 8px', borderRadius: 999 }}>📍 {ev.place}</span>}
                  {ev.price && <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background:'rgb(25 25 25 / 89%)', padding: '8px 8px', borderRadius: 999 }}>💰 {ev.price}</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: spacing[2], position: 'relative', zIndex: 5, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                  <RequireLogin>
                    <AddToCalendarWithStats
                      eventId={ev.id}
                      title={ev.nombre}
                      description={ev.biografia}
                      location={ev.lugar}
                      start={calendarStart}
                      end={calendarEnd}
                      showAsIcon={true}
                    />
                  </RequireLogin>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        {items.length > 1 && (
          <div style={{ width: 350, maxWidth: '80vw', display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" onClick={() => setIdx((p) => (p - 1 + items.length) % items.length)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer' }}>‹ Anterior</button>
            <button type="button" onClick={() => setIdx((p) => (p + 1) % items.length)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer' }}>Siguiente ›</button>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={{ padding: spacing[12], textAlign: 'center', color: colors.gray[50], background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>⏳</div>
        <p style={{ fontSize: typography.fontSize.lg }}>Cargando organizador...</p>
      </div>
    );
  }
  if (isError || !org) {
    return <NotFound />;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: ${typography.fontFamily.primary}; }
        .org-container { width: 100%; max-width: 900px; margin: 0 auto; }
        .org-banner { width: 100%; max-width: 900px; margin: 0 auto; position: relative; overflow: hidden; }
        .org-banner-grid { display: grid; grid-template-columns: auto 1fr; gap: 3rem; align-items: center; }
        .glass-card { background: ${colors.glass.light}; backdrop-filter: blur(20px); border: 1px solid ${colors.glass.medium}; box-shadow: ${colors.shadows.glass}; }
        .gradient-text { background: ${colors.gradients.primary}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .shimmer-effect { background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .glass-card-container { opacity: 1; margin: 0 auto 2rem auto; padding: 2rem; text-align: center; background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%); border-radius: 20px; border: 1px solid rgba(255,255,255,0.15); box-shadow: rgba(0,0,0,0.3) 0px 8px 32px; backdrop-filter: blur(10px); transform: none; }
        .section-title { font-size: 1.5rem; font-weight: 800; margin: 0 0 1rem 0; background: linear-gradient(135deg, #E53935 0%, #FB8C00 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: flex; align-items: center; gap: .5rem; }
        @media (max-width: 768px) { .org-root { padding-top: 64px; } }
        @media (max-width: 768px) {
          .org-container { max-width: 100% !important; padding: 1rem !important; }
          .org-banner { border-radius: 0 !important; padding: 2rem 1rem !important; margin: 0 auto !important; }
          .org-banner-grid { grid-template-columns: 1fr !important; gap: 2rem !important; justify-items: center !important; text-align: center !important; }
          .org-banner-avatar { width: 220px !important; height: 220px !important; }
          .org-banner-avatar-fallback { font-size: 5rem !important; }
          .org-banner h1 { font-size: 3rem !important; line-height: 1.2 !important; }
          .org-banner .org-chips { justify-content: center !important; margin-bottom: 1rem !important; }
          .glass-card { margin-bottom: 1.5rem !important; padding: 1.5rem !important; }
          .glass-card h3 { font-size: 1.5rem !important; }
          .glass-card p { font-size: 1rem !important; }
          .glass-card-container { padding: 1rem !important; margin-bottom: 1rem !important; border-radius: 16px !important; }
        }
        @media (max-width: 480px) {
          .org-banner { padding: 1.5rem 1rem !important; }
          .org-banner-avatar { width: 180px !important; height: 180px !important; }
          .org-banner-avatar-fallback { font-size: 4.2rem !important; }
          .org-banner h1 { font-size: 2.6rem !important; }
          .glass-card { padding: 1rem !important; margin-bottom: 1rem !important; }
          .glass-card h3 { font-size: 1.25rem !important; }
          .glass-card-container { padding: 0.75rem !important; border-radius: 12px !important; }
        }
      `}</style>

      <div className="org-root" style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`, color: colors.gray[50], width: '100%', position: 'relative' }}>
        {/* Elementos flotantes */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 100, height: 100, background: colors.gradients.primary, borderRadius: '50%', opacity: 0.1, animation: 'float 8s ease-in-out infinite', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: 60, height: 60, background: colors.gradients.secondary, borderRadius: '50%', opacity: 0.15, animation: 'float 6s ease-in-out infinite reverse', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '15%', width: 80, height: 80, background: colors.gradients.deep, borderRadius: '50%', opacity: 0.1, animation: 'float 7s ease-in-out infinite', zIndex: 0 }} />

        {/* Banner */}
        <motion.div className="org-banner glass-card-container" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} style={{ position: 'relative', overflow: 'hidden', margin: `0 auto`, maxWidth: '900px', width: '100%', zIndex: 1 }}>
          <button
            aria-label="Compartir perfil"
            title="Compartir"
            onClick={async () => {
              try {
                const url = typeof window !== 'undefined' ? window.location.href : '';
                const title = (org as any)?.nombre_publico || 'Organizador';
                const text = `Mira el perfil de ${title}`;
                const navAny = (navigator as any);
                
                // Intentar Web Share API (móvil)
                if (navAny && typeof navAny.share === 'function') {
                  try {
                    await navAny.share({ title, text, url });
                  } catch (shareError: any) {
                    if (shareError.name === 'AbortError') return;
                    throw shareError;
                  }
                } else {
                  // Fallback: Clipboard API (escritorio)
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } else {
                    // Fallback antiguo
                    const textArea = document.createElement('textarea');
                    textArea.value = url;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }
                }
              } catch (error) {
                console.error('Error al compartir:', error);
                alert('No se pudo copiar el enlace.');
              }
            }}
            style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: 999, backdropFilter: 'blur(8px)', cursor: 'pointer', zIndex: 10 }}
          >📤</button>
          {copied && <div role="status" aria-live="polite" style={{ position: 'absolute', top: 14, right: 56, padding: '4px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontSize: 12, fontWeight: 700, zIndex: 10 }}>Copiado</div>}
          <div className="org-banner-grid">
            {/* Avatar */}
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.6 }} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 10 }}>
              <div id="organizer-avatar" data-test-id="organizer-avatar" className="org-banner-avatar" style={{ width: 250, height: 250, borderRadius: '50%', overflow: 'hidden', border: `4px solid ${colors.glass.strong}`, boxShadow: `${colors.shadows.glow}, 0 20px 40px rgba(0,0,0,0.3)`, background: colors.gradients.primary, position: 'relative' }}>
                {getMediaBySlot(media as any, 'cover')?.url || getMediaBySlot(media as any, 'p1')?.url ? (
                  <img src={getMediaBySlot(media as any, 'cover')?.url || getMediaBySlot(media as any, 'p1')?.url || ''} alt="Logo del organizador" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="org-banner-avatar-fallback" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6rem', fontWeight: typography.fontWeight.black, color: colors.light }}>
                    {(org as any)?.nombre_publico?.[0]?.toUpperCase() || '🎤'}
                  </div>
                )}
                <div className="shimmer-effect" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '50%' }} />
              </div>
              {/* Estado */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <motion.span whileHover={{ scale: 1.05 }} style={{ padding: `${spacing[2]} ${spacing[4]}`, borderRadius: borderRadius.full, background: (org as any)?.estado_aprobacion === 'aprobado' ? `linear-gradient(135deg, ${colors.success}cc, ${colors.success}99)` : colors.gradients.secondary, border: `2px solid ${(org as any)?.estado_aprobacion === 'aprobado' ? colors.success : colors.secondary[500]}`, color: colors.light, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, backdropFilter: 'blur(10px)', boxShadow: (org as any)?.estado_aprobacion === 'aprobado' ? `0 4px 16px ${colors.success}66` : `0 4px 16px ${colors.secondary[500]}66`, display: 'inline-flex', alignItems: 'center', gap: spacing[1], textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {(org as any)?.estado_aprobacion === 'aprobado' ? '✅ Verificado' : `⏳ ${(org as any)?.estado_aprobacion}`}
                </motion.span>
              </div>
            </motion.div>

            {/* Nombre + Chips */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.6 }} style={{ display: 'flex', flexDirection: 'column', gap: spacing[6], justifyContent: 'center' }}>
              <h1 id="organizer-name" data-test-id="organizer-name" className="gradient-text" style={{ fontSize: typography.fontSize['5xl'], fontWeight: typography.fontWeight.black, margin: 0, lineHeight: typography.lineHeight.tight, textShadow: `0 4px 20px ${colors.primary[500]}40` }}>
                {(org as any)?.nombre_publico}
              </h1>
              <div id="organizer-chips" data-test-id="organizer-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[2] }}>
                {(() => {
                  const slugs = normalizeRitmosToSlugs(org, allRitmos);
                  return slugs.length > 0 ? (
                    <RitmosChips selected={slugs} onChange={() => {}} readOnly />
                  ) : null;
                })()}
                {getZonaNombres().map((nombre) => (
                  <Chip key={`z-${nombre}`} label={nombre} icon="📍" variant="zona" />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Contenido Principal */}
        <div className="org-container" style={{ padding: spacing[8], position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          {/* Biografía y Redes Sociales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <BioSection 
              bio={(org as any)?.bio}
              redes={(org as any)?.redes_sociales || (org as any)?.respuestas?.redes}
            />
          </motion.div>

          {/* Maestros Invitados */}
          <div id="organizer-invited-masters" data-test-id="organizer-invited-masters">
            <InvitedMastersSection masters={[]} title="🎭 Maestros Invitados" showTitle={true} isEditable={false} />
          </div>

          {/* Próximas Fechas */}
          {inviteItems.length > 0 && (
            <motion.section id="organizer-upcoming-dates" data-test-id="organizer-upcoming-dates" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], marginBottom: spacing[6] }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: colors.gradients.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: typography.fontSize['2xl'], boxShadow: colors.shadows.glow }}>📅</div>
                <div>
                  <h3 className="section-title">Próximas Fechas</h3>
                  <p style={{ fontSize: typography.fontSize.sm, opacity: 0.8, margin: 0, color: colors.light }}>{inviteItems.length} fecha{inviteItems.length !== 1 ? 's' : ''} programada{inviteItems.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <DateFlyerSlider items={inviteItems} onOpen={(href: string) => navigate(href)} />
            </motion.section>
          )}

          {/* Sociales del Organizador */}
          {parents && parents.length > 0 && (
            <motion.section id="organizer-social-events" data-test-id="organizer-social-events" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], marginBottom: spacing[6] }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: colors.gradients.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: typography.fontSize['2xl'], boxShadow: `0 8px 24px ${colors.secondary[500]}40` }}>🎭</div>
                <div>
                  <h3 className="section-title">Sociales que organizamos</h3>
                  <p style={{ fontSize: typography.fontSize.sm, opacity: 0.8, margin: 0, color: colors.light }}>{parents.length} social{parents.length !== 1 ? 'es' : ''} organizado{parents.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
                {parents.map((parent: any) => (
                  <motion.div
                    key={parent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{
                      y: -4,
                      borderColor: 'rgba(255, 61, 87, 0.4)'
                    }}
                    style={{
                      padding: 'clamp(1.5rem, 2.5vw, 2.5rem)',
                      borderRadius: 'clamp(16px, 2.5vw, 28px)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      background: 'rgba(30, 30, 30, 0.6)',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.5rem'
                    }}
                  >
                    {/* Barra decorativa superior */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '6px',
                      background: `linear-gradient(90deg, ${colors.coral}, ${colors.orange}, ${colors.yellow})`,
                      borderRadius: '24px 24px 0 0',
                    }} />

                    {/* FILA 1: Información del Social */}
                    <div style={{ 
                      position: 'relative', 
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1.5rem',
                      paddingTop: '0.5rem'
                    }}>
                      {/* Icono */}
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2.5rem',
                          background: `linear-gradient(135deg, rgba(255, 61, 87, 0.2), rgba(255, 140, 66, 0.2))`,
                          border: '3px solid rgba(255, 61, 87, 0.4)',
                          boxShadow: '0 6px 20px rgba(255, 61, 87, 0.4)',
                          filter: 'drop-shadow(0 4px 8px rgba(255, 61, 87, 0.4))',
                          flexShrink: 0
                        }}
                      >
                        🎭
                      </motion.div>
                      
                      {/* Contenido principal */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Nombre del social */}
                        <h4 style={{
                          fontSize: 'clamp(1.5rem, 2vw, 2rem)',
                          fontWeight: '800',
                          margin: 0,
                          marginBottom: '0.75rem',
                          background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          letterSpacing: '-0.02em',
                          lineHeight: 1.2
                        }}>
                          {parent.nombre}
                        </h4>
                        
                        {/* Descripción */}
                        {parent.descripcion && (
                          <p style={{
                            fontSize: '1rem',
                            opacity: 0.9,
                            margin: 0,
                            fontWeight: '400',
                            lineHeight: 1.6,
                            color: "rgba(255, 255, 255, 0.9)"
                          }}>
                            {parent.descripcion.length > 200 ? `${parent.descripcion.substring(0, 200)}...` : parent.descripcion}
                          </p>
                        )}
                      </div>
                      
                      {/* Botón de ver detalles */}
                      <div style={{ flexShrink: 0 }}>
                        <motion.button
                          whileHover={{ scale: 1.08, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate(`/social/${parent.id}`)}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: `linear-gradient(135deg, ${colors.blue}, #00BCD4)`,
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 16px rgba(30, 136, 229, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span>📅</span>
                          <span>Ver Fechas</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Galería de Fotos */}
          {carouselPhotos.length > 0 && (
            <motion.section id="organizer-profile-photo-gallery" data-test-id="organizer-profile-photo-gallery" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], marginBottom: spacing[6] }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: colors.gradients.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: typography.fontSize['2xl'], boxShadow: colors.shadows.glow }}>📷</div>
                <div>
                  <h3 className="section-title">📷 Galería de Fotos</h3>
                  <p style={{ fontSize: typography.fontSize.sm, opacity: 0.8, margin: 0, color: colors.light }}>{carouselPhotos.length} foto{carouselPhotos.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <CarouselComponent photos={carouselPhotos} />
            </motion.section>
          )}

          {/* Videos */}
          {videos.length > 0 && (
            <motion.section id="organizer-profile-video-gallery" data-test-id="organizer-profile-video-gallery" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], marginBottom: spacing[6] }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: colors.gradients.deep, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: typography.fontSize['2xl'], boxShadow: `0 8px 24px ${colors.deep[500]}40` }}>🎥</div>
                <div>
                  <h3 className="section-title">🎥 Videos del Organizador</h3>
                  <p style={{ fontSize: typography.fontSize.sm, opacity: 0.8, margin: 0, color: colors.light }}>{videos.length} video{videos.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: spacing[6] }}>
                {videos.map((video, index) => (
                  <motion.div key={index} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.05, y: -8, boxShadow: colors.shadows.lg }} style={{ width: '100%', height: 'auto', aspectRatio: '16/9', borderRadius: borderRadius.xl, overflow: 'hidden', border: `2px solid ${colors.glass.medium}`, cursor: 'pointer', transition: transitions.normal, position: 'relative', background: colors.dark[400], boxShadow: colors.shadows.md }}>
                    <video src={video} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: spacing[4], right: spacing[4], background: colors.glass.darker, color: colors.light, padding: `${spacing[2]} ${spacing[4]}`, borderRadius: borderRadius.lg, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, boxShadow: colors.shadows.md, backdropFilter: 'blur(10px)' }}>🎥 Video {index + 1}</div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* FAQ */}
          {((org as any)?.respuestas?.musica_tocaran || (org as any)?.respuestas?.hay_estacionamiento) && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], marginBottom: spacing[6] }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: colors.gradients.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: typography.fontSize['2xl'], boxShadow: `0 8px 24px ${colors.secondary[500]}40` }}>❓</div>
                <div>
                  <h3 className="section-title">❓ Información para Asistentes</h3>
                  <p style={{ fontSize: typography.fontSize.sm, opacity: 0.8, margin: 0, color: colors.light }}>Preguntas frecuentes</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                {(org as any)?.respuestas?.musica_tocaran && (<FAQAccordion question="🎵 ¿Qué música tocarán?" answer={(org as any).respuestas.musica_tocaran} />)}
                {(org as any)?.respuestas?.hay_estacionamiento && (<FAQAccordion question="🅿️ ¿Hay estacionamiento?" answer={(org as any).respuestas.hay_estacionamiento} />)}
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </>
  );
}