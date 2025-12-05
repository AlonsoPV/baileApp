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
import ZonaGroupedChips from "../../components/profile/ZonaGroupedChips";
import { useEventParentsByOrganizer, useEventDatesByOrganizer } from "../../hooks/useEventParentsByOrganizer";
import { fmtDate, fmtTime } from "../../utils/format";
import { colors, typography, spacing, borderRadius, transitions } from "../../theme/colors";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import { BioSection } from "../../components/profile/BioSection";
import SeoHead from "@/components/SeoHead";
import { SEO_BASE_URL, SEO_LOGO_URL } from "@/lib/seoConfig";
import { calculateNextDateWithTime } from "../../utils/calculateRecurringDates";
import CompetitionGroupCard from "../../components/explore/cards/CompetitionGroupCard";

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
          <ImageWithFallback src={photos[currentIndex]} alt={`Foto ${currentIndex + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', cursor: 'pointer' }} onClick={() => setIsFullscreen(true)} />
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

  // Evitar loops infinitos de "Cargando organizador..." en WebView
  const [loadingTimedOut, setLoadingTimedOut] = React.useState(false);

  React.useEffect(() => {
    if (isLoading) {
      setLoadingTimedOut(false);
      const timeoutId = setTimeout(() => {
        setLoadingTimedOut(true);
      }, 15000); // 15s máximo
      return () => clearTimeout(timeoutId);
    }
    setLoadingTimedOut(false);
  }, [isLoading, routeId]);

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

  // Agregar agregación de ubicaciones desde los sociales (events_parent)
  const aggregatedLocations = (() => {
    try {
      const items = (parents || []).flatMap((p: any) => Array.isArray(p?.ubicaciones) ? p.ubicaciones : []);
      const key = (u: any) => `${(u?.nombre || '').trim()}|${(u?.direccion || '').trim()}`;
      const map = new Map<string, any>();
      items.forEach((u: any) => map.set(key(u), u));
      return Array.from(map.values());
    } catch {
      return [];
    }
  })();

  // Construir items de Fechas para slider
  const inviteItems = (() => {
    const items: any[] = [];
    
    // Obtener fecha y hora actual en CDMX
    const getTodayCDMX = () => {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(new Date());
    };

    const getNowCDMX = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(now);
      const y = Number(parts.find(p => p.type === 'year')?.value || '0');
      const m = Number(parts.find(p => p.type === 'month')?.value || '1');
      const d = Number(parts.find(p => p.type === 'day')?.value || '1');
      const h = Number(parts.find(p => p.type === 'hour')?.value || '0');
      const min = Number(parts.find(p => p.type === 'minute')?.value || '0');
      return new Date(Date.UTC(y, m - 1, d, h, min, 0));
    };

    const todayCDMX = getTodayCDMX();
    const nowCDMX = getNowCDMX();

    // Filtrar solo fechas futuras (incluyendo hoy si la hora no ha pasado)
    const parseLocalYmd = (value: string) => {
      const plain = String(value).split('T')[0];
      const [y, m, d] = plain.split('-').map((n) => parseInt(n, 10));
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
        const fallback = new Date(value);
        return Number.isNaN(fallback.getTime()) ? null : fallback;
      }
      return new Date(y, m - 1, d);
    };

    const futureDates = (eventDates as any[])?.filter((d: any) => {
      try {
        // Si tiene dia_semana, siempre mostrar (es recurrente)
        if (d.dia_semana !== null && d.dia_semana !== undefined && typeof d.dia_semana === 'number') {
          return true;
        }
        
        // Si no tiene dia_semana, filtrar por fecha específica
        const fechaStr = String(d.fecha).split('T')[0];
        const dateObj = parseLocalYmd(d.fecha);
        if (!dateObj) return false;
        
        // Si la fecha es hoy, verificar la hora
        if (fechaStr === todayCDMX) {
          const horaStr = d.hora_inicio as string | null | undefined;
          if (!horaStr) return true; // Si no hay hora, mostrar todo el día
          
          const [yy, mm, dd] = fechaStr.split('-').map((p: string) => parseInt(p, 10));
          if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return true;
          
          const [hhRaw, minRaw] = String(horaStr).split(':');
          const hh = parseInt(hhRaw ?? '0', 10);
          const min = parseInt(minRaw ?? '0', 10);
          
          const eventDateTime = new Date(Date.UTC(yy, mm - 1, dd, hh, min, 0));
          return eventDateTime.getTime() >= nowCDMX.getTime();
        }
        
        // Para fechas futuras, solo verificar que sea >= hoy
        dateObj.setHours(0, 0, 0, 0);
        const todayObj = parseLocalYmd(todayCDMX);
        if (!todayObj) return false;
        todayObj.setHours(0, 0, 0, 0);
        return dateObj >= todayObj;
      } catch {
        return false;
      }
    }) || [];

    futureDates.forEach((date) => {
      const nombre = (date as any).nombre || `Fecha ${fmtDate(date.fecha)}`;
      const horaFormateada = date.hora_inicio && date.hora_fin ? `${date.hora_inicio} - ${date.hora_fin}` : (date.hora_inicio || '');
      
      // Si tiene dia_semana, calcular la próxima fecha para mostrar
      let fechaParaMostrar = date.fecha;
      if ((date as any).dia_semana !== null && (date as any).dia_semana !== undefined && typeof (date as any).dia_semana === 'number') {
        try {
          const horaInicio = (date.hora_inicio || '20:00').split(':').slice(0, 2).join(':');
          const proximaFecha = calculateNextDateWithTime((date as any).dia_semana, horaInicio);
          const year = proximaFecha.getFullYear();
          const month = String(proximaFecha.getMonth() + 1).padStart(2, '0');
          const day = String(proximaFecha.getDate()).padStart(2, '0');
          fechaParaMostrar = `${year}-${month}-${day}`;
        } catch (e) {
          console.error('Error calculando próxima fecha:', e);
        }
      }
      
      items.push({
        id: date.id,
        nombre,
        date: fmtDate(fechaParaMostrar),
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
        biografia: (date as any).biografia,
        dia_semana: (date as any).dia_semana !== null && (date as any).dia_semana !== undefined ? (date as any).dia_semana : null
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
        // Si tiene dia_semana, calcular la próxima fecha basada en el día de la semana
        if (ev.dia_semana !== null && ev.dia_semana !== undefined && typeof ev.dia_semana === 'number') {
          const horaInicio = (ev.hora_inicio || '20:00').split(':').slice(0, 2).join(':');
          return calculateNextDateWithTime(ev.dia_semana, horaInicio);
        }
        // Si no tiene dia_semana, usar la fecha específica
        if (!ev.fecha) return new Date();
        const fechaStr = ev.fecha.includes('T') ? ev.fecha.split('T')[0] : ev.fecha;
        const hora = (ev.hora_inicio || '20:00').split(':').slice(0, 2).join(':');
        const parsed = new Date(`${fechaStr}T${hora}:00`);
        return isNaN(parsed.getTime()) ? new Date() : parsed;
      } catch { return new Date(); }
    })();
    const calendarEnd = (() => {
      try {
        // Si tiene dia_semana, calcular la próxima fecha basada en el día de la semana
        if (ev.dia_semana !== null && ev.dia_semana !== undefined && typeof ev.dia_semana === 'number') {
          const horaFin = (ev.hora_fin || ev.hora_inicio || '23:00').split(':').slice(0, 2).join(':');
          const startDate = calculateNextDateWithTime(ev.dia_semana, (ev.hora_inicio || '20:00').split(':').slice(0, 2).join(':'));
          const [hora, minutos] = horaFin.split(':').map(Number);
          const endDate = new Date(startDate);
          endDate.setHours(hora || 23, minutos || 0, 0, 0);
          return endDate;
        }
        // Si no tiene dia_semana, usar la fecha específica
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
                      diaSemana={ev.dia_semana !== null && ev.dia_semana !== undefined ? ev.dia_semana : undefined}
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

  if (isLoading && !loadingTimedOut) {
    return (
      <div style={{ padding: spacing[12], textAlign: 'center', color: colors.gray[50], background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>⏳</div>
        <p style={{ fontSize: typography.fontSize.lg }}>Cargando organizador...</p>
      </div>
    );
  }
  if (isLoading && loadingTimedOut) {
    return (
      <div style={{ padding: spacing[12], textAlign: 'center', color: colors.gray[50], background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 360 }}>
          <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>⚠️</div>
          <p style={{ fontSize: typography.fontSize.lg, marginBottom: spacing[2] }}>No se pudo cargar el organizador.</p>
          <p style={{ fontSize: typography.fontSize.sm, opacity: 0.75, marginBottom: spacing[4] }}>
            Revisa tu conexión a internet e inténtalo de nuevo.
          </p>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            style={{
              padding: '10px 20px',
              borderRadius: 999,
              border: 'none',
              background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.secondary[500]})`,
              color: colors.light,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.bold,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
  if (isError || !org) {
    return <NotFound />;
  }

  const organizerName =
    (org as any)?.nombre_publico ||
    (org as any)?.nombre ||
    (org as any)?.display_name ||
    'Organizador de baile';
  const organizerCity =
    (org as any)?.ciudad ||
    (org as any)?.zonas_nombres?.[0] ||
    (org as any)?.zonas?.[0] ||
    'México';
  const organizerRitmos = getRitmoNombres().slice(0, 3).join(', ');
  const organizerDescription =
    (org as any)?.bio ||
    `Conoce a ${organizerName}, organizador de sociales y eventos de baile en ${organizerCity} con ritmos como ${organizerRitmos || 'salsa y bachata'}.`;
  const organizerImage =
    getMediaBySlot(media as any, 'p1')?.url ||
    getMediaBySlot(media as any, 'cover')?.url ||
    carouselPhotos[0] ||
    SEO_LOGO_URL;
  const organizerUrl = `${SEO_BASE_URL}/organizer/${routeId}`;

  return (
    <>
      <SeoHead
        section="organizer"
        title={`${organizerName} | Organizador en Dónde Bailar`}
        description={organizerDescription}
        image={organizerImage}
        url={organizerUrl}
        keywords={[
          organizerName,
          'organizador de baile',
          organizerCity,
          organizerRitmos,
          'eventos de baile',
        ].filter(Boolean) as string[]}
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: ${typography.fontFamily.primary}; }
        .org-container { width: 100%; max-width: 900px; margin: 0 auto; }
        .org-banner { width: 100%; max-width: 900px; margin: auto !important; position: relative; overflow: hidden; }
        .org-banner-grid { display: grid; grid-template-columns: auto 1fr; gap: 3rem; align-items: center; }
        .glass-card { background: ${colors.glass.light}; backdrop-filter: blur(20px); border: 1px solid ${colors.glass.medium}; box-shadow: ${colors.shadows.glass}; }
        .gradient-text { background: ${colors.gradients.primary}; -webkit-background-clip: text; background-clip: text; }
        .shimmer-effect { background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .glass-card-container { opacity: 1; margin: 0 auto 2rem auto; margin-top: 0; padding: 2rem; text-align: center; background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%); border-radius: 20px; border: 1px solid rgba(255,255,255,0.15); box-shadow: rgba(0,0,0,0.3) 0px 8px 32px; backdrop-filter: blur(10px); transform: none; }
        .org-social-events-section {
          margin-bottom: 2rem;
        }
        
        .org-social-events-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .org-social-events-header-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        
        .org-social-events-header-text {
          flex: 1;
          min-width: 0;
        }
        
        .org-social-events-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .org-social-card {
          padding: clamp(1.5rem, 2.5vw, 2.5rem);
          border-radius: clamp(16px, 2.5vw, 28px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          background: rgba(30, 30, 30, 0.6);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .org-social-card-row { 
          display: flex; 
          align-items: flex-start; 
          gap: 1.5rem; 
          padding-top: 0.5rem;
          position: relative;
          z-index: 2;
        }
        
        .org-social-card-row-icon { 
          flex-shrink: 0;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
        }
        
        .org-social-card-content {
          flex: 1;
          min-width: 0;
        }
        
        .org-social-card-title {
          font-size: clamp(1.5rem, 2vw, 2rem);
          font-weight: 800;
          margin: 0 0 0.75rem 0;
          background: linear-gradient(135deg, #1E88E5, #FF3D57);
          -webkit-background-clip: text;
          background-clip: text;
          color: #FFFFFF;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        
        .org-social-card-description {
          font-size: 1rem;
          opacity: 0.9;
          margin: 0;
          font-weight: 400;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .org-social-card-row-cta { 
          flex-shrink: 0;
        }
        
        .org-social-card-row-cta button {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #1E88E5, #00BCD4);
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(30, 136, 229, 0.4);
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .org-banner h2,
        .org-banner h3,
        .org-container h2,
        .org-container h3 {
          color: #fff;
          text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px;
        }
        .section-title { font-size: 1.5rem; font-weight: 800; margin: 0 0 1rem 0; display: flex; align-items: center; gap: .5rem; }
        @media (max-width: 768px) { .org-root { padding-top: 0; } }
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
          .org-social-events-section {
            margin-bottom: 1.5rem !important;
          }
          
          .org-social-events-header {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 1rem !important;
            margin-bottom: 1.25rem !important;
          }
          
          .org-social-events-header-icon {
            width: 56px !important;
            height: 56px !important;
            font-size: 1.4rem !important;
          }
          
          .org-social-events-header-text {
            width: 100% !important;
          }
          
          .org-social-events-header-text h3 {
            font-size: 1.4rem !important;
            margin-bottom: 0.5rem !important;
          }
          
          .org-social-events-header-text p {
            font-size: 0.9rem !important;
          }
          
          .org-social-events-list {
            gap: 1.25rem !important;
          }
          
          .org-social-card {
            padding: 1.25rem !important;
            border-radius: 18px !important;
            gap: 1.25rem !important;
          }
          
          .org-social-card-row { 
            flex-direction: column !important; 
            align-items: stretch !important; 
            gap: 1rem !important;
            padding-top: 0.75rem !important;
          }
          
          .org-social-card-row-icon {
            width: 60px !important;
            height: 60px !important;
            font-size: 2.1rem !important;
            align-self: center !important;
          }
          
          .org-social-card-content {
            text-align: center !important;
          }
          
          .org-social-card-title {
            font-size: 1.4rem !important;
            margin-bottom: 0.75rem !important;
            text-align: center !important;
          }
          
          .org-social-card-description {
            font-size: 0.95rem !important;
            text-align: center !important;
            margin-bottom: 1rem !important;
          }
          
          .org-social-card-row-cta {
            width: 100% !important;
            display: flex !important;
            justify-content: center !important;
          }
          
          .org-social-card-row-cta button {
            width: 100% !important;
            justify-content: center !important;
            padding: 0.7rem 1.25rem !important;
            font-size: 0.85rem !important;
          }
        }
        @media (max-width: 480px) {
          .org-banner { padding: 1.5rem 1rem !important; }
          .org-banner-avatar { width: 180px !important; height: 180px !important; }
          .org-banner-avatar-fallback { font-size: 4.2rem !important; }
          .org-banner h1 { font-size: 2.6rem !important; }
          .glass-card { padding: 1rem !important; margin-bottom: 1rem !important; }
          .glass-card h3 { font-size: 1.25rem !important; }
          .glass-card-container { padding: 0.75rem !important; border-radius: 12px !important; }
          .org-social-events-section {
            margin-bottom: 1rem !important;
          }
          
          .org-social-events-header {
            gap: 0.75rem !important;
            margin-bottom: 1rem !important;
          }
          
          .org-social-events-header-icon {
            width: 52px !important;
            height: 52px !important;
            font-size: 1.3rem !important;
          }
          
          .org-social-events-header-text h3 {
            font-size: 1.25rem !important;
          }
          
          .org-social-events-header-text p {
            font-size: 0.85rem !important;
          }
          
          .org-social-events-list {
            gap: 1rem !important;
          }
          
          .org-social-card {
            padding: 1rem !important;
            border-radius: 16px !important;
            gap: 1rem !important;
          }
          
          .org-social-card-row {
            gap: 0.85rem !important;
            padding-top: 0.5rem !important;
          }
          
          .org-social-card-row-icon {
            width: 52px !important;
            height: 52px !important;
            font-size: 1.9rem !important;
          }
          
          .org-social-card-title {
            font-size: 1.3rem !important;
            margin-bottom: 0.6rem !important;
          }
          
          .org-social-card-description {
            font-size: 0.9rem !important;
            margin-bottom: 0.75rem !important;
          }
          
          .org-social-card-row-cta button {
            padding: 0.65rem 1.1rem !important;
            font-size: 0.8rem !important;
          }
        }
      `}</style>
      <style>{`
        /* Compact layout for very small screens */
        @media (max-width: 430px) {
          .org-container {
            padding: 0.75rem 0.75rem 1.5rem !important;
          }
          .glass-card-container {
            padding: 0.85rem !important;
            border-radius: 14px !important;
            margin-bottom: 1.25rem !important;
          }
          .org-banner h1 {
            font-size: 2.1rem !important;
          }
          .org-social-card {
            padding: 1rem !important;
            border-radius: 16px !important;
          }
          .org-social-card-title {
            font-size: 1.3rem !important;
          }
          .org-social-card-description {
            font-size: 0.9rem !important;
          }
          .org-social-events-header {
            margin-bottom: 1rem !important;
          }
          .org-social-events-header-icon {
            width: 52px !important;
            height: 52px !important;
          }
          /* Competition Groups Grid Responsivo */
          .competition-groups-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
        /* Responsive para Competition Groups */
        @media (max-width: 768px) {
          .competition-groups-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
            gap: 1.25rem !important;
          }
        }
        @media (max-width: 480px) {
          .competition-groups-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
      `}</style>

      <div className="org-root" style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`, color: colors.gray[50], width: '100%', position: 'relative' }}>
        {/* Elementos flotantes */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 100, height: 100, background: colors.gradients.primary, borderRadius: '50%', opacity: 0.1, animation: 'float 8s ease-in-out infinite', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: 60, height: 60, background: colors.gradients.secondary, borderRadius: '50%', opacity: 0.15, animation: 'float 6s ease-in-out infinite reverse', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '15%', width: 80, height: 80, background: colors.gradients.deep, borderRadius: '50%', opacity: 0.1, animation: 'float 7s ease-in-out infinite', zIndex: 0 }} />

        {/* Banner */}
        <motion.div className="org-banner glass-card-container" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} style={{ position: 'relative', overflow: 'visible', margin: `0.5rem auto 0 auto`, maxWidth: '900px', width: '100%', zIndex: 1 }}>
          {/* Botón Volver a inicio */}
          <motion.button
            onClick={() => navigate('/explore')}
            whileHover={{ scale: 1.1, x: -3 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Volver a inicio"
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(135deg, rgba(240,147,251,0.2), rgba(255,209,102,0.15))',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) inset',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(240,147,251,0.3), rgba(255,209,102,0.25))';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(240,147,251,0.4), 0 0 0 1px rgba(255,255,255,0.15) inset';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(240,147,251,0.2), rgba(255,209,102,0.15))';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) inset';
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: '#f093fb' }}
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </motion.button>
          <div className="org-banner-grid">
            {/* Avatar */}
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.6 }} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 10, position: 'relative' }}>
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
              {/* Badge de verificación y botón de compartir inline debajo del avatar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
                position: 'relative'
              }}>
                {(org as any)?.estado_aprobacion === 'aprobado' && (
                  <div className="badge" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '.45rem',
                    padding: '.35rem .6rem',
                    borderRadius: '999px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #106c37, #0b5)',
                    border: '1px solid #13a65a',
                    boxShadow: '0 8px 18px rgba(0,0,0,.35)',
                    fontSize: '.82rem',
                    color: '#fff'
                  }}>
                    <div className="dot" style={{
                      width: '16px',
                      height: '16px',
                      display: 'grid',
                      placeItems: 'center',
                      background: '#16c784',
                      borderRadius: '50%',
                      color: '#062d1f',
                      fontSize: '.75rem',
                      fontWeight: 900
                    }}>✓</div>
                    <span>Verificado</span>
                  </div>
                )}
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
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: '#fff',
                    borderRadius: 999,
                    backdropFilter: 'blur(8px)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 700
                  }}
                >
                  📤 Compartir
                </button>
                {copied && (
                  <div
                    role="status"
                    aria-live="polite"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      padding: '4px 8px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.25)',
                      fontSize: 12,
                      fontWeight: 700,
                      zIndex: 10
                    }}
                  >
                    Copiado
                  </div>
                )}
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
                    <RitmosChips selected={slugs} onChange={() => {}} readOnly size="compact" />
                  ) : null;
                })()}
                <ZonaGroupedChips
                  selectedIds={(org as any)?.zonas || []}
                  allTags={allZonas}
                  mode="display"
                  size="compact"
                />
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

        {/* Ubicaciones de los Sociales (agregadas) */}
        {aggregatedLocations.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card"
            style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], marginBottom: spacing[6] }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: colors.gradients.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: typography.fontSize['2xl'], boxShadow: colors.shadows.glow }}>📍</div>
              <div>
                <h3 className="section-title">Ubicaciones</h3>
                <p style={{ fontSize: typography.fontSize.sm, opacity: 0.8, margin: 0, color: colors.light }}>
                  Lugares donde se realizan estos sociales
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gap: spacing[3] }}>
              {aggregatedLocations.map((u: any, idx: number) => (
                <div key={idx} style={{ display: 'grid', gap: 8, padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ fontWeight: 700 }}>{u?.nombre || 'Ubicación'}</div>
                  <div style={{ opacity: 0.9 }}>{u?.direccion}</div>
                  {u?.referencias && <div style={{ opacity: 0.75, fontSize: 13 }}>Ref: {u.referencias}</div>}
                  {!!(u?.zonaIds?.length) && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(u.zonaIds as number[]).map((zid) => {
                        const z = allZonas.find((t: any) => t.id === zid);
                        return z ? (
                          <span key={zid} style={{ fontSize: 12, fontWeight: 600, color: '#fff', border: '1px solid rgba(25,118,210,0.35)', background: 'rgba(25,118,210,0.16)', padding: '2px 8px', borderRadius: 999 }}>
                            {z.nombre}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

          {/* Maestros Invitados */}
          <div id="organizer-invited-masters" data-test-id="organizer-invited-masters">
            <InvitedMastersSection masters={[]} title="🎭 Maestros Invitados" showTitle={true} isEditable={false} />
          </div>

          {/* Grupos de Competencia */}
          {/* Nota: Los organizers no tienen grupos de competencia directamente asociados,
              pero mantenemos la sección por consistencia con otros perfiles */}
          {false && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="glass-card"
              style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], marginBottom: spacing[6] }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #f093fb, #f5576c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: typography.fontSize['2xl'], boxShadow: '0 8px 24px rgba(240, 147, 251, 0.4)' }}>🏆</div>
                <div>
                  <h3 className="section-title" style={{ margin: 0 }}>Grupos de Competencia</h3>
                  <p style={{ fontSize: typography.fontSize.sm, opacity: 0.8, margin: 0, fontWeight: 500, color: colors.light }}>Grupos de entrenamiento y competencia</p>
                </div>
              </div>
              <div className="competition-groups-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {/* Los grupos se renderizarían aquí */}
              </div>
            </motion.section>
          )}

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

          {/* Slot Video */}
          {getMediaBySlot(media as any, 'v1') && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card-container"
              style={{
                marginBottom: '1.5rem',
                padding: '1.25rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Header con gradiente superior */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, rgba(240, 147, 251, 0.6), rgba(255, 209, 102, 0.6), rgba(240, 147, 251, 0.6))',
                borderRadius: '20px 20px 0 0'
              }} />
              
              {/* Header compacto */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(255, 209, 102, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  flexShrink: 0
                }}>
                  🎥
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="section-title" style={{ margin: 0, fontSize: '1.15rem', lineHeight: 1.3 }}>
                    Video Principal
                  </h3>
                  <p style={{
                    margin: '0.15rem 0 0 0',
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 400,
                    lineHeight: 1.2
                  }}>
                    Contenido multimedia destacado
                  </p>
                </div>
              </div>

              {/* Contenedor del video compacto */}
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '480px',
                margin: '0 auto',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2))',
                border: '2px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                padding: '3px'
              }}>
                {/* Borde interno con gradiente */}
                <div style={{
                  position: 'absolute',
                  inset: '3px',
                  borderRadius: '13px',
                  background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.1), rgba(255, 209, 102, 0.1))',
                  pointerEvents: 'none',
                  zIndex: 1
                }} />
                
                {/* Video */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  borderRadius: '13px',
                  overflow: 'hidden',
                  background: '#000',
                  zIndex: 2
                }}>
                  <video
                    src={getMediaBySlot(media as any, 'v1')!.url}
                    controls
                    style={{
                      width: '100%',
                      height: 'auto',
                      aspectRatio: '4 / 5',
                      display: 'block',
                      objectFit: 'contain',
                      objectPosition: 'center',
                    }}
                  />
                </div>

                {/* Efecto de brillo en las esquinas */}
                <div style={{
                  position: 'absolute',
                  top: '5px',
                  left: '5px',
                  width: '40px',
                  height: '40px',
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent 70%)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  zIndex: 3
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '5px',
                  right: '5px',
                  width: '40px',
                  height: '40px',
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent 70%)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  zIndex: 3
                }} />
              </div>
            </motion.section>
          )}

          {/* Galería de Fotos Mejorada */}
          {carouselPhotos.length > 0 && (
            <motion.section
              id="organizer-profile-photo-gallery"
              data-baile-id="organizer-profile-photo-gallery"
              data-test-id="organizer-profile-photo-gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="gallery-section glass-card-container"
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                <h3 className="section-title">
                  📷 Galería de Fotos
                </h3>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: colors.light
                }}>
                  {carouselPhotos.length} foto{carouselPhotos.length !== 1 ? 's' : ''}
                </div>
              </div>

              <CarouselComponent photos={carouselPhotos} />
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