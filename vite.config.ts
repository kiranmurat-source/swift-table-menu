import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode, isSsrBuild }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
      "react-router",
      "react-router-dom",
      "react-helmet-async",
    ],
  },
  build: {
    rollupOptions: {
      // manualChunks is only valid for the client build; SSR treats
      // React/dependencies as externals which cannot be manual-chunked.
      output: isSsrBuild
        ? undefined
        : {
            manualChunks: {
              "vendor-react": ["react", "react-dom", "react-router-dom"],
              "vendor-supabase": ["@supabase/supabase-js"],
              "vendor-query": ["@tanstack/react-query"],
            },
          },
    },
  },
}));
