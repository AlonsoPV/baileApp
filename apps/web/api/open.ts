import type { IncomingMessage, ServerResponse } from "http";
import { createClient } from "@supabase/supabase-js";

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

type SupabaseClient = ReturnType<typeof createClient>;
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseServerEnv(): { url: string; key: string } | null {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

function getSupabaseAdmin(): SupabaseClient | null {
  const env = getSupabaseServerEnv();
  if (!env) return null;
  if (!supabaseAdmin) {
    try {
      supabaseAdmin = createClient(env.url, env.key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } catch (e) {
      console.error("[open] createClient failed", e);
      return null;
    }
  }
  return supabaseAdmin;
}

type ClassType = "teacher" | "academy";
type OpenPayload = {
  entityType: ShareEntityType;
  id: string;
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

type ShareUrlOpts = { type?: string; index?: number; dia?: number };

function appendClassQuery(path: string, opts?: ShareUrlOpts): string {
  const params = new URLSearchParams();
  if (Number.isFinite(opts?.index)) params.set("i", String(opts?.index));
  if (Number.isFinite(opts?.dia)) params.set("dia", String(opts?.dia));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function buildShareUrl(entityType: ShareEntityType, id: string, opts?: ShareUrlOpts): string {
  const base = `${SITE_URL.replace(/\/+$/, "")}/open`;
  if (entityType === "evento") return `${base}/evento/${id}`;
  if (entityType === "clase") {
    const type = opts?.type ?? "academy";
    const path = `${base}/clase/${type}/${id}`;
    return appendClassQuery(path, opts);
  }
  if (entityType === "academia") return `${base}/academia/${id}`;
  if (entityType === "maestro") return `${base}/maestro/${id}`;
  if (entityType === "organizer") return `${base}/organizer/${id}`;
  if (entityType === "user") return `${base}/u/${encodeURIComponent(id)}`;
  if (entityType === "marca") return `${base}/marca/${id}`;
  return `${base}/evento/${id}`;
}

function buildCanonicalUrl(entityType: ShareEntityType, id: string, opts?: ShareUrlOpts): string {
  const base = SITE_URL.replace(/\/+$/, "");
  if (entityType === "evento") return `${base}/social/fecha/${id}`;
  if (entityType === "clase") {
    const type = opts?.type ?? "academy";
    const path = `${base}/clase/${type}/${id}`;
    return appendClassQuery(path, opts);
  }
  if (entityType === "academia") return `${base}/academia/${id}`;
  if (entityType === "maestro") return `${base}/maestro/${id}`;
  if (entityType === "organizer") return `${base}/organizer/${id}`;
  if (entityType === "user") return `${base}/u/${encodeURIComponent(id)}`;
  if (entityType === "marca") return `${base}/marca/${id}`;
  return `${base}/social/fecha/${id}`;
}

function buildDeepLink(entityType: ShareEntityType, id: string, opts?: ShareUrlOpts): string {
  const scheme = "dondebailarmx";
  if (entityType === "evento") return `${scheme}://evento/${id}`;
  if (entityType === "clase") {
    const type = opts?.type ?? "academy";
    const path = `${scheme}://clase/${type}/${id}`;
    return appendClassQuery(path, opts);
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

/** Misma lógica que `src/utils/classFlyerImage` (sin importar `../src` en serverless). */
function selectCronogramaClassItem(profile: Record<string, unknown>, classIndex?: number): unknown {
  const cronograma = (profile?.cronograma || profile?.horarios || []) as unknown[];
  if (!Array.isArray(cronograma) || cronograma.length === 0) return undefined;
  if (
    classIndex != null &&
    Number.isFinite(classIndex) &&
    classIndex >= 0 &&
    classIndex < cronograma.length
  ) {
    return cronograma[classIndex];
  }
  return cronograma[0];
}

function pickClassItemFlyerUrl(classItem: unknown): string | undefined {
  if (!classItem || typeof classItem !== "object") return undefined;
  const c = classItem as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const direct = str(c.flyer_url) || str(c.cover_url) || str(c.portada_url) || str(c.imagen);
  if (direct) return direct;
  const classMedia = normalizeMediaArray((c as { media?: unknown }).media);
  return (
    getMediaBySlot(classMedia, "flyer")?.url ||
    getMediaBySlot(classMedia, "cover")?.url ||
    getMediaBySlot(classMedia, "p1")?.url ||
    classMedia.find((m) => m.url)?.url ||
    undefined
  );
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
  const parentFlyerRaw = parent?.flyer_url ?? parent?.portada_url;
  if (isNonEmptyImageUrl(parentFlyerRaw)) {
    const url = resolveUrl(parentFlyerRaw as string);
    if (url) return { imageUrl: url, imageSourceType: "flyer_url" };
  }
  const dateMedia = normalizeMediaArray(date?.media);
  const dateFirst =
    getMediaBySlot(dateMedia, "flyer")?.url ||
    getMediaBySlot(dateMedia, "cover")?.url ||
    getMediaBySlot(dateMedia, "p1")?.url;
  if (dateFirst) {
    const url = resolveUrl(dateFirst);
    if (url) return { imageUrl: url, imageSourceType: "media" };
  }
  const parentMedia = normalizeMediaArray(parent?.media);
  const parentFirst =
    getMediaBySlot(parentMedia, "flyer")?.url ||
    getMediaBySlot(parentMedia, "cover")?.url ||
    getMediaBySlot(parentMedia, "p1")?.url;
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
  classIndex?: number;
}): ResolveOpenEntityImageResult {
  const { profile, classIndex } = data;
  const classItem = selectCronogramaClassItem(profile, classIndex);
  const fromClassItem = pickClassItemFlyerUrl(classItem);
  if (fromClassItem) {
    const url = resolveUrl(fromClassItem);
    if (url) return { imageUrl: url, imageSourceType: "flyer_url" };
  }
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
  const dia = url.searchParams.get("dia") !== null ? Number.parseInt(url.searchParams.get("dia") || "", 10) : undefined;
  return { entityType, id, type, index, dia: Number.isFinite(dia) ? dia : undefined };
}

async function fetchEventPayload(supabase: SupabaseClient, id: string): Promise<OpenPayload | null> {
  const dateId = parsePositiveInt(id);
  if (!dateId) return null;

  const { data: date, error: dateError } = await supabase
    .from("events_date")
    .select("*")
    .eq("id", dateId)
    .maybeSingle();
  if (dateError || !date) return null;

  let parent: Record<string, unknown> | null = null;
  if (date.parent_id) {
    const { data: parentData } = await supabase
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
    entityType: "evento",
    id: String(dateId),
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

async function fetchClassPayload(
  supabase: SupabaseClient,
  id: string,
  type: ClassType,
  index?: number | null,
  dia?: number,
): Promise<OpenPayload | null> {
  const profileId = parsePositiveInt(id);
  if (!profileId) return null;

  const table = type === "teacher" ? "profiles_teacher" : "v_academies_public";
  const { data: profile, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
  if (error || !profile) return null;

  const imageResult = resolveOpenEntityImageClase({
    profile: profile as Record<string, unknown>,
    classIndex: index ?? undefined,
  });
  const presentation = buildOpenClasePresentation(profile as Record<string, unknown>, index ?? undefined);

  return {
    entityType: "clase",
    id: String(profileId),
    shareUrl: buildShareUrl("clase", String(profileId), { type, index: index ?? undefined, dia }),
    canonicalUrl: buildCanonicalUrl("clase", String(profileId), { type, index: index ?? undefined, dia }),
    deepLink: buildDeepLink("clase", String(profileId), { type, index: index ?? undefined, dia }),
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

async function fetchProfilePayload(
  supabase: SupabaseClient,
  entityType: ShareEntityType,
  id: string,
): Promise<OpenPayload | null> {
  if (!["academia", "maestro", "organizer", "user", "marca"].includes(entityType)) return null;

  const rawLookupValue = decodeURIComponent(id).trim();
  const lookupValue =
    entityType === "user" || entityType === "organizer"
      ? rawLookupValue
      : parsePositiveInt(id);
  if (!lookupValue) return null;

  let profile: Record<string, unknown> | null = null;
  if (entityType === "organizer") {
    const numericId = /^\d+$/.test(rawLookupValue) ? Number(rawLookupValue) : null;
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawLookupValue);
    const column = numericId != null ? "id" : isUuid ? "user_id" : "slug";
    const value = numericId ?? rawLookupValue;
    const { data, error } = await supabase
      .from("v_organizers_public")
      .select("*")
      .eq(column, value)
      .maybeSingle();
    if (error || !data) return null;
    profile = data as Record<string, unknown>;
  }

  const source =
    entityType === "academia"
      ? { table: "v_academies_public", column: "id" }
      : entityType === "maestro"
        ? { table: "profiles_teacher", column: "id" }
        : entityType === "marca"
          ? { table: "v_brands_public", column: "id" }
          : { table: "v_user_public", column: "user_id" };

  if (!profile) {
    const { data, error } = await supabase
      .from(source.table)
      .select("*")
      .eq(source.column, lookupValue)
      .maybeSingle();
    if (error || !data) return null;
    profile = data as Record<string, unknown>;
  }

  const imageResult = resolveOpenEntityImageProfile({
    profile,
  });
  const presentation = buildOpenProfilePresentation(entityType, profile);

  return {
    entityType,
    id: String(id),
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

async function resolvePayload(req: IncomingMessage, supabase: SupabaseClient): Promise<OpenPayload | null> {
  const { entityType, id, type, index, dia } = readShareParams(req);
  if (!entityType || !id) return null;
  if (entityType === "evento") return fetchEventPayload(supabase, id);
  if (entityType === "clase") return type ? fetchClassPayload(supabase, id, type, index, dia) : null;
  return fetchProfilePayload(supabase, entityType, id);
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
  const kindTag = escapeHtml(
    payload.entityLabel === "evento" ? "Evento" : payload.entityLabel === "clase" ? "Clase" : "Perfil",
  );

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
        min-height: 100dvh;
        font-family: Inter, system-ui, sans-serif;
        background: linear-gradient(165deg, #0a0c10 0%, #12151c 38%, #0c0f14 100%);
        color: #f4f6fb;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: max(20px, env(safe-area-inset-top, 0px)) 18px calc(24px + env(safe-area-inset-bottom, 0px));
      }
      .sp-root { width: 100%; max-width: 380px; }
      .sp-card {
        background: linear-gradient(180deg, #12151c 0%, #0c0f14 48%, #0a0c10 100%);
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.06) inset;
        border: 1px solid rgba(255, 255, 255, 0.06);
      }
      .sp-topbar {
        display: flex;
        align-items: center;
        padding: 14px 18px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        background: linear-gradient(180deg, rgba(41, 127, 150, 0.14) 0%, rgba(18, 21, 28, 0) 100%);
      }
      .sp-brand { display: flex; align-items: center; gap: 12px; }
      .sp-brand-logo { width: 36px; height: 36px; border-radius: 10px; object-fit: cover; box-shadow: 0 4px 14px rgba(0,0,0,0.35); }
      .sp-brand-text { display: flex; flex-direction: column; gap: 2px; }
      .sp-brand-name { font-size: 1.05rem; font-weight: 700; color: #f4f6fb; letter-spacing: -0.02em; }
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
      .sp-title { margin: 0; font-size: 1.2rem; font-weight: 700; line-height: 1.3; color: #f8fafc; }
      .sp-subtitle { margin: 8px 0 0; font-size: 0.92rem; color: rgba(203, 213, 225, 0.88); }
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
        border: none;
        cursor: pointer;
        box-sizing: border-box;
      }
      .sp-btn--primary {
        background: linear-gradient(135deg, rgba(30, 107, 130, 0.95) 0%, rgba(41, 127, 150, 1) 50%, rgba(41, 127, 150, 0.92) 100%);
        color: #fff;
        box-shadow: 0 8px 24px rgba(41, 127, 150, 0.35), 0 1px 3px rgba(0, 0, 0, 0.25);
      }
      .sp-btn--secondary {
        background: rgba(255, 255, 255, 0.04);
        color: #e5e7eb;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .notice {
        display: none;
        padding: 14px;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.04);
        color: rgba(226, 232, 240, 0.88);
        font-size: 0.88rem;
        text-align: center;
      }
      .notice.is-visible { display: block; }
      .hint {
        display: none;
        margin: -2px 0 0;
        color: rgba(148, 163, 184, 0.88);
        font-size: 0.8rem;
        text-align: center;
        line-height: 1.35;
      }
      .hint.is-visible { display: block; }
      .sp-stores { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
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
      }
      .sp-store--ios { background: #0a0a0a; border: 1px solid rgba(255,255,255,0.12); }
      .sp-store--play { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); }
      .sp-caption {
        margin: 4px 0 0;
        font-size: 0.78rem;
        color: rgba(148, 163, 184, 0.85);
        text-align: center;
        line-height: 1.4;
      }
      .sp-page-foot {
        margin-top: 1.25rem;
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        color: rgba(100, 116, 139, 0.95);
        text-align: center;
      }
      .share-url { display: block; margin-top: 6px; opacity: 0.85; word-break: break-all; font-weight: 500; letter-spacing: 0; }
    </style>
  </head>
  <body>
    <div class="sp-root">
    <main class="sp-card">
      <header class="sp-topbar">
        <div class="sp-brand">
          <img src="${escapeHtml(SEO_LOGO_URL)}" alt="" width="36" height="36" class="sp-brand-logo" />
          <div class="sp-brand-text">
            <span class="sp-brand-name">Donde Bailar</span>
            <span class="sp-brand-tag">${kindTag}</span>
          </div>
        </div>
      </header>
      <div class="sp-media-frame">
        <div class="sp-media">
          <img src="${imageUrl}" alt="" />
        </div>
      </div>
      <section class="sp-content">
        <h1 class="sp-title">${title}</h1>
        ${subtitle ? `<p class="sp-subtitle">${subtitle}</p>` : ""}
        ${place ? `<p class="sp-place">📍 ${place}</p>` : ""}
      </section>
      <section class="sp-actions">
        <a id="open-in-app" class="sp-btn sp-btn--primary" href="${deepLink}">
          <img src="${escapeHtml(SEO_LOGO_URL)}" alt="" width="22" height="22" style="border-radius:6px;object-fit:contain;flex-shrink:0" />
          Abrir en la app
        </a>
        <p id="ios-browser-hint" class="hint"></p>
        <div id="fallback-notice" class="notice">
          Si la app no se abrio automaticamente, usa Ver en navegador o descarga la app.
        </div>
        <a class="sp-btn sp-btn--secondary" href="${canonicalUrl}">Ver en navegador</a>
        <div class="sp-stores">
          <a class="sp-store sp-store--ios" href="${escapeHtml(APP_STORE_URL)}" target="_blank" rel="noopener noreferrer">App Store</a>
          <a class="sp-store sp-store--play" href="${escapeHtml(PLAY_STORE_URL)}" target="_blank" rel="noopener noreferrer">Google Play</a>
        </div>
        <p class="sp-caption">
          Smart page oficial de Donde Bailar para abrir este ${escapeHtml(payload.entityLabel)} en app o web.
          <span class="share-url">${shareUrl}</span>
        </p>
      </section>
    </main>
    </div>
    <script>
      (function () {
        var deepLink = ${JSON.stringify(payload.deepLink)};
        var canonicalUrl = ${JSON.stringify(payload.canonicalUrl)};
        var shareUrl = ${JSON.stringify(payload.shareUrl)};
        var entityType = ${JSON.stringify(payload.entityType)};
        var entityId = ${JSON.stringify(payload.id)};
        var entityLabel = ${JSON.stringify(payload.entityLabel)};
        var fallback = document.getElementById("fallback-notice");
        var iosHint = document.getElementById("ios-browser-hint");
        var openBtn = document.getElementById("open-in-app");
        var timer = null;
        function log(tag, payload) {
          try {
            console.log(tag, JSON.stringify(payload));
          } catch (error) {
            console.log(tag, payload, error);
          }
        }
        function detectEnv() {
          var ua = String((window.navigator && window.navigator.userAgent) || "");
          var isIos = /iPhone|iPad|iPod/i.test(ua);
          var isAndroid = /Android/i.test(ua);
          var isSafari = isIos && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
          var embeddedBrowserPattern = new RegExp("FBAN|FBAV|Instagram|Line|MicroMessenger|TikTok|Snapchat|Pinterest|LinkedInApp|Twitter|X/", "i");
          var isEmbeddedBrowser =
            embeddedBrowserPattern.test(ua) ||
            (isIos && !isSafari && /AppleWebKit/i.test(ua));
          return {
            userAgent: ua,
            isIos: isIos,
            isAndroid: isAndroid,
            isSafari: isSafari,
            isEmbeddedBrowser: isEmbeddedBrowser
          };
        }
        function getFallbackMessage(env) {
          if (env.isIos && env.isEmbeddedBrowser) {
            return "Si estas en un navegador embebido de iPhone, abre esta pagina en Safari y vuelve a tocar Abrir en la app.";
          }
          if (env.isIos) {
            return "Si la app no se abrio automaticamente, confirma que este instalada y vuelve a intentar desde Safari.";
          }
          return "Si la app no se abrio automaticamente, usa Ver en navegador o descarga la app.";
        }
        var env = detectEnv();
        log("[SMART_PAGE]", {
          event: "render",
          entityType: entityType,
          id: entityId,
          deepLink: deepLink,
          canonicalUrl: canonicalUrl,
          shareUrl: shareUrl,
          entityLabel: entityLabel,
          env: env
        });
        log("[SMART_PAGE_DEEPLINK]", { entityType: entityType, id: entityId, deepLink: deepLink });
        log("[SMART_PAGE_CANONICAL]", { entityType: entityType, id: entityId, canonicalUrl: canonicalUrl });
        if (env.isIos) {
          log("[DEEPLINK_IOS]", {
            event: "render",
            deepLink: deepLink,
            canonicalUrl: canonicalUrl,
            shareUrl: shareUrl,
            isSafari: env.isSafari,
            isEmbeddedBrowser: env.isEmbeddedBrowser
          });
        }
        if (fallback) fallback.textContent = getFallbackMessage(env);
        if (iosHint && env.isIos && env.isEmbeddedBrowser) {
          iosHint.textContent = "Si estas en Instagram, Facebook u otro navegador embebido de iPhone, puede que necesites abrir esta pagina en Safari.";
          iosHint.classList.add("is-visible");
        }
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
          if (document.visibilityState === "hidden") {
            log(env.isIos ? "[DEEPLINK_IOS]" : "[SMART_PAGE]", {
              event: "document_hidden",
              deepLink: deepLink,
              shareUrl: shareUrl
            });
            clearTimer();
          }
        });
        window.addEventListener("pagehide", function () {
          log(env.isIos ? "[DEEPLINK_IOS]" : "[SMART_PAGE]", {
            event: "pagehide",
            deepLink: deepLink,
            shareUrl: shareUrl
          });
          clearTimer();
        });
        if (openBtn) {
          openBtn.addEventListener("click", function () {
            if (fallback) fallback.classList.remove("is-visible");
            clearTimer();
            log("[SMART_PAGE]", {
              event: "open_in_app_click",
              entityType: entityType,
              id: entityId,
              deepLink: deepLink,
              canonicalUrl: canonicalUrl,
              shareUrl: shareUrl,
              env: env
            });
            log("[SMART_PAGE_DEEPLINK]", { entityType: entityType, id: entityId, deepLink: deepLink });
            log("[SMART_PAGE_CANONICAL]", { entityType: entityType, id: entityId, canonicalUrl: canonicalUrl });
            if (env.isIos) {
              log("[DEEPLINK_IOS]", {
                event: "open_attempt",
                deepLink: deepLink,
                canonicalUrl: canonicalUrl,
                shareUrl: shareUrl,
                isSafari: env.isSafari,
                isEmbeddedBrowser: env.isEmbeddedBrowser
              });
            }
            timer = setTimeout(function () {
              log(env.isIos ? "[DEEPLINK_IOS]" : "[SMART_PAGE]", {
                event: "open_timeout_fallback",
                deepLink: deepLink,
                canonicalUrl: canonicalUrl,
                shareUrl: shareUrl,
                isSafari: env.isSafari,
                isEmbeddedBrowser: env.isEmbeddedBrowser
              });
              showFallback();
            }, env.isIos ? 2200 : 1800);
          });
        }
      })();
    </script>
  </body>
</html>`;
}

function renderConfigError(): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>Servicio no disponible | Donde Bailar</title>
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
      .box { text-align: center; max-width: 440px; }
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
      <h1>Enlace temporalmente no disponible</h1>
      <p>No se pudo cargar la vista previa. Vuelve a intentar o abre la app desde la tienda.</p>
      <a href="https://dondebailar.com.mx/explore">Explorar en la web</a>
    </main>
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
  try {
    if (req.method !== "GET") {
      res.statusCode = 405;
      res.end("Method Not Allowed");
      return;
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error(
        "[open] Missing Supabase env or createClient failed. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE or SUPABASE_ANON_KEY (VITE_* / NEXT_PUBLIC_* also supported) for serverless.",
      );
      res.statusCode = 503;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(renderConfigError());
      return;
    }

    const payload = await resolvePayload(req, supabase);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    if (!payload) {
      res.statusCode = 404;
      res.end(renderNotFound());
      return;
    }

    res.statusCode = 200;
    res.end(renderHtml(payload));
  } catch (error) {
    console.error("[open] Failed to handle request", error);
    if (res.headersSent) return;
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(renderNotFound());
  }
}
