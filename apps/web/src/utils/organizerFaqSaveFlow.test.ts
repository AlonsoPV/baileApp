import { describe, expect, it } from "vitest";
import {
  findInvalidOrganizerFaq,
  parseOrganizerFaqFromDb,
  sanitizeOrganizerFaqForSave,
} from "./organizerFaq";
import { renderOrganizerFaqAnswerToHtml } from "./organizerFaqRichText";

describe("organizer FAQ save + public view (post-migration shape)", () => {
  it("parses jsonb-like array, validates, sanitizes for save, and renders markdown for public HTML", () => {
    const raw = [
      { id: "a1", q: "Precio", a: "- Taquilla: $100\n- [más](https://x.com)", sort_order: 0 },
      { id: "a2", q: "", a: "", sort_order: 1 },
    ];

    const parsed = parseOrganizerFaqFromDb(raw);
    expect(parsed.length).toBe(2);
    expect(findInvalidOrganizerFaq(parsed)).toBe(false);

    const toSave = sanitizeOrganizerFaqForSave(parsed);
    expect(toSave.length).toBe(1);
    expect(toSave[0].q).toBe("Precio");

    const html = renderOrganizerFaqAnswerToHtml(toSave[0].a);
    expect(html).toContain("<ul");
    expect(html).toContain("https://x.com");
  });

  it("flags incomplete rows (solo pregunta o solo respuesta)", () => {
    expect(
      findInvalidOrganizerFaq([
        { id: "1", q: "Solo Q", a: "", sort_order: 0 },
      ])
    ).toBe(true);
    expect(
      findInvalidOrganizerFaq([
        { id: "1", q: "", a: "Solo A", sort_order: 0 },
      ])
    ).toBe(true);
  });
});
