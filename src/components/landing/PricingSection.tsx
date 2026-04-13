import { Button } from "@relume_io/relume-ui";
import React from "react";
import { BiCheck } from "react-icons/bi";

export function PricingSection() {
  return (
    <section id="fiyatlandirma" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="mx-auto mb-12 max-w-lg text-center md:mb-18 lg:mb-20">
          <p className="mb-3 font-semibold md:mb-4">Fiyatlandırma</p>
          <h1 className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
            Basit, şeffaf planlar
          </h1>
          <p className="md:text-md">
            Başlangıçtan kurumsal ölçeğe kadar, her işletme için bir plan
            vardır.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Basic */}
          <div className="flex h-full flex-col justify-between border border-border-primary px-6 py-8 md:p-8 overflow-hidden">
            <div>
              <div className="bg-[#FF4F7A] text-white text-sm font-medium text-center py-2 -mx-6 -mt-8 md:-mx-8 md:-mt-8 mb-6">
                Lansman Fırsatı — %20 İndirim
              </div>
              <p className="font-semibold text-lg mb-2">Basic</p>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg line-through text-gray-400">549 TL+KDV</span>
                <span className="bg-pink-50 text-pink-500 text-xs font-semibold px-2 py-0.5 rounded-full">%20 indirim</span>
              </div>
              <h3 className="my-2 text-6xl font-bold md:text-9xl lg:text-10xl">
                439 TL <span className="text-base font-normal text-gray-500">+KDV/ay</span>
              </h3>
              <p>senelik faturalandırılır</p>
              <div className="my-8 h-px w-full shrink-0 bg-border" />
              <p>Dahil:</p>
              <div className="mb-8 mt-4 grid grid-cols-1 gap-y-4 py-2">
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>QR menü ve temel yönetim</p>
                </div>
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>Türkçe ve İngilizce dil desteği</p>
                </div>
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>Temel analitik ve raporlar</p>
                </div>
              </div>
            </div>
            <div>
              <Button title="Başla" className="w-full" asChild>
                <a href="/iletisim?plan=basic">Başla</a>
              </Button>
            </div>
          </div>
          {/* Premium */}
          <div className="flex h-full flex-col justify-between border border-border-primary px-6 py-8 md:p-8 overflow-hidden">
            <div>
              <div className="bg-[#FF4F7A] text-white text-sm font-medium text-center py-2 -mx-6 -mt-8 md:-mx-8 md:-mt-8 mb-6">
                Lansman Fırsatı — %20 İndirim
              </div>
              <p className="font-semibold text-lg mb-2">Premium</p>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg line-through text-gray-400">1.459 TL+KDV</span>
                <span className="bg-pink-50 text-pink-500 text-xs font-semibold px-2 py-0.5 rounded-full">%20 indirim</span>
              </div>
              <h3 className="my-2 text-6xl font-bold md:text-9xl lg:text-10xl">
                1.167 TL <span className="text-base font-normal text-gray-500">+KDV/ay</span>
              </h3>
              <p>senelik faturalandırılır</p>
              <div className="my-8 h-px w-full shrink-0 bg-border" />
              <p>Dahil:</p>
              <div className="mb-8 mt-4 grid grid-cols-1 gap-y-4 py-2">
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>AI menü içeriği önerileri</p>
                </div>
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>Garson çağrısı ve promosyonlar</p>
                </div>
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>Google yorumlar ve geri bildirim</p>
                </div>
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>Etkinlik Yönetimi</p>
                </div>
              </div>
            </div>
            <div>
              <Button title="Başla" className="w-full" asChild>
                <a href="/iletisim?plan=premium">Başla</a>
              </Button>
            </div>
          </div>
          {/* Enterprise */}
          <div className="flex h-full flex-col justify-between border border-border-primary px-6 py-8 md:p-8">
            <div>
              <p className="font-semibold text-lg mb-2">Enterprise</p>
              <h3 className="my-2 text-6xl font-bold md:text-9xl lg:text-10xl">
                Özel
              </h3>
              <p>senelik faturalandırılır</p>
              <div className="my-8 h-px w-full shrink-0 bg-border" />
              <p>Dahil:</p>
              <div className="mb-8 mt-4 grid grid-cols-1 gap-y-4 py-2">
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>Sınırsız dil ve alerjen yönetimi</p>
                </div>
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>Özel entegrasyonlar ve API erişimi</p>
                </div>
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>Adanmış destek ve eğitim</p>
                </div>
                <div className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <BiCheck className="size-6" />
                  </div>
                  <p>Zincir ve multi-lokasyon yönetimi</p>
                </div>
              </div>
            </div>
            <div>
              <Button title="Başla" className="w-full" asChild>
                <a href="/iletisim?plan=enterprise">Başla</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
