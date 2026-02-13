import type { NavItem } from "./navTypes";

export type NavVisibilityContext = {
  isAdmin: boolean;
  isPremium: boolean;
  isSuperAdmin: boolean;
  /**
   * True when the user is allowed to see NSFW destinations in navigation.
   * (This can still mean "requires age verification"; those flows are handled by caller.)
   */
  nsfwAvailable: boolean;
};

export type NavItemVisibilityResult = {
  visible: boolean;
  locked: boolean;
};

export function getNavItemVisibility(
  item: NavItem,
  ctx: NavVisibilityContext,
): NavItemVisibilityResult {
  // SUPER ADMIN BYPASS: Super admins see everything, nothing is locked
  if (ctx.isSuperAdmin) {
    // Only hide items that are explicitly for other roles (adminOnly without admin role)
    if (item.adminOnly && !ctx.isAdmin && !ctx.isSuperAdmin)
      return { visible: false, locked: false };
    if (item.superAdminOnly && !ctx.isSuperAdmin) return { visible: false, locked: false };
    // Super admin sees all other items unlocked
    return { visible: true, locked: false };
  }

  // ADMIN BYPASS: Admins also get full access to all features (treated as premium)
  if (ctx.isAdmin) {
    if (item.superAdminOnly && !ctx.isSuperAdmin) return { visible: false, locked: false };
    // Admin sees all other items unlocked
    return { visible: true, locked: false };
  }

  if (item.adminOnly && !ctx.isAdmin) return { visible: false, locked: false };
  if (item.superAdminOnly && !ctx.isSuperAdmin) return { visible: false, locked: false };
  if (item.nsfwOnly && !ctx.nsfwAvailable) return { visible: false, locked: false };
  if (item.premiumOnly && !ctx.isPremium) return { visible: true, locked: true };
  return { visible: true, locked: false };
}
