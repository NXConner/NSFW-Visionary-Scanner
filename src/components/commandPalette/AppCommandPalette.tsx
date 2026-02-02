import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Crown, LogIn, LogOut, Settings, Terminal, Keyboard } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useNSFWAvailable } from "@/dlc/context/DLCContext";
import {
  APP_EVENT_OPEN_COMMAND_PALETTE,
  emitNavigateTab,
  emitOpenShortcutsHelp,
} from "@/lib/appEvents";
import {
  ADMIN_NAV_CATEGORY,
  NAV_CATEGORIES,
  type NavCategory,
  type NavItem,
} from "@/lib/navigation/navCatalog";
import { getNavItemVisibility } from "@/lib/navigation/navVisibility";
import { runNavItem } from "@/lib/navigation/navRun";

type PaletteEntry =
  | { kind: "nav"; category: string; item: NavItem }
  | {
      kind: "action";
      category: string;
      label: string;
      icon?: ComponentType<{ className?: string }>;
      shortcut?: string;
      run: () => void;
    };

function isVisibleItem(
  item: NavItem,
  ctx: { isAdmin: boolean; isPremium: boolean; isSuperAdmin: boolean; nsfwAvailable: boolean },
) {
  return getNavItemVisibility(item, ctx).visible;
}

export function AppCommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isPremium, isSuperAdmin, isLoading: rolesLoading } = useUserRoles();
  const nsfw = useNSFWAvailable();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(APP_EVENT_OPEN_COMMAND_PALETTE, onOpen);
    return () => window.removeEventListener(APP_EVENT_OPEN_COMMAND_PALETTE, onOpen);
  }, []);

  const entries = useMemo(() => {
    const nsfwAvailable = !nsfw.requiresDLC;
    const categories: NavCategory[] = [...NAV_CATEGORIES];
    const result: PaletteEntry[] = [];
    const ctx = { isAdmin, isPremium, isSuperAdmin, nsfwAvailable };

    // Quick actions
    result.push(
      {
        kind: "action",
        category: "Quick actions",
        label: "Keyboard shortcuts",
        icon: Keyboard,
        shortcut: "Ctrl+/",
        run: () => emitOpenShortcutsHelp(),
      },
      {
        kind: "action",
        category: "Quick actions",
        label: "Settings",
        icon: Settings,
        shortcut: "Ctrl+,",
        run: () => emitNavigateTab("settings"),
      },
    );

    if (user) {
      result.push({
        kind: "action",
        category: "Account",
        label: "Sign out",
        icon: LogOut,
        run: () => signOut(),
      });
    } else {
      result.push({
        kind: "action",
        category: "Account",
        label: "Sign in",
        icon: LogIn,
        run: () => navigate("/auth"),
      });
    }

    if (!rolesLoading && isAdmin) {
      for (const item of ADMIN_NAV_CATEGORY.items) {
        result.push({ kind: "nav", category: ADMIN_NAV_CATEGORY.label, item });
      }
    }

    for (const category of categories) {
      for (const item of category.items) {
        if (!isVisibleItem(item, ctx)) continue;
        result.push({ kind: "nav", category: category.label, item });
      }
    }

    return result;
  }, [isAdmin, isPremium, isSuperAdmin, nsfw.requiresDLC, navigate, rolesLoading, signOut, user]);

  const grouped = useMemo(() => {
    const map = new Map<string, PaletteEntry[]>();
    for (const entry of entries) {
      const key = entry.category;
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    return map;
  }, [entries]);

  const groups = useMemo(() => Array.from(grouped.keys()), [grouped]);

  const runNav = (item: NavItem) => {
    const nsfwAvailable = !nsfw.requiresDLC;
    const { visible, locked } = getNavItemVisibility(item, {
      isAdmin,
      isPremium,
      isSuperAdmin,
      nsfwAvailable,
    });
    if (!visible) return;

    if (item.nsfwOnly) {
      if (nsfw.requiresDLC) {
        navigate("/nsfw/landing");
        return;
      }
      if (nsfw.requiresAgeVerification) {
        navigate("/nsfw");
        return;
      }
    }

    if (locked) {
      toast.info("Premium required", {
        description: "Upgrade to Premium to unlock this feature.",
        action: {
          label: "View plans",
          onClick: () => emitNavigateTab("subscription-tiers"),
        },
      });
      return;
    }

    runNavItem(item, { navigate, navigateTab: emitNavigateTab });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {groups.map((groupLabel, idx) => {
          const items = grouped.get(groupLabel) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={groupLabel}>
              {idx !== 0 && <CommandSeparator />}
              <CommandGroup heading={groupLabel}>
                {items.map(entry => {
                  if (entry.kind === "action") {
                    const Icon = entry.icon ?? Terminal;
                    return (
                      <CommandItem
                        key={`action:${groupLabel}:${entry.label}`}
                        onSelect={() => {
                          setOpen(false);
                          entry.run();
                        }}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <span className="flex-1">{entry.label}</span>
                        {entry.shortcut ? (
                          <CommandShortcut>{entry.shortcut}</CommandShortcut>
                        ) : null}
                      </CommandItem>
                    );
                  }

                  const item = entry.item;
                  return (
                    <CommandItem
                      key={`nav:${groupLabel}:${item.id}`}
                      onSelect={() => {
                        setOpen(false);
                        runNav(item);
                      }}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                      {item.premiumOnly ? <Crown className="h-4 w-4 text-amber-500" /> : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
