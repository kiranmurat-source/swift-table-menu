import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import PublicMenu from "./pages/PublicMenu.tsx";
import CookieBanner from "./components/CookieBanner.tsx";

const Login = lazy(() => import("./pages/Login.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAFAF7" }}>
    <div className="flex flex-col items-center gap-4">
      <img src="/tabbled-logo.png" alt="Tabbled" className="w-32 animate-pulse" />
      <div className="flex gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#E8837C] animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-1.5 h-1.5 rounded-full bg-[#E8837C] animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-1.5 h-1.5 rounded-full bg-[#E8837C] animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  </div>
);

const App = () => (
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
);

export default App;
