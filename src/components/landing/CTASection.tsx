import { Button } from "@relume_io/relume-ui";
import React from "react";

export function CTASection() {
  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="mx-auto w-full max-w-lg text-center">
          <h2 className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
            Restoranınızı büyütmeye hazır mısınız?
          </h2>
          <p className="md:text-md">
            Tabbled'in restoranların iş akışlarını optimize etmelerine ve
            büyüyü hızlandırmalarına nasıl yardımcı olduğunu keşfedin.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 md:mt-8">
            <Button title="Demo" className="bg-[#FF4F7A] border-[#FF4F7A] text-white hover:bg-[#E8456E] hover:border-[#E8456E]" asChild>
              <a href="/login">14 Gün Ücretsiz Deneyin</a>
            </Button>
            <Button title="İletişime Geç" variant="secondary" asChild>
              <a href="https://wa.me/905325119484?text=Merhaba%2C%20Tabbled%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum">İletişime Geç</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
