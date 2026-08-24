import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import CustomCursor from "@/components/ui/CustomCursor";
import Toaster from "@/components/ui/Toaster";
import ChatbotWidget from "@/components/ui/ChatbotWidget";
import CookieConsent from "@/components/ui/CookieConsent";
import Analytics from "@/components/ui/Analytics";
import { env } from "@/config/env";
import "./styles/globals.css";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "Invera Digital Agency — Design, Engineering & Growth",
    template: "%s",
  },
  description:
    "Invera Digital Agency designs and engineers SaaS products, websites, internal tools, and growth systems for teams that refuse to ship average.",
  applicationName: "Invera Digital Agency",
  keywords: [
    "digital agency",
    "web design",
    "web development",
    "SaaS products",
    "design agency",
    "software engineering",
    "Invera",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Invera Digital Agency",
    url: env.siteUrl,
    title: "Invera Digital Agency — Design, Engineering & Growth",
    description:
      "Invera Digital Agency designs and engineers SaaS websites, internal tools, and growth systems for ambitious teams.",
    locale: "en_US",
    images: [{ url: `${env.siteUrl}/images/og.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Invera Digital Agency",
    description:
      "Invera Digital Agency designs and engineers SaaS websites, internal tools, and growth systems for ambitious teams.",
    images: [`${env.siteUrl}/images/og.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${env.siteUrl}/#organization`,
        name: "Invera Digital Agency",
        description:
          "Full-service digital agency delivering web design, engineering, and growth systems for ambitious brands.",
        url: env.siteUrl,
        email: "hello@inveradigitalagency.com",
        logo: `${env.siteUrl}/logo.svg`,
        image: `${env.siteUrl}/images/og.png`,
        priceRange: "$$",
        areaServed: "Worldwide",
        sameAs: [
          "https://twitter.com/inveradigital",
          "https://www.linkedin.com/company/inveradigitalagency/",
          "https://github.com/inveradigitalagency",
          "https://dribbble.com/inveradigitalagency",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${env.siteUrl}/#website`,
        url: env.siteUrl,
        name: "Invera Digital Agency",
        publisher: { "@id": `${env.siteUrl}/#organization` },
      },
    ],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          {children}
          <CustomCursor />
          <ChatbotWidget />
          <CookieConsent />
          <Toaster />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}