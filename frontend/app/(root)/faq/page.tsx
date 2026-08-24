import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import FAQ from "@/components/sections/home/FAQ";
import { getHomeContent, getPublicPageContent } from "@/services/cms-public";
import type { PageBanner, PageSeo } from "@/types/cms";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublicPageContent("faq");
  const seo = (content.seo ?? {}) as PageSeo;
  return buildMetadata({
    title: seo.metaTitle || "FAQ",
    description:
      seo.metaDescription ||
      "Still have something specific? We reply within 4 hours on business days.",
    path: "/faq",
    ogImage: seo.ogImage,
  });
}

export default async function FaqPage() {
  const [home, page] = await Promise.all([
    getHomeContent(),
    getPublicPageContent("faq"),
  ]);
  const banner = (page.page ?? {}) as PageBanner;
  const items = home.faq?.items ?? [];

  // FAQPage structured data — makes Q&A eligible for rich results.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PageHeader
        eyebrow={banner.eyebrow}
        title={banner.title}
        description={banner.description}
      />
      <FAQ showHeading={false} items={items} />
    </div>
  );
}
