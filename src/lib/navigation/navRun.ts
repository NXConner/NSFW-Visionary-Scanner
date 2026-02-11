import type { NavigateFunction } from "react-router-dom";
import type { NavItem } from "./navTypes";

export type RunNavContext = {
  navigate: NavigateFunction;
  navigateTab: (tabId: string) => void;
  /**
   * Optional hook to close any open mobile nav surfaces (sheet/drawer).
   * Called after a successful navigation.
   */
  afterNavigate?: () => void;
};

export function runNavItem(item: NavItem, ctx: RunNavContext) {
  console.log("[runNavItem] Executing:", { id: item.id, kind: item.kind, to: item.to });

  if (item.kind === "route") {
    const to = item.to ?? "/";
    console.log("[runNavItem] Navigating to route:", to);
    ctx.navigate(to);
    ctx.afterNavigate?.();
    return;
  }

  console.log("[runNavItem] Navigating to tab:", item.id);
  ctx.navigateTab(item.id);
  ctx.afterNavigate?.();
}
