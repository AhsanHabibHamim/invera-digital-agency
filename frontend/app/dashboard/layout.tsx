"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Target,
  Briefcase,
  FileText,
  Receipt,
  FileEdit,
  PenLine,
  Layout,
  BookOpen,
  Users,
  Shield,
  Key,
  Wrench,
  Star,
  TrendingUp,
  DollarSign,
  Wallet,
  Calendar,
  LifeBuoy,
  CheckSquare,
  GitBranch,
  Timer,
  List,
  Bell,
  Settings,
  PieChart,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Folder,
  MessageSquare,
  Globe,
  Crown,
} from "lucide-react";
import Image from "next/image";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: Array<"super_admin" | "admin" | "team">;
};

type NavGroup = {
  group: string;
  items: NavItem[];
};

const adminOnlyPrefixes = [
  "/dashboard/users",
  "/dashboard/roles",
  "/dashboard/permissions",
  "/dashboard/sales",
  "/dashboard/finance",
  "/dashboard/payments",
  "/dashboard/hr",
  "/dashboard/analytics",
  "/dashboard/activity-log",
  "/dashboard/cms",
  "/dashboard/pricing",
  "/dashboard/budget-options",
  "/dashboard/blog",
  "/dashboard/case-studies",
  "/dashboard/reviews",
];

const navGroups: NavGroup[] = [
  {
    group: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    group: "CRM",
    items: [
      { label: "Leads", href: "/dashboard/leads", icon: Target },
      { label: "Projects", href: "/dashboard/projects", icon: Briefcase },
      { label: "Quotes", href: "/dashboard/quotes", icon: FileText },
      { label: "Invoices", href: "/dashboard/invoices", icon: Receipt },
      { label: "Proposals", href: "/dashboard/proposals", icon: FileEdit },
    ],
  },
  {
    group: "Content",
    items: [
      { label: "Blog", href: "/dashboard/blog", icon: PenLine },
      { label: "CMS", href: "/dashboard/cms", icon: Layout },
      { label: "Pricing", href: "/dashboard/pricing", icon: DollarSign },
      {
        label: "Budget Options",
        href: "/dashboard/budget-options",
        icon: TrendingUp,
      },
      {
        label: "Case Studies",
        href: "/dashboard/case-studies",
        icon: BookOpen,
      },
    ],
  },
  {
    group: "Management",
    items: [
      {
        label: "Users",
        href: "/dashboard/users",
        icon: Users,
        roles: ["admin", "super_admin"],
      },
      {
        label: "Roles",
        href: "/dashboard/roles",
        icon: Shield,
        roles: ["admin", "super_admin"],
      },
      {
        label: "Permissions",
        href: "/dashboard/permissions",
        icon: Key,
        roles: ["admin", "super_admin"],
      },
      { label: "Services", href: "/dashboard/services", icon: Wrench },
      { label: "Reviews", href: "/dashboard/reviews", icon: Star },
    ],
  },
  {
    group: "Sales",
    items: [
      {
        label: "Sales",
        href: "/dashboard/sales",
        icon: TrendingUp,
        roles: ["admin", "super_admin"],
      },
    ],
  },
  {
    group: "Finance",
    items: [
      {
        label: "Payments",
        href: "/dashboard/payments",
        icon: Wallet,
        roles: ["admin", "super_admin"],
      },
      {
        label: "Finance",
        href: "/dashboard/finance",
        icon: DollarSign,
        roles: ["admin", "super_admin"],
      },
    ],
  },
  {
    group: "HR",
    items: [
      {
        label: "HR",
        href: "/dashboard/hr",
        icon: Calendar,
        roles: ["admin", "super_admin"],
      },
    ],
  },
  {
    group: "Support",
    items: [{ label: "Tickets", href: "/dashboard/support", icon: LifeBuoy }],
  },
  {
    group: "Tasks",
    items: [
      { label: "All Tasks", href: "/dashboard/tasks", icon: CheckSquare },
      { label: "Sprints", href: "/dashboard/sprints", icon: GitBranch },
      { label: "Time", href: "/dashboard/time", icon: Timer },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Files", href: "/dashboard/files", icon: Folder },
      { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
      { label: "Activity Log", href: "/dashboard/activity-log", icon: List },
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
      {
        label: "Analytics",
        href: "/dashboard/analytics",
        icon: PieChart,
        roles: ["admin", "super_admin"],
      },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      for (const group of navGroups) {
        initial[group.group] = group.items.some((item) =>
          pathname.startsWith(item.href),
        );
      }
      return initial;
    },
  );

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
      } else if (user.role === "client") {
        router.replace("/client");
      } else if (
        user.role === "team" &&
        adminOnlyPrefixes.some((p) => pathname.startsWith(p))
      ) {
        router.replace("/dashboard");
      }
    }
  }, [isLoading, user, router, pathname]);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
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
          <Link href="/dashboard" className="flex items-center gap-2xs">
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
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) =>
                !item.roles ||
                item.roles.includes(
                  user.role as "super_admin" | "admin" | "team",
                ),
            );
            if (visibleItems.length === 0) return null;
            const isExpanded = expandedGroups[group.group] ?? true;
            const Icon = visibleItems[0]?.icon;
            return (
              <div key={group.group} className="mb-[2px]">
                <button
                  onClick={() => toggleGroup(group.group)}
                  className="flex w-full items-center gap-2xs rounded-lg px-xs py-2xs text-caption font-semibold uppercase tracking-wider text-foreground/50 transition-colors hover:text-foreground"
                >
                  {Icon && <Icon size={12} />}
                  <span>{group.group}</span>
                  <ChevronDown
                    size={12}
                    className={`ml-auto transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isExpanded && (
                  <div className="ml-3xs mt-[2px] flex flex-col gap-[2px]">
                    {visibleItems.map((item) => {
                      const active = isActive(item.href);
                      const ItemIcon = item.icon;
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
                          <ItemIcon size={16} />
                          <span>{item.label}</span>
                          {active && (
                            <span className="ml-auto w-3xs h-3xs rounded-full bg-primary" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
              <span className="hidden sm:inline">Welcome back,</span>{" "}
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
              href="/dashboard/notifications"
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
                {user.role === "super_admin" ? (
                  <span className="inline-flex items-center gap-3xs rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-2xs py-3xs text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                    <Crown size={10} />
                    Super Admin · Full Access
                  </span>
                ) : (
                  <p className="text-caption text-foreground/50 capitalize">
                    {user.role.replace("_", " ")}
                  </p>
                )}
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
