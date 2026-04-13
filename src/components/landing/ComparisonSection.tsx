import React from "react";
import { BiCheck } from "react-icons/bi";

export function ComparisonSection() {
  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container max-w-xl">
        <div className="mx-auto mb-12 max-w-lg text-center md:mb-18 lg:mb-20">
          <h2 className="rb-5 mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
            İşletmeciler İçin Üretildi
          </h2>
          <p className="md:text-md">
            QR menüler ürünlerinizi listeler. Tabbled işinizi yönetir.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex h-full flex-col justify-between border border-border-primary px-6 py-8 md:p-8">
            <div>
              <div className="rb-4 mb-3 flex flex-col items-start justify-end md:mb-4">
                <img
                  src="/tabbled-logo-icon.png"
                  alt="Tabbled"
                  className="size-12"
                />
              </div>
              <h3 className="mb-2 text-md font-bold leading-[1.4] md:text-xl">
                Tabbled
              </h3>
              <p className="mb-5 md:mb-6">QR Menü Platformu</p>
              <div className="grid grid-cols-1">
                <div className="flex justify-between gap-4 border-b border-border-primary py-6 first:border-t">
                  <p>Etkinlik Yönetimi</p>
                  <h6 className="text-md font-bold leading-[1.4] md:text-lg md:leading-[1.4]">
                    Anında
                  </h6>
                </div>
                <div className="flex justify-between gap-4 border-b border-border-primary py-6 first:border-t">
                  <p>Happy Hour ve promosyonlar</p>
                  <h6 className="text-md font-bold leading-[1.4] md:text-lg md:leading-[1.4]">
                    Evet
                  </h6>
                </div>
                <div className="flex justify-between gap-4 border-b border-border-primary py-6 first:border-t">
                  <p>AI içerik üretimi</p>
                  <h6 className="text-md font-bold leading-[1.4] md:text-lg md:leading-[1.4]">
                    Dahil
                  </h6>
                </div>
                <div className="flex justify-between gap-4 border-b border-border-primary py-6 first:border-t">
                  <p>Yasal Uyum</p>
                  <h6 className="text-md font-bold leading-[1.4] md:text-lg md:leading-[1.4]">
                    100%
                  </h6>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-y-4 py-2 md:mt-8">
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>34 Dilde Otomatik Çeviri</p>
                </div>
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>Local SEO Araçları</p>
                </div>
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>Akıllı Öneriler ile %20 gelir artışı imkanı</p>
                </div>
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>AI Destekli İçerik Araçları</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex h-full flex-col justify-between border border-border-primary px-6 py-8 md:p-8">
            <div>
              <div className="rb-4 mb-3 flex flex-col items-start justify-end md:mb-4">
                <span className="text-4xl">📱</span>
              </div>
              <h3 className="mb-2 text-md font-bold leading-[1.4] md:text-xl">
                Basit QR menü
              </h3>
              <p className="mb-5 md:mb-6">Diğer QR Uygulamaları</p>
              <div className="grid grid-cols-1">
                <div className="flex justify-between gap-4 border-b border-border-primary py-6 first:border-t">
                  <p>Etkinlik Yönetimi</p>
                  <h6 className="text-md font-bold leading-[1.4] md:text-lg md:leading-[1.4]">
                    Hayır
                  </h6>
                </div>
                <div className="flex justify-between gap-4 border-b border-border-primary py-6 first:border-t">
                  <p>Happy Hour ve promosyonlar</p>
                  <h6 className="text-md font-bold leading-[1.4] md:text-lg md:leading-[1.4]">
                    Hayır
                  </h6>
                </div>
                <div className="flex justify-between gap-4 border-b border-border-primary py-6 first:border-t">
                  <p>AI içerik üretimi</p>
                  <h6 className="text-md font-bold leading-[1.4] md:text-lg md:leading-[1.4]">
                    Kısmen
                  </h6>
                </div>
                <div className="flex justify-between gap-4 border-b border-border-primary py-6 first:border-t">
                  <p>Yasal Uyum</p>
                  <h6 className="text-md font-bold leading-[1.4] md:text-lg md:leading-[1.4]">
                    Kısmen
                  </h6>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-y-4 py-2 md:mt-8">
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>Sınırlı Çeviri</p>
                </div>
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>Sadece QR Menü</p>
                </div>
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>Sabit Ürün</p>
                </div>
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>İçerik Desteği Yok</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
