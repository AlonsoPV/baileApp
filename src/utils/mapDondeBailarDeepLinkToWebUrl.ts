/**
 * Convierte dondebailarmx:// y URLs https del sitio en la URL final que carga el WebView.
 * Debe mantenerse alineado con:
 * - apps/web/src/utils/shareUrls.ts (buildDeepLink / buildCanonicalUrl)
 * - app.config.ts intent filters (Android) e Info.plist URL schemes (iOS)
 *
 * Notas:
 * - Los segmentos de path pueden llegar percent-encoded; se decodifican antes de remontar
 *   la canónica (p. ej. usuario con @ en el id).
 * - La ruta "user" termina con encodeURIComponent en la canónica (igual que shareUrls).
 * - ?i= en clase se toma de searchParams (y se conserva u.search como respaldo).
 */

export const DEFAULT_DONDE_BAILAR_WEB_ORIGIN = "https://dondebailar.com.mx";

function normalizeBase(base: string): string {
  return String(base || "").replace(/\/+$/, "");
}

/** Decodifica un segmento de path; si el decode falla, devuelve el original. */
export function safeDecodePathSegment(segment: string): string {
  if (!segment) return segment;
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * `true` si la WebView ya está en (o redirigió a) la URL pendiente, sin comparar hash.
 * Usado para no re-inyectar replace() en bucle.
 */
export function isSameWebDestination(
  pending: string,
  currentDocumentUrl: string,
  _webOrigin: string = DEFAULT_DONDE_BAILAR_WEB_ORIGIN
): boolean {
  if (!pending || !currentDocumentUrl) return false;
  try {
    const a = new URL(pending);
    const b = new URL(currentDocumentUrl);
    a.searchParams.delete("__baileapp_dl");
    b.searchParams.delete("__baileapp_dl");
    a.searchParams.delete("__baileapp_route_retry");
    b.searchParams.delete("__baileapp_route_retry");
    const pathSearchA = `${a.pathname.replace(/\/$/, "")}${a.search || ""}`.toLowerCase();
    const pathSearchB = `${b.pathname.replace(/\/$/, "")}${b.search || ""}`.toLowerCase();
    if (a.host !== b.host) return false;
    return pathSearchA === pathSearchB;
  } catch {
    return false;
  }
}

/**
 * @param incomingUrl deep link o URL https del producto
 * @param webOrigin origen canónico (p.ej. https://dondebailar.com.mx)
 */
export function mapDondeBailarDeepLinkToWebUrl(
  incomingUrl: string,
  webOrigin: string = DEFAULT_DONDE_BAILAR_WEB_ORIGIN
): string | null {
  const base = normalizeBase(webOrigin);
  if (!base) return null;

  try {
    if (incomingUrl.startsWith("dondebailarmx://")) {
      const u = new URL(incomingUrl);
      const host = (u.host || "").toLowerCase();
      const path = (u.pathname || "").replace(/^\/+/, "") || "";
      const hash = u.hash || "";

      if (host === "evento" && path) {
        const raw = path.split("/")[0];
        if (!raw) return null;
        const id = safeDecodePathSegment(raw);
        if (!id) return null;
        return `${base}/social/fecha/${id}${u.search || ""}${hash}`;
      }

      if (host === "clase" && path) {
        const parts = path.split("/").filter(Boolean);
        if (parts.length >= 2) {
          const type = safeDecodePathSegment(parts[0]);
          const id = safeDecodePathSegment(parts[1]);
          if ((type === "teacher" || type === "academy") && id) {
            // u.search conserva ?i= y cualquier otro query (p. ej. cronograma)
            return `${base}/clase/${type}/${id}${u.search || ""}${hash}`;
          }
        }
        return null;
      }

      if (host === "academia" && path) {
        const raw = path.split("/")[0];
        if (!raw) return null;
        const id = safeDecodePathSegment(raw);
        return id ? `${base}/academia/${id}${u.search || ""}${hash}` : null;
      }
      if (host === "maestro" && path) {
        const raw = path.split("/")[0];
        if (!raw) return null;
        const id = safeDecodePathSegment(raw);
        return id ? `${base}/maestro/${id}${u.search || ""}${hash}` : null;
      }
      if (host === "organizer" && path) {
        const raw = path.split("/")[0];
        if (!raw) return null;
        const id = safeDecodePathSegment(raw);
        return id ? `${base}/organizer/${id}${u.search || ""}${hash}` : null;
      }
      if (host === "u" && path) {
        const raw = path.split("/")[0];
        if (!raw) return null;
        const idDecoded = safeDecodePathSegment(raw);
        if (!idDecoded) return null;
        return `${base}/u/${encodeURIComponent(idDecoded)}${u.search || ""}${hash}`;
      }
      if (host === "marca" && path) {
        const raw = path.split("/")[0];
        if (!raw) return null;
        const id = safeDecodePathSegment(raw);
        return id ? `${base}/marca/${id}${u.search || ""}${hash}` : null;
      }

      if (host === "auth") {
        const hostSlash = u.host ? `/${u.host}` : "";
        const mappedPath = `${hostSlash}${u.pathname || ""}` || "/auth/callback";
        return `${base}${mappedPath}${u.search || ""}${hash}`;
      }

      return null;
    }

    if (
      incomingUrl.startsWith("https://dondebailar.com.mx") ||
      incomingUrl.startsWith("https://www.dondebailar.com.mx")
    ) {
      return incomingUrl;
    }

    return null;
  } catch {
    return null;
  }
}
