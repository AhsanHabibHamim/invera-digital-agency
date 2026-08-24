import Link from "next/link";
import Image from "next/image";
import {
  Mail, MapPin, Clock, Phone, ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { getFooterContent } from "@/services/cms-public";
import { navItems as fallbackNav } from "@/constants/navigation";
import FooterNewsletter from "@/components/sections/FooterNewsletter";
import StartProjectLink from "@/components/sections/StartProjectLink";

/* Brand icons are no longer shipped by lucide — inline minimal marks. */
const BRAND_PATHS: Record<string, string> = {
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  twitter:
    "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  github:
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  dribbble:
    "M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z",
  instagram:
    "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  youtube:
    "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
};

function BrandMark({ label }: { label: string }) {
  const key = label.toLowerCase().trim();
  const path = BRAND_PATHS[key];
  if (!path) return <ArrowUpRight size={14} />;
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
      <path d={path} />
    </svg>
  );
}

/**
 * CMS plain-string fields can occasionally hold segment arrays or objects
 * when edited through the generic editor. Normalize to a plain string.
 */
function toText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((s) => (s && typeof s.text === "string" ? s.text : ""))
      .join("");
  }
  return "";
}

export async function Footer() {
  const content = await getFooterContent();

  const brand = content.brand;
  const cta = content.cta;
  const links = content.links;
  const contact = content.contact;
  const social = content.social?.links ?? [];
  const stats = content.stats?.items ?? [];
  const badges = content.badges?.items ?? [];
  const legal = content.legal;

  const ctaTitle = toText(cta?.title);
  const ctaSubtitle = toText(cta?.subtitle);
  const companyName = brand?.companyName || "Invera Digital Agency";

  // Fallback link columns when CMS content is unavailable (e.g. backend down
  // at build time) so the footer never renders empty.
  const linkColumns = links?.columns?.length
    ? links.columns
    : [
        {
          title: "Quick Links",
          links: fallbackNav.map((item) => ({
            label: item.label,
            href: item.href,
          })),
        },
        {
          title: "Company",
          links: [
            { label: "Testimonials", href: "/testimonials" },
            { label: "Contact", href: "/contact" },
            { label: "FAQ", href: "/faq" },
          ],
        },
      ];

  const contactRows = [
    {
      label: "Email",
      value: contact?.email ?? "hello@inveradigitalagency.com",
      href: `mailto:${contact?.email ?? "hello@inveradigitalagency.com"}`,
      icon: Mail,
    },
    {
      label: "Location",
      value: contact?.address ?? "Remote, worldwide",
      icon: MapPin,
    },
    ...(contact?.phone
      ? [
          {
            label: "Phone",
            value: contact.phone,
            href: `tel:${contact.phone.replace(/\s/g, "")}`,
            icon: Phone,
          },
        ]
      : []),
    ...(contact?.hours ? [{ label: "Hours", value: contact.hours, icon: Clock }] : []),
  ];

  return (
    <footer className="relative z-2 overflow-hidden border-t border-primary/15 bg-[#0A0A12]">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(124,58,237,0.14),transparent_70%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* CTA band */}
      {/* {ctaTitle && (
        <div className="relative border-b border-white/5">
          <div className="container-premium flex flex-col items-start justify-between gap-lg py-5xl md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="mb-2xs bg-gradient-to-r from-white via-white to-violet-300 bg-clip-text text-h2 font-bold tracking-tight text-transparent">
                {ctaTitle}
              </h2>
              {ctaSubtitle && (
                <p className="text-body text-foreground/55 m-0">{ctaSubtitle}</p>
              )}
            </div>
            {cta?.buttonText &&
              (cta?.buttonAction === "start" ? (
                <StartProjectLink
                  href="/contact"
                  className="group btn btn-primary btn-xl w-full shrink-0 gap-2xs shadow-lg shadow-primary/25 sm:w-auto"
                >
                  {cta.buttonText}
                  <ArrowUpRight size={18} className="transition-transform duration-200 group-hover:translate-x-3xs group-hover:-translate-y-3xs" />
                </StartProjectLink>
              ) : (
                <Link href="/contact" className="btn btn-primary btn-xl w-full shrink-0 sm:w-auto">
                  {cta.buttonText}
                </Link>
              ))}
          </div>
        </div>
      )} */}

      {/* Main footer grid */}
      <div className="container-premium relative grid grid-cols-2 gap-x-lg gap-y-xl py-2xl md:grid-cols-4 lg:grid-cols-12">
        {/* Brand */}
        <div className="col-span-2 md:col-span-4 lg:col-span-4">
          <Link href="/" className="inline-flex items-center gap-xs">
            {brand?.logo ? (
              <Image
                src={brand.logo}
                width={40}
                height={40}
                alt={companyName}
                className="h-10 w-10 rounded-xl object-contain ring-1 ring-primary/20"
              />
            ) : (
              <span className="avatar avatar-md bg-gradient-to-br from-violet-600 to-cyan-400 font-bold text-white">
                {companyName.charAt(0)}
              </span>
            )}
            <span className="text-h5 font-bold tracking-tight text-white">
              {companyName}
            </span>
          </Link>
          {brand?.description && (
            <p className="mt-sm max-w-sm text-body-small leading-relaxed text-foreground/45">
              {brand.description}
            </p>
          )}

          {/* Social icons */}
          {social.length > 0 && (
            <ul className="m-0 mt-md flex list-none items-center gap-2xs p-0">
              {social.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    title={item.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-foreground/55 transition-all duration-200 hover:-translate-y-2xs hover:border-primary/40 hover:bg-primary/10 hover:text-accent"
                  >
                    <BrandMark label={item.label} />
                  </a>
                </li>
              ))}
            </ul>
          )}

          {/* Newsletter */}
          {/* {content.newsletter?.title && (
            <div className="mt-xl max-w-sm rounded-2xl border border-white/8 bg-white/[0.02] p-sm">
              <FooterNewsletter
                title={toText(content.newsletter.title)}
                description={toText(content.newsletter.description)}
                placeholder={toText(content.newsletter.placeholder)}
                buttonText={toText(content.newsletter.buttonText)}
                successMessage={toText(content.newsletter.successMessage)}
              />
            </div>
          )} */}
        </div>

        {/* Link columns */}
        {linkColumns.map((col) => (
          <nav
            key={col.title}
            aria-label={col.title}
            className="col-span-1 md:col-span-2 lg:col-span-2"
          >
            <div className="mb-sm flex items-center gap-3xs text-label uppercase tracking-wider text-foreground/35">
              <span aria-hidden className="h-3xs w-3xs rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
              {col.title}
            </div>
            <ul className="m-0 flex list-none flex-col gap-2xs p-0">
              {col.links.map((item) => (
                <li key={item.label} className="min-w-0">
                  <Link
                    href={item.href}
                    className="group inline-flex max-w-full items-center gap-3xs text-small break-words text-foreground/55 transition-colors duration-200 hover:text-white"
                  >
                    <span className="line-clamp-1">{item.label}</span>
                    <ArrowUpRight
                      size={11}
                      className="shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-2xs group-hover:opacity-60"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* Contact */}
        <div className="col-span-2 md:col-span-4 lg:col-span-2">
          <div className="mb-sm flex items-center gap-3xs text-label uppercase tracking-wider text-foreground/35">
            <span aria-hidden className="h-3xs w-3xs rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
            Contact
          </div>
          <ul className="m-0 flex list-none flex-col gap-xs p-0">
            {contactRows.map((row) => {
              const Icon = row.icon;
              return (
                <li key={row.label}>
                  {row.href ? (
                    <a
                      href={row.href}
                      className="group flex items-start gap-2xs"
                    >
                      <span className="mt-3xs flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-foreground/45 transition-colors group-hover:border-primary/40 group-hover:text-accent">
                        <Icon size={13} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-caption uppercase tracking-wide text-foreground/30">
                          {row.label}
                        </span>
                        <span className="text-small break-words text-foreground/65 transition-colors group-hover:text-white">
                          {String(row.value)}
                        </span>
                      </span>
                    </a>
                  ) : (
                    <div className="flex items-start gap-2xs">
                      <span className="mt-3xs flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-foreground/45">
                        <Icon size={13} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-caption uppercase tracking-wide text-foreground/30">
                          {row.label}
                        </span>
                        <span className="text-small break-words text-foreground/65">
                          {String(row.value)}
                        </span>
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Stats & badges strip */}
      {/* {(stats.length > 0 || badges.length > 0) && (
        <div className="relative border-t border-white/5 bg-white/[0.015]">
          <div className="container-premium flex flex-col items-start justify-between gap-lg py-lg sm:flex-row sm:flex-wrap sm:items-center">
            {stats.length > 0 && (
              <dl className="m-0 flex list-none flex-wrap items-center gap-xl p-0">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-baseline gap-1">
                    <dt className="sr-only">{stat.label}</dt>
                    <dd className="m-0 bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-h5 font-bold text-transparent">
                      {stat.value}
                      {stat.suffix}
                    </dd>
                    <dd className="m-0 max-w-28 text-caption leading-tight text-foreground/35">
                      {stat.label}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {badges.length > 0 && (
              <ul className="m-0 flex list-none flex-wrap items-center gap-sm p-0">
                {badges.map((badge) => (
                  <li key={badge.label}>
                    <span className="badge border-white/10 bg-white/[0.03] text-caption text-foreground/50">
                      {badge.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )} */}

      {/* Legal bar */}
      <div className="border-t border-white/5">
        <div className="container-premium flex flex-col items-center justify-between gap-sm py-lg text-center sm:flex-row sm:text-left">
          <span className="text-caption text-foreground/25">
            {legal?.copyright ||
              `© ${new Date().getFullYear()} Invera Digital Agency. All rights reserved.`}
          </span>
          <span className="flex flex-wrap items-center justify-center gap-md text-caption text-foreground/25">
            {legal?.privacyLabel && (
              <Link
                href={legal.privacyHref || "/privacy"}
                className="transition-colors duration-200 hover:text-foreground/70"
              >
                {legal.privacyLabel}
              </Link>
            )}
            {legal?.termsLabel && (
              <Link
                href={legal.termsHref || "/terms"}
                className="transition-colors duration-200 hover:text-foreground/70"
              >
                {legal.termsLabel}
              </Link>
            )}
            {legal?.cookiesLabel && (
              <Link
                href={legal.cookiesHref || "/cookies"}
                className="transition-colors duration-200 hover:text-foreground/70"
              >
                {legal.cookiesLabel}
              </Link>
            )}
          </span>
        </div>
      </div>
    </footer>
  );
}
