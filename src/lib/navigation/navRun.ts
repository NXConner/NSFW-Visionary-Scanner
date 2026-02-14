import type { NavigateFunction } from "react-router-dom";
import type { NavItem } from "./navTypes";
import { logger } from "@/lib/logger";

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
  logger.debug("Nav item executed", {
    component: "nav",
    id: item.id,
    kind: item.kind,
    to: item.to,
  });

  if (item.kind === "route") {
    const to = item.to ?? "/";
    logger.debug("Navigating to route", { component: "nav", to });
    ctx.navigate(to);
    ctx.afterNavigate?.();
    return;
  }

  logger.debug("Navigating to tab", { component: "nav", tabId: item.id });
  ctx.navigateTab(item.id);
  ctx.afterNavigate?.();
}
