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
  ssgOptions: {
    // Auth-gated routes are rendered at request time by api/spa.ts (Vercel
    // Function) instead of being prerendered. A stale build-time snapshot
    // for /login, /dashboard, /onboarding has no useful first-paint content
    // (auth state is empty) and historically caused hydration mismatches
    // when vercel.json rewrote them to /index.html.
    // vite-react-ssg passes paths in slug form (no leading slash, except "/"
    // for the index route): "login", "dashboard/:path", etc.
    includedRoutes: (paths: string[]) =>
      paths.filter((p) => !["login", "dashboard", "onboarding"].includes(p)),
  },
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
    // Don't copy public/ into dist-server — the Vercel Function has no use
    // for favicons/images and includeFiles would otherwise ship ~9 MB of
    // static assets into the Function bundle.
    copyPublicDir: !isSsrBuild,
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
