import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Crown, LogOut, Menu, Shield, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useNSFWAvailable } from "@/dlc/context/DLCContext";
import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";
import {
  ADMIN_NAV_CATEGORY,
  NAV_CATEGORIES,
  type NavCategory,
  type NavItem,
} from "@/lib/navigation/navCatalog";
import { getNavItemVisibility } from "@/lib/navigation/navVisibility";
import { runNavItem } from "@/lib/navigation/navRun";

interface NavigationDropdownProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const NavigationDropdown = ({ activeTab, onTabChange }: NavigationDropdownProps) => {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin, isPremium, isSuperAdmin, isLoading } = useUserRoles();
  const nsfw = useNSFWAvailable();
  const navigate = useNavigate();
  const location = useLocation();

  const categories: NavCategory[] = useMemo(() => NAV_CATEGORIES, []);

  const nsfwAvailable = !nsfw.requiresDLC;

  const isActiveItem = (item: NavItem) => {
    if (item.kind === "tab") return activeTab === item.id;
    const to = item.to ?? "";
    if (!to) return false;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const handleNavClick = (item: NavItem) => {
    // Always log for debugging navigation issues
    console.log("[Navigation] Click:", { itemId: item.id, kind: item.kind, to: item.to });

    if (BUILD_ALLOW_ADULT_BUNDLE && item.nsfwOnly) {
      // Adult-only navigation is only available in direct bundles.
      // If user doesn't have NSFW DLC yet, route to the promo/landing page (store entry).
      // If they have DLC but aren't age verified yet, route to the hub which prompts verification.
      if (nsfw.requiresDLC) {
        console.log("[Navigation] Requires DLC, navigating to /nsfw/landing");
        navigate("/nsfw/landing");
        setOpen(false);
        return;
      }
      if (nsfw.requiresAgeVerification) {
        console.log("[Navigation] Requires age verification, navigating to /nsfw");
        navigate("/nsfw");
        setOpen(false);
        return;
      }
    }

    const { visible, locked } = getNavItemVisibility(item, {
      isAdmin,
      isPremium,
      isSuperAdmin,
      nsfwAvailable,
    });
    
    console.log("[Navigation] Visibility check:", { visible, locked });
    
    if (!visible) {
      console.log("[Navigation] Item not visible, aborting");
      return;
    }
    if (locked) {
      console.log("[Navigation] Item locked, redirecting to subscription");
      onTabChange("subscription-tiers");
      setOpen(false);
      return;
    }

    console.log("[Navigation] Running nav item");
    runNavItem(item, {
      navigate,
      navigateTab: onTabChange,
      afterNavigate: () => setOpen(false),
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-9 px-3 font-medium border-primary/30 hover:border-primary/50 hover:bg-primary/10"
        >
          <Menu className="w-4 h-4" />
          <span className="hidden sm:inline">Navigate</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-2 border-primary/20 shadow-2xl"
      >
        {user && (
          <>
            <div className="px-3 py-2 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="text-sm font-semibold truncate">{user.email}</p>
              {!isLoading && (isAdmin || isPremium) && (
                <div className="flex gap-1 mt-1">
                  {isAdmin && <Badge className="text-[10px] h-4 bg-destructive/90">Admin</Badge>}
                  {isPremium && (
                    <Badge className="text-[10px] h-4 bg-gradient-to-r from-amber-500 to-orange-500">
                      Premium
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Admin Category - Only show if user is admin */}
        {!isLoading && isAdmin && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2 py-2.5 cursor-pointer hover:bg-destructive/10">
                <Shield className="w-4 h-4 text-destructive" />
                <span className="font-medium text-destructive">Admin Panel</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56 bg-background/95 backdrop-blur-xl border border-destructive/30">
                <DropdownMenuLabel className="text-destructive text-xs">
                  Administrator Controls
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ADMIN_NAV_CATEGORY.items.map(item => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleNavClick(item);
                    }}
                    className="gap-2 py-2 cursor-pointer hover:bg-destructive/10"
                  >
                    <item.icon className="w-4 h-4 text-destructive" />
                    <span>{item.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Regular Categories */}
        {categories.map(category => (
          <DropdownMenuSub key={category.label}>
            <DropdownMenuSubTrigger className="gap-2 py-2.5 cursor-pointer hover:bg-primary/10">
              <category.icon className="w-4 h-4 text-primary" />
              <span className="font-medium">{category.label}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56 bg-background/95 backdrop-blur-xl border border-primary/20">
              {category.items
                .filter(item => {
                  const { visible } = getNavItemVisibility(item, {
                    isAdmin,
                    isPremium,
                    isSuperAdmin,
                    nsfwAvailable,
                  });
                  return visible;
                })
                .map(item => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleNavClick(item);
                    }}
                    className={`gap-2 py-2 cursor-pointer ${
                      isActiveItem(item) ? "bg-primary/15" : "hover:bg-primary/10"
                    } ${item.nsfwOnly ? "text-pink-500" : ""}`}
                  >
                    <item.icon
                      className={`w-4 h-4 ${item.nsfwOnly ? "text-pink-500" : "text-muted-foreground"}`}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.premiumOnly && <Crown className="w-3 h-3 text-amber-500" />}
                    {item.nsfwOnly && (
                      <Badge
                        variant="outline"
                        className="text-[9px] h-4 border-pink-500 text-pink-500"
                      >
                        18+
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}

        {/* Auth Actions */}
        <DropdownMenuSeparator />
        {user ? (
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              signOut();
              setOpen(false);
            }}
            className="gap-2 py-2.5 cursor-pointer text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Sign Out</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              navigate("/auth");
              setOpen(false);
            }}
            className="gap-2 py-2.5 cursor-pointer hover:bg-primary/10"
          >
            <User className="w-4 h-4 text-primary" />
            <span className="font-medium">Sign In</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
