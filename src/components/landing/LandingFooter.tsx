import { Button, Input } from "@relume_io/relume-ui";
import React, { useState } from "react";
import {
  BiLogoFacebookCircle,
  BiLogoInstagram,
  BiLogoLinkedinSquare,
  BiLogoYoutube,
} from "react-icons/bi";
import { FaXTwitter } from "react-icons/fa6";

const useForm = () => {
  const [email, setEmail] = useState("");
  const handleSetEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log({ email });
  };
  return {
    email,
    handleSetEmail,
    handleSubmit,
  };
};

export function LandingFooter() {
  const formState = useForm();
  return (
    <footer id="relume" className="px-[5%] py-12 md:py-18 lg:py-20">
      <div className="container">
        <div className="grid grid-cols-1 items-start gap-x-[8vw] gap-y-12 pb-12 md:gap-y-16 md:pb-18 lg:grid-cols-[1fr_0.5fr] lg:gap-y-4 lg:pb-20">
          <div className="grid grid-cols-1 items-start gap-x-8 gap-y-10 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-12 md:gap-x-8 lg:grid-cols-4">
            <a
              href="/"
              className="sm:col-start-1 sm:col-end-4 sm:row-start-1 sm:row-end-2 lg:col-start-auto lg:col-end-auto lg:row-start-auto lg:row-end-auto"
            >
              <img
                src="/tabbled-logo-horizontal.png"
                alt="Tabbled"
                className="h-8"
              />
            </a>
            <div className="flex flex-col items-start justify-start">
              <h2 className="mb-3 font-semibold md:mb-4">Ürün</h2>
              <ul>
                <li className="py-2 text-sm">
                  <a href="#ozellikler" className="flex items-center gap-3">
                    Özellikler
                  </a>
                </li>
                <li className="py-2 text-sm">
                  <a href="#fiyatlandirma" className="flex items-center gap-3">
                    Fiyatlandırma
                  </a>
                </li>
                <li className="py-2 text-sm">
                  <a href="#nasil-calisir" className="flex items-center gap-3">
                    Nasıl Çalışır
                  </a>
                </li>
                <li className="py-2 text-sm">
                  <a href="#sss" className="flex items-center gap-3">
                    SSS
                  </a>
                </li>
                <li className="py-2 text-sm">
                  <a href="/menu/demo" className="flex items-center gap-3">
                    Demo
                  </a>
                </li>
              </ul>
            </div>
            <div className="flex flex-col items-start justify-start">
              <h2 className="mb-3 font-semibold md:mb-4">Şirket</h2>
              <ul>
                <li className="py-2 text-sm">
                  <a href="/blog" className="flex items-center gap-3">
                    Blog
                  </a>
                </li>
                <li className="py-2 text-sm">
                  <a href="/iletisim" className="flex items-center gap-3">
                    İletişim
                  </a>
                </li>
                <li className="py-2 text-sm">
                  <a href="/iletisim" className="flex items-center gap-3">
                    Destek
                  </a>
                </li>
              </ul>
            </div>
            <div className="flex flex-col items-start justify-start">
              <h2 className="mb-3 font-semibold md:mb-4">Yasal</h2>
              <ul>
                <li className="py-2 text-sm">
                  <a href="#" className="flex items-center gap-3">
                    Kullanım Koşulları
                  </a>
                </li>
                <li className="py-2 text-sm">
                  <a href="/privacy" className="flex items-center gap-3">
                    Gizlilik Politikası
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="mb-3 font-semibold md:mb-4">Güncellemeler</h1>
            <p className="mb-3 text-sm md:mb-4">
              Ürün güncellemeleri ve yeni özelliklerden haberdar olun.
            </p>
            <div className="w-full max-w-md">
              <form
                className="mb-3 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-[1fr_max-content] md:gap-y-4"
                onSubmit={formState.handleSubmit}
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="e-posta@adresiniz.com"
                  value={formState.email}
                  onChange={formState.handleSetEmail}
                />
                <Button title="Abone Ol" variant="secondary" size="sm">
                  Abone Ol
                </Button>
              </form>
              <p className="text-xs">
                Gizliliğinize saygı duyuyoruz. İstediğiniz zaman abonelikten çıkabilirsiniz.
              </p>
            </div>
          </div>
        </div>
        <div className="h-px w-full bg-black" />
        <div className="flex flex-col-reverse items-start pb-4 pt-6 text-sm md:justify-start md:pb-0 md:pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col-reverse items-start md:flex-row md:gap-6 lg:items-center">
            <div className="grid grid-flow-row grid-cols-[max-content] justify-center gap-y-4 md:grid-flow-col md:justify-center md:gap-x-6 md:gap-y-0 lg:text-left">
              <p className="mt-8 md:mt-0">
                © 2026 KHP Limited. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
          <div className="mb-8 flex items-center justify-center gap-3 lg:mb-0">
            <a href="#">
              <BiLogoFacebookCircle className="size-6" />
            </a>
            <a href="#">
              <BiLogoInstagram className="size-6" />
            </a>
            <a href="#">
              <FaXTwitter className="size-6 p-0.5" />
            </a>
            <a href="#">
              <BiLogoLinkedinSquare className="size-6" />
            </a>
            <a href="#">
              <BiLogoYoutube className="size-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
