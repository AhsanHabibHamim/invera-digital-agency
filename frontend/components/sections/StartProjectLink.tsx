"use client";

import { useRouter } from "next/navigation";
import type { ReactNode, MouseEvent } from "react";
import { useAuth } from "@/context/AuthContext";

export const PROPOSAL_FLOW_URL = "/client/proposals/new";

export function getDashboardPath(role?: string): string {
  if (!role) return "/login";
  if (role === "client") return "/client";
  return "/dashboard";
}

interface StartProjectLinkProps {
  href?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Auth-aware "Start a project" action. Visitors are routed to the
 * login/register flow and returned to the proposal form afterwards.
 * Logged-in clients go straight to the proposal form; staff go to the
 * fallback href (defaults to the contact page).
 */
export default function StartProjectLink({
  href = "/contact",
  className,
  children,
}: StartProjectLinkProps) {
  const router = useRouter();
  const { user } = useAuth();

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(PROPOSAL_FLOW_URL)}`);
      return;
    }
    if (user.role === "client") {
      router.push(PROPOSAL_FLOW_URL);
      return;
    }
    router.push(href);
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
