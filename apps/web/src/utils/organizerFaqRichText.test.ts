import { describe, expect, it } from "vitest";
import { renderOrganizerFaqAnswerToHtml } from "./organizerFaqRichText";

describe("renderOrganizerFaqAnswerToHtml", () => {
  it("returns empty string for blank input", () => {
    expect(renderOrganizerFaqAnswerToHtml("")).toBe("");
    expect(renderOrganizerFaqAnswerToHtml("   ")).toBe("");
  });

  it("renders lists and strips script tags", () => {
    const html = renderOrganizerFaqAnswerToHtml("- uno\n- dos\n\n<script>alert(1)</script>");
    expect(html).toContain("<ul");
    expect(html).toContain("uno");
    expect(html.toLowerCase()).not.toContain("<script");
  });

  it("allows safe links and adds rel on http(s)", () => {
    const html = renderOrganizerFaqAnswerToHtml("[sitio](https://example.com/path)");
    expect(html).toContain('href="https://example.com/path"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });
});
