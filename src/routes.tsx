import { lazy } from "react";
import type { RouteRecord } from "vite-react-ssg";
import App from "./App";
import Index from "./pages/Index";
import { blogPosts } from "./lib/blogData";

const PublicMenu = lazy(() => import("./pages/PublicMenu"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const NotFound = lazy(() => import("./pages/NotFound"));

export const routes: RouteRecord[] = [
  {
    path: "/",
    Component: App,
    children: [
      { index: true, Component: Index },
      { path: "blog", Component: Blog },
      {
        path: "blog/:slug",
        Component: BlogPost,
        getStaticPaths: () => blogPosts.map((p) => `blog/${p.slug}`),
      },
      { path: "privacy", Component: PrivacyPolicy },
      { path: "iletisim", Component: Contact },
      {
        path: "menu/:slug",
        Component: PublicMenu,
        getStaticPaths: async () => {
          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
          );
          const { data, error } = await supabase
            .from("restaurants")
            .select("slug")
            .eq("is_active", true);

          if (error || !data) {
            console.warn("[SSG] Failed to fetch active restaurants for prerender:", error);
            return [];
          }
          console.log("[SSG] Prerendering", data.length, "active restaurants");
          return data.map((r) => `menu/${r.slug}`);
        },
      },
      { path: "login", Component: Login },
      { path: "onboarding", Component: Onboarding },
      { path: "dashboard", Component: Dashboard },
      { path: "*", Component: NotFound },
    ],
  },
];
