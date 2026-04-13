import { Button } from "@relume_io/relume-ui";
import React from "react";

export function HeroSection() {
  return (
    <section
      id="relume"
      className="grid grid-cols-1 items-center gap-y-16 pt-16 md:pt-24 lg:grid-cols-2 lg:pt-0"
    >
      <div className="mx-[5%] sm:max-w-md md:justify-self-start lg:ml-[5vw] lg:mr-20 lg:justify-self-end">
        <h1 className="mb-5 text-6xl font-bold md:mb-6 md:text-9xl lg:text-10xl">
          QR menüden fazlası: restoranınız için tek dijital merkez
        </h1>
        <p className="md:text-md">
          Menü yönetimini hızlandırın, çok dilli yayın yapın, misafir deneyimini
          güçlendirin. AI destekli araçlarla içerik üretimini ve güncellemeleri
          daha kısa sürede tamamlayın.
        </p>
        <div>
          <div className="mt-6 flex flex-wrap gap-4 md:mt-8">
            <Button title="Demo" className="bg-[#FF4F7A] border-[#FF4F7A] text-white hover:bg-[#E8456E] hover:border-[#E8456E]" asChild>
              <a href="/menu/demo">Demo</a>
            </Button>
            <Button title="İletişime" variant="secondary" asChild>
              <a href="/iletisim">İletişime</a>
            </Button>
          </div>
        </div>
      </div>
      <div className="relative flex items-center">
        <div className="absolute w-[45%] pl-[5%] lg:pl-0">
          <img
            src="/phone-mockup.webp"
            alt="Tabbled restoran dijital menü"
            className="aspect-[2/3] w-full object-cover lg:h-full"
          />
        </div>
        <div className="ml-[10%]">
          <img
            src="/hero-restaurant.webp"
            alt="Tabbled restoran dijital menü"
            className="w-full object-cover lg:h-screen lg:max-h-[60rem]"
          />
        </div>
      </div>
    </section>
  );
}
