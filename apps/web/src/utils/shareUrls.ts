/**
 * URLs para compartir (smart page), canónicas y deep links.
 * Scheme único: dondebailarmx (no introducir dondebailar).
 * open/evento/:id = siempre events_date.id.
 */

import { SEO_BASE_URL } from "../lib/seoConfig";

const DEEP_LINK_SCHEME = "dondebailarmx";

export type ShareEntityType =
  | "evento"
  | "clase"
  | "academia"
  | "maestro"
  | "organizer"
  | "user"
  | "marca";

export interface ShareUrlOpts {
  /** Para clase: "teacher" | "academy" */
  type?: string;
  /** Índice de cronograma (clase) */
  index?: number;
  /** Día seleccionado en clase */
  dia?: number;
}

const OPEN_BASE = `${SEO_BASE_URL}/open`;

function appendClassQuery(path: string, opts?: ShareUrlOpts): string {
  const params = new URLSearchParams();
  if (opts?.index != null && Number.isFinite(opts.index)) params.set("i", String(opts.index));
  if (opts?.dia != null && Number.isFinite(opts.dia)) params.set("dia", String(opts.dia));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * URL de compartir (página intermedia /open/...).
 * Usar esta URL al compartir desde la app.
 */
export function buildShareUrl(
  entityType: ShareEntityType,
  id: string,
  opts?: ShareUrlOpts
): string {
  if (entityType === "evento") return `${OPEN_BASE}/evento/${id}`;
  if (entityType === "clase") {
    const type = opts?.type ?? "academy";
    const path = `${OPEN_BASE}/clase/${type}/${id}`;
    return appendClassQuery(path, opts);
  }
  if (entityType === "academia") return `${OPEN_BASE}/academia/${id}`;
  if (entityType === "maestro") return `${OPEN_BASE}/maestro/${id}`;
  if (entityType === "organizer") return `${OPEN_BASE}/organizer/${id}`;
  if (entityType === "user") return `${OPEN_BASE}/u/${encodeURIComponent(id)}`;
  if (entityType === "marca") return `${OPEN_BASE}/marca/${id}`;
  return `${OPEN_BASE}/evento/${id}`;
}

/**
 * URL canónica web (detalle final).
 * Usar para "Ver en navegador" y para abrir en WebView desde deep link.
 */
export function buildCanonicalUrl(
  entityType: ShareEntityType,
  id: string,
  opts?: ShareUrlOpts
): string {
  if (entityType === "evento") return `${SEO_BASE_URL}/social/fecha/${id}`;
  if (entityType === "clase") {
    const type = opts?.type ?? "academy";
    const path = `${SEO_BASE_URL}/clase/${type}/${id}`;
    return appendClassQuery(path, opts);
  }
  if (entityType === "academia") return `${SEO_BASE_URL}/academia/${id}`;
  if (entityType === "maestro") return `${SEO_BASE_URL}/maestro/${id}`;
  if (entityType === "organizer") return `${SEO_BASE_URL}/organizer/${id}`;
  if (entityType === "user") return `${SEO_BASE_URL}/u/${encodeURIComponent(id)}`;
  if (entityType === "marca") return `${SEO_BASE_URL}/marca/${id}`;
  return `${SEO_BASE_URL}/social/fecha/${id}`;
}

/**
 * Deep link nativo (dondebailarmx://).
 * Abre la app; el host debe cargar la URL canónica en el WebView.
 */
export function buildDeepLink(
  entityType: ShareEntityType,
  id: string,
  opts?: ShareUrlOpts
): string {
  if (entityType === "evento") return `${DEEP_LINK_SCHEME}://evento/${id}`;
  if (entityType === "clase") {
    const type = opts?.type ?? "academy";
    const path = `${DEEP_LINK_SCHEME}://clase/${type}/${id}`;
    return appendClassQuery(path, opts);
  }
  if (entityType === "academia") return `${DEEP_LINK_SCHEME}://academia/${id}`;
  if (entityType === "maestro") return `${DEEP_LINK_SCHEME}://maestro/${id}`;
  if (entityType === "organizer") return `${DEEP_LINK_SCHEME}://organizer/${id}`;
  if (entityType === "user") return `${DEEP_LINK_SCHEME}://u/${encodeURIComponent(id)}`;
  if (entityType === "marca") return `${DEEP_LINK_SCHEME}://marca/${id}`;
  return `${DEEP_LINK_SCHEME}://evento/${id}`;
}
