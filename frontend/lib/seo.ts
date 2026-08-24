import type { Metadata } from "next";
import { env } from "@/config/env";

export const SITE_NAME = "Invera Digital Agency";
export const DEFAULT_DESCRIPTION =
  "Invera Digital Agency designs and engineers SaaS products, websites, internal tools, and growth systems for teams that refuse to ship average.";
export const DEFAULT_OG_IMAGE = `${env.siteUrl}/images/logo.png`;

export interface PageSeoInput {
  title: string;
  description?: string;
  path?: string;
  ogImage?: string;
  type?: "website" | "article";
  publishedTime?: string;
}

/**
 * Builds a fully-populated Next Metadata object (title, description,
 * canonical, Open Graph, Twitter card) from a page title and path.
 */
export function buildMetadata({
  title,
  description,
  path = "",
  ogImage,
  type = "website",
  publishedTime,
}: PageSeoInput): Metadata {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const descriptionText = description || DEFAULT_DESCRIPTION;
  const url = path ? `${env.siteUrl}${path}` : env.siteUrl;

  return {
    title: fullTitle,
    description: descriptionText,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: descriptionText,
      url,
      siteName: SITE_NAME,
      type,
      locale: "en_US",
      images: [{ url: ogImage || DEFAULT_OG_IMAGE }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: descriptionText,
      images: [ogImage || DEFAULT_OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}