import type { LucideIcon } from "lucide-react";

export type NavItemKind = "tab" | "route";

export type NavItemVisibility = {
  adminOnly?: boolean;
  premiumOnly?: boolean;
  nsfwOnly?: boolean;
  superAdminOnly?: boolean;
};

export interface NavItem extends NavItemVisibility {
  id: string;
  label: string;
  icon: LucideIcon;
  kind: NavItemKind;
  /**
   * Only used when kind === "route".
   * Example: "/admin", "/store", "/growers-vs-showers"
   */
  to?: string;
}

export interface NavCategory {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  adminOnly?: boolean;
}
