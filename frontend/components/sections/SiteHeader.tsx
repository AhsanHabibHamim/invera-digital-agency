"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { navItems as fallbackNav } from "@/constants/navigation";
import type { NavItem, CtaButton } from "@/types/cms";
import StartProjectLink, {
  getDashboardPath,
} from "@/components/sections/StartProjectLink";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

interface SiteHeaderProps {
  navItems?: NavItem[];
  cta?: CtaButton;
}

export default function SiteHeader({ navItems = [], cta }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const items = navItems.length > 0 ? navItems : fallbackNav;
  const ctaLabel = cta?.label || "Start a project";
  const ctaAction = cta?.action || "start";

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-nav border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container-premium flex h-16 items-center justify-between gap-md">
        <Link href="/" className="flex items-center gap-xs shrink-0">
          <Image
            src={"/logo.svg"}
            width={30}
            height={30}
            alt="Invera Digital Agency"
          />
          <span className="text-h5 font-bold text-foreground">Invera</span>
        </Link>

        <nav
          className="hidden xl:flex items-center gap-5xs"
          aria-label="Main navigation"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive(item.href) ? "active" : ""}`}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden xl:flex items-center gap-2xs shrink-0">
          {!isLoading && user ? (
            <>
              <Link
                href={getDashboardPath(user.role)}
                className="btn btn-primary btn-md gap-2xs"
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
              <div className="relative ml-2xs" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="avatar avatar-md font-bold bg-primary text-accent transition-colors cursor-pointer"
                  aria-label="Account menu"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2xs w-52 rounded-xl border border-border bg-surface shadow-card-hover p-2xs z-50"
                  >
                    <div className="px-xs py-2xs border-b border-border mb-1">
                      <p className="text-small font-semibold text-foreground truncate">
                        {user.name}
                      </p>
                      <p className="text-caption text-foreground/50 capitalize">
                        {user.role.replace("_", " ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push(getDashboardPath(user.role));
                      }}
                      className="flex w-full items-center gap-xs rounded-lg px-xs py-2xs text-small text-foreground/70 transition-colors hover:bg-surface hover:text-foreground"
                    >
                      <LayoutDashboard size={15} />
                      Dashboard
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={async () => {
                        setMenuOpen(false);
                        await logout();
                        router.push("/");
                      }}
                      className="flex w-full items-center gap-xs rounded-lg px-xs py-2xs text-small text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            ctaAction === "start" ? (
              <StartProjectLink
                href="/contact"
                className="btn btn-primary btn-md"
              >
                {ctaLabel}
              </StartProjectLink>
            ) : (
              <Link href="/contact" className="btn btn-primary btn-md">
                {ctaLabel}
              </Link>
            )
          )}
          {isLoading && <span className="h-btn w-btn rounded-full skeleton" aria-hidden />}
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="icon-btn xl:hidden"
          aria-expanded={open}
          aria-controls="site-nav-mobile"
          aria-label="Toggle navigation menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div
          id="site-nav-mobile"
          className="xl:hidden border-t border-border bg-surface px-sm pb-sm pt-xs"
        >
          <nav className="flex flex-col gap-2xs" aria-label="Mobile navigation">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`nav-link ${isActive(item.href) ? "active" : ""}`}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
            {!isLoading && user ? (
              <Link
                href={getDashboardPath(user.role)}
                onClick={() => setOpen(false)}
                className="btn btn-primary btn-md mt-xs gap-2xs"
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
            ) : (
              <>
                {ctaAction === "start" ? (
                  <StartProjectLink
                    href="/contact"
                    className="btn btn-primary btn-md mt-xs"
                  >
                    {ctaLabel}
                  </StartProjectLink>
                ) : (
                  <Link
                    href="/contact"
                    onClick={() => setOpen(false)}
                    className="btn btn-primary btn-md mt-xs"
                  >
                    {ctaLabel}
                  </Link>
                )}
                {!isLoading && (
                  <Link href="/login" onClick={() => setOpen(false)} className="btn btn-outline btn-md mt-3xs">
                    Sign in
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
