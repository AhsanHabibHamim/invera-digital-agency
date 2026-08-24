import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import Portfolio from "@/components/sections/home/Portfolio";
import { getHomeContent, getPublicPageContent } from "@/services/cms-public";
import type { PageBanner, PageSeo } from "@/types/cms";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublicPageContent("work");
  const seo = (content.seo ?? {}) as PageSeo;
  return buildMetadata({
    title: seo.metaTitle || "Selected Work",
    description:
      seo.metaDescription ||
      "A selection of products we've designed, engineered, and shipped with teams that refuse to ship average.",
    path: "/work",
    ogImage: seo.ogImage,
  });
}

export default async function WorkPage() {
  const [home, page] = await Promise.all([
    getHomeContent(),
    getPublicPageContent("work"),
  ]);
  const banner = (page.page ?? {}) as PageBanner;

  return (
    <div>
      <PageHeader
        eyebrow={banner.eyebrow}
        title={banner.title}
        description={banner.description}
      />
      <Portfolio
        showHeading={false}
        categories={home.portfolio?.categories ?? []}
        projects={home.portfolio?.projects ?? []}
      />
    </div>
  );
}
