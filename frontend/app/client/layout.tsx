"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Briefcase,
  Receipt,
  LifeBuoy,
  MessageSquare,
  Bell,
  Settings,
  Menu,
  X,
  LogOut,
  Globe,
} from "lucide-react";
import Image from "next/image";

const navItems = [
  { label: "Dashboard", href: "/client", icon: LayoutDashboard },
  { label: "My Projects", href: "/client/projects", icon: Briefcase },
  { label: "My Invoices", href: "/client/invoices", icon: Receipt },
  { label: "Support Tickets", href: "/client/tickets", icon: LifeBuoy },
  { label: "Messages", href: "/client/messages", icon: MessageSquare },
  { label: "Notifications", href: "/client/notifications", icon: Bell },
  { label: "Settings", href: "/client/settings", icon: Settings },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
      } else if (user.role !== "client" && user.role !== "super_admin") {
        router.replace("/dashboard");
      }
    }
  }, [isLoading, user, router, pathname]);

  const isActive = (href: string) => {
    if (href === "/client") return pathname === "/client";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-surface transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-sm">
          <Link href="/client" className="flex items-center gap-2xs">
            <Image
              src={"/logo.svg"}
              width={30}
              height={30}
              alt="Invera Digital Agency"
            />
            <span className="text-h5 font-bold text-foreground">
              Invera
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="icon-btn lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="h-[calc(100vh-4rem)] overflow-y-auto px-xs py-sm">
          <div className="flex flex-col gap-[2px]">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-xs rounded-lg px-xs py-2xs text-small font-medium transition-all duration-150 ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/40 hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {active && (
                    <span className="ml-auto w-3xs h-3xs rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-sm lg:px-md">
          <div className="flex items-center gap-xs">
            <button
              onClick={() => setSidebarOpen(true)}
              className="icon-btn lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={18} />
            </button>
            <div className="text-small text-foreground/50">
              <span className="hidden sm:inline">Welcome,</span>{" "}
              <span className="font-semibold text-foreground">{user.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2xs">
            <Link
              href="/"
              className="btn btn-outline btn-sm gap-2xs hidden sm:inline-flex"
              aria-label="Back to main website"
            >
              <Globe size={14} />
              Website
            </Link>
            <Link
              href="/"
              className="icon-btn sm:hidden"
              aria-label="Back to main website"
            >
              <Globe size={18} />
            </Link>
            <Link
              href="/client/notifications"
              className="icon-btn relative"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </Link>
            <div className="flex items-center gap-xs border-l border-border pl-xs">
              <div className="avatar avatar-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-small font-medium text-foreground">
                  {user.name}
                </p>
                <p className="text-caption text-foreground/50 capitalize">
                  {user.role === "super_admin" ? "Super Admin (viewing as client)" : "Client"}
                </p>
              </div>
              <button
                onClick={logout}
                className="icon-btn text-foreground/50 hover:text-destructive"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-sm lg:p-md">{children}</main>
      </div>
    </div>
  );
}
