import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import Pricing from "@/components/sections/home/Pricing";
import {
  getPublicPageContent,
  getPublicPricingPlans,
} from "@/services/cms-public";
import type { PageBanner, PageSeo } from "@/types/cms";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublicPageContent("pricing");
  const seo = (content.seo ?? {}) as PageSeo;
  return buildMetadata({
    title: seo.metaTitle || "Pricing",
    description:
      seo.metaDescription ||
      "Monthly retainers with weekly sprint cycles. Pick a plan that fits your stage — or talk to us about a custom engagement.",
    path: "/pricing",
    ogImage: seo.ogImage,
  });
}

export default async function PricingPage() {
  const [page, plans] = await Promise.all([
    getPublicPageContent("pricing"),
    getPublicPricingPlans(),
  ]);
  const banner = (page.page ?? {}) as PageBanner;

  return (
    <div>
      <PageHeader
        eyebrow={banner.eyebrow}
        title={banner.title}
        description={banner.description}
      />
      <Pricing showHeading={false} plans={plans} />
    </div>
  );
}
