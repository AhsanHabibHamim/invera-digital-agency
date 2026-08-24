import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import WhyChooseUs from "@/components/sections/home/WhyChooseUs";
import { getHomeContent, getPublicPageContent } from "@/services/cms-public";
import type { PageBanner, PageSeo } from "@/types/cms";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublicPageContent("process");
  const seo = (content.seo ?? {}) as PageSeo;
  return buildMetadata({
    title: seo.metaTitle || "Process",
    description:
      seo.metaDescription ||
      "A proven engagement model: deep discovery, rapid iteration, systems thinking, and full ownership handed back to your team.",
    path: "/process",
    ogImage: seo.ogImage,
  });
}

export default async function ProcessPage() {
  const [home, page] = await Promise.all([
    getHomeContent(),
    getPublicPageContent("process"),
  ]);
  const banner = (page.page ?? {}) as PageBanner;

  return (
    <div>
      <PageHeader
        eyebrow={banner.eyebrow}
        title={banner.title}
        description={banner.description}
      />
      <WhyChooseUs
        showHeading={false}
        steps={home.whyChooseUs?.processSteps ?? []}
      />
    </div>
  );
}
