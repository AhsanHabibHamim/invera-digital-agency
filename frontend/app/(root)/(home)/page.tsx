import type { Metadata } from "next";
import FAQ from "@/components/sections/home/FAQ";
import FinalCTA from "@/components/sections/home/FinalCTA";
import Hero from "@/components/sections/home/Hero";
import LogoStrip from "@/components/sections/home/LogoStrip";
import Portfolio from "@/components/sections/home/Portfolio";
import Services from "@/components/sections/home/Services";
import Testimonials from "@/components/sections/home/Testimonials";
import WhyChooseUs from "@/components/sections/home/WhyChooseUs";
import { getHomeContent } from "@/services/cms-public";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getHomeContent();
  const seo = content.seo;
  return buildMetadata({
    title: seo?.metaTitle
      ? seo.metaTitle
      : "Invera Digital Agency — Design, Engineering & Growth",
    description:
      seo?.metaDescription ||
      "Invera Digital Agency designs and engineers SaaS websites, internal tools, and growth systems for teams that refuse to ship average.",
    path: "/",
    ogImage: seo?.ogImage,
  });
}

export default async function Home() {
  const content = await getHomeContent();

  return (
    <div>
      <Hero content={content.hero ?? { stats: [] }} />
      <LogoStrip logos={content.logos?.logos ?? []} label={content.logos?.label} />
      <Services
        services={content.services?.services ?? []}
        eyebrow={content.services?.eyebrow}
        title={content.services?.title}
      />
      <WhyChooseUs
        steps={content.whyChooseUs?.processSteps ?? []}
        eyebrow={content.whyChooseUs?.eyebrow}
        title={content.whyChooseUs?.title}
        paragraph={content.whyChooseUs?.paragraph}
      />
      <Portfolio
        categories={content.portfolio?.categories ?? []}
        projects={content.portfolio?.projects ?? []}
        eyebrow={content.portfolio?.eyebrow}
        title={content.portfolio?.title}
      />
      <Testimonials
        testimonials={content.testimonials?.testimonials ?? []}
        eyebrow={content.testimonials?.eyebrow}
        title={content.testimonials?.title}
      />
      <FAQ
        items={content.faq?.items ?? []}
        eyebrow={content.faq?.eyebrow}
        title={content.faq?.title}
        description={content.faq?.description}
      />
      <FinalCTA content={content.finalCta} />
    </div>
  );
}
