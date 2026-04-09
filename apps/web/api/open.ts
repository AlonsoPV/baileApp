import type { IncomingMessage, ServerResponse } from "http";
import { supabaseAdmin } from "./_supabaseAdmin";
import type { ShareEntityType } from "../src/utils/shareUrls";
import { buildCanonicalUrl, buildDeepLink, buildShareUrl } from "../src/utils/shareUrls";
import {
  getOpenEntityImageForMeta,
  resolveOpenEntityImageClase,
  resolveOpenEntityImageEvento,
  resolveOpenEntityImageProfile,
} from "../src/utils/resolveOpenEntityImage";
import {
  buildOpenClasePresentation,
  buildOpenEventoPresentation,
  buildOpenProfilePresentation,
} from "../src/utils/openEntityMeta";
import { APP_STORE_URL, PLAY_STORE_URL } from "../src/config/links";

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
