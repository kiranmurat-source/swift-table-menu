import { Button } from "@relume_io/relume-ui";
import React from "react";
import { RxChevronRight } from "react-icons/rx";

export function HowItWorksSection() {
  return (
    <section id="nasil-calisir" className="px-[5%] py-16 md:py-24 lg:py-28 bg-[#1C1C1E] text-white">
      <div className="container">
        <div className="flex flex-col items-center">
          <div className="rb-12 mb-12 w-full max-w-lg text-center md:mb-18 lg:mb-20">
            <p className="mb-3 font-semibold md:mb-4">Başlangıç</p>
            <h2 className="rb-5 mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
              Üç adımda başlayın
            </h2>
            <p className="md:text-md">
              Tabbled'i kurmak hızlı ve basittir. Menünüzü yükleyin, QR kodunuzu
              paylaşın, büyümeyi izleyin.
            </p>
          </div>
          <div className="grid grid-cols-1 items-start justify-center gap-y-12 md:grid-cols-3 md:gap-x-8 md:gap-y-16 lg:gap-x-12">
            <div className="flex w-full flex-col items-center text-center">
              <div className="rb-5 mb-5 md:mb-6">
                <span className="text-4xl font-bold text-[#FF4F7A]">1</span>
              </div>
              <h3 className="mb-5 text-2xl font-bold md:mb-6 md:text-3xl md:leading-[1.3] lg:text-4xl">
                Kaydolun ve menünüzü yükleyin
              </h3>
              <p>
                Hesap oluşturun, menü dosyanızı yükleyin veya elle ekleyin,
                temel ayarları yapın.
              </p>
            </div>
            <div className="flex w-full flex-col items-center text-center">
              <div className="rb-5 mb-5 md:mb-6">
                <span className="text-4xl font-bold text-[#FF4F7A]">2</span>
              </div>
              <h3 className="mb-5 text-2xl font-bold md:mb-6 md:text-3xl md:leading-[1.3] lg:text-4xl">
                QR kodunuzu paylaşın ve yönetmeye başlayın
              </h3>
              <p>
                Benzersiz QR kodunuzu masalara, kapıya veya sosyal medyaya
                yerleştirin. Anında menüyü düzenleyin ve yayınlayın.
              </p>
            </div>
            <div className="flex w-full flex-col items-center text-center">
              <div className="rb-5 mb-5 md:mb-6">
                <span className="text-4xl font-bold text-[#FF4F7A]">3</span>
              </div>
              <h3 className="mb-5 text-2xl font-bold md:mb-6 md:text-3xl md:leading-[1.3] lg:text-4xl">
                Deneyimi ve büyümeyi izleyin
              </h3>
              <p>
                Misafir katılımını, menü etkileşimini ve Google yorumlarını
                gerçek zamanlı olarak izleyin.
              </p>
            </div>
          </div>
          <div className="mt-10 flex items-center gap-4 md:mt-14 lg:mt-16">
            <Button className="bg-[#FF4F7A] border-[#FF4F7A] text-white hover:bg-[#E8456E] hover:border-[#E8456E]" asChild>
              <a href="/iletisim">14 Gün Ücretsiz Deneyin</a>
            </Button>
            <Button iconRight={<RxChevronRight />} variant="link" size="link" className="text-white" asChild>
              <a href="#ozellikler">Daha fazla</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
