import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  resolve: {
    alias: {
      "@ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@theme": path.resolve(__dirname, "src/theme")
    },
    dedupe: ["react", "react-dom"], // 👈 Asegura una sola copia de React
  }
});
