import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@relume_io/relume-ui";
import React from "react";
import {
  BiLinkAlt,
  BiLogoFacebookCircle,
  BiLogoLinkedinSquare,
} from "react-icons/bi";
import { FaXTwitter } from "react-icons/fa6";

export function BlogPostHeader() {
  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="mx-auto mb-12 flex w-full max-w-lg flex-col items-start justify-start md:mb-16 lg:mb-20">
          <Breadcrumb className="mb-6 flex w-full items-center">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Blog</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Strategy</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="mb-8 text-5xl font-bold md:mb-10 md:text-7xl lg:mb-12 lg:text-8xl">
            Why restaurants need smarter menu strategy
          </h1>
          <div className="flex w-full flex-col items-start justify-between sm:flex-row sm:items-end">
            <div className="rb-4 mb-4 flex items-center sm:mb-0">
              <div className="mr-4 shrink-0">
                <img
                  src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg"
                  alt="Relume placeholder avatar"
                  className="size-14 min-h-14 min-w-14 rounded-full object-cover"
                />
              </div>
              <div>
                <h6 className="font-semibold">Emre Yilmaz</h6>
                <div className="mt-1 flex">
                  <p className="text-sm">18 Jan 2025</p>
                  <span className="mx-2">•</span>
                  <p className="text-sm">8 min read</p>
                </div>
              </div>
            </div>
            <div className="rt-4 mt-4 grid grid-flow-col grid-cols-[max-content] items-start gap-2">
              <a
                href="#"
                className="rounded-[1.25rem] bg-background-secondary p-1"
              >
                <BiLinkAlt className="size-6" />
              </a>
              <a
                href="#"
                className="rounded-[1.25rem] bg-background-secondary p-1"
              >
                <BiLogoLinkedinSquare className="size-6" />
              </a>
              <a
                href="#"
                className="rounded-[1.25rem] bg-background-secondary p-1"
              >
                <FaXTwitter className="size-6 p-0.5" />
              </a>
              <a
                href="#"
                className="rounded-[1.25rem] bg-background-secondary p-1"
              >
                <BiLogoFacebookCircle className="size-6" />
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto w-full overflow-hidden">
          <img
            src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg"
            className="aspect-[2] size-full object-cover"
            alt="Relume placeholder image"
          />
        </div>
      </div>
    </section>
  );
}
