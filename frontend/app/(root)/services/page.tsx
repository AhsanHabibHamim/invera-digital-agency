import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import Services from "@/components/sections/home/Services";
import { getHomeContent, getPublicPageContent } from "@/services/cms-public";
import type { PageBanner, PageSeo } from "@/types/cms";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublicPageContent("services");
  const seo = (content.seo ?? {}) as PageSeo;
  return buildMetadata({
    title: seo.metaTitle || "Services",
    description:
      seo.metaDescription ||
      "Product design, engineering, growth systems, and AI integration — one team that ships the whole system.",
    path: "/services",
    ogImage: seo.ogImage,
  });
}

export default async function ServicesPage() {
  const [home, page] = await Promise.all([
    getHomeContent(),
    getPublicPageContent("services"),
  ]);
  const banner = (page.page ?? {}) as PageBanner;
  const services = home.services?.services ?? [];

  // Service list structured data — helps search engines understand offerings.
  const servicesJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.title,
        description: s.desc,
        provider: { "@type": "Organization", name: "Invera Digital Agency" },
      },
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesJsonLd) }}
      />
      <PageHeader
        eyebrow={banner.eyebrow}
        title={banner.title}
        description={banner.description}
      />
      <Services showHeading={false} services={services} />
    </div>
  );
}
