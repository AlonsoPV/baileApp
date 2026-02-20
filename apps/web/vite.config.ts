import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    dir: "src",
    // Keep the suite intentionally small and stable.
    // (Some legacy tests import extremely large screens and can OOM on Windows.)
    include: [
      "components/auth/RequireLogin.test.tsx",
      "hooks/useUserProfile.timeout.test.tsx",
      "screens/onboarding/PickZonas.loading.test.tsx",
      // User data isolation guardrails (per-user storage namespacing)
      "state/userIsolation.test.ts",
      // RSVP expiration logic
      "utils/eventDateExpiration.test.ts",
    ],
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
    // Keep tests fast and deterministic
    testTimeout: 10_000,
    // Avoid importing extremely heavy screens in unit test runs.
    // (This file is better suited for dedicated integration/e2e tests.)
    exclude: [...configDefaults.exclude, "src/screens/explore/ExploreHomeScreenModern.test.tsx"],
    // Reduce memory usage on large repos (Windows tends to OOM with threads).
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
        execArgv: ["--max-old-space-size=8192"],
      },
    },
    deps: {
      optimizer: {
        web: { enabled: false },
        ssr: { enabled: false },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  resolve: {
    alias: {
      "@ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@theme": path.resolve(__dirname, "src/theme"),
      "@": path.resolve(__dirname, "src")
    },
    dedupe: ["react", "react-dom"], // 👈 Asegura una sola copia de React
  },
  build: {
    sourcemap: true, // 👈 Clave para stack trace legible en producción
  },
});
