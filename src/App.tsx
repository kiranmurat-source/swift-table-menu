import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CookieBanner from "./components/CookieBanner";
import ErrorBoundary from "./components/ErrorBoundary";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import AnimatedLogo from "./components/AnimatedLogo";

const ConditionalWhatsApp = () => {
  const { pathname } = useLocation();
  const hide =
    pathname.startsWith("/menu/") ||
    pathname.startsWith("/dashboard") ||
    pathname === "/login" ||
    pathname === "/onboarding";
  return hide ? null : <FloatingWhatsApp />;
};

const queryClient = new QueryClient();

const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#fff" }}>
    <AnimatedLogo size={80} message="Yükleniyor..." />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CookieBanner />
        <ConditionalWhatsApp />
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
