import type { IncomingMessage, ServerResponse } from "http";
import { supabaseAdmin } from "./_supabaseAdmin";
type ShareEntityType =
  | "evento"
  | "clase"
  | "academia"
  | "maestro"
  | "organizer"
  | "user"
  | "marca";

const SITE_URL =
  process.env.SITE_URL ||
  process.env.VITE_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://dondebailar.com.mx");
const APP_STORE_URL =
  process.env.VITE_APP_STORE_URL ||
  "https://apps.apple.com/mx/app/donde-bailar-mx/id6756324774";
const PLAY_STORE_URL =
  process.env.VITE_PLAY_STORE_URL ||
  "https://play.google.com/store/apps/details?id=com.tuorg.dondebailarmx.app";
const SEO_LOGO_URL =
  "https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/DB_LOGO150.webp";

type ClassType = "teacher" | "academy";
type OpenPayload = {
  shareUrl: string;
  canonicalUrl: string;
  deepLink: string;
  title: string;
  subtitle?: string;
  place?: string;
  imageUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoImage: string;
  entityLabel: string;
};

type ResolveOpenEntityImageResult = {
  imageUrl: string;
  imageSourceType: "flyer_url" | "media" | "cover" | "avatar" | "fallback_entity";
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseClassType(value: string | null): ClassType | null {
  return value === "teacher" || value === "academy" ? value : null;
}

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function buildShareUrl(entityType: ShareEntityType, id: string, opts?: { type?: string; index?: number }): string {
  const base = `${SITE_URL.replace(/\/+$/, "")}/open`;
  if (entityType === "evento") return `${base}/evento/${id}`;
  if (entityType === "clase") {
    const type = opts?.type ?? "academy";
    const path = `${base}/clase/${type}/${id}`;
    return Number.isFinite(opts?.index) ? `${path}?i=${opts?.index}` : path;
  }
  if (entityType === "academia") return `${base}/academia/${id}`;
  if (entityType === "maestro") return `${base}/maestro/${id}`;
  if (entityType === "organizer") return `${base}/organizer/${id}`;
  if (entityType === "user") return `${base}/u/${encodeURIComponent(id)}`;
  if (entityType === "marca") return `${base}/marca/${id}`;
  return `${base}/evento/${id}`;
}

function buildCanonicalUrl(entityType: ShareEntityType, id: string, opts?: { type?: string; index?: number }): string {
  const base = SITE_URL.replace(/\/+$/, "");
  if (entityType === "evento") return `${base}/social/fecha/${id}`;
  if (entityType === "clase") {
    const type = opts?.type ?? "academy";
    const path = `${base}/clase/${type}/${id}`;
    return Number.isFinite(opts?.index) ? `${path}?i=${opts?.index}` : path;
  }
  if (entityType === "academia") return `${base}/academia/${id}`;
  if (entityType === "maestro") return `${base}/maestro/${id}`;
  if (entityType === "organizer") return `${base}/organizer/${id}`;
  if (entityType === "user") return `${base}/u/${encodeURIComponent(id)}`;
  if (entityType === "marca") return `${base}/marca/${id}`;
  return `${base}/social/fecha/${id}`;
}

function buildDeepLink(entityType: ShareEntityType, id: string, opts?: { type?: string; index?: number }): string {
  const scheme = "dondebailarmx";
  if (entityType === "evento") return `${scheme}://evento/${id}`;
  if (entityType === "clase") {
    const type = opts?.type ?? "academy";
    const path = `${scheme}://clase/${type}/${id}`;
    return Number.isFinite(opts?.index) ? `${path}?i=${opts?.index}` : path;
  }
  if (entityType === "academia") return `${scheme}://academia/${id}`;
  if (entityType === "maestro") return `${scheme}://maestro/${id}`;
  if (entityType === "organizer") return `${scheme}://organizer/${id}`;
  if (entityType === "user") return `${scheme}://u/${encodeURIComponent(id)}`;
  if (entityType === "marca") return `${scheme}://marca/${id}`;
  return `${scheme}://evento/${id}`;
}

function isNonEmptyImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const s = value.trim();
  if (!s) return false;
  if (s === "undefined" || s.includes("undefined")) return false;
  return s.startsWith("http") || s.startsWith("/") || s.startsWith("data:");
}

function getSupabaseBaseUrl(): string {
  return (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ""
  ).replace(/\/+$/, "");
}

function ensureAbsoluteImageUrl(url?: string | null): string | null {
  if (!url) return null;
  const input = String(url).trim();
  if (!input) return null;
  if (/^https?:\/\//i.test(input)) return input;
  if (input.startsWith("/")) {
    const base = getSupabaseBaseUrl();
    return base ? `${base}${input}` : null;
  }
  const base = getSupabaseBaseUrl();
  if (!base) return null;
  const storageKey = input.startsWith("media/") || input.startsWith("public/") ? input : `media/${input}`;
  return `${base}/storage/v1/object/public/${storageKey}`;
}

function toDirectPublicStorageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const normalized = String(url).trim().replace(
    "/storage/v1/object/public/AVATARS/",
    "/storage/v1/object/public/media/avatars/",
  );
  if (normalized.includes("/storage/v1/render/image/public/")) {
    const pathPart = normalized.split("/storage/v1/render/image/public/")[1]?.split("?")[0];
    if (pathPart) {
      const origin = normalized.startsWith("http") ? new URL(normalized).origin : getSupabaseBaseUrl();
      return `${origin}/storage/v1/object/public/${pathPart}`;
    }
  }
  return ensureAbsoluteImageUrl(normalized) ?? normalized;
}

function resolveUrl(raw: string | null): string | null {
  if (!raw) return null;
  const direct = toDirectPublicStorageUrl(raw) ?? raw;
  return direct && isNonEmptyImageUrl(direct) ? direct : null;
}

function normalizeMediaArray(raw: unknown): Array<{ slot: string; url: string }> {
  if (Array.isArray(raw)) {
    return raw
      .map((item: any) => ({
        slot: typeof item?.slot === "string" ? item.slot : "",
        url: typeof item?.url === "string" ? item.url : typeof item?.path === "string" ? item.path : "",
      }))
      .filter((item) => item.slot && item.url);
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      return normalizeMediaArray(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  return [];
}

function getMediaBySlot(list: Array<{ slot: string; url: string }>, slot: string): { slot: string; url: string } | undefined {
  return list.find((item) => item.slot === slot);
}

function extractFirstValidImageUrl(input: unknown): string | null {
  if (input == null) return null;
  const keys = ["url", "src", "image_url", "flyer_url", "cover_url", "avatar_url", "path"];
  if (typeof input === "string") return isNonEmptyImageUrl(input) ? input.trim() : null;
  if (Array.isArray(input)) {
    for (const item of input) {
      const found = extractFirstValidImageUrl(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof input === "object") {
    for (const key of keys) {
      const value = (input as Record<string, unknown>)[key];
      if (isNonEmptyImageUrl(value)) return value.trim();
    }
  }
  return null;
}

function getFallbackEntityDataUrl(entityType: string): string {
  const label = entityType === "evento" ? "Evento" : entityType === "clase" ? "Clase" : "Perfil";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect fill="#1a1a24" width="400" height="250"/><text x="200" y="125" fill="rgba(255,255,255,0.4)" font-family="system-ui,sans-serif" font-size="24" font-weight="600" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function resolveOpenEntityImageEvento(data: {
  date: Record<string, unknown>;
  parent?: Record<string, unknown> | null;
}): ResolveOpenEntityImageResult {
  const { date, parent } = data;
  if (isNonEmptyImageUrl(date?.flyer_url)) {
    const url = resolveUrl(date.flyer_url as string);
    if (url) return { imageUrl: url, imageSourceType: "flyer_url" };
  }
  const dateMedia = normalizeMediaArray(date?.media);
  const dateFirst = getMediaBySlot(dateMedia, "cover")?.url || getMediaBySlot(dateMedia, "p1")?.url;
  if (dateFirst) {
    const url = resolveUrl(dateFirst);
    if (url) return { imageUrl: url, imageSourceType: "media" };
  }
  const parentMedia = normalizeMediaArray(parent?.media);
  const parentFirst = getMediaBySlot(parentMedia, "cover")?.url || getMediaBySlot(parentMedia, "p1")?.url;
  if (parentFirst) {
    const url = resolveUrl(parentFirst);
    if (url) return { imageUrl: url, imageSourceType: "media" };
  }
  const avatarRaw =
    (date as any)?.avatar_url ??
    (parent as any)?.avatar_url ??
    (date as any)?.portada_url ??
    (parent as any)?.portada_url;
  if (isNonEmptyImageUrl(avatarRaw)) {
    const url = resolveUrl(avatarRaw);
    if (url) return { imageUrl: url, imageSourceType: "avatar" };
  }
  const firstAny =
    extractFirstValidImageUrl(date?.media) ||
    extractFirstValidImageUrl(parent?.media) ||
    extractFirstValidImageUrl(date) ||
    extractFirstValidImageUrl(parent);
  if (firstAny) {
    const url = resolveUrl(firstAny);
    if (url) return { imageUrl: url, imageSourceType: "media" };
  }
  return { imageUrl: getFallbackEntityDataUrl("evento"), imageSourceType: "fallback_entity" };
}

function resolveOpenEntityImageClase(data: {
  profile: Record<string, unknown>;
}): ResolveOpenEntityImageResult {
  const profile = data.profile;
  const mediaArr = Array.isArray(profile?.media) ? profile.media : [];
  const normalized = normalizeMediaArray(mediaArr);
  const cover = getMediaBySlot(normalized, "cover")?.url;
  if (cover) {
    const url = resolveUrl(cover);
    if (url) return { imageUrl: url, imageSourceType: "cover" };
  }
  const p1 = getMediaBySlot(normalized, "p1")?.url;
  if (p1) {
    const url = resolveUrl(p1);
    if (url) return { imageUrl: url, imageSourceType: "media" };
  }
  const avatarRaw =
    (profile as any)?.avatar_url ?? (profile as any)?.banner_url ?? (profile as any)?.logo_url ?? (profile as any)?.portada_url;
  if (isNonEmptyImageUrl(avatarRaw)) {
    const url = resolveUrl(avatarRaw);
    if (url) return { imageUrl: url, imageSourceType: "avatar" };
  }
  const firstAny = extractFirstValidImageUrl(mediaArr);
  if (firstAny) {
    const url = resolveUrl(firstAny);
    if (url) return { imageUrl: url, imageSourceType: "media" };
  }
  return { imageUrl: getFallbackEntityDataUrl("clase"), imageSourceType: "fallback_entity" };
}

function resolveOpenEntityImageProfile(data: {
  profile: Record<string, unknown>;
}): ResolveOpenEntityImageResult {
  const profile = data.profile;
  const mediaArr = Array.isArray(profile?.media) ? profile.media : [];
  const normalized = normalizeMediaArray(mediaArr);
  const cover = getMediaBySlot(normalized, "cover")?.url;
  if (cover) {
    const url = resolveUrl(cover);
    if (url) return { imageUrl: url, imageSourceType: "cover" };
  }
  const avatarSlot = getMediaBySlot(normalized, "avatar")?.url;
  if (avatarSlot) {
    const url = resolveUrl(avatarSlot);
    if (url) return { imageUrl: url, imageSourceType: "avatar" };
  }
  const firstFromMedia = extractFirstValidImageUrl(mediaArr) || extractFirstValidImageUrl(profile);
  if (firstFromMedia) {
    const url = resolveUrl(firstFromMedia);
    if (url) return { imageUrl: url, imageSourceType: "media" };
  }
  const avatarRaw =
    (profile as any)?.avatar_url ??
    (profile as any)?.logo_url ??
    (profile as any)?.banner_url ??
    (profile as any)?.portada_url;
  if (isNonEmptyImageUrl(avatarRaw)) {
    const url = resolveUrl(avatarRaw);
    if (url) return { imageUrl: url, imageSourceType: "avatar" };
  }
  return { imageUrl: getFallbackEntityDataUrl("perfil"), imageSourceType: "fallback_entity" };
}

function getOpenEntityImageForMeta(result: ResolveOpenEntityImageResult): string {
  if (result.imageSourceType === "fallback_entity" && result.imageUrl.startsWith("data:")) {
    return SEO_LOGO_URL;
  }
  return result.imageUrl;
}

function compactParts(parts: Array<unknown>): string {
  return parts
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => String(value).trim())
    .join(" · ");
}

function formatDateLabel(raw: unknown, locale = "es-MX"): string {
  if (typeof raw !== "string" || !raw.trim()) return "";
  const plain = raw.split("T")[0];
  const date = new Date(`${plain}T12:00:00`);
  if (Number.isNaN(date.getTime())) return plain;
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatTimeRange(start: unknown, end: unknown): string {
  const startText = typeof start === "string" ? start.trim() : "";
  const endText = typeof end === "string" ? end.trim() : "";
  if (!startText) return "";
  if (!endText || endText === startText) return startText;
  return `${startText} - ${endText}`;
}

function buildOpenEventoPresentation(
  date: Record<string, unknown>,
  parent?: Record<string, unknown> | null,
  locale = "es-MX",
) {
  const title = String(date?.nombre || parent?.nombre || "Evento de baile");
  const dateStr = formatDateLabel(String(date?.fecha || date?.fecha_inicio || ""), locale);
  const timeStr = formatTimeRange(date?.hora_inicio, date?.hora_fin);
  const place =
    compactParts([date?.lugar, date?.ciudad]) ||
    (typeof parent?.sede_general === "string" ? parent.sede_general : "");
  return {
    title,
    subtitle: compactParts([dateStr, timeStr]) || undefined,
    place: place || undefined,
    seoTitle: title,
    seoDescription: compactParts([dateStr, timeStr, place]) || title,
  };
}

function buildOpenClasePresentation(profile: Record<string, unknown>, classIndex?: number) {
  const cronograma = (profile?.cronograma || profile?.horarios || []) as Array<Record<string, unknown>>;
  const entry =
    Array.isArray(cronograma) && classIndex != null && cronograma[classIndex]
      ? cronograma[classIndex]
      : Array.isArray(cronograma)
        ? cronograma[0]
        : undefined;
  const title = String(entry?.nombre || entry?.nombre_clase || profile?.nombre_publico || "Clase de baile");
  const ubicaciones = Array.isArray(profile?.ubicaciones) ? (profile.ubicaciones as Array<Record<string, unknown>>) : [];
  const firstUbicacion = ubicaciones[0];
  const place =
    compactParts([firstUbicacion?.nombre, firstUbicacion?.ciudad]) ||
    (typeof profile?.ciudad === "string" ? profile.ciudad : "");
  const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
  const diaNum = typeof entry?.diaSemana === "number" ? entry.diaSemana : entry?.dia_semana;
  const dayLabel = typeof diaNum === "number" && diaNum >= 0 && diaNum <= 6 ? dayNames[diaNum] : "";
  const subtitle =
    compactParts([dayLabel, entry?.hora]) ||
    (typeof profile?.nombre_publico === "string" ? "" : "Clase");
  return {
    title,
    subtitle: subtitle || (typeof profile?.nombre_publico === "string" ? String(profile.nombre_publico) : undefined),
    place: place || undefined,
    seoTitle: title,
    seoDescription: compactParts([subtitle, place]) || "Clase de baile",
  };
}

function buildOpenProfilePresentation(profileType: ShareEntityType, profile: Record<string, unknown>) {
  const title = String(
    profile?.display_name ||
      profile?.nombre_publico ||
      profile?.nombre ||
      profile?.nombre_organizador ||
      profile?.full_name ||
      profile?.nombre_marca ||
      "Perfil",
  );
  const profileLabel =
    profileType === "academia"
      ? "Academia"
      : profileType === "maestro"
        ? "Maestro"
        : profileType === "organizer"
          ? "Organizador"
          : profileType === "marca"
            ? "Marca"
            : "Perfil";
  return {
    title,
    seoTitle: title,
    seoDescription: `${profileLabel} de ${title} en Donde Bailar`,
  };
}

function readShareParams(req: IncomingMessage) {
  const url = new URL(req.url || "/", "https://dondebailar.com.mx");
  const entityType = url.searchParams.get("entityType") as ShareEntityType | null;
  const id = url.searchParams.get("id");
  const type = parseClassType(url.searchParams.get("type"));
  const index = parsePositiveInt(url.searchParams.get("i"));
  return { entityType, id, type, index };
}

async function fetchEventPayload(id: string): Promise<OpenPayload | null> {
  const dateId = parsePositiveInt(id);
  if (!dateId) return null;

  const { data: date, error: dateError } = await supabaseAdmin
    .from("events_date")
    .select("*")
    .eq("id", dateId)
    .maybeSingle();
  if (dateError || !date) return null;

  let parent: Record<string, unknown> | null = null;
  if (date.parent_id) {
    const { data: parentData } = await supabaseAdmin
      .from("events_parent")
      .select("*")
      .eq("id", date.parent_id)
      .maybeSingle();
    parent = (parentData as Record<string, unknown> | null) ?? null;
  }

  const imageResult = resolveOpenEntityImageEvento({
    date: date as Record<string, unknown>,
    parent,
  });
  const presentation = buildOpenEventoPresentation(date as Record<string, unknown>, parent);

  return {
    shareUrl: buildShareUrl("evento", String(dateId)),
    canonicalUrl: buildCanonicalUrl("evento", String(dateId)),
    deepLink: buildDeepLink("evento", String(dateId)),
    title: presentation.title,
    subtitle: presentation.subtitle,
    place: presentation.place,
    imageUrl: imageResult.imageUrl,
    seoTitle: presentation.seoTitle,
    seoDescription: presentation.seoDescription,
    seoImage: getOpenEntityImageForMeta(imageResult),
    entityLabel: "evento",
  };
}

async function fetchClassPayload(id: string, type: ClassType, index?: number | null): Promise<OpenPayload | null> {
  const profileId = parsePositiveInt(id);
  if (!profileId) return null;

  const table = type === "teacher" ? "profiles_teacher" : "v_academies_public";
  const { data: profile, error } = await supabaseAdmin
    .from(table)
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
  if (error || !profile) return null;

  const imageResult = resolveOpenEntityImageClase({
    profile: profile as Record<string, unknown>,
    sourceType: type,
  });
  const presentation = buildOpenClasePresentation(profile as Record<string, unknown>, index ?? undefined);

  return {
    shareUrl: buildShareUrl("clase", String(profileId), { type, index: index ?? undefined }),
    canonicalUrl: buildCanonicalUrl("clase", String(profileId), { type, index: index ?? undefined }),
    deepLink: buildDeepLink("clase", String(profileId), { type, index: index ?? undefined }),
    title: presentation.title,
    subtitle: presentation.subtitle,
    place: presentation.place,
    imageUrl: imageResult.imageUrl,
    seoTitle: presentation.seoTitle,
    seoDescription: presentation.seoDescription,
    seoImage: getOpenEntityImageForMeta(imageResult),
    entityLabel: "clase",
  };
}

async function fetchProfilePayload(entityType: ShareEntityType, id: string): Promise<OpenPayload | null> {
  if (!["academia", "maestro", "organizer", "user", "marca"].includes(entityType)) return null;

  const lookupValue = entityType === "user" ? decodeURIComponent(id) : parsePositiveInt(id);
  if (!lookupValue) return null;

  const source =
    entityType === "academia"
      ? { table: "v_academies_public", column: "id" }
      : entityType === "maestro"
        ? { table: "profiles_teacher", column: "id" }
        : entityType === "organizer"
          ? { table: "profiles_organizer", column: "id" }
          : entityType === "marca"
            ? { table: "v_brands_public", column: "id" }
            : { table: "v_user_public", column: "user_id" };

  const { data: profile, error } = await supabaseAdmin
    .from(source.table)
    .select("*")
    .eq(source.column, lookupValue)
    .maybeSingle();
  if (error || !profile) return null;

  const imageResult = resolveOpenEntityImageProfile({
    profile: profile as Record<string, unknown>,
  });
  const presentation = buildOpenProfilePresentation(entityType, profile as Record<string, unknown>);

  return {
    shareUrl: buildShareUrl(entityType, String(id)),
    canonicalUrl: buildCanonicalUrl(entityType, String(id)),
    deepLink: buildDeepLink(entityType, String(id)),
    title: presentation.title,
    subtitle: presentation.subtitle,
    place: presentation.place,
    imageUrl: imageResult.imageUrl,
    seoTitle: presentation.seoTitle,
    seoDescription: presentation.seoDescription,
    seoImage: getOpenEntityImageForMeta(imageResult),
    entityLabel: "perfil",
  };
}

async function resolvePayload(req: IncomingMessage): Promise<OpenPayload | null> {
  const { entityType, id, type, index } = readShareParams(req);
  if (!entityType || !id) return null;
  if (entityType === "evento") return fetchEventPayload(id);
  if (entityType === "clase") return type ? fetchClassPayload(id, type, index) : null;
  return fetchProfilePayload(entityType, id);
}

function renderHtml(payload: OpenPayload): string {
  const title = escapeHtml(payload.title);
  const subtitle = payload.subtitle ? escapeHtml(payload.subtitle) : "";
  const place = payload.place ? escapeHtml(payload.place) : "";
  const shareUrl = escapeHtml(payload.shareUrl);
  const canonicalUrl = escapeHtml(payload.canonicalUrl);
  const deepLink = escapeHtml(payload.deepLink);
  const seoTitle = escapeHtml(payload.seoTitle);
  const seoDescription = escapeHtml(payload.seoDescription);
  const seoImage = escapeHtml(payload.seoImage);
  const imageUrl = escapeHtml(payload.imageUrl);

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${seoTitle}</title>
    <meta name="description" content="${seoDescription}" />
    <meta name="robots" content="noindex,nofollow" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Donde Bailar" />
    <meta property="og:title" content="${seoTitle}" />
    <meta property="og:description" content="${seoDescription}" />
    <meta property="og:image" content="${seoImage}" />
    <meta property="og:url" content="${shareUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${seoTitle}" />
    <meta name="twitter:description" content="${seoDescription}" />
    <meta name="twitter:image" content="${seoImage}" />
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: Inter, system-ui, sans-serif;
        background: linear-gradient(180deg, #0f0f14 0%, #1a1a24 100%);
        color: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px 16px;
      }
      .card {
        width: min(100%, 420px);
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 24px 48px rgba(0,0,0,0.3);
      }
      .media {
        width: 100%;
        aspect-ratio: 16 / 10;
        background: #1a1a24;
      }
      .media img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .content { padding: 24px 20px 20px; }
      h1 {
        margin: 0 0 6px;
        font-size: 1.35rem;
        line-height: 1.3;
      }
      p {
        margin: 0;
      }
      .subtitle {
        color: rgba(255,255,255,0.76);
        font-size: 0.95rem;
      }
      .place {
        margin-top: 6px;
        color: rgba(255,255,255,0.6);
        font-size: 0.9rem;
      }
      .actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 0 20px 24px;
      }
      .button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        min-height: 52px;
        padding: 14px 18px;
        border-radius: 14px;
        text-decoration: none;
        font-weight: 700;
      }
      .button-primary {
        background: linear-gradient(135deg, #1a7a8c 0%, #2d9cdb 100%);
        color: white;
      }
      .button-secondary {
        background: rgba(255,255,255,0.08);
        color: #f0f0f0;
        border: 1px solid rgba(255,255,255,0.25);
      }
      .notice {
        display: none;
        padding: 14px 16px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.82);
        font-size: 0.92rem;
        text-align: center;
      }
      .notice.is-visible { display: block; }
      .stores {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 12px;
      }
      .store {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
        padding: 0 14px;
        border-radius: 8px;
        text-decoration: none;
        font-size: 0.75rem;
        font-weight: 600;
        color: white;
      }
      .store-app { background: #000; }
      .store-play {
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.18);
      }
      .caption {
        margin-top: 10px;
        color: rgba(255,255,255,0.54);
        font-size: 0.8rem;
        text-align: center;
      }
      .share-url {
        display: block;
        margin-top: 4px;
        opacity: 0.8;
        word-break: break-word;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="media">
        <img src="${imageUrl}" alt="" />
      </div>
      <section class="content">
        <h1>${title}</h1>
        ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ""}
        ${place ? `<p class="place">${place}</p>` : ""}
      </section>
      <section class="actions">
        <a id="open-in-app" class="button button-primary" href="${deepLink}">Abrir en la app</a>
        <div id="fallback-notice" class="notice">
          Si la app no se abrio automaticamente, usa Ver en navegador o descarga la app.
        </div>
        <a class="button button-secondary" href="${canonicalUrl}">Ver en navegador</a>
        <div class="stores">
          <a class="store store-app" href="${escapeHtml(APP_STORE_URL)}" target="_blank" rel="noopener noreferrer">App Store</a>
          <a class="store store-play" href="${escapeHtml(PLAY_STORE_URL)}" target="_blank" rel="noopener noreferrer">Google Play</a>
        </div>
        <p class="caption">
          Smart page oficial de Donde Bailar para abrir este ${escapeHtml(payload.entityLabel)} en app o web.
          <span class="share-url">${shareUrl}</span>
        </p>
      </section>
    </main>
    <script>
      (function () {
        var fallback = document.getElementById("fallback-notice");
        var openBtn = document.getElementById("open-in-app");
        var timer = null;
        function clearTimer() {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        }
        function showFallback() {
          if (fallback) fallback.classList.add("is-visible");
        }
        document.addEventListener("visibilitychange", function () {
          if (document.visibilityState === "hidden") clearTimer();
        });
        window.addEventListener("pagehide", clearTimer);
        if (openBtn) {
          openBtn.addEventListener("click", function () {
            if (fallback) fallback.classList.remove("is-visible");
            clearTimer();
            timer = setTimeout(showFallback, 1800);
          });
        }
      })();
    </script>
  </body>
</html>`;
}

function renderNotFound(): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>No encontrado | Donde Bailar</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        font-family: Inter, system-ui, sans-serif;
        background: linear-gradient(180deg, #0f0f14 0%, #1a1a24 100%);
        color: #f5f5f5;
      }
      .box {
        text-align: center;
        max-width: 420px;
      }
      a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-top: 16px;
        padding: 12px 18px;
        border-radius: 999px;
        color: #7ec8e3;
        text-decoration: none;
        background: rgba(45,156,219,0.25);
      }
    </style>
  </head>
  <body>
    <main class="box">
      <h1>No encontrado</h1>
      <p>Este recurso no existe o fue eliminado.</p>
      <a href="https://dondebailar.com.mx/explore">Explorar</a>
    </main>
  </body>
</html>`;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  try {
    const payload = await resolvePayload(req);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    if (!payload) {
      res.statusCode = 404;
      res.end(renderNotFound());
      return;
    }

    res.statusCode = 200;
    res.end(renderHtml(payload));
  } catch (error) {
    console.error("[open] Failed to render smart page", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(renderNotFound());
  }
}
