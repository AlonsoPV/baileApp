import React from "react";
import { describe, it, expect, beforeAll } from "vitest";
import i18n from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OrganizerPublicFaqSection from "./OrganizerPublicFaqSection";
import esCommon from "../../i18n/locales/es/common.json";

const instance = i18n.createInstance();

beforeAll(async () => {
  window.scrollTo = () => {};
  await instance.use(initReactI18next).init({
    lng: "es",
    fallbackLng: "es",
    ns: ["common"],
    defaultNS: "common",
    resources: { es: { common: esCommon as unknown as Record<string, unknown> } },
    interpolation: { escapeValue: false },
  });
});

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={instance}>{ui}</I18nextProvider>);
}

describe("OrganizerPublicFaqSection", () => {
  it("muestra FAQ y renderiza markdown sanitizado al expandir", async () => {
    const user = userEvent.setup();
    const items = [
      {
        id: "1",
        q: "¿Formas de pago?",
        a: "- Efectivo\n- [web](https://example.com)",
        sort_order: 0,
      },
    ];

    renderWithI18n(<OrganizerPublicFaqSection items={items} />);

    expect(screen.getByText("¿Formas de pago?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /¿Formas de pago/i }));

    const wrap = document.querySelector("[data-test-id=organizer-public-faq-answer]");
    expect(wrap).toBeTruthy();
    expect(wrap?.querySelector("ul")).toBeTruthy();
    const link = wrap?.querySelector("a[href='https://example.com']");
    expect(link).toBeTruthy();
  });
});
