import React from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEventDate } from "@/hooks/useEventDate";
import { useEventParent } from "@/hooks/useEventParent";
import { useTeacherPublic } from "@/hooks/useTeacher";
import { useAcademyPublic } from "@/hooks/useAcademy";
import { useOrganizerPublic } from "@/hooks/useOrganizer";
import { useBrandPublic } from "@/hooks/useBrand";
import { supabase } from "@/lib/supabase";
import { buildCanonicalUrl, buildDeepLink, type ShareEntityType } from "@/utils/shareUrls";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config/links";
import { SEO_LOGO_URL } from "@/lib/seoConfig";
import { toDirectPublicStorageUrl } from "@/utils/imageOptimization";
import { getMediaBySlot, normalizeMediaArray } from "@/utils/mediaSlots";
import { formatHeaderDate, formatHeaderTimeRange } from "@/components/events/EventDetail/helpers";
import { resolveEventDateYmd } from "@/utils/eventDateDisplay";

const PROFILE_ENTITY_TYPES: ShareEntityType[] = [
  "academia",
  "maestro",
  "organizer",
  "user",
  "marca",
];

function isProfileEntityType(t: ShareEntityType): t is "academia" | "maestro" | "organizer" | "user" | "marca" {
  return PROFILE_ENTITY_TYPES.includes(t);
}

type Props = { entityType: ShareEntityType };

export default function OpenEntityScreen({ entityType }: Props) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const idParam = params.id ?? "";
  const typeParam = (params.type as "teacher" | "academy") ?? "academy";
  const indexParam = searchParams.get("i");
  const index = indexParam !== null && indexParam !== "" ? parseInt(indexParam, 10) : undefined;
  const idNum = parseInt(idParam, 10);
  const isValidNumId = Number.isFinite(idNum) && idNum > 0;
  const isValidUserId = entityType === "user" && idParam.length > 0;

  if (entityType === "evento") {
    if (!isValidNumId) return <OpenNotFound entityType={entityType} />;
    return (
      <OpenEventoContent
        dateId={idNum}
        dateIdParam={idParam}
      />
    );
  }

  if (entityType === "clase") {
    if (!isValidNumId) return <OpenNotFound entityType={entityType} />;
    return (
      <OpenClaseContent
        sourceType={typeParam}
        profileId={idNum}
        classIndex={Number.isFinite(index) ? index : undefined}
      />
    );
  }

  if (isProfileEntityType(entityType)) {
    if (entityType === "user" ? !isValidUserId : !isValidNumId) {
      return <OpenNotFound entityType={entityType} />;
    }
    return (
      <OpenProfileContent
        profileType={entityType}
        id={entityType === "user" ? idParam : String(idNum)}
      />
    );
  }

  return <OpenNotFound entityType="evento" />;
}

function OpenEventoContent({ dateId, dateIdParam }: { dateId: number; dateIdParam: string }) {
  const { data: date, isLoading, isError } = useEventDate(dateId);
  const parentId = date?.parent_id ?? undefined;
  const { data: parent } = useEventParent(parentId);

  if (isLoading || !date) {
    if (isError || (!isLoading && !date)) return <OpenNotFound entityType="evento" />;
    return <OpenLoading />;
  }

  const dateMedia = normalizeMediaArray((date as any)?.media);
  const parentMedia = normalizeMediaArray((parent as any)?.media);
  const bannerUrl =
    getMediaBySlot(dateMedia, "cover")?.url ||
    getMediaBySlot(parentMedia, "cover")?.url ||
    getMediaBySlot(dateMedia, "p1")?.url ||
    getMediaBySlot(parentMedia, "p1")?.url;
  const imageUrl = bannerUrl
    ? (toDirectPublicStorageUrl(bannerUrl) || bannerUrl)
    : SEO_LOGO_URL;

  const displayYmd = resolveEventDateYmd(date);
  const title = (date as any).nombre || (parent as any)?.nombre || "Evento de baile";
  const dateStr = formatHeaderDate(displayYmd || "");
  const timeStr = formatHeaderTimeRange(
    (date as any).hora_inicio,
    (date as any).hora_fin
  );
  const lugar = (date as any).lugar;
  const ciudad = (date as any).ciudad;
  const parentSede = (parent as any)?.sede_general;
  const place = [lugar, ciudad].filter(Boolean).join(", ") || parentSede || "";

  const canonicalUrl = buildCanonicalUrl("evento", String(dateId));
  const deepLink = buildDeepLink("evento", String(dateId));

  return (
    <OpenLayout
      entityType="evento"
      title={title}
      subtitle={[dateStr, timeStr].filter(Boolean).join(" · ")}
      place={place}
      imageUrl={imageUrl}
      canonicalUrl={canonicalUrl}
      deepLink={deepLink}
    />
  );
}

function OpenClaseContent({
  sourceType,
  profileId,
  classIndex,
}: {
  sourceType: "teacher" | "academy";
  profileId: number;
  classIndex?: number;
}) {
  const teacherQ = useTeacherPublic(sourceType === "teacher" ? profileId : (undefined as any));
  const academyQ = useAcademyPublic(sourceType === "academy" ? profileId : (undefined as any));
  const profile = sourceType === "teacher" ? teacherQ.data : academyQ.data;
  const isLoading = sourceType === "teacher" ? teacherQ.isLoading : academyQ.isLoading;
  const isError = sourceType === "teacher" ? teacherQ.isError : academyQ.isError;

  if (isLoading || !profile) {
    if (isError || (!isLoading && !profile)) return <OpenNotFound entityType="clase" />;
    return <OpenLoading />;
  }

  const cronograma = (profile as any)?.cronograma || (profile as any)?.horarios || [];
  const entry = Array.isArray(cronograma) && classIndex != null && cronograma[classIndex]
    ? cronograma[classIndex]
    : cronograma[0];
  const classTitle =
    (entry as any)?.nombre ||
    (entry as any)?.nombre_clase ||
    (profile as any)?.nombre_publico ||
    "Clase de baile";
  const ubicaciones = (profile as any)?.ubicaciones || [];
  const firstUbicacion = Array.isArray(ubicaciones) ? ubicaciones[0] : null;
  const place =
    (firstUbicacion as any)?.nombre ||
    (firstUbicacion as any)?.ciudad ||
    (profile as any)?.ciudad ||
    "";

  const mediaList = (profile as any)?.media;
  const coverUrl =
    getMediaBySlot(Array.isArray(mediaList) ? mediaList : [], "cover")?.url ||
    (profile as any)?.avatar_url ||
    (profile as any)?.banner_url;
  const imageUrl = coverUrl
    ? (toDirectPublicStorageUrl(coverUrl) || coverUrl)
    : SEO_LOGO_URL;

  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const diaNum = (entry as any)?.diaSemana ?? (entry as any)?.dia_semana;
  const dayLabel =
    typeof diaNum === "number" && diaNum >= 0 && diaNum <= 6
      ? dayNames[diaNum]
      : null;
  const subtitle = dayLabel
    ? dayLabel + ((entry as any)?.hora ? ` · ${String((entry as any).hora)}` : "")
    : (entry as any)?.hora
      ? String((entry as any).hora)
      : (profile as any)?.nombre_publico
        ? ""
        : "Clase";

  const canonicalUrl = buildCanonicalUrl("clase", String(profileId), {
    type: sourceType,
    index: classIndex,
  });
  const deepLink = buildDeepLink("clase", String(profileId), {
    type: sourceType,
    index: classIndex,
  });

  return (
    <OpenLayout
      entityType="clase"
      title={classTitle}
      subtitle={subtitle || (profile as any)?.nombre_publico}
      place={place}
      imageUrl={imageUrl}
      canonicalUrl={canonicalUrl}
      deepLink={deepLink}
    />
  );
}

type ProfileEntityType = "academia" | "maestro" | "organizer" | "user" | "marca";

function OpenProfileContent({
  profileType,
  id,
}: {
  profileType: ProfileEntityType;
  id: string;
}) {
  const academyQ = useAcademyPublic(profileType === "academia" ? parseInt(id, 10) : (undefined as any));
  const teacherQ = useTeacherPublic(profileType === "maestro" ? parseInt(id, 10) : (undefined as any));
  const organizerQ = useOrganizerPublic(profileType === "organizer" ? parseInt(id, 10) : (undefined as any));
  const brandQ = useBrandPublic(profileType === "marca" ? parseInt(id, 10) : (undefined as any));
  const userQ = useQuery({
    queryKey: ["user-public", id],
    enabled: profileType === "user" && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_user_public")
        .select("*")
        .eq("user_id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const which =
    profileType === "academia"
      ? academyQ
      : profileType === "maestro"
        ? teacherQ
        : profileType === "organizer"
          ? organizerQ
          : profileType === "marca"
            ? brandQ
            : userQ;
  const profile = which.data;
  const isLoading = which.isLoading;
  const isError = (which as any).isError;

  if (isLoading || !profile) {
    if (isError || (!isLoading && !profile)) return <OpenNotFound entityType={profileType} />;
    return <OpenLoading />;
  }

  const mediaList = (profile as any)?.media;
  const mediaArr = Array.isArray(mediaList) ? mediaList : [];
  const avatarUrl =
    getMediaBySlot(mediaArr, "avatar")?.url ||
    (profile as any)?.avatar_url ||
    (profile as any)?.logo_url ||
    getMediaBySlot(mediaArr, "cover")?.url ||
    (profile as any)?.banner_url;
  const imageUrl = avatarUrl
    ? (toDirectPublicStorageUrl(avatarUrl) || avatarUrl)
    : SEO_LOGO_URL;

  const title =
    (profile as any)?.nombre_publico ||
    (profile as any)?.nombre ||
    (profile as any)?.nombre_organizador ||
    (profile as any)?.full_name ||
    (profile as any)?.nombre_marca ||
    "Perfil";

  const place =
    (profile as any)?.ciudad ||
    (profile as any)?.ciudad_principal ||
    (profile as any)?.ubicacion_principal ||
    "";

  const canonicalUrl = buildCanonicalUrl(profileType, id);
  const deepLink = buildDeepLink(profileType, id);

  return (
    <OpenLayout
      entityType={profileType}
      title={title}
      subtitle={undefined}
      place={place}
      imageUrl={imageUrl}
      canonicalUrl={canonicalUrl}
      deepLink={deepLink}
    />
  );
}

function OpenInAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function AppleLogoIconSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function GooglePlayIconSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L13.792 12l3.906-3.491zM5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.635z" />
    </svg>
  );
}

function OpenLayout({
  entityType,
  title,
  subtitle,
  place,
  imageUrl,
  canonicalUrl,
  deepLink,
}: {
  entityType: ShareEntityType;
  title: string;
  subtitle?: string;
  place?: string;
  imageUrl: string;
  canonicalUrl: string;
  deepLink: string;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f0f14 0%, #1a1a24 100%)",
        color: "#f5f5f5",
        padding: "2rem 1.25rem",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 24,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            width: "100%",
            aspectRatio: "16/10",
            background: "#1a1a24",
            objectFit: "cover",
          }}
        >
          <img
            src={imageUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
        <div style={{ padding: "1.5rem 1.25rem" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "1.35rem",
              fontWeight: 800,
              lineHeight: 1.3,
              marginBottom: subtitle ? "0.35rem" : 0,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                margin: 0,
                fontSize: "0.95rem",
                color: "rgba(255,255,255,0.75)",
                marginBottom: place ? "0.35rem" : 0,
              }}
            >
              {subtitle}
            </p>
          )}
          {place && (
            <p
              style={{
                margin: 0,
                fontSize: "0.9rem",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              📍 {place}
            </p>
          )}
        </div>
        <div
          style={{
            padding: "0 1.25rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.875rem",
          }}
        >
          <a
            href={deepLink}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              width: "100%",
              padding: "1rem 1.25rem",
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #1a7a8c 0%, #2d9cdb 100%)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.05rem",
              cursor: "pointer",
              textAlign: "center",
              textDecoration: "none",
              boxSizing: "border-box",
              boxShadow: "0 4px 16px rgba(45,156,219,0.35), 0 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            <OpenInAppIcon />
            Abrir en la app
          </a>
          <a
            href={canonicalUrl}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              width: "100%",
              padding: "0.95rem 1.25rem",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.08)",
              color: "#f0f0f0",
              fontWeight: 600,
              fontSize: "1rem",
              textAlign: "center",
              textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            <GlobeIcon />
            Ver en navegador
          </a>
          <p
            style={{
              margin: "0.5rem 0 0",
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.5)",
              textAlign: "center",
            }}
          >
            ¿No tienes la app?
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Descargar en App Store"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                height: 40,
                padding: "0 14px",
                borderRadius: 8,
                background: "#000",
                color: "#fff",
                fontSize: "0.75rem",
                fontWeight: 600,
                textDecoration: "none",
                letterSpacing: "0.01em",
                boxSizing: "border-box",
              }}
            >
              <AppleLogoIconSmall />
              <span>App Store</span>
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Disponible en Google Play"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                height: 40,
                padding: "0 14px",
                borderRadius: 8,
                background: "#000",
                color: "#fff",
                fontSize: "0.75rem",
                fontWeight: 600,
                textDecoration: "none",
                letterSpacing: "0.01em",
                boxSizing: "border-box",
              }}
            >
              <GooglePlayIconSmall />
              <span>Google Play</span>
            </a>
          </div>
        </div>
      </div>
      <p
        style={{
          marginTop: "1.5rem",
          fontSize: "0.8rem",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        Dónde Bailar · Clases y eventos de baile
      </p>
    </div>
  );
}

function OpenLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f0f14 0%, #1a1a24 100%)",
        color: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: "3px solid rgba(255,255,255,0.2)",
            borderTopColor: "#2d9cdb",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 1rem",
          }}
        />
        <p style={{ margin: 0, opacity: 0.8 }}>Cargando...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function OpenNotFound({ entityType }: { entityType: ShareEntityType }) {
  const label =
    entityType === "evento"
      ? "evento"
      : entityType === "clase"
        ? "clase"
        : "perfil";
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f0f14 0%, #1a1a24 100%)",
        color: "#f5f5f5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
        No encontrado
      </h2>
      <p style={{ marginBottom: "1.5rem", opacity: 0.8 }}>
        Este {label} no existe o fue eliminado.
      </p>
      <Link
        to="/explore"
        style={{
          padding: "0.75rem 1.5rem",
          borderRadius: 999,
          background: "rgba(45,156,219,0.3)",
          color: "#7ec8e3",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Explorar
      </Link>
    </div>
  );
}
