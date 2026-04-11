import { Button } from "@/components/ui/button";
import { CaretCircleRight } from "@phosphor-icons/react";

const CTABanner = () => (
  <section className="py-20 lg:py-28 bg-gradient-to-br from-grapefruit to-grapefruit-deep">
    <div className="container mx-auto px-4 lg:px-8 text-center">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-card mb-4">
        Menünüzü bugün dijitalleştirin
      </h2>
      <p className="text-lg text-card/80 mb-8">
        14 gün ücretsiz deneyin. Kredi kartı gerekmez, 2 dakikada kurulum.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <a href="/iletisim">
          <Button variant="cta-white" size="lg" className="rounded-full px-10 text-base">
            14 Gün Ücretsiz Deneyin <CaretCircleRight className="w-4 h-4" />
          </Button>
        </a>
        <a href="/menu/demo">
          <Button variant="hero-outline" size="lg" className="rounded-full px-10 text-base bg-transparent text-card border-card/40 hover:bg-card/10">
            Demo Menüyü İncele
          </Button>
        </a>
      </div>
    </div>
  </section>
);

export default CTABanner;
