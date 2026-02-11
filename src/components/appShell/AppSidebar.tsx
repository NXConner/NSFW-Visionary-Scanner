import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Flame, LogIn, LogOut, Shield } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/components/ui/sidebar";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useNSFWAvailable, useDLC } from "@/dlc/context/DLCContext";
import {
  ADMIN_NAV_CATEGORY,
  NAV_CATEGORIES,
  type NavCategory,
  type NavItem,
} from "@/lib/navigation/navCatalog";
import { getNavItemVisibility } from "@/lib/navigation/navVisibility";
import { runNavItem } from "@/lib/navigation/navRun";
import { emitOpenCommandPalette } from "@/lib/appEvents";
import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";
import { Badge } from "@/components/ui/badge";

const PRIMARY_ITEM_IDS = ["home", "scanner", "progress", "learn", "community", "profile"] as const;

function flattenItems(categories: NavCategory[]): NavItem[] {
  const out: NavItem[] = [];
  for (const c of categories) out.push(...c.items);
  return out;
}

export function AppSidebar(props: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}): React.ReactElement {
  const { activeTab, onTabChange } = props;
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const { user, signOut } = useAuth();
  const { isAdmin, isPremium, isSuperAdmin, isLoading } = useUserRoles();
  const nsfw = useNSFWAvailable();
  const { isAgeVerified } = useDLC();

  // NSFW content is available when:
  // 1. User has the DLC (!nsfw.requiresDLC) AND is age verified
  // 2. OR user is a super admin (bypass all restrictions)
  const nsfwUnlocked = isSuperAdmin || (nsfw.isAvailable && isAgeVerified);
  const nsfwAvailable = !nsfw.requiresDLC || isSuperAdmin;
  const allItems = React.useMemo(() => flattenItems(NAV_CATEGORIES), []);
  const primaryItems = React.useMemo(
    () =>
      PRIMARY_ITEM_IDS.map(id => allItems.find(i => i.kind === "tab" && i.id === id)).filter(
        Boolean,
      ) as NavItem[],
    [allItems],
  );

  const afterNavigate = React.useCallback(() => setOpenMobile(false), [setOpenMobile]);

  const handleItem = React.useCallback(
    (item: NavItem) => {
      if (BUILD_ALLOW_ADULT_BUNDLE && item.nsfwOnly) {
        if (nsfw.requiresDLC) {
          navigate("/nsfw/landing");
          afterNavigate();
          return;
        }
        if (nsfw.requiresAgeVerification) {
          navigate("/nsfw");
          afterNavigate();
          return;
        }
      }

      const { visible, locked } = getNavItemVisibility(item, {
        isAdmin,
        isPremium,
        isSuperAdmin,
        nsfwAvailable,
      });
      if (!visible) return;
      if (locked) {
        onTabChange("subscription-tiers");
        afterNavigate();
        return;
      }

      runNavItem(item, { navigate, navigateTab: onTabChange, afterNavigate });
    },
    [
      afterNavigate,
      isAdmin,
      isPremium,
      isSuperAdmin,
      navigate,
      nsfw.requiresAgeVerification,
      nsfw.requiresDLC,
      nsfwAvailable,
      onTabChange,
    ],
  );

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <SidebarInput
          readOnly
          value=""
          placeholder="Search (Ctrl+K)"
          onClick={() => emitOpenCommandPalette()}
          aria-label="Search"
        />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Primary</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryItems.map(item => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    isActive={item.kind === "tab" ? activeTab === item.id : false}
                    onClick={() => handleItem(item)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isLoading && isAdmin ? (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {ADMIN_NAV_CATEGORY.items.map(item => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton tooltip={item.label} onClick={() => handleItem(item)}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}

        <SidebarSeparator />

        {NAV_CATEGORIES.filter(category => category.label !== "Main").map(category => {
          const isNSFWCategory = category.label === "NSFW Content";

          // For NSFW category, only show if unlocked (has DLC + age verified OR super admin)
          if (isNSFWCategory && !nsfwUnlocked) {
            // Show a teaser entry to unlock NSFW content
            if (BUILD_ALLOW_ADULT_BUNDLE) {
              return (
                <SidebarGroup key={category.label}>
                  <SidebarGroupLabel className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    NSFW Content
                    <Badge
                      variant="outline"
                      className="ml-auto text-xs bg-orange-500/10 text-orange-500 border-orange-500/30"
                    >
                      Locked
                    </Badge>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          tooltip="Unlock NSFW Content"
                          onClick={() => {
                            if (nsfw.requiresDLC) {
                              navigate("/nsfw/landing");
                            } else if (nsfw.requiresAgeVerification) {
                              navigate("/nsfw");
                            }
                            afterNavigate();
                          }}
                        >
                          <Crown className="h-4 w-4 text-orange-500" />
                          <span className="flex-1">Unlock Adult Content</span>
                          <Shield className="h-4 w-4 text-muted-foreground" />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            }
            return null;
          }

          return (
            <SidebarGroup key={category.label}>
              <SidebarGroupLabel className={isNSFWCategory ? "flex items-center gap-2" : undefined}>
                {isNSFWCategory && <Flame className="h-4 w-4 text-orange-500" />}
                {category.label}
                {isNSFWCategory && nsfwUnlocked && (
                  <Badge
                    variant="outline"
                    className="ml-auto text-xs bg-green-500/10 text-green-500 border-green-500/30"
                  >
                    Unlocked
                  </Badge>
                )}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {category.items
                    .map(item => {
                      const { visible, locked } = getNavItemVisibility(item, {
                        isAdmin,
                        isPremium,
                        isSuperAdmin,
                        nsfwAvailable,
                      });
                      return { item, visible, locked };
                    })
                    .filter(x => x.visible)
                    .map(({ item, locked }) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          tooltip={item.label}
                          isActive={item.kind === "tab" ? activeTab === item.id : false}
                          onClick={() => handleItem(item)}
                        >
                          <item.icon />
                          <span className="flex-1">{item.label}</span>
                          {locked ? <Crown className="h-4 w-4 text-amber-500" /> : null}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 text-xs text-muted-foreground">
          {user ? <span className="truncate block">{user.email}</span> : <span>Signed out</span>}
        </div>
        {user ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Sign out" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Sign in" onClick={() => navigate("/auth")}>
                <LogIn className="h-4 w-4" />
                <span>Sign in</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
