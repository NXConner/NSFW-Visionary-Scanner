import { memo } from "react";
import { cn } from "@/lib/utils";
import { Home, Scan, BookOpen, Users, User, TrendingUp, type LucideIcon } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "scanner", label: "Scan", icon: Scan },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "community", label: "Community", icon: Users },
  { id: "profile", label: "Profile", icon: User },
];

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenMenu?: () => void;
}

export const MobileBottomNav = memo(function MobileBottomNav({
  activeTab,
  onTabChange,
  onOpenMenu,
}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-[9999] block lg:hidden bg-background border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.3)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch justify-around h-16 max-w-lg mx-auto bg-background">
        {navItems.map(item => {
          const isMenu = item.id === "__menu__";
          const isActive = !isMenu && activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (isMenu) {
                  onOpenMenu?.();
                  return;
                }
                onTabChange(item.id);
              }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-0.5 transition-all duration-200 relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
              <item.icon
                className={cn("w-5 h-5 transition-transform duration-200", isActive && "scale-110")}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});
