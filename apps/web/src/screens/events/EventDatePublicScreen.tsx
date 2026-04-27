import React, { Suspense } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEventDateSuspense } from "../../hooks/useEventDateSuspense";
import { useEventParent } from "../../hooks/useEventParent";
import { useTags } from "../../hooks/useTags";
import { useEventRSVP, type RSVPStatus } from "../../hooks/useRSVP";
import { useMyOrganizer, useOrganizerPublic } from "../../hooks/useOrganizer";
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
// import RequireLogin from "@/components/auth/RequireLogin"; // TEMP: disabled to allow actions without login
import { ensureAbsoluteImageUrl, toDirectPublicStorageUrl } from "../../utils/imageOptimization";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot, normalizeMediaArray } from "../../utils/mediaSlots";
import SeoHead from "@/components/SeoHead";
import { SEO_BASE_URL, SEO_LOGO_URL } from "@/lib/seoConfig";
import { buildShareUrl } from "@/utils/shareUrls";
import { EventDateSkeleton } from "../../components/skeletons/EventDateSkeleton";
import { QueryErrorBoundaryWithReset } from "../../components/errors/QueryErrorBoundary";
import { getLocale } from "../../utils/locale";
import { routes } from "../../routes/registry";
import { resolveEventDateYmd } from "../../utils/eventDateDisplay";
import { supabase } from "../../lib/supabase";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useGuestFavorites } from "@/hooks/useGuestFavorites";
import { normalizeEventCosts } from "../../utils/normalizeEventCosts";
import { buildEventWhatsappUrl, getEventWhatsapp } from "../../utils/eventWhatsapp";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

/** “About the event” for calendar / extras: date bio → parent bio → description (avoids dropping parent bio). */
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

/** Copy for `#event-section-about`: only this date’s biografía (no herencia del padre). */
function getEventDateAboutSectionBody(date: any): string {
  const raw = date?.biografia;
  if (typeof raw !== "string") return "";
  return raw.trim();
}

/**
 * Root component with Suspense.
 * Validates dateId and wraps content in Suspense.
 */
export default function EventDatePublicScreen() {
  const { t } = useTranslation();
  const params = useParams<{ dateId?: string; id?: string }>();
  const dateIdParam = params.dateId ?? params.id;
  const dateIdNum = dateIdParam ? parseInt(dateIdParam) : undefined;

  // Require a valid dateId before using Suspense
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
        <EventDateContent dateId={dateIdNum} />
      </Suspense>
    </QueryErrorBoundaryWithReset>
  );
}

/**
 * Content component using Suspense.
 * Assumes data is available (Suspense handles loading).
 */
function EventDateContent({ dateId }: { dateId: number }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const { isEventFavorite, toggleEventFavorite, togglingEvent } = useUserFavorites();
  const guestFavorites = useGuestFavorites();
  
  // With Suspense, date always exists when this renders
  const date = useEventDateSuspense(dateId);
  const resolvedDateId = Number((date as any)?.id || dateId);
  const displayYmd = React.useMemo(() => resolveEventDateYmd(date), [date]);

  React.useEffect(() => {
    if (!Number.isFinite(resolvedDateId) || resolvedDateId === dateId) return;
    navigate(`/social/fecha/${resolvedDateId}${location.search || ""}`, { replace: true });
  }, [dateId, location.search, navigate, resolvedDateId]);

  // ✅ Recurring template (dia_semana, no fecha): materialize occurrences and redirect
  // to the next real future occurrence so we navigate with a real events_date.id.
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
          if (Number.isFinite(nextId) && nextId !== resolvedDateId) {
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
  }, [date?.parent_id, (date as any)?.organizer_id, (date as any)?.dia_semana, (date as any)?.fecha, (date as any)?.fecha_inicio, resolvedDateId, navigate]);
  
  // Optional queries (not using Suspense)
  const { data: parent } = useEventParent(date?.parent_id ?? undefined);
  const { data: myOrganizer } = useMyOrganizer();

  const organizerIdForWhatsapp = React.useMemo(() => {
    const fromDate = (date as any)?.organizer_id;
    const fromParent = (parent as any)?.organizer_id;
    if (typeof fromDate === "number" && Number.isFinite(fromDate)) return fromDate;
    if (typeof fromParent === "number" && Number.isFinite(fromParent)) return fromParent;
    return undefined;
  }, [date, parent]);

  const { data: organizerPublic } = useOrganizerPublic(organizerIdForWhatsapp);
  const { data: ritmos } = useTags('ritmo');
  const { data: zonas } = useTags('zona');

  const dateMedia = React.useMemo(() => normalizeMediaArray((date as any)?.media), [(date as any)?.media]);
  const parentMedia = React.useMemo(() => normalizeMediaArray((parent as any)?.media), [(parent as any)?.media]);

  const isOwner = React.useMemo(() => {
    if (!user || !myOrganizer || !parent) return false;

    // Organizer user_id vs parent user_id
    const organizerUserId = (myOrganizer as any).user_id;
    const parentUserId = (parent as any)?.user_id;

    return organizerUserId === parentUserId;
  }, [user, myOrganizer, parent]);

  const fullAddress = `${date.lugar ?? ''} ${date.direccion ?? ''} ${date.ciudad ?? ''}`.trim();
  const handleCopyAddress = React.useCallback(async () => {
    if (!fullAddress) return;
    try {
      await navigator.clipboard.writeText(fullAddress);
      showToast(t('link_copied', 'Link copied'), 'success');
    } catch {
      showToast(t('copy_failed', 'Could not copy'), 'error');
    }
  }, [fullAddress, showToast, t]);

  // RSVP: works with or without login; guests use localStorage.
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

  const [guestRsvpStatus, setGuestRsvpStatus] = React.useState<RSVPStatus | null>(() => readGuestRsvp(resolvedDateId));
  React.useEffect(() => {
    setGuestRsvpStatus(readGuestRsvp(resolvedDateId));
  }, [resolvedDateId, readGuestRsvp]);

  const {
    userStatus,
    stats,
    setStatus,
    isUpdating,
  } = useEventRSVP(resolvedDateId);

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

  const favoriteActive = user ? isEventFavorite(resolvedDateId) : guestFavorites.isEventFavorite(resolvedDateId);
  const onToggleFavorite = React.useCallback(async () => {
    if (!user) {
      try {
        const next = guestFavorites.toggleEventFavorite(resolvedDateId);
        showToast(
          next ? t("added_to_favorites", "Added to favorites") : t("removed_from_favorites", "Removed from favorites"),
          "success"
        );
      } catch {
        showToast(t("action_failed", "Could not complete the action"), "error");
      }
      return;
    }
    try {
      const next = await toggleEventFavorite(resolvedDateId);
      showToast(next ? t("added_to_favorites", "Added to favorites") : t("removed_from_favorites", "Removed from favorites"), "success");
    } catch {
      showToast(t("action_failed", "Could not complete the action"), "error");
    }
  }, [user, guestFavorites, toggleEventFavorite, resolvedDateId, showToast, t]);

  const handleStatusChange = React.useCallback(
    (s: RSVPStatus | null) => {
      if (isUpdating) return;
      if (!canMutateRsvpBackend) {
        try {
          if (s === null) localStorage.removeItem(GUEST_RSVP_KEY(resolvedDateId));
          else localStorage.setItem(GUEST_RSVP_KEY(resolvedDateId), s);
        } catch {
          // ignore
        }
        setGuestRsvpStatus(s);
        if (s === null) {
          showToast(t("rsvp_guest_cleared", "Preference updated"), "success");
        } else if (s === "interesado") {
          showToast(t("rsvp_guest_interested", "You're interested in this event"), "success");
        } else if (s === "going") {
          showToast(t("rsvp_guest_going", "See you at the event!"), "success");
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
            showToast(t('rsvp_error_toast', 'Could not save. Please try again.'), 'error');
          }
        });
    },
    [resolvedDateId, canMutateRsvpBackend, effectiveStatus, isUpdating, setStatus, showToast, t]
  );

  // Interested count (RPC get_event_rsvp_stats: { interesado, total }) — disabled for now
  // const interestedCount = React.useMemo(() => {
  //   if (!stats) return 0;
  //   const count = stats.interesado;
  //   if (typeof count !== 'number' || isNaN(count) || count < 0) {
  //     console.warn('[EventDatePublicScreen] Invalid interestedCount from stats:', stats);
  //     return 0;
  //   }
  //    
  //   return count;
  // }, [stats]);
  // Calendar start/end (specific date or recurring dia_semana)
  const { calendarStart, calendarEnd } = React.useMemo(() => {
    try {
      const horaInicio = (date.hora_inicio || '20:00').split(':').slice(0, 2).join(':');
      const horaFin = (date.hora_fin || date.hora_inicio || '23:00').split(':').slice(0, 2).join(':');

      let start: Date;
      let end: Date;
  
      // ✅ 1) Concrete date (or legacy display YMD): always use it
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



  const dateName = date.nombre || parent?.nombre || 'Dance event';
  const eventWhatsapp = React.useMemo(
    () => getEventWhatsapp(date as any, parent as any, organizerPublic as any),
    [date, parent, organizerPublic],
  );
  const aboutText = React.useMemo(() => resolveEventAboutText(date, parent), [date, parent]);
  const aboutSectionBody = React.useMemo(() => getEventDateAboutSectionBody(date), [date]);
  const calendarButton = (
    <AddToCalendarWithStats
      eventId={resolvedDateId}
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
  const flyerDate = getMediaBySlot(dateMedia, 'flyer')?.url;
  const flyerParent = getMediaBySlot(parentMedia, 'flyer')?.url;
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
    (flyerDate ? toUrl(flyerDate) : undefined) ||
    ((parent as any)?.flyer_url ? toUrl((parent as any).flyer_url) : undefined) ||
    (flyerParent ? toUrl(flyerParent) : undefined) ||
    ((parent as any)?.portada_url ? toUrl((parent as any).portada_url) : undefined) ||
    (p1Date ? toUrl(p1Date) : undefined) ||
    (p1Parent ? toUrl(p1Parent) : undefined) ||
    (avatarUrl ? toUrl(avatarUrl) : undefined) ||
    ((date as any).avatar_url ? toUrl((date as any).avatar_url) : undefined) ||
    ((parent as any)?.avatar_url ? toUrl((parent as any).avatar_url) : undefined) ||
    ((date as any).portada_url ? toUrl((date as any).portada_url) : undefined) ||
    (firstUrl ? toUrl(firstUrl) : undefined);
  const flyerCacheKey =
    ((date as any)?.updated_at as string | undefined) ||
    (date.created_at as string | undefined) ||
    '';

  const getRitmoName = (id: number) => {
    return ritmos?.find(r => r.id === id)?.nombre || `Rhythm ${id}`;
  };

  const getZonaName = (id: number) => {
    return zonas?.find(z => z.id === id)?.nombre || `Zone ${id}`;
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
        // Noon UTC to avoid day-shift when formatting for CDMX
        return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      }
      const parsed = new Date(dateStr);
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    })();

    const locale = getLocale(i18n.language || "es");
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
  const locationName = date.lugar || date.ciudad || (parent as any)?.ciudad || getZonaName((date.zonas || [])[0]) || 'Mexico';
  const hasLocation = !!(date.lugar || date.direccion || date.ciudad);
  const ritmosList = Array.isArray((date as any).ritmos)
    ? (date as any).ritmos.map((id: number) => getRitmoName(id)).slice(0, 3).join(', ')
    : '';
  const seoDescription = `${dateName} on ${formattedDate}${locationName ? ` in ${locationName}` : ''}${ritmosList ? ` · Styles: ${ritmosList}` : ''}.`;

  const seoImageRaw =
    baseFlyerUrl ||
    getMediaBySlot(dateMedia, 'p1')?.url ||
    getMediaBySlot(parentMedia, 'p1')?.url ||
    SEO_LOGO_URL;
  const seoImage = seoImageRaw === SEO_LOGO_URL ? SEO_LOGO_URL : (toDirectPublicStorageUrl(seoImageRaw) || seoImageRaw);
  const dateUrl = `${SEO_BASE_URL}/social/fecha/${resolvedDateId}`;
  const shareUrl = buildShareUrl("evento", String(resolvedDateId));

  const handleBack = React.useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(routes.app.explore);
    }
  }, [navigate]);

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
      showToast(t('link_copied', 'Link copied'), 'success');
    } catch {
      showToast(t('copy_failed', 'Could not copy'), 'error');
    }
  }, [shareUrl, dateName, t, showToast]);

  const dateStr = formatHeaderDate(displayYmd || "", i18n.language);
  /** Time text for hero + info card; if no hora_fin in DB, show only hora_inicio. */
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
    return startFmt;
  }, [date.hora_inicio, date.hora_fin]);
  const venueName = date.lugar || '';
  const costsSummary = React.useMemo(() => {
    const normalized = normalizeEventCosts((date as any)?.costos || []);
    const values = normalized.flatMap((c) => c.phases.map((p) => p.price)).filter((v) => Number.isFinite(v));
    if (!values.length) return "To be confirmed";
    const minValue = Math.min(...values.map((v) => Number(v)));
    if (minValue <= 0) return "Free";

    return new Intl.NumberFormat(getLocale(i18n.language || "es"), {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(minValue);
  }, [date, i18n.language]);
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
          'dance event',
          'Donde Bailar',
        ].filter(Boolean) as string[]}
      />
      <div id="event-detail-page" className="event-detail-screen">
        <EventHero
          title={dateName}
          flyerUrl={baseFlyerUrl ?? date.flyer_url ?? null}
          flyerCacheKey={flyerCacheKey || null}
          dateStr={dateStr}
          timeRange={timeRange}
          venueName={venueName}
          onShare={handleShare}
          onBack={handleBack}
          onToggleFavorite={onToggleFavorite}
          favoriteActive={favoriteActive}
          togglingEvent={user ? togglingEvent : false}
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
              {t("login", "Log in")}
            </Link>
            <span className="eds-guest-sync-hint__rest">
              {t("guest_sync_continue", "to sync favorites and RSVPs with your account.")}
            </span>
          </div>
        )}
        <div id="event-detail-content" className="eds-content">
          <section id="event-section-info" className="eds-section eds-section--info">
            <InfoGrid
              costsSummary={costsSummary}
              costsItems={Array.isArray(date.costos) ? (date.costos as any[]) : []}
              costsDisclaimer={t('price_disclaimer', 'Prices subject to change')}
              freeLabel={t('free', 'Free')}
              dateStr={dateStr}
              timeRange={timeRange}
              venueName={venueName}
              city={date.ciudad || undefined}
              mapsUrl={mapsUrl}
              fullAddress={fullAddress || undefined}
              onCopyAddress={fullAddress ? handleCopyAddress : undefined}
            />
          </section>
          {aboutSectionBody ? (
              <section id="event-section-about" className="eds-section eds-section--about">
                <div className="eds-section-header">
                  <h2 className="eds-section-title">{t('about_event', 'About the event')}</h2>
                  <div className="eds-section-underline" aria-hidden />
                </div>
                <ExpandableText
                  text={aboutSectionBody}
                  expandLabel={t('see_more', 'See more')}
                  collapseLabel={t('see_less', 'See less')}
                />
              </section>
          ) : null}
          {Array.isArray(date.cronograma) && date.cronograma.length > 0 && (
            <section id="event-section-schedule" className="eds-section eds-section--schedule">
              <div className="eds-section-header">
                <h2 className="eds-section-title">{t('schedule', 'Schedule')}</h2>
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
                mapsLabel={t('view_on_maps', 'Open in Google Maps')}
                copyLabel={t('copy_address')}
                copiedLabel={t('copied')}
              />
            </section>
          )}
          {date.requisitos && (
            <section id="event-section-requirements" className="eds-section eds-section--requirements">
              <div className="eds-section-header">
                <h2 className="eds-section-title">{t('requirements', 'Requirements')}</h2>
                <div className="eds-section-underline" aria-hidden />
              </div>
              <div className="eds-expandable">
                <p className="eds-expandable__text">{date.requisitos}</p>
              </div>
            </section>
          )}
          {eventWhatsapp.phone && (
            <section id="event-section-contact" className="eds-section eds-section--contact">
              <div className="eds-section-header">
                <h2 className="eds-section-title">{t('contact', 'Contact')}</h2>
                <div className="eds-section-underline" aria-hidden />
              </div>
              <ContactSection
                whatsappUrl={buildEventWhatsappUrl(eventWhatsapp.phone, eventWhatsapp.message, dateName) || '#'}
                whatsappLabel={t('consult_whatsapp', 'Contact via WhatsApp')}
                organizerName={parent?.nombre}
                showOrganizerContactBadge={eventWhatsapp.source === "organizer"}
              />
            </section>
          )}
          {hasMedia && (
            <section id="event-section-gallery" className="eds-section eds-section--gallery">
              <div className="eds-section-header">
                <h2 className="eds-section-title">{t('photo_gallery', 'Gallery')}</h2>
                <div className="eds-section-underline" aria-hidden />
              </div>
              <MediaGallery photos={carouselPhotos} videos={videos} photoCacheKey={flyerCacheKey || null} />
            </section>
          )}
        </div>
      </div>
    </>
  );
}