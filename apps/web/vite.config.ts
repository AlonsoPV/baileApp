import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getMainCssBundlePath(bundle?: Record<string, unknown>): string | null {
  if (!bundle) return null;

  for (const fileName of Object.keys(bundle)) {
    if (!fileName.endsWith(".css")) continue;
    if (fileName === "assets/main.css") return fileName;

    const asset = bundle[fileName] as
      | {
          name?: string;
          names?: string[];
          originalFileNames?: string[];
        }
      | undefined;

    const candidateNames = [
      ...(asset?.names ?? []),
      ...(asset?.originalFileNames ?? []),
      asset?.name ?? "",
      fileName,
    ];

    if (candidateNames.some((name) => name === "index.css" || name.endsWith("/index.css"))) {
      return fileName;
    }
  }

  return null;
}

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
  return {
    name: "html-head-optimizations",
    transformIndexHtml(html: string, ctx?: { bundle?: Record<string, unknown> }) {
      let nextHtml = html;
      const mainCssPath = getMainCssBundlePath(ctx?.bundle);

      if (mainCssPath) {
        const stylesheetTagPattern = new RegExp(
          `<link rel="stylesheet"(?: crossorigin)? href="/${escapeRegExp(mainCssPath)}">`,
        );

        if (stylesheetTagPattern.test(nextHtml)) {
          nextHtml = nextHtml.replace(
            stylesheetTagPattern,
            [
              `    <link rel="preload" href="/${mainCssPath}" as="style" onload="this.onload=null;this.rel='stylesheet'">`,
              `    <noscript><link rel="stylesheet" href="/${mainCssPath}"></noscript>`,
            ].join("\n"),
          );
        }
      }

      return nextHtml;
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
    alias: [
      { find: "@ui", replacement: path.resolve(__dirname, "../../packages/ui/src") },
      { find: "@theme", replacement: path.resolve(__dirname, "src/theme") },
      { find: "@", replacement: path.resolve(__dirname, "src") },
    ],
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
