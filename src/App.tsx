import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index.tsx";
import CookieBanner from "./components/CookieBanner.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";

const PublicMenu = lazy(() => import("./pages/PublicMenu.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

import AnimatedLogo from "./components/AnimatedLogo.tsx";

const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#fff" }}>
    <AnimatedLogo size={80} message="Yükleniyor..." />
  </div>
);

const App = () => (
  <HelmetProvider>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CookieBanner />
            <Suspense fallback={<PageLoading />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/menu/:slug" element={<PublicMenu />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </HelmetProvider>
);

export default App;
