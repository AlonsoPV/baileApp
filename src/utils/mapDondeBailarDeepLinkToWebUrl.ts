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

export type ParsedDondeBailarDeepLink = {
  protocol: string;
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
  entity: string;
  parts: string[];
};

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

export function parseDondeBailarDeepLink(incomingUrl: string): ParsedDondeBailarDeepLink | null {
  const SCHEME = "dondebailarmx://";
  if (!incomingUrl || !incomingUrl.startsWith(SCHEME)) return null;

  const restWithHash = incomingUrl.slice(SCHEME.length);
  const hashIndex = restWithHash.indexOf("#");
  const beforeHash = hashIndex >= 0 ? restWithHash.slice(0, hashIndex) : restWithHash;
  const hash = hashIndex >= 0 ? restWithHash.slice(hashIndex) : "";
  const queryIndex = beforeHash.indexOf("?");
  const pathPart = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;
  const search = queryIndex >= 0 ? beforeHash.slice(queryIndex) : "";

  const hasPathOnlyAuthority = pathPart.startsWith("/");
  const rawSegments = pathPart.split("/").filter(Boolean);
  const hostname = hasPathOnlyAuthority ? "" : String(rawSegments.shift() || "").toLowerCase();
  const entity = hostname || String(rawSegments.shift() || "").toLowerCase();
  if (!entity) return null;

  const pathname = hasPathOnlyAuthority ? pathPart : rawSegments.length ? `/${rawSegments.join("/")}` : "";

  return {
    protocol: "dondebailarmx:",
    hostname,
    pathname,
    search,
    hash,
    entity,
    parts: rawSegments.map(safeDecodePathSegment),
  };
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
      const parsed = parseDondeBailarDeepLink(incomingUrl);
      if (!parsed) return null;
      const { entity, parts, search, hash } = parsed;

      if (entity === "evento") {
        const id = parts[0];
        if (!id) return null;
        return `${base}/social/fecha/${id}${search}${hash}`;
      }

      if (entity === "clase") {
        if (parts.length >= 2) {
          const type = parts[0];
          const id = parts[1];
          if ((type === "teacher" || type === "academy") && id) return `${base}/clase/${type}/${id}${search}${hash}`;
        }
        return null;
      }

      if (entity === "academia") {
        const id = parts[0];
        return id ? `${base}/academia/${id}${search}${hash}` : null;
      }
      if (entity === "explore") {
        return `${base}/explore${search || "?when=todos"}${hash}`;
      }
      if (entity === "maestro") {
        const id = parts[0];
        return id ? `${base}/maestro/${id}${search}${hash}` : null;
      }
      if (entity === "organizer") {
        const id = parts[0];
        return id ? `${base}/organizer/${id}${search}${hash}` : null;
      }
      if (entity === "u") {
        const idDecoded = parts[0];
        if (!idDecoded) return null;
        return `${base}/u/${encodeURIComponent(idDecoded)}${search}${hash}`;
      }
      if (entity === "marca") {
        const id = parts[0];
        return id ? `${base}/marca/${id}${search}${hash}` : null;
      }

      if (entity === "auth") {
        const authPath = parts.length > 0 ? `/auth/${parts.join("/")}` : "/auth/callback";
        return `${base}${authPath}${search}${hash}`;
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
