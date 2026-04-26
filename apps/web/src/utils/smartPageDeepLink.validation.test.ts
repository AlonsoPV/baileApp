import { describe, expect, it } from "vitest";
import {
  mapDondeBailarDeepLinkToWebUrl,
  isSameWebDestination,
  parseDondeBailarDeepLink,
  safeDecodePathSegment,
} from "../../../../src/utils/mapDondeBailarDeepLinkToWebUrl";
import { buildCanonicalUrl, buildDeepLink, buildShareUrl } from "./shareUrls";

const BASE = "https://dondebailar.com.mx";

/**
 * Regresión: shareUrls (web) y mapDondeBailarDeepLinkToWebUrl (iOS/Android WebView) deben
 * coincidir en deep link → URL canónica. Smart page: /open/... → CTA "Abrir en app" → mapeo.
 */
describe("smart page / deep link alignment (iOS + Android WebView)", () => {
  it("Evento: deep link y canónica coinciden con shareUrls", () => {
    const id = "13321";
    const dl = buildDeepLink("evento", id);
    expect(dl).toBe("dondebailarmx://evento/13321");
    expect(mapDondeBailarDeepLinkToWebUrl(dl, BASE)).toBe(buildCanonicalUrl("evento", id));
    expect(buildShareUrl("evento", id)).toBe(`${BASE}/open/evento/${id}`);
  });

  it("Smart Page evento: /open/evento/:id -> deep link -> ruta web interna canónica", () => {
    const id = "13321";
    const shareUrl = buildShareUrl("evento", id);
    const deepLink = buildDeepLink("evento", id);
    const canonicalUrl = buildCanonicalUrl("evento", id);

    expect(shareUrl).toBe(`${BASE}/open/evento/${id}`);
    expect(deepLink).toBe(`dondebailarmx://evento/${id}`);
    expect(mapDondeBailarDeepLinkToWebUrl(deepLink, BASE)).toBe(canonicalUrl);
    expect(new URL(canonicalUrl).pathname).toBe(`/social/fecha/${id}`);
  });

  it("Smart Page organizador: /open/organizer/:id -> deep link -> ruta web interna canónica", () => {
    const id = "56";
    const shareUrl = buildShareUrl("organizer", id);
    const deepLink = buildDeepLink("organizer", id);
    const canonicalUrl = buildCanonicalUrl("organizer", id);

    expect(shareUrl).toBe(`${BASE}/open/organizer/${id}`);
    expect(deepLink).toBe("dondebailarmx://explore?type=organizadores&when=todos");
    expect(mapDondeBailarDeepLinkToWebUrl(deepLink, BASE)).toBe(canonicalUrl);
    expect(canonicalUrl).toBe(`${BASE}/explore?type=organizadores&when=todos`);
  });

  it("Maestro, usuario y organizador apuntan a listados reales de Explore", () => {
    const cases = [
      { kind: "maestro" as const, id: "34", type: "maestros" },
      { kind: "user" as const, id: "abc-def-123", type: "usuarios" },
      { kind: "organizer" as const, id: "56", type: "organizadores" },
    ];
    for (const { kind, id, type } of cases) {
      const deepLink = buildDeepLink(kind, id);
      const canonicalUrl = buildCanonicalUrl(kind, id);

      expect(deepLink).toBe(`dondebailarmx://explore?type=${type}&when=todos`);
      expect(canonicalUrl).toBe(`${BASE}/explore?type=${type}&when=todos`);
      expect(mapDondeBailarDeepLinkToWebUrl(deepLink, BASE)).toBe(canonicalUrl);
    }
  });

  it("Clase (teacher) con query ?i= y ?dia= respeta shareUrls", () => {
    const opts = { type: "teacher" as const, index: 2, dia: 0 };
    const id = "456";
    const dl = buildDeepLink("clase", id, opts);
    expect(mapDondeBailarDeepLinkToWebUrl(dl, BASE)).toBe(buildCanonicalUrl("clase", id, opts));
    expect(buildShareUrl("clase", id, opts)).toBe(`${BASE}/open/clase/teacher/456?i=2&dia=0`);
  });

  it("Clase (academy) sin índice", () => {
    const opts = { type: "academy" as const };
    const id = "789";
    const dl = buildDeepLink("clase", id, opts);
    expect(mapDondeBailarDeepLinkToWebUrl(dl, BASE)).toBe(buildCanonicalUrl("clase", id, opts));
  });

  it("rechaza tipo de clase inválido", () => {
    expect(mapDondeBailarDeepLinkToWebUrl("dondebailarmx://clase/other/1", BASE)).toBeNull();
  });

  it("Academia, Maestro, Organizador, Usuario, Marca", () => {
    const cases: { kind: "academia" | "maestro" | "organizer" | "user" | "marca"; id: string }[] = [
      { kind: "academia", id: "12" },
      { kind: "maestro", id: "34" },
      { kind: "organizer", id: "56" },
      { kind: "user", id: "abc-def-123" },
      { kind: "marca", id: "78" },
    ];
    for (const { kind, id } of cases) {
      const dl = buildDeepLink(kind, id);
      const mapped = mapDondeBailarDeepLinkToWebUrl(dl, BASE);
      const canonical = buildCanonicalUrl(kind, id);
      expect(mapped, `${kind} ${id}`).toBe(canonical);
      expect(buildShareUrl(kind, id)).toContain(`${BASE}/open/`);
    }
  });

  it("Usuario: id alfanumérico (típico Supabase/UUID en URL)", () => {
    const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const dl = buildDeepLink("user", id);
    expect(mapDondeBailarDeepLinkToWebUrl(dl, BASE)).toBe(buildCanonicalUrl("user", id));
  });

  it("pasa https del propio dominio al WebView sin cambio", () => {
    const u = `${BASE}/explore`;
    expect(mapDondeBailarDeepLinkToWebUrl(u, BASE)).toBe(u);
  });

  it("URL opaca no se mapea", () => {
    expect(mapDondeBailarDeepLinkToWebUrl("https://google.com", BASE)).toBeNull();
  });
});

describe("custom scheme parser formats", () => {
  it("parsea formato host: dondebailarmx://evento/123", () => {
    const parsed = parseDondeBailarDeepLink("dondebailarmx://evento/123?x=1");
    expect(parsed).toMatchObject({
      protocol: "dondebailarmx:",
      hostname: "evento",
      pathname: "/123",
      search: "?x=1",
      entity: "evento",
      parts: ["123"],
    });
  });

  it("parsea formato pathname: dondebailarmx:///evento/123", () => {
    const parsed = parseDondeBailarDeepLink("dondebailarmx:///evento/123?x=1");
    expect(parsed).toMatchObject({
      protocol: "dondebailarmx:",
      hostname: "",
      pathname: "/evento/123",
      search: "?x=1",
      entity: "evento",
      parts: ["123"],
    });
  });

  it("mapea todas las entidades en formato host", () => {
    const cases = [
      ["dondebailarmx://evento/123", `${BASE}/social/fecha/123`],
      ["dondebailarmx://clase/teacher/456?i=2&dia=0", `${BASE}/clase/teacher/456?i=2&dia=0`],
      ["dondebailarmx://clase/academy/456", `${BASE}/clase/academy/456`],
      ["dondebailarmx://academia/789", `${BASE}/academia/789`],
      ["dondebailarmx://explore?type=maestros&when=todos", `${BASE}/explore?type=maestros&when=todos`],
      ["dondebailarmx://explore?type=organizadores&when=todos", `${BASE}/explore?type=organizadores&when=todos`],
      ["dondebailarmx://explore?type=usuarios&when=todos", `${BASE}/explore?type=usuarios&when=todos`],
    ] as const;

    for (const [deepLink, expected] of cases) {
      expect(mapDondeBailarDeepLinkToWebUrl(deepLink, BASE), deepLink).toBe(expected);
    }
  });

  it("mapea todas las entidades en formato pathname", () => {
    const cases = [
      ["dondebailarmx:///evento/123", `${BASE}/social/fecha/123`],
      ["dondebailarmx:///clase/teacher/456?i=2&dia=0", `${BASE}/clase/teacher/456?i=2&dia=0`],
      ["dondebailarmx:///clase/academy/456", `${BASE}/clase/academy/456`],
      ["dondebailarmx:///academia/789", `${BASE}/academia/789`],
      ["dondebailarmx:///explore?type=maestros&when=todos", `${BASE}/explore?type=maestros&when=todos`],
      ["dondebailarmx:///explore?type=organizadores&when=todos", `${BASE}/explore?type=organizadores&when=todos`],
      ["dondebailarmx:///explore?type=usuarios&when=todos", `${BASE}/explore?type=usuarios&when=todos`],
    ] as const;

    for (const [deepLink, expected] of cases) {
      expect(mapDondeBailarDeepLinkToWebUrl(deepLink, BASE), deepLink).toBe(expected);
    }
  });
});

describe("smart page / deep link edge cases", () => {
  it("usuario: buildDeepLink apunta al listado real de Explore", () => {
    const id = "user@domain.com";
    const dl = buildDeepLink("user", id);
    const mapped = mapDondeBailarDeepLinkToWebUrl(dl, BASE);
    const canonical = buildCanonicalUrl("user", id);
    expect(mapped).toBe(canonical);
    expect(mapped).toBe(`${BASE}/explore?type=usuarios&when=todos`);
    expect(mapped).not.toContain("%25");
  });

  it("usuario: deep link legacy /u también cae al listado real de Explore", () => {
    const id = "a@b.c";
    const segment = encodeURIComponent(id);
    const dl = `dondebailarmx://u/${segment}`;
    expect(mapDondeBailarDeepLinkToWebUrl(dl, BASE)).toBe(`${BASE}/explore?type=usuarios&when=todos`);
  });

  it("clase: ?i= y ?dia= se conservan en la canónica", () => {
    const dl = "dondebailarmx://clase/teacher/456?i=2&dia=0";
    expect(mapDondeBailarDeepLinkToWebUrl(dl, BASE)).toBe(`${BASE}/clase/teacher/456?i=2&dia=0`);
    expect(buildCanonicalUrl("clase", "456", { type: "teacher", index: 2, dia: 0 })).toBe(
      `${BASE}/clase/teacher/456?i=2&dia=0`
    );
  });

  it("clase: sin ?i= no añade query vacío", () => {
    const dl = buildDeepLink("clase", "789", { type: "academy" });
    const mapped = mapDondeBailarDeepLinkToWebUrl(dl, BASE);
    expect(mapped).toBe(`${BASE}/clase/academy/789`);
    expect(mapped).not.toContain("?i=");
  });

  it("evento: path sin id → null", () => {
    expect(mapDondeBailarDeepLinkToWebUrl("dondebailarmx://evento/", BASE)).toBeNull();
  });

  it("marca: round-trip explícito", () => {
    const id = "brand-99";
    const dl = buildDeepLink("marca", id);
    expect(mapDondeBailarDeepLinkToWebUrl(dl, BASE)).toBe(buildCanonicalUrl("marca", id));
  });

  it("isSameWebDestination: evita replace si el documento ya coincide (path+search)", () => {
    const p = `${BASE}/social/fecha/1`;
    expect(isSameWebDestination(p, `${BASE}/social/fecha/1`)).toBe(true);
    expect(isSameWebDestination(p, `${BASE}/social/fecha/1/`)).toBe(true);
    expect(isSameWebDestination(`${p}?__baileapp_dl=1`, `${p}?__baileapp_dl=2`)).toBe(true);
    expect(isSameWebDestination(`${p}?__baileapp_route_retry=1`, p)).toBe(true);
  });

  it("safeDecodePathSegment: decodifica %2F y no rompe en ids simples", () => {
    expect(safeDecodePathSegment("100")).toBe("100");
    expect(safeDecodePathSegment("x%2Fy")).toBe("x/y");
  });
});
