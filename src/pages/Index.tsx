import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LogoBar from "@/components/LogoBar";
import FeaturesSection from "@/components/FeaturesSection";
import ValueProposition from "@/components/ValueProposition";
import HowItWorks from "@/components/HowItWorks";
import PricingSection from "@/components/PricingSection";
import RoadmapSection from "@/components/RoadmapSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import MetricsBar from "@/components/MetricsBar";
import CTABanner from "@/components/CTABanner";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <LogoBar />
      <FeaturesSection />
      <ValueProposition />
      <HowItWorks />
      <PricingSection />
      <RoadmapSection />
      <TestimonialsSection />
      <MetricsBar />
      <CTABanner />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;
