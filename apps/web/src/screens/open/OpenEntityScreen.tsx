import React from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEventDate } from "@/hooks/useEventDate";
import { useEventParent } from "@/hooks/useEventParent";
import { useTeacherPublic } from "@/hooks/useTeacher";
import { useAcademyPublic } from "@/hooks/useAcademy";
import { useOrganizerPublic as useOrganizerPublicByRouteId } from "@/hooks/useOrganizerPublic";
import { useBrandPublic } from "@/hooks/useBrand";
import { supabase } from "@/lib/supabase";
import { buildCanonicalUrl, buildDeepLink, buildShareUrl, type ShareEntityType } from "@/utils/shareUrls";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config/links";
import { SEO_LOGO_URL } from "@/lib/seoConfig";

type SmartPageClientEnv = {
  userAgent: string;
  isIos: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isEmbeddedBrowser: boolean;
};

function detectSmartPageClientEnv(): SmartPageClientEnv {
  if (typeof navigator === "undefined") {
    return {
      userAgent: "",
      isIos: false,
      isAndroid: false,
      isSafari: false,
      isEmbeddedBrowser: false,
    };
  }

  const userAgent = String(navigator.userAgent || "");
  const isIos = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  const isSafari = isIos && /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);
  const embeddedBrowserPattern = new RegExp(
    "FBAN|FBAV|Instagram|Line|MicroMessenger|TikTok|Snapchat|Pinterest|LinkedInApp|Twitter|X/",
    "i",
  );
  const isEmbeddedBrowser =
    embeddedBrowserPattern.test(userAgent) ||
    (isIos && !isSafari && /AppleWebKit/i.test(userAgent));

  return {
    userAgent,
    isIos,
    isAndroid,
    isSafari,
    isEmbeddedBrowser,
  };
}

function getSmartPageFallbackMessage(env: SmartPageClientEnv): string {
  if (env.isIos && env.isEmbeddedBrowser) {
    return "Si estas en un navegador embebido de iPhone, abre esta pagina en Safari y vuelve a tocar Abrir en la app.";
  }
  if (env.isIos) {
    return "Si la app no se abrio automaticamente, confirma que este instalada y vuelve a intentar desde Safari.";
  }
  return "Si la app no se abrio automaticamente, usa Ver en navegador o descarga la app.";
}

function logSmartPage(tag: "[SMART_PAGE]" | "[DEEPLINK_IOS]", payload: Record<string, unknown>): void {
  if (typeof console?.log !== "function") return;
  try {
    console.log(tag, JSON.stringify(payload));
  } catch {
    console.log(tag, payload);
  }
}

function getStoreUrl(): string {
  if (typeof navigator === "undefined") return APP_STORE_URL;
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return PLAY_STORE_URL;
  if (/iphone|ipad|ipod/.test(ua)) return APP_STORE_URL;
  return APP_STORE_URL;
}
import {
  resolveOpenEntityImageEvento,
  resolveOpenEntityImageClase,
  resolveOpenEntityImageProfile,
  getOpenEntityImageForMeta,
} from "@/utils/resolveOpenEntityImage";
import {
  buildOpenClasePresentation,
  buildOpenEventoPresentation,
  buildOpenProfilePresentation,
} from "@/utils/openEntityMeta";
import SeoHead from "@/components/SeoHead";
import { useTranslation } from "react-i18next";

function getSmartPageKindLabel(entityType: ShareEntityType): string {
  switch (entityType) {
    case "evento":
      return "Evento";
    case "clase":
      return "Clase";
    case "academia":
      return "Academia";
    case "maestro":
      return "Maestro";
    case "organizer":
      return "Organizador";
    case "user":
      return "Perfil";
    case "marca":
      return "Marca";
    default:
      return "Donde Bailar";
  }
}

/** Misma línea visual que el offcanvas: capas oscuras, teal #297F96, tarjeta con profundidad. */
const SMART_PAGE_SHELL_CSS = `
.sp-root {
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(165deg, #0a0c10 0%, #12151c 38%, #0c0f14 100%);
  color: #f4f6fb;
  padding: max(20px, env(safe-area-inset-top, 0px)) 18px calc(24px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.sp-card {
  width: min(100%, 380px);
  max-width: 100%;
  background: linear-gradient(180deg, #12151c 0%, #0c0f14 48%, #0a0c10 100%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.06) inset;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.sp-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(180deg, rgba(41, 127, 150, 0.14) 0%, rgba(18, 21, 28, 0) 100%);
}
.sp-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
.sp-brand-logo { width: 36px; height: 36px; border-radius: 10px; object-fit: cover; box-shadow: 0 4px 14px rgba(0,0,0,0.35); flex-shrink: 0; }
.sp-brand-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.sp-brand-name { font-size: 1.05rem; font-weight: 700; color: #f4f6fb; letter-spacing: -0.02em; line-height: 1.2; }
.sp-brand-tag { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(186, 230, 253, 0.55); }
.sp-media-frame { padding: 12px 14px 0; }
.sp-media {
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.sp-media img { display: block; width: 100%; height: 100%; object-fit: contain; }
.sp-content { padding: 18px 18px 8px; }
.sp-title { margin: 0; font-size: 1.2rem; font-weight: 700; line-height: 1.3; color: #f8fafc; letter-spacing: -0.02em; }
.sp-subtitle { margin: 8px 0 0; font-size: 0.92rem; color: rgba(203, 213, 225, 0.88); line-height: 1.35; }
.sp-place { margin: 8px 0 0; font-size: 0.85rem; color: rgba(148, 163, 184, 0.95); }
.sp-actions { padding: 8px 16px 18px; display: flex; flex-direction: column; gap: 10px; }
.sp-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 52px;
  padding: 14px 18px;
  border-radius: 14px;
  font-weight: 650;
  font-size: 0.98rem;
  text-align: center;
  text-decoration: none;
  box-sizing: border-box;
  border: none;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.12s ease, filter 0.18s ease;
}
.sp-btn:active { transform: scale(0.99); }
.sp-btn--primary {
  background: linear-gradient(135deg, rgba(30, 107, 130, 0.95) 0%, rgba(41, 127, 150, 1) 50%, rgba(41, 127, 150, 0.92) 100%);
  color: #fff;
  box-shadow: 0 8px 24px rgba(41, 127, 150, 0.35), 0 1px 3px rgba(0, 0, 0, 0.25);
}
.sp-btn--primary:hover { filter: brightness(1.06); }
.sp-btn--secondary {
  background: rgba(255, 255, 255, 0.04);
  color: #e5e7eb;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.sp-btn--secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.14);
}
.sp-btn--muted {
  background: rgba(41, 127, 150, 0.22);
  color: #e0f2fe;
  border: 1px solid rgba(41, 127, 150, 0.35);
}
.sp-btn--muted:hover { background: rgba(41, 127, 150, 0.32); }
.sp-hint {
  margin: -2px 0 0;
  font-size: 0.8rem;
  color: rgba(148, 163, 184, 0.88);
  text-align: center;
  line-height: 1.35;
}
.sp-fallback {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.sp-fallback p { margin: 0; font-size: 0.88rem; color: rgba(226, 232, 240, 0.88); text-align: center; }
.sp-caption { margin: 4px 0 0; font-size: 0.78rem; color: rgba(148, 163, 184, 0.85); text-align: center; line-height: 1.4; }
.sp-stores { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.sp-store {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  box-sizing: border-box;
}
.sp-store--ios { background: #0a0a0a; border: 1px solid rgba(255,255,255,0.12); }
.sp-store--play {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.sp-page-foot {
  margin-top: 1.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgba(100, 116, 139, 0.95);
  text-align: center;
  max-width: 380px;
}
.sp-page-foot span { display: block; margin-top: 6px; opacity: 0.85; word-break: break-all; font-weight: 500; letter-spacing: 0; }
`;

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
  const rawTypeParam = params.type;
  const typeParam =
    rawTypeParam === "teacher" || rawTypeParam === "academy" ? rawTypeParam : null;
  const indexParam = searchParams.get("i");
  const diaParam = searchParams.get("dia");
  const index = indexParam !== null && indexParam !== "" ? parseInt(indexParam, 10) : undefined;
  const dia = diaParam !== null && diaParam !== "" ? parseInt(diaParam, 10) : undefined;
  const idNum = parseInt(idParam, 10);
  const isValidNumId = Number.isFinite(idNum) && idNum > 0;
  const isValidRouteId = idParam.trim().length > 0;

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
    if (!isValidNumId || !typeParam) return <OpenNotFound entityType={entityType} />;
    return (
      <OpenClaseContent
        sourceType={typeParam}
        profileId={idNum}
        classIndex={Number.isFinite(index) ? index : undefined}
        dia={Number.isFinite(dia) ? dia : undefined}
      />
    );
  }

  if (isProfileEntityType(entityType)) {
    const isValidProfileId =
      entityType === "user" || entityType === "organizer"
        ? isValidRouteId
        : isValidNumId;
    if (!isValidProfileId) {
      return <OpenNotFound entityType={entityType} />;
    }
    return (
      <OpenProfileContent
        profileType={entityType}
        id={entityType === "user" || entityType === "organizer" ? idParam : String(idNum)}
      />
    );
  }

  return <OpenNotFound entityType="evento" />;
}

function OpenEventoContent({ dateId, dateIdParam }: { dateId: number; dateIdParam: string }) {
  const { i18n } = useTranslation();
  const { data: date, isLoading, isError } = useEventDate(dateId);
  const parentId = date?.parent_id ?? undefined;
  const { data: parent } = useEventParent(parentId);

  if (isLoading || !date) {
    if (isError || (!isLoading && !date)) return <OpenNotFound entityType="evento" />;
    return <OpenLoading />;
  }

  const imageResult = resolveOpenEntityImageEvento({
    date: date as Record<string, unknown>,
    parent: parent as Record<string, unknown> | undefined,
  });
  const presentation = buildOpenEventoPresentation(
    date as Record<string, unknown>,
    parent as Record<string, unknown> | undefined,
    i18n.language,
  );

  const canonicalUrl = buildCanonicalUrl("evento", String(dateId));
  const deepLink = buildDeepLink("evento", String(dateId));
  const shareUrl = buildShareUrl("evento", String(dateIdParam || dateId));

  return (
    <OpenLayout
      entityType="evento"
      entityId={String(dateId)}
      title={presentation.title}
      subtitle={presentation.subtitle}
      place={presentation.place}
      imageUrl={imageResult.imageUrl}
      canonicalUrl={canonicalUrl}
      deepLink={deepLink}
      shareUrl={shareUrl}
      seoTitle={presentation.seoTitle}
      seoDescription={presentation.seoDescription}
      seoImage={getOpenEntityImageForMeta(imageResult)}
      seoUrl={shareUrl}
    />
  );
}

function OpenClaseContent({
  sourceType,
  profileId,
  classIndex,
  dia,
}: {
  sourceType: "teacher" | "academy";
  profileId: number;
  classIndex?: number;
  dia?: number;
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

  const imageResult = resolveOpenEntityImageClase({
    profile: profile as Record<string, unknown>,
    sourceType,
    classIndex,
  });
  const presentation = buildOpenClasePresentation(profile as Record<string, unknown>, classIndex);

  const canonicalUrl = buildCanonicalUrl("clase", String(profileId), {
    type: sourceType,
    index: classIndex,
    dia,
  });
  const deepLink = buildDeepLink("clase", String(profileId), {
    type: sourceType,
    index: classIndex,
    dia,
  });
  const shareUrl = buildShareUrl("clase", String(profileId), {
    type: sourceType,
    index: classIndex,
    dia,
  });

  return (
    <OpenLayout
      entityType="clase"
      entityId={String(profileId)}
      title={presentation.title}
      subtitle={presentation.subtitle}
      place={presentation.place}
      imageUrl={imageResult.imageUrl}
      canonicalUrl={canonicalUrl}
      deepLink={deepLink}
      shareUrl={shareUrl}
      seoTitle={presentation.seoTitle}
      seoDescription={presentation.seoDescription}
      seoImage={getOpenEntityImageForMeta(imageResult)}
      seoUrl={shareUrl}
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
  const organizerByRouteIdQ = useOrganizerPublicByRouteId(profileType === "organizer" ? id : undefined);
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
          ? organizerByRouteIdQ
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

  const imageResult = resolveOpenEntityImageProfile({
    profile: profile as Record<string, unknown>,
  });

  const presentation = buildOpenProfilePresentation(profileType, profile as Record<string, unknown>);

  const canonicalUrl = buildCanonicalUrl(profileType, id);
  const deepLink = buildDeepLink(profileType, id);
  const shareUrl = buildShareUrl(profileType, id);

  return (
    <OpenLayout
      entityType={profileType}
      entityId={id}
      title={presentation.title}
      subtitle={undefined}
      place={undefined}
      imageUrl={imageResult.imageUrl}
      canonicalUrl={canonicalUrl}
      deepLink={deepLink}
      shareUrl={shareUrl}
      seoTitle={presentation.seoTitle}
      seoDescription={presentation.seoDescription}
      seoImage={getOpenEntityImageForMeta(imageResult)}
      seoUrl={shareUrl}
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

function OpenLayout({
  entityType,
  entityId,
  title,
  subtitle,
  place,
  imageUrl,
  canonicalUrl,
  deepLink,
  shareUrl,
  seoTitle,
  seoDescription,
  seoImage,
  seoUrl,
}: {
  entityType: ShareEntityType;
  entityId: string;
  title: string;
  subtitle?: string;
  place?: string;
  imageUrl: string;
  canonicalUrl: string;
  deepLink: string;
  shareUrl: string;
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
  seoUrl?: string;
}) {
  const [showFallback, setShowFallback] = React.useState(false);
  const openTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const didBackgroundRef = React.useRef(false);
  const env = React.useMemo(() => detectSmartPageClientEnv(), []);
  const fallbackMessage = React.useMemo(() => getSmartPageFallbackMessage(env), [env]);
  const showIosEmbeddedHint = env.isIos && env.isEmbeddedBrowser;

  const handleOpenInApp = React.useCallback(() => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    didBackgroundRef.current = false;
    setShowFallback(false);

    logSmartPage("[SMART_PAGE]", {
      event: "open_in_app_click",
      entityType,
      id: entityId,
      deepLink,
      canonicalUrl,
      shareUrl,
      env,
    });
    logSmartPage("[SMART_PAGE_DEEPLINK]", { entityType, id: entityId, deepLink });
    logSmartPage("[SMART_PAGE_CANONICAL]", { entityType, id: entityId, canonicalUrl });
    if (env.isIos) {
      logSmartPage("[DEEPLINK_IOS]", {
        event: "open_attempt",
        deepLink,
        canonicalUrl,
        shareUrl,
        isSafari: env.isSafari,
        isEmbeddedBrowser: env.isEmbeddedBrowser,
      });
    }

    openTimeoutRef.current = setTimeout(() => {
      openTimeoutRef.current = null;
      if (didBackgroundRef.current) return;
      logSmartPage(env.isIos ? "[DEEPLINK_IOS]" : "[SMART_PAGE]", {
        event: "open_timeout_fallback",
        deepLink,
        canonicalUrl,
        shareUrl,
        isSafari: env.isSafari,
        isEmbeddedBrowser: env.isEmbeddedBrowser,
      });
      setShowFallback(true);
    }, env.isIos ? 2200 : 2000);
  }, [canonicalUrl, deepLink, entityId, entityType, env, shareUrl]);

  React.useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    };
  }, []);

  React.useEffect(() => {
    logSmartPage("[SMART_PAGE]", {
      event: "render",
      entityType,
      id: entityId,
      deepLink,
      canonicalUrl,
      shareUrl,
      env,
    });
    logSmartPage("[SMART_PAGE_DEEPLINK]", { entityType, id: entityId, deepLink });
    logSmartPage("[SMART_PAGE_CANONICAL]", { entityType, id: entityId, canonicalUrl });
    if (env.isIos) {
      logSmartPage("[DEEPLINK_IOS]", {
        event: "render",
        deepLink,
        canonicalUrl,
        shareUrl,
        isSafari: env.isSafari,
        isEmbeddedBrowser: env.isEmbeddedBrowser,
      });
    }
  }, [canonicalUrl, deepLink, entityId, entityType, env, shareUrl]);

  React.useEffect(() => {
    if (!showFallback) return;
    const t = setTimeout(() => setShowFallback(false), 8000);
    return () => clearTimeout(t);
  }, [showFallback]);

  React.useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        didBackgroundRef.current = true;
        logSmartPage(env.isIos ? "[DEEPLINK_IOS]" : "[SMART_PAGE]", {
          event: "document_hidden",
          deepLink,
          shareUrl,
        });
        if (openTimeoutRef.current) {
          clearTimeout(openTimeoutRef.current);
          openTimeoutRef.current = null;
        }
      }
    };
    const onPageHide = () => {
      didBackgroundRef.current = true;
      logSmartPage(env.isIos ? "[DEEPLINK_IOS]" : "[SMART_PAGE]", {
        event: "pagehide",
        deepLink,
        shareUrl,
      });
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
        openTimeoutRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [deepLink, env, shareUrl]);

  return (
    <>
      {seoTitle != null && (
        <SeoHead
          title={seoTitle}
          description={seoDescription ?? title}
          image={seoImage}
          url={seoUrl}
        />
      )}
      <style>{SMART_PAGE_SHELL_CSS}</style>
      <div className="sp-root">
        <div className="sp-card">
          <header className="sp-topbar">
            <div className="sp-brand">
              <img src={SEO_LOGO_URL} alt="" width={36} height={36} className="sp-brand-logo" />
              <div className="sp-brand-text">
                <span className="sp-brand-name">Donde Bailar</span>
                <span className="sp-brand-tag">{getSmartPageKindLabel(entityType)}</span>
              </div>
            </div>
          </header>
          <div className="sp-media-frame">
            <div className="sp-media">
              <img src={imageUrl} alt="" />
            </div>
          </div>
          <section className="sp-content">
            <h1 className="sp-title">{title}</h1>
            {subtitle ? <p className="sp-subtitle">{subtitle}</p> : null}
            {place ? <p className="sp-place">📍 {place}</p> : null}
          </section>
          <section className="sp-actions">
            <a href={deepLink} onClick={handleOpenInApp} className="sp-btn sp-btn--primary">
              <img
                src={SEO_LOGO_URL}
                alt=""
                aria-hidden
                width={22}
                height={22}
                style={{ borderRadius: 6, objectFit: "contain", flexShrink: 0 }}
              />
              <OpenInAppIcon />
              Abrir en la app
            </a>
            {showIosEmbeddedHint ? (
              <p className="sp-hint">
                Si estas en Instagram, Facebook u otro navegador embebido de iPhone, puede que necesites
                abrir esta pagina en Safari.
              </p>
            ) : null}
            {showFallback ? (
              <div className="sp-fallback">
                <p>{fallbackMessage}</p>
                <a
                  href={getStoreUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sp-btn sp-btn--muted"
                >
                  Descargar en tu tienda
                </a>
              </div>
            ) : null}
            <a href={canonicalUrl} className="sp-btn sp-btn--secondary">
              <GlobeIcon />
              Ver en navegador
            </a>
            <p className="sp-caption">
              Comparte este enlace o abre el contenido en tu app, en web o desde la tienda correcta.
            </p>
            <div className="sp-stores">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Descargar en App Store"
                className="sp-store sp-store--ios"
              >
                <AppleLogoIconSmall />
                <span>App Store</span>
              </a>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Descargar en Google Play"
                className="sp-store sp-store--play"
              >
                <span>Google Play</span>
              </a>
            </div>
          </section>
        </div>
        <p className="sp-page-foot">
          Donde Bailar · Clases y eventos de baile
          <span>{shareUrl}</span>
        </p>
      </div>
    </>
  );
}

function OpenLoading() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(165deg, #0a0c10 0%, #12151c 38%, #0c0f14 100%)",
        color: "#f4f6fb",
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
            border: "3px solid rgba(255,255,255,0.12)",
            borderTopColor: "#297f96",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 1rem",
          }}
        />
        <p style={{ margin: 0, opacity: 0.85 }}>Cargando...</p>
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
        minHeight: "100dvh",
        background: "linear-gradient(165deg, #0a0c10 0%, #12151c 38%, #0c0f14 100%)",
        color: "#f4f6fb",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: "1.5rem", marginBottom: "0.75rem", fontWeight: 700 }}>
        No encontrado
      </h2>
      <p style={{ marginBottom: "1.5rem", opacity: 0.88, color: "rgba(203, 213, 225, 0.9)" }}>
        Este {label} no existe o fue eliminado.
      </p>
      <Link
        to="/explore"
        style={{
          padding: "0.85rem 1.5rem",
          borderRadius: 14,
          background: "linear-gradient(135deg, rgba(30, 107, 130, 0.95) 0%, rgba(41, 127, 150, 1) 100%)",
          color: "#fff",
          fontWeight: 650,
          textDecoration: "none",
          boxShadow: "0 8px 24px rgba(41, 127, 150, 0.3)",
        }}
      >
        Explorar
      </Link>
    </div>
  );
}
