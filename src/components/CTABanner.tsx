import { Button } from "@/components/ui/button";
import { CiCircleChevRight } from "react-icons/ci";

const CTABanner = () => (
  <section className="py-20 lg:py-28 bg-gradient-to-br from-grapefruit to-grapefruit-deep">
    <div className="container mx-auto px-4 lg:px-8 text-center">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-card mb-4">
        Menünüzü bugün dijitalleştirin
      </h2>
      <p className="text-lg text-card/80 mb-8">1 Ocak 2026 itibarıyla QR menü yasal zorunluluk. Hemen başlayın.</p>
      <div className="flex flex-wrap gap-4 justify-center">
        <a href="/menu/abc-restaurant">
          <Button variant="cta-white" size="lg" className="rounded-full px-10 text-base">
            Demo Menüyü Gör <CiCircleChevRight className="w-4 h-4" />
          </Button>
        </a>
      </div>
    </div>
  </section>
);

export default CTABanner;
