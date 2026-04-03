import React, { Suspense } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
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
  Timeline,
  LocationAccordion,
  ContactSection,
  MediaGallery,
  formatHeaderDate,
  formatHeaderTime,
  formatHeaderTimeRange,
} from "../../components/events/EventDetail";
import "../../components/events/EventDetail/eventDetailScreen.css";
import { useToast } from "../../components/Toast";
// import RequireLogin from "@/components/auth/RequireLogin"; // TEMP: desactivado para permitir acciones sin login
import { ensureAbsoluteImageUrl, toDirectPublicStorageUrl } from "../../utils/imageOptimization";
import { withStableCacheBust } from "../../utils/cacheBuster";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot, normalizeMediaArray } from "../../utils/mediaSlots";
import SeoHead from "@/components/SeoHead";
import { SEO_BASE_URL, SEO_LOGO_URL } from "@/lib/seoConfig";
import { buildShareUrl } from "@/utils/shareUrls";
import { EventDateSkeleton } from "../../components/skeletons/EventDateSkeleton";
import { QueryErrorBoundaryWithReset } from "../../components/errors/QueryErrorBoundary";
import { getLocaleFromI18n } from "../../utils/locale";
import { routes } from "../../routes/registry";
import { resolveEventDateYmd } from "../../utils/eventDateDisplay";
import { supabase } from "../../lib/supabase";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useGuestFavorites } from "@/hooks/useGuestFavorites";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

/** Texto “Acerca del evento”: prioridad fecha → biografía del parent → descripción (evita omitir biografia del parent). */
function resolveEventAboutText(date: any, parent: any): string {
  const nested = date?.events_parent;
  const candidates = [
    date?.biografia,
    parent?.biografia,
    nested?.biografia,
    parent?.descripcion,
    nested?.descripcion,
  ];
  for (const raw of candidates) {
    if (typeof raw !== "string") continue;
    const s = raw.trim();
    if (s.length > 0) return s;
  }
  return "";
}

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
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { isEventFavorite, toggleEventFavorite, togglingEvent } = useUserFavorites();
  const guestFavorites = useGuestFavorites();
  
  // Con Suspense, date siempre existe cuando se renderiza
  const date = useEventDateSuspense(dateId);
  const displayYmd = React.useMemo(() => resolveEventDateYmd(date), [date]);

  // ✅ Si abrimos una "plantilla" recurrente (dia_semana sin fecha), materializar ocurrencias y redirigir
  // a la primera ocurrencia real futura para navegar por un events_date.id real.
  React.useEffect(() => {
    const hasDiaSemana = typeof (date as any)?.dia_semana === "number";
    const hasFecha = !!(date as any)?.fecha || !!(date as any)?.fecha_inicio;
    if (!hasDiaSemana) return;
    if (hasFecha) return;

    const parentId = date?.parent_id;
    if (!parentId) return;

    let cancelled = false;
    (async () => {
      try {
        await supabase.rpc("ensure_weekly_occurrences", { p_parent_id: Number(parentId), p_weeks_ahead: 13 } as any);
        const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
        const { data: nextRows, error } = await supabase
          .from("events_date")
          .select("id,fecha")
          .eq("parent_id", Number(parentId))
          .not("fecha", "is", null)
          .gte("fecha", today)
          .order("fecha", { ascending: true })
          .limit(1);
        if (error) return;

        if (cancelled) return;
        if (Array.isArray(nextRows) && nextRows[0]?.id) {
          const nextId = Number((nextRows[0] as any).id);
          if (Number.isFinite(nextId) && nextId !== dateId) {
            navigate(`/social/fecha/${nextId}`, { replace: true });
          }
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn("[EventDetail] ensure_weekly_occurrences/redirect failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [date?.parent_id, (date as any)?.organizer_id, (date as any)?.dia_semana, (date as any)?.fecha, (date as any)?.fecha_inicio, dateId, navigate]);
  
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

  // RSVP: disponible con o sin login. Sin login se guarda en localStorage.
  const GUEST_RSVP_KEY = (id: number) => `rsvp_guest_${id}`;
  const readGuestRsvp = React.useCallback((id: number): RSVPStatus | null => {
    try {
      const raw = localStorage.getItem(GUEST_RSVP_KEY(id));
      if (raw === 'interesado' || raw === 'going') return raw;
      return null;
    } catch {
      return null;
    }
  }, []);

  const [guestRsvpStatus, setGuestRsvpStatus] = React.useState<RSVPStatus | null>(() => readGuestRsvp(dateId));
  React.useEffect(() => {
    setGuestRsvpStatus(readGuestRsvp(dateId));
  }, [dateId, readGuestRsvp]);

  const {
    userStatus,
    stats,
    setStatus,
    isUpdating,
  } = useEventRSVP(dateId);

  const canMutateRsvpBackend = !!user;

  // Optimistic UI + state machine: idle | active | loading | error
  const [optimisticStatus, setOptimisticStatus] = React.useState<RSVPStatus | null | undefined>(undefined);
  const requestIdRef = React.useRef(0);

  const effectiveStatus = React.useMemo(() => {
    if (optimisticStatus !== undefined) return optimisticStatus;
    if (canMutateRsvpBackend) return userStatus ?? null;
    return guestRsvpStatus;
  }, [optimisticStatus, canMutateRsvpBackend, userStatus, guestRsvpStatus]);

  const rsvpState: StickyRsvpState = isUpdating
    ? 'loading'
    : effectiveStatus === 'interesado' || effectiveStatus === 'going'
      ? 'active'
      : 'idle';

  const favoriteActive = user ? isEventFavorite(dateId) : guestFavorites.isEventFavorite(dateId);
  const onToggleFavorite = React.useCallback(async () => {
    if (!user) {
      try {
        const next = guestFavorites.toggleEventFavorite(dateId);
        showToast(
          next ? t("added_to_favorites", "Agregado a favoritos") : t("removed_from_favorites", "Eliminado de favoritos"),
          "success"
        );
      } catch {
        showToast(t("action_failed", "No se pudo completar la acción"), "error");
      }
      return;
    }
    try {
      const next = await toggleEventFavorite(dateId);
      showToast(next ? t("added_to_favorites", "Agregado a favoritos") : t("removed_from_favorites", "Eliminado de favoritos"), "success");
    } catch {
      showToast(t("action_failed", "No se pudo completar la acción"), "error");
    }
  }, [user, guestFavorites, toggleEventFavorite, dateId, showToast, t]);

  const handleStatusChange = React.useCallback(
    (s: RSVPStatus | null) => {
      if (isUpdating) return;
      if (!canMutateRsvpBackend) {
        try {
          if (s === null) localStorage.removeItem(GUEST_RSVP_KEY(dateId));
          else localStorage.setItem(GUEST_RSVP_KEY(dateId), s);
        } catch {
          // ignore
        }
        setGuestRsvpStatus(s);
        if (s === null) {
          showToast(t("rsvp_guest_cleared", "Preferencia actualizada"), "success");
        } else if (s === "interesado") {
          showToast(t("rsvp_guest_interested", "Te interesa este evento"), "success");
        } else if (s === "going") {
          showToast(t("rsvp_guest_going", "¡Nos vemos en el evento!"), "success");
        }
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
    [dateId, canMutateRsvpBackend, effectiveStatus, isUpdating, setStatus, showToast, t]
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
  const aboutText = React.useMemo(() => resolveEventAboutText(date, parent), [date, parent]);
  const calendarButton = (
    <AddToCalendarWithStats
      eventId={dateId}
      title={dateName}
      description={aboutText || undefined}
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
  const flyerUrlCacheBusted = React.useMemo(
    () => withStableCacheBust(baseFlyerUrl, flyerCacheKey || null) ?? null,
    [baseFlyerUrl, flyerCacheKey]
  );

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
  const shareUrl = buildShareUrl("evento", String(dateIdParam ?? date.id));

  const handleShare = React.useCallback(async () => {
    const shareData = { url: shareUrl, title: dateName, text: t('check_this_event', { name: dateName }) };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast(t('link_copied', 'Link copiado'), 'success');
    } catch {
      showToast(t('copy_failed', 'No se pudo copiar'), 'error');
    }
  }, [shareUrl, dateName, t, showToast]);

  const dateStr = formatHeaderDate(displayYmd || '');
  /** Rango visible en hero + eds-info-card: inicio y fin; si no hay hora_fin en BD, el fin coincide con Add to calendar (+2h si aplica). */
  const timeRange = React.useMemo(() => {
    const hi = date.hora_inicio;
    const hf = date.hora_fin;
    if (hf) {
      return formatHeaderTimeRange(hi, hf);
    }
    if (!hi) {
      return formatHeaderTimeRange(hi, hf);
    }
    const startFmt = formatHeaderTime(hi);
    if (!startFmt) return "";
    const locale = getLocaleFromI18n();
    const endFmt = calendarEnd.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Mexico_City",
    });
    return `${startFmt} - ${endFmt}`;
  }, [date.hora_inicio, date.hora_fin, calendarEnd]);
  const venueName = date.lugar || '';
  const costsSummary = React.useMemo(() => {
    const items = Array.isArray((date as any)?.costos) ? (date as any).costos : [];
    if (!items.length) return "Por confirmar";

    const values = items
      .map((item: any) => item?.monto ?? item?.precio)
      .map((raw: any) => {
        if (raw === null || raw === undefined || raw === "") return 0;
        if (typeof raw === "number") return Number.isFinite(raw) ? raw : NaN;
        if (typeof raw === "string") {
          if (raw.toLowerCase().trim() === "gratis") return 0;
          const parsed = parseFloat(raw.replace(/[^\d.]/g, ""));
          return Number.isFinite(parsed) ? parsed : NaN;
        }
        return NaN;
      })
      .filter((n: number) => Number.isFinite(n));

    if (!values.length) return "Por confirmar";
    const minValue = Math.min(...values);
    if (minValue <= 0) return "Gratis";

    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(minValue);
  }, [date]);
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
      <div id="event-detail-page" className="event-detail-screen">
        <EventHero
          title={dateName}
          flyerUrl={flyerUrlCacheBusted || date.flyer_url}
          flyerCacheKey=""
          dateStr={dateStr}
          timeRange={timeRange}
          venueName={venueName}
          onShare={handleShare}
          onToggleFavorite={onToggleFavorite}
          favoriteActive={favoriteActive}
          togglingEvent={user ? togglingEvent : false}
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
        {!user && (
          <div className="eds-guest-sync-hint" role="note">
            <Link
              className="eds-guest-sync-hint__link"
              to="/auth/login"
              state={{ from: `${location.pathname}${location.search || ""}` }}
            >
              {t("login", "Iniciar sesión")}
            </Link>
            <span className="eds-guest-sync-hint__rest">
              {t("guest_sync_continue", "para sincronizar favoritos y RSVPs en tu cuenta.")}
            </span>
          </div>
        )}
        <div id="event-detail-content" className="eds-content">
          <section id="event-section-info" className="eds-section eds-section--info">
            <InfoGrid
              costsSummary={costsSummary}
              costsItems={Array.isArray(date.costos) ? date.costos : []}
              costsDisclaimer={t('price_disclaimer', 'Precios sujetos a cambios')}
              freeLabel={t('free', 'Gratis')}
              dateStr={dateStr}
              timeRange={timeRange}
              venueName={venueName}
              city={date.ciudad || undefined}
              mapsUrl={mapsUrl}
              fullAddress={fullAddress || undefined}
              onCopyAddress={fullAddress ? handleCopyAddress : undefined}
            />
          </section>
          {(() => {
            if (!aboutText) return null;
            return (
              <section id="event-section-about" className="eds-section eds-section--about">
                <div className="eds-section-header">
                  <h2 className="eds-section-title">{t('about_event', 'Acerca del evento')}</h2>
                  <div className="eds-section-underline" aria-hidden />
                </div>
                <ExpandableText
                  text={aboutText}
                  expandLabel={t('see_more', 'Ver más')}
                  collapseLabel={t('see_less', 'Ver menos')}
                />
              </section>
            );
          })()}
          {Array.isArray(date.cronograma) && date.cronograma.length > 0 && (
            <section id="event-section-schedule" className="eds-section eds-section--schedule">
              <div className="eds-section-header">
                <h2 className="eds-section-title">{t('schedule', 'Cronograma')}</h2>
                <div className="eds-section-underline" aria-hidden />
              </div>
              <Timeline items={date.cronograma} byLabel={t('by')} conductedByLabel={t('conducted_by')} levelLabel={t('level')} />
            </section>
          )}
          {(date.lugar || date.direccion || date.ciudad) && (
            <section id="event-section-location" className="eds-section eds-section--location">
              <LocationAccordion
                venueName={date.lugar || date.ciudad || t('place')}
                address={[date.direccion, date.ciudad].filter(Boolean).join(', ')}
                references={date.referencias ?? undefined}
                mapsUrl={mapsUrl}
                mapsLabel={t('view_on_maps', 'Abrir en Google Maps')}
                copyLabel={t('copy_address')}
                copiedLabel={t('copied')}
              />
            </section>
          )}
          {date.requisitos && (
            <section id="event-section-requirements" className="eds-section eds-section--requirements">
              <div className="eds-section-header">
                <h2 className="eds-section-title">{t('requirements', 'Requisitos')}</h2>
                <div className="eds-section-underline" aria-hidden />
              </div>
              <div className="eds-expandable">
                <p className="eds-expandable__text">{date.requisitos}</p>
              </div>
            </section>
          )}
          {date.telefono_contacto && (
            <section id="event-section-contact" className="eds-section eds-section--contact">
              <div className="eds-section-header">
                <h2 className="eds-section-title">{t('contact', 'Contacto')}</h2>
                <div className="eds-section-underline" aria-hidden />
              </div>
              <ContactSection
                whatsappUrl={buildWhatsAppUrl((date as any).telefono_contacto, (date as any).mensaje_contacto, dateName) || '#'}
                whatsappLabel={t('consult_whatsapp', 'Contactar por WhatsApp')}
                organizerName={parent?.nombre}
              />
            </section>
          )}
          {hasMedia && (
            <section id="event-section-gallery" className="eds-section eds-section--gallery">
              <div className="eds-section-header">
                <h2 className="eds-section-title">{t('photo_gallery', 'Galería')}</h2>
                <div className="eds-section-underline" aria-hidden />
              </div>
              <MediaGallery photos={carouselPhotos} videos={videos} toDirectUrl={toDirectPublicStorageUrl} />
            </section>
          )}
        </div>
      </div>
    </>
  );
}