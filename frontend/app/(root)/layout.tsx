import { Footer } from "@/components/sections/SiteFooter";
import SiteHeader from "@/components/sections/SiteHeader";
import { getNavContent } from "@/services/cms-public";
import type { NavItem, CtaButton } from "@/types/cms";
import { navItems as fallbackNav } from "@/constants/navigation";

// Re-render public pages (nav + footer CMS) at most every 5 minutes.
export const revalidate = 300;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nav = await getNavContent();

  const items: NavItem[] =
    nav.items && nav.items.length > 0
      ? nav.items.map((item) => ({ label: item.label, href: item.href }))
      : fallbackNav.map((item) => ({ label: item.label, href: item.href }));

  const cta: CtaButton = nav.cta
    ? { label: nav.cta.label, href: nav.cta.href, action: nav.cta.action }
    : { label: "Start a project", href: "/contact", action: "start" };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader navItems={items} cta={cta} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
