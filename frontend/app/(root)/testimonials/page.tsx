import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import Testimonials from "@/components/sections/home/Testimonials";
import { getHomeContent, getPublicPageContent } from "@/services/cms-public";
import type { PageBanner, PageSeo } from "@/types/cms";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublicPageContent("testimonials");
  const seo = (content.seo ?? {}) as PageSeo;
  return buildMetadata({
    title: seo.metaTitle || "Testimonials",
    description:
      seo.metaDescription ||
      "Founders, product leaders, and engineers on what it's like to work with us — and the systems they got out of it.",
    path: "/testimonials",
    ogImage: seo.ogImage,
  });
}

export default async function TestimonialsPage() {
  const [home, page] = await Promise.all([
    getHomeContent(),
    getPublicPageContent("testimonials"),
  ]);
  const banner = (page.page ?? {}) as PageBanner;

  return (
    <div>
      <PageHeader
        eyebrow={banner.eyebrow}
        title={banner.title}
        description={banner.description}
      />
      <Testimonials
        showHeading={false}
        testimonials={home.testimonials?.testimonials ?? []}
      />
    </div>
  );
}
