import { Button } from "@relume_io/relume-ui";
import React from "react";
import { RxChevronRight } from "react-icons/rx";

export function BlogListSection() {
  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="mb-12 md:mb-18 lg:mb-20">
          <div className="mx-auto w-full max-w-lg text-center">
            <p className="mb-3 font-semibold md:mb-4">Blog</p>
            <h1 className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
              Restoran dünyasından içgörüler
            </h1>
            <p className="md:text-md">
              Stratejiler, rehberler ve sektör trendleri
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-start">
          <div className="grid grid-cols-1 gap-x-12 gap-y-12 md:gap-y-16 lg:grid-cols-2">
            <div className="grid gap-x-8 gap-y-6 md:grid-cols-[.75fr_1fr] md:gap-y-4">
              <a href="#" className="w-full">
                <img
                  src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg"
                  alt="Blog görseli"
                  className="aspect-square w-full object-cover"
                />
              </a>
              <div className="flex h-full flex-col items-start justify-start">
                <div className="rb-4 mb-3 flex w-full items-center justify-start sm:mb-4">
                  <p className="mr-4 bg-background-secondary px-2 py-1 text-sm font-semibold">
                    Operasyon
                  </p>
                  <p className="inline text-sm font-semibold">7 dk okuma</p>
                </div>
                <a className="mb-2" href="#">
                  <h3 className="text-xl font-bold md:text-2xl">
                    Menüler misafir davranışını ve geliri nasıl yönlendirir
                  </h3>
                </a>
                <p>Menü en güçlü aracınızdır. Nasıl kullanacağınızı öğrenin</p>
                <Button
                  title="Devamını oku"
                  variant="link"
                  size="link"
                  iconRight={<RxChevronRight />}
                  className="mt-5 flex items-center justify-center gap-x-2 md:mt-6"
                >
                  Devamını oku
                </Button>
              </div>
            </div>
            <div className="grid gap-x-8 gap-y-6 md:grid-cols-[.75fr_1fr] md:gap-y-4">
              <a href="#" className="w-full">
                <img
                  src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg"
                  alt="Blog görseli"
                  className="aspect-square w-full object-cover"
                />
              </a>
              <div className="flex h-full flex-col items-start justify-start">
                <div className="rb-4 mb-3 flex w-full items-center justify-start sm:mb-4">
                  <p className="mr-4 bg-background-secondary px-2 py-1 text-sm font-semibold">
                    Teknoloji
                  </p>
                  <p className="inline text-sm font-semibold">6 dk okuma</p>
                </div>
                <a className="mb-2" href="#">
                  <h3 className="text-xl font-bold md:text-2xl">
                    QR menüler sadece dijital kolaylık değil
                  </h3>
                </a>
                <p>
                  Misafir verisi ve operasyonel içgörü için bir temel oluştururlar
                </p>
                <Button
                  title="Devamını oku"
                  variant="link"
                  size="link"
                  iconRight={<RxChevronRight />}
                  className="mt-5 flex items-center justify-center gap-x-2 md:mt-6"
                >
                  Devamını oku
                </Button>
              </div>
            </div>
            <div className="grid gap-x-8 gap-y-6 md:grid-cols-[.75fr_1fr] md:gap-y-4">
              <a href="#" className="w-full">
                <img
                  src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg"
                  alt="Blog görseli"
                  className="aspect-square w-full object-cover"
                />
              </a>
              <div className="flex h-full flex-col items-start justify-start">
                <div className="rb-4 mb-3 flex w-full items-center justify-start sm:mb-4">
                  <p className="mr-4 bg-background-secondary px-2 py-1 text-sm font-semibold">
                    Büyüme
                  </p>
                  <p className="inline text-sm font-semibold">5 dk okuma</p>
                </div>
                <a className="mb-2" href="#">
                  <h3 className="text-xl font-bold md:text-2xl">
                    Menünüzde şeffaflıkla güven inşa etmek
                  </h3>
                </a>
                <p>
                  Alerjenler, besin değerleri, kaynak bilgisi. Misafirlerin gerçekten bilmek istediği şeyler
                </p>
                <Button
                  title="Devamını oku"
                  variant="link"
                  size="link"
                  iconRight={<RxChevronRight />}
                  className="mt-5 flex items-center justify-center gap-x-2 md:mt-6"
                >
                  Devamını oku
                </Button>
              </div>
            </div>
            <div className="grid gap-x-8 gap-y-6 md:grid-cols-[.75fr_1fr] md:gap-y-4">
              <a href="#" className="w-full">
                <img
                  src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg"
                  alt="Blog görseli"
                  className="aspect-square w-full object-cover"
                />
              </a>
              <div className="flex h-full flex-col items-start justify-start">
                <div className="rb-4 mb-3 flex w-full items-center justify-start sm:mb-4">
                  <p className="mr-4 bg-background-secondary px-2 py-1 text-sm font-semibold">
                    Strateji
                  </p>
                  <p className="inline text-sm font-semibold">8 dk okuma</p>
                </div>
                <a className="mb-2" href="#">
                  <h3 className="text-xl font-bold md:text-2xl">
                    İşinizi gerçekten iyileştiren geri bildirim döngüleri
                  </h3>
                </a>
                <p>
                  Misafirlerinizden gerçek zamanlı içgörüler. Mutfağınızda gerçek değişiklikler
                </p>
                <Button
                  title="Devamını oku"
                  variant="link"
                  size="link"
                  iconRight={<RxChevronRight />}
                  className="mt-5 flex items-center justify-center gap-x-2 md:mt-6"
                >
                  Devamını oku
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <Button
              title="Tümünü gör"
              variant="secondary"
              className="mt-10 sm:mt-18 md:mt-20"
            >
              Tümünü gör
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
