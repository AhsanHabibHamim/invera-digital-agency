import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import Contact from "@/components/sections/home/Contact";
import {
  getContactContent,
  getPublicBudgetOptions,
  getPublicPageContent,
} from "@/services/cms-public";
import type { PageBanner, PageSeo } from "@/types/cms";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublicPageContent("contact");
  const seo = (content.seo ?? {}) as PageSeo;
  return buildMetadata({
    title: seo.metaTitle || "Contact",
    description:
      seo.metaDescription ||
      "Tell us about your project and let's see if we're a fit. We take on 3–4 new engagements per quarter.",
    path: "/contact",
    ogImage: seo.ogImage,
  });
}

export default async function ContactPage() {
  const [page, contact, budgetOptions] = await Promise.all([
    getPublicPageContent("contact"),
    getContactContent(),
    getPublicBudgetOptions(),
  ]);
  const banner = (page.page ?? {}) as PageBanner;

  return (
    <div>
      <PageHeader
        eyebrow={banner.eyebrow}
        title={banner.title}
        description={banner.description}
      />
      <Contact content={contact} budgetOptions={budgetOptions} />
    </div>
  );
}
