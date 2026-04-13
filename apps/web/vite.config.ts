import { defineConfig, loadEnv } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

function getManualChunk(id: string): string | undefined {
  if (!id.includes("node_modules")) return undefined;

  // Normalize Windows paths so chunk matching is stable.
  const pkg = id.replace(/\\/g, "/");

  if (pkg.includes("/node_modules/react/") || pkg.includes("/node_modules/react-dom/")) {
    return "react-vendor";
  }

  if (
    pkg.includes("/node_modules/react-router/") ||
    pkg.includes("/node_modules/react-router-dom/") ||
    pkg.includes("/node_modules/@remix-run/router/")
  ) {
    return "router";
  }

  if (
    pkg.includes("/node_modules/@supabase/") ||
    pkg.includes("/node_modules/@babel/runtime/")
  ) {
    return "supabase";
  }

  if (pkg.includes("/node_modules/framer-motion/") || pkg.includes("/node_modules/motion/")) {
    return "motion";
  }

  if (pkg.includes("/node_modules/react-icons/") || pkg.includes("/node_modules/lucide-react/")) {
    return "icons";
  }

  if (
    pkg.includes("/node_modules/@tanstack/react-query/") ||
    pkg.includes("/node_modules/@tanstack/query-core/")
  ) {
    return "query";
  }

  if (
    pkg.includes("/node_modules/i18next/") ||
    pkg.includes("/node_modules/react-i18next/") ||
    pkg.includes("/node_modules/i18next-browser-languagedetector/")
  ) {
    return "i18n";
  }

  return undefined;
}

function htmlHeadOptimizationsPlugin() {
  let viteMode = "production";
  return {
    name: "html-head-optimizations",
    configResolved(config: { mode: string }) {
      viteMode = config.mode;
    },
    transformIndexHtml(html: string, ctx?: { bundle?: Record<string, unknown> }) {
      const env = loadEnv(viteMode, process.cwd(), "");
      const base = (env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
      let nextHtml = html;
      const tags: string[] = [];

      if (ctx?.bundle && Object.prototype.hasOwnProperty.call(ctx.bundle, "assets/main.css")) {
        nextHtml = nextHtml.replace(
          `<link rel="stylesheet" crossorigin href="/assets/main.css">`,
          `    <link rel="preload" href="/assets/main.css" as="style" />\n    <link rel="stylesheet" crossorigin href="/assets/main.css">`,
        );
      }

      if (base) {
        nextHtml = nextHtml.replace(
          /(<link rel="apple-touch-icon"[^>]*>\s*)/i,
          `$1    <link rel="preconnect" href="${base}" crossorigin />\n`,
        );
      }

      if (!tags.length) return nextHtml;
      return nextHtml.replace(/<\/head>/i, `${tags.join("\n")}\n  </head>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), htmlHeadOptimizationsPlugin()],
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
      "utils/eventWhatsapp.test.ts",
      // Organizer FAQ: markdown sanitization, save flow, public section
      "utils/organizerFaqRichText.test.ts",
      "utils/organizerFaqSaveFlow.test.ts",
      "components/organizer/OrganizerPublicFaqSection.test.tsx",
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
    rollupOptions: {
      output: {
        manualChunks: getManualChunk,
        assetFileNames: (assetInfo) => {
          const originalName = assetInfo.names?.[0] ?? assetInfo.name ?? "";
          if (originalName === "index.css") {
            return "assets/main.css";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});
