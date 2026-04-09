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
});
