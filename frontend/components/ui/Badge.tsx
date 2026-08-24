import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "primary" | "accent" | "success" | "warning" | "destructive" | "info";
}

export default function Badge({ children, variant = "primary" }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
