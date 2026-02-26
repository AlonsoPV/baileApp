import React, { Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEventDateSuspense } from "../../hooks/useEventDateSuspense";
import { useEventParent } from "../../hooks/useEventParent";
import { useTags } from "../../hooks/useTags";
import { useEventRSVP, type RSVPStatus } from "../../hooks/useRSVP";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import AddToCalendarWithStats from "../../components/AddToCalendarWithStats";
import { useAuth } from "@/contexts/AuthProvider";
import {
  EventHero,
  StickyCtaBar,
  type StickyRsvpState,
  InfoGrid,
  ExpandableText,
  CostsSection,
  Timeline,
  LocationAccordion,
  ContactSection,
  MediaGallery,
  formatHeaderDate,
  formatHeaderTimeRange,
} from "../../components/events/EventDetail";
import "../../components/events/EventDetail/eventDetailScreen.css";
import { useToast } from "../../components/Toast";
// import RequireLogin from "@/components/auth/RequireLogin"; // TEMP: desactivado para permitir acciones sin login
import { ensureAbsoluteImageUrl, toDirectPublicStorageUrl } from "../../utils/imageOptimization";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot, normalizeMediaArray } from "../../utils/mediaSlots";
import SeoHead from "@/components/SeoHead";
import { SEO_BASE_URL, SEO_LOGO_URL } from "@/lib/seoConfig";
import { EventDateSkeleton } from "../../components/skeletons/EventDateSkeleton";
import { QueryErrorBoundaryWithReset } from "../../components/errors/QueryErrorBoundary";
import { getLocaleFromI18n } from "../../utils/locale";
import { routes } from "../../routes/registry";
import { getEventDateYmd } from "../../utils/eventDateDisplay";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

function buildWhatsAppUrl(phone?: string | null, message?: string | null, eventName?: string | null) {
  if (!phone) return undefined;
  const cleanedPhone = phone.replace(/[^\d]/g, ''); // usar solo dígitos en el número
  if (!cleanedPhone) return undefined;

  const text = typeof message === 'string' ? message : '';
  const trimmed = text.trim();

  // Construir el mensaje base
  let baseMessage = '';
  if (trimmed) {
    // Si hay mensaje personalizado, usarlo directamente (asumiendo que ya tiene el formato correcto)
    baseMessage = trimmed;
  } else if (eventName && eventName.trim()) {
    // Sin mensaje personalizado, crear uno con el nombre del evento
    baseMessage = `me interesa el evento: ${eventName.trim()}`;
  } else {
    // Sin mensaje ni nombre, mensaje genérico
    baseMessage = 'me interesa este evento';
  }

  // Verificar si el mensaje ya incluye el prefijo para evitar duplicación
  const hasPrefix = baseMessage.toLowerCase().includes('hola vengo de donde bailar mx');
  
  // Prepend "Hola vengo de Donde Bailar MX, " al mensaje si no lo tiene
  const fullMessage = hasPrefix 
    ? baseMessage 
    : `Hola vengo de Donde Bailar MX, ${baseMessage}`;

  const encoded = encodeURIComponent(fullMessage);
  return `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encoded}`;
}

/**
 * Componente principal con Suspense
 * Maneja la validación del dateId y envuelve el contenido con Suspense
 */
export default function EventDatePublicScreen() {
  const { t } = useTranslation();
  const params = useParams<{ dateId?: string; id?: string }>();
  const dateIdParam = params.dateId ?? params.id;
  const dateIdNum = dateIdParam ? parseInt(dateIdParam) : undefined;

  // Validar que tenemos un dateId válido antes de usar Suspense
  if (!dateIdNum || isNaN(dateIdNum)) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
            {t('event_not_found_title')}
          </h2>
          <p style={{ marginBottom: '24px', opacity: 0.7 }}>
            {t('event_not_found_description')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryErrorBoundaryWithReset>
      <Suspense fallback={<EventDateSkeleton />}>
        <EventDateContent dateId={dateIdNum} dateIdParam={dateIdParam} />
      </Suspense>
    </QueryErrorBoundaryWithReset>
  );
}

/**
 * Componente de contenido que usa Suspense
 * Este componente asume que los datos están disponibles (Suspense maneja el loading)
 * Con Suspense, no necesitamos early returns de loading - el hook siempre retorna datos
 */
function EventDateContent({ dateId, dateIdParam }: { dateId: number; dateIdParam: string | undefined }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  
  // Con Suspense, date siempre existe cuando se renderiza
  const date = useEventDateSuspense(dateId);
  const displayYmd = React.useMemo(() => getEventDateYmd(date), [date]);
  
  // Estas queries pueden ser opcionales (no usan Suspense)
  const { data: parent } = useEventParent(date?.parent_id ?? undefined);
  const { data: myOrganizer } = useMyOrganizer();
  const { data: ritmos } = useTags('ritmo');
  const { data: zonas } = useTags('zona');

  const dateMedia = React.useMemo(() => normalizeMediaArray((date as any)?.media), [(date as any)?.media]);
  const parentMedia = React.useMemo(() => normalizeMediaArray((parent as any)?.media), [(parent as any)?.media]);

  // Verificar si el usuario es propietario
  const isOwner = React.useMemo(() => {
    if (!user || !myOrganizer || !parent) return false;

    // Comparar user_id del organizador con user_id del parent
    const organizerUserId = (myOrganizer as any).user_id;
    const parentUserId = (parent as any)?.user_id;

    return organizerUserId === parentUserId;
  }, [user, myOrganizer, parent]);

  const fullAddress = `${date.lugar ?? ''} ${date.direccion ?? ''} ${date.ciudad ?? ''}`.trim();
  const handleCopyAddress = React.useCallback(async () => {
    if (!fullAddress) return;
    try {
      await navigator.clipboard.writeText(fullAddress);
      showToast(t('link_copied', 'Link copiado'), 'success');
    } catch {
      showToast(t('copy_failed', 'No se pudo copiar'), 'error');
    }
  }, [fullAddress, showToast, t]);

  // Hook de RSVP
  const {
    userStatus,
    stats,
    setStatus,
    isUpdating,
  } = useEventRSVP(dateId);

  // TEMP: permitir UI RSVP sin login; backend puede seguir exigiendo auth
  const canMutateRsvp = !!user;

  // Optimistic UI + state machine: idle | active | loading | error
  const [optimisticStatus, setOptimisticStatus] = React.useState<RSVPStatus | null | undefined>(undefined);
  const requestIdRef = React.useRef(0);

  const effectiveStatus = optimisticStatus !== undefined ? optimisticStatus : (canMutateRsvp ? userStatus : null);
  const rsvpState: StickyRsvpState = isUpdating
    ? 'loading'
    : effectiveStatus === 'interesado' || effectiveStatus === 'going'
      ? 'active'
      : 'idle';

  const handleStatusChange = React.useCallback(
    (s: RSVPStatus | null) => {
      if (isUpdating) return;
      if (!canMutateRsvp) {
        showToast(t('rsvp_guest_toast', 'RSVP temporalmente requiere login en backend. UI desbloqueada.'), 'info');
        return;
      }
      const previous = effectiveStatus;
      const reqId = ++requestIdRef.current;
      setOptimisticStatus(s);
      setStatus(s)
        .then(() => {
          if (reqId === requestIdRef.current) setOptimisticStatus(undefined);
        })
        .catch(() => {
          if (reqId === requestIdRef.current) {
            setOptimisticStatus(previous ?? undefined);
            showToast(t('rsvp_error_toast', 'No se pudo registrar, intenta de nuevo'), 'error');
          }
        });
    },
    [canMutateRsvp, effectiveStatus, isUpdating, setStatus, showToast, t]
  );

  // Calcular contador de interesados de forma robusta
  // La función RPC get_event_rsvp_stats retorna { interesado: number, total: number }
  // Este contador se actualiza automáticamente cuando el usuario cambia su RSVP
  // gracias a la invalidación de queries en useEventRSVP
  // COMENTADO: Contador deshabilitado temporalmente
  // const interestedCount = React.useMemo(() => {
  //   // Si stats aún no está cargado, retornar 0 (se actualizará cuando cargue)
  //   if (!stats) return 0;
  //   
  //   // stats es de tipo RSVPStats: { interesado: number, total: number }
  //   const count = stats.interesado;
  //   
  //   // Validar que sea un número válido y no negativo
  //   if (typeof count !== 'number' || isNaN(count) || count < 0) {
  //     console.warn('[EventDatePublicScreen] Invalid interestedCount from stats:', stats);
  //     return 0;
  //   }
  //    
  //   return count;
  // }, [stats]);
  // Calcular start/end para calendario (fecha específica o dia_semana recurrente)
  const { calendarStart, calendarEnd } = React.useMemo(() => {
    try {
      const horaInicio = (date.hora_inicio || '20:00').split(':').slice(0, 2).join(':');
      const horaFin = (date.hora_fin || date.hora_inicio || '23:00').split(':').slice(0, 2).join(':');

      let start: Date;
      let end: Date;
  
      // ✅ 1) Si hay fecha concreta (o display calculado legacy), usarla SIEMPRE
      if (displayYmd) {
        const parsedStart = new Date(`${displayYmd}T${horaInicio}:00`);
        const parsedEnd = new Date(`${displayYmd}T${horaFin}:00`);
        start = isNaN(parsedStart.getTime()) ? new Date() : parsedStart;
        end =
          isNaN(parsedEnd.getTime()) || parsedEnd.getTime() <= start.getTime()
            ? (() => { const d = new Date(start); d.setHours(d.getHours() + 2); return d; })()
            : parsedEnd;
        return { calendarStart: start, calendarEnd: end };
      }
  
      start = new Date();
      end = new Date(start);
      end.setHours(end.getHours() + 2);
      return { calendarStart: start, calendarEnd: end };
    } catch {
      const s = new Date();
      const e = new Date(s);
      e.setHours(e.getHours() + 2);
      return { calendarStart: s, calendarEnd: e };
    }
  }, [displayYmd, date.hora_inicio, date.hora_fin]);



  const dateName = date.nombre || parent?.nombre || 'Fecha de baile';
  const calendarButton = (
    <AddToCalendarWithStats
      eventId={dateId}
      title={dateName}
      description={date.biografia || parent?.descripcion}
      location={date.lugar || date.ciudad}
      start={calendarStart}
      end={calendarEnd}
      showAsIcon
    />
  );

  const toUrl = (u: string | null | undefined) =>
    u ? (toDirectPublicStorageUrl(ensureAbsoluteImageUrl(u) ?? u) ?? u) : undefined;
  const p1Date = getMediaBySlot(dateMedia, 'p1')?.url;
  const p1Parent = getMediaBySlot(parentMedia, 'p1')?.url;
  const avatarSlot = [...dateMedia, ...parentMedia].find((m: any) => m?.slot === 'avatar');
  const avatarUrl = avatarSlot?.url ?? (avatarSlot as any)?.path;
  const firstDate = dateMedia[0] as any;
  const firstParent = parentMedia[0] as any;
  const firstDateUrl = firstDate?.url ?? firstDate?.path ?? (typeof firstDate === 'string' ? firstDate : '');
  const firstParentUrl = firstParent?.url ?? firstParent?.path ?? (typeof firstParent === 'string' ? firstParent : '');
  const firstUrl = firstDateUrl || firstParentUrl;
  const baseFlyerUrl =
    (date.flyer_url ? toUrl(date.flyer_url) : undefined) ||
    (p1Date ? toUrl(p1Date) : undefined) ||
    (p1Parent ? toUrl(p1Parent) : undefined) ||
    (avatarUrl ? toUrl(avatarUrl) : undefined) ||
    ((date as any).avatar_url ? toUrl((date as any).avatar_url) : undefined) ||
    ((parent as any)?.avatar_url ? toUrl((parent as any).avatar_url) : undefined) ||
    ((date as any).portada_url ? toUrl((date as any).portada_url) : undefined) ||
    ((parent as any)?.portada_url ? toUrl((parent as any).portada_url) : undefined) ||
    (firstUrl ? toUrl(firstUrl) : undefined);
  const flyerCacheKey =
    ((date as any)?.updated_at as string | undefined) ||
    (date.created_at as string | undefined) ||
    '';
  const flyerUrlCacheBusted = React.useMemo(() => {
    if (!baseFlyerUrl) return null;
    const separator = baseFlyerUrl.includes('?') ? '&' : '?';
    // Usar created_at/updated_at como parte del key para que cambie solo cuando cambie en BD
    const key = encodeURIComponent(flyerCacheKey || '');
    return `${baseFlyerUrl}${separator}_t=${key}`;
  }, [baseFlyerUrl, flyerCacheKey]);

  const getRitmoName = (id: number) => {
    return ritmos?.find(r => r.id === id)?.nombre || `Ritmo ${id}`;
  };

  const getZonaName = (id: number) => {
    return zonas?.find(z => z.id === id)?.nombre || `Zona ${id}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const safeDate = (() => {
      const plain = String(dateStr).split('T')[0];
      const [year, month, day] = plain.split('-').map((part) => parseInt(part, 10));
      if (
        Number.isFinite(year) &&
        Number.isFinite(month) &&
        Number.isFinite(day)
      ) {
        // Colocar el día a mediodía en UTC para evitar desfases al formatear en CDMX
        return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      }
      const parsed = new Date(dateStr);
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    })();

    // ✅ Usar locale según el idioma actual
    const locale = getLocaleFromI18n();
    return safeDate.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Mexico_City'
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const segments = timeStr.split(':');
    const hours = segments[0] ?? '00';
    const minutes = segments[1] ?? '00';
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  };

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[EventDetail] id:", date?.id, "fecha:", date?.fecha, "dia_semana:", (date as any)?.dia_semana, "display:", displayYmd);
  }

  const formattedDate = formatDate(displayYmd || '');
  const locationName = date.lugar || date.ciudad || (parent as any)?.ciudad || getZonaName((date.zonas || [])[0]) || 'México';
  const hasLocation = !!(date.lugar || date.direccion || date.ciudad);
  const ritmosList = Array.isArray((date as any).ritmos)
    ? (date as any).ritmos.map((id: number) => getRitmoName(id)).slice(0, 3).join(', ')
    : '';
  const seoDescription = `${dateName} el ${formattedDate}${locationName ? ` en ${locationName}` : ''}${ritmosList ? ` · Ritmos: ${ritmosList}` : ''}.`;

  const seoImageRaw =
    baseFlyerUrl ||
    getMediaBySlot(dateMedia, 'p1')?.url ||
    getMediaBySlot(parentMedia, 'p1')?.url ||
    SEO_LOGO_URL;
  const seoImage = seoImageRaw === SEO_LOGO_URL ? SEO_LOGO_URL : (toDirectPublicStorageUrl(seoImageRaw) || seoImageRaw);
  const dateUrl = `${SEO_BASE_URL}/social/fecha/${dateIdParam ?? date.id}`;

  const handleShare = React.useCallback(async () => {
    const shareData = { url: dateUrl, title: dateName, text: t('check_this_event', { name: dateName }) };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(dateUrl);
      showToast(t('link_copied', 'Link copiado'), 'success');
    } catch {
      showToast(t('copy_failed', 'No se pudo copiar'), 'error');
    }
  }, [dateUrl, dateName, t, showToast]);

  const dateStr = formatHeaderDate(displayYmd || '');
  const timeRange = formatHeaderTimeRange(date.hora_inicio, date.hora_fin);
  const venueName = date.lugar || '';
  const mapsUrl = (date.lugar || date.direccion || date.ciudad)
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${date.lugar ?? ''} ${date.direccion ?? ''} ${date.ciudad ?? ''}`.trim()
      )}`
    : '';
  const carouselPhotos = React.useMemo(() => 
    PHOTO_SLOTS.map((s) => getMediaBySlot(dateMedia, s)?.url).filter(Boolean).map((u) => toDirectPublicStorageUrl(u) || u) as string[],
    [dateMedia]
  );
  const videos = React.useMemo(() =>
    VIDEO_SLOTS.map((s) => getMediaBySlot(dateMedia, s)?.url).filter(Boolean).map((u) => toDirectPublicStorageUrl(u) || u) as string[],
    [dateMedia]
  );
  const hasMedia = carouselPhotos.length > 0 || videos.length > 0;

  return (
    <>
      <SeoHead
        section="event"
        title={`${dateName} | ${formattedDate}`}
        description={seoDescription}
        image={seoImage}
        url={dateUrl}
        keywords={[
          dateName,
          formattedDate,
          locationName,
          ritmosList,
          'evento de baile',
          'Dónde Bailar',
        ].filter(Boolean) as string[]}
      />
      <div className="event-detail-screen">
        <EventHero
          title={dateName}
          flyerUrl={flyerUrlCacheBusted || date.flyer_url}
          flyerCacheKey=""
          dateStr={dateStr}
          timeRange={timeRange}
          venueName={venueName}
          onBack={() => navigate(routes.app.explore)}
          onShare={handleShare}
          toDirectUrl={toDirectPublicStorageUrl}
        />
        <StickyCtaBar
          userStatus={effectiveStatus}
          onStatusChange={handleStatusChange}
          isUpdating={isUpdating}
          rsvpState={rsvpState}
          onShare={handleShare}
          calendarButton={calendarButton}
        />
        <div className="eds-content">
          <InfoGrid
            dateStr={dateStr}
            timeRange={timeRange}
            venueName={venueName}
            city={date.ciudad || undefined}
            mapsUrl={mapsUrl}
            fullAddress={fullAddress || undefined}
            onCopyAddress={fullAddress ? handleCopyAddress : undefined}
          />
          {(date.biografia || parent?.descripcion) && (
            <>
              <div className="eds-section-header">
                <h2 className="eds-section-title">{t('about_event', 'Acerca del evento')}</h2>
                <div className="eds-section-underline" aria-hidden />
              </div>
              <ExpandableText
                text={date.biografia || parent?.descripcion || ''}
                expandLabel={t('see_more', 'Ver más')}
                collapseLabel={t('see_less', 'Ver menos')}
              />
            </>
          )}
          {Array.isArray(date.costos) && date.costos.length > 0 && (
            <>
              <div className="eds-section-header">
                <h2 className="eds-section-title">{t('costs', 'Costos')}</h2>
                <div className="eds-section-underline" aria-hidden />
              </div>
              <CostsSection items={date.costos} disclaimer={t('price_disclaimer', 'Precios sujetos a cambios')} freeLabel={t('free', 'Gratis')} />
            </>
          )}
          {Array.isArray(date.cronograma) && date.cronograma.length > 0 && (
            <>
              <div className="eds-section-header">
                <h2 className="eds-section-title">{t('schedule', 'Cronograma')}</h2>
                <div className="eds-section-underline" aria-hidden />
              </div>
              <Timeline items={date.cronograma} byLabel={t('by')} conductedByLabel={t('conducted_by')} levelLabel={t('level')} />
            </>
          )}
          {(date.lugar || date.direccion || date.ciudad) && (
            <LocationAccordion
              venueName={date.lugar || date.ciudad || t('place')}
              address={[date.direccion, date.ciudad].filter(Boolean).join(', ')}
              references={date.referencias ?? undefined}
              mapsUrl={mapsUrl}
              mapsLabel={t('view_on_maps', 'Abrir en Google Maps')}
              copyLabel={t('copy_address')}
              copiedLabel={t('copied')}
            />
          )}
          {date.requisitos && (
            <>
              <div className="eds-section-header">
                <h2 className="eds-section-title">{t('requirements', 'Requisitos')}</h2>
                <div className="eds-section-underline" aria-hidden />
              </div>
              <div className="eds-expandable">
                <p className="eds-expandable__text">{date.requisitos}</p>
              </div>
            </>
          )}
          {date.telefono_contacto && (
            <>
              <div className="eds-section-header">
                <h2 className="eds-section-title">{t('contact', 'Contacto')}</h2>
                <div className="eds-section-underline" aria-hidden />
              </div>
              <ContactSection
                whatsappUrl={buildWhatsAppUrl((date as any).telefono_contacto, (date as any).mensaje_contacto, dateName) || '#'}
                whatsappLabel={t('consult_whatsapp', 'Contactar por WhatsApp')}
                organizerName={parent?.nombre}
              />
            </>
          )}
          {hasMedia && (
            <>
              <div className="eds-section-header">
                <h2 className="eds-section-title">{t('photo_gallery', 'Galería')}</h2>
                <div className="eds-section-underline" aria-hidden />
              </div>
              <MediaGallery photos={carouselPhotos} videos={videos} toDirectUrl={toDirectPublicStorageUrl} />
            </>
          )}
        </div>
      </div>
    </>
  );
}