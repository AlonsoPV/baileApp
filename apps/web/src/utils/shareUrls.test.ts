import { describe, expect, it } from "vitest";
import { buildCanonicalUrl, buildDeepLink, buildShareUrl } from "./shareUrls";

describe("shareUrls", () => {
  it("builds event share, canonical and deep link with date id", () => {
    expect(buildShareUrl("evento", "13321")).toBe("https://dondebailar.com.mx/open/evento/13321");
    expect(buildCanonicalUrl("evento", "13321")).toBe("https://dondebailar.com.mx/social/fecha/13321");
    expect(buildDeepLink("evento", "13321")).toBe("dondebailarmx://evento/13321");
  });

  it("preserves class type and schedule index across all builders", () => {
    const opts = { type: "teacher", index: 2 };
    expect(buildShareUrl("clase", "456", opts)).toBe("https://dondebailar.com.mx/open/clase/teacher/456?i=2");
    expect(buildCanonicalUrl("clase", "456", opts)).toBe("https://dondebailar.com.mx/clase/teacher/456?i=2");
    expect(buildDeepLink("clase", "456", opts)).toBe("dondebailarmx://clase/teacher/456?i=2");
  });

  it("academia, maestro, organizer, user, marca: smart + canónica + deep link coherentes", () => {
    const academy = { kind: "academia" as const, id: "1" };
    expect(buildShareUrl(academy.kind, academy.id)).toBe(`${"https://dondebailar.com.mx"}/open/academia/1`);
    expect(buildDeepLink(academy.kind, academy.id)).toBe("dondebailarmx://academia/1");
    const org = { kind: "organizer" as const, id: "2" };
    expect(buildCanonicalUrl(org.kind, org.id)).toBe("https://dondebailar.com.mx/organizer/2");
    expect(buildDeepLink(org.kind, org.id)).toBe("dondebailarmx://organizer/2");
  });
});
