import "@testing-library/jest-dom/vitest";

// Minimal i18n bootstrap for component tests.
// Many screens rely on react-i18next; without an instance, tests render raw keys.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: "es",
    fallbackLng: "es",
    interpolation: { escapeValue: false },
    resources: {
      es: {
        translation: {
          // Explore quick date presets
          all: "Todos",
          today: "Hoy",
          this_week: "Esta semana",
          next_week: "Siguientes",
        },
      },
    },
  });
}

