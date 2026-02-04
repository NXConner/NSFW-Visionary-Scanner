import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NavigationDropdown } from "@/components/navigation/NavigationDropdown";
import { emitOpenCommandPalette } from "@/lib/appEvents";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuth } from "@/contexts/AuthContext";
import { Crown, Search, Shield } from "lucide-react";
import { APP_SHORT_NAME } from "@/config/brand";

export function AppTopBar(props: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}): React.ReactElement {
  const { activeTab, onTabChange } = props;
  const { user } = useAuth();
  const { isAdmin, isPremium, isLoading } = useUserRoles();

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] border-b border-border bg-background/95 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex h-14 max-w-[1800px] items-center gap-2 px-3">
        <SidebarTrigger className="shrink-0" />

        <Button
          type="button"
          variant="ghost"
          className="px-2 font-semibold tracking-wide"
          onClick={() => onTabChange("home")}
          aria-label="Go to home"
        >
          <span className="neon-text">{APP_SHORT_NAME}</span>
        </Button>

        <div className="hidden md:flex flex-1">
          <Button
            type="button"
            variant="outline"
            className="w-full max-w-md justify-start gap-2 bg-background/70 text-muted-foreground hover:text-foreground"
            onClick={() => emitOpenCommandPalette()}
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Search commands, pages, features…</span>
            <span className="ml-auto hidden lg:inline-flex gap-1">
              <kbd className="pointer-events-none rounded border bg-muted px-1.5 py-0.5 text-[10px]">
                Ctrl
              </kbd>
              <kbd className="pointer-events-none rounded border bg-muted px-1.5 py-0.5 text-[10px]">
                K
              </kbd>
            </span>
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {!isLoading && isAdmin ? (
            <Badge className="hidden sm:inline-flex bg-destructive/90 text-destructive-foreground gap-1">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
          ) : null}
          {!isLoading && isPremium ? (
            <Badge className="hidden sm:inline-flex bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-1">
              <Crown className="h-3 w-3" />
              Premium
            </Badge>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => emitOpenCommandPalette()}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          <NavigationDropdown activeTab={activeTab} onTabChange={onTabChange} />
          {user ? null : (
            <span className="hidden lg:inline text-xs text-muted-foreground">Signed out</span>
          )}
        </div>
      </div>
    </header>
  );
}
