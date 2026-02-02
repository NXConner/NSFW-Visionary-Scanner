import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Home,
  Package,
  Flame,
  Shield,
  Activity,
  BookOpen,
  TrendingUp,
  Dumbbell,
  Calendar,
  Heart,
  BarChart3,
  Bot,
  Brain,
  Users,
  MessageSquare,
  Settings,
  Stethoscope,
} from "lucide-react";
import { useOptionalDLC } from "@/dlc/context/DLCContext";
import { NavigationDropdown } from "./NavigationDropdown";
import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";

type RouteTopNavAction =
  | {
      key: string;
      kind: "link";
      to: string;
      label: string;
      icon?: React.ComponentType<{ className?: string }>;
      variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
    }
  | {
      key: string;
      kind: "custom";
      node: React.ReactNode;
    };

export function RouteTopNav(props: {
  title: string;
  badge?: string;
  backTo?: string;
  backLabel?: string;
  actions?: RouteTopNavAction[];
  showFullNavigation?: boolean;
}): React.ReactElement {
  const dlc = useOptionalDLC();
  const navigate = useNavigate();
  const showNsfwHubAction = useMemo(() => {
    if (!dlc) return false;
    return [...dlc.ownedPackages, ...dlc.installedPackages].some(p => {
      const rating = String((p as any)?.contentRating ?? "");
      return rating === "18+" || rating === "adult";
    });
  }, [dlc]);

  const {
    title,
    badge,
    backTo = "/",
    backLabel = "Back",
    showFullNavigation = false,
    actions = [
      { key: "home", kind: "link", to: "/", label: "Home", icon: Home, variant: "outline" },
      {
        key: "store",
        kind: "link",
        to: "/store",
        label: "Store",
        icon: Package,
        variant: "outline",
      },
      ...(showNsfwHubAction && BUILD_ALLOW_ADULT_BUNDLE
        ? [
            {
              key: "nsfw",
              kind: "link" as const,
              to: "/nsfw",
              label: "Private Hub",
              icon: Flame,
              variant: "default" as const,
            },
          ]
        : []),
    ],
  } = props;

  // Quick access navigation items for full navigation mode
  const quickNavItems = [
    { key: "scanner", label: "Scanner", icon: Activity },
    { key: "diary", label: "Diary", icon: BookOpen },
    { key: "pumping", label: "Pumping", icon: TrendingUp },
    { key: "guide", label: "PE Guide", icon: Dumbbell },
    { key: "health-monitoring", label: "Health", icon: Heart },
    { key: "ai-chat", label: "AI Chat", icon: Bot },
    { key: "community-forum", label: "Forum", icon: Users },
  ];

  const handleQuickNav = (tabId: string) => {
    navigate("/");
    // Dispatch event to change tab
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("navigate-tab", { detail: tabId }));
    }, 100);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon" aria-label={backLabel}>
            <Link to={backTo}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="font-bold truncate">{title}</div>
              {badge ? (
                <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                  <Shield className="h-3 w-3" />
                  {badge}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {/* Quick navigation buttons - shown when showFullNavigation is true */}
        {showFullNavigation && (
          <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
            {quickNavItems.map(item => (
              <Button
                key={item.key}
                variant="ghost"
                size="sm"
                onClick={() => handleQuickNav(item.key)}
                className="gap-1"
              >
                <item.icon className="h-3 w-3" />
                <span className="hidden xl:inline text-xs">{item.label}</span>
              </Button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Full navigation dropdown */}
          <NavigationDropdown activeTab="" onTabChange={handleQuickNav} />

          {/* Custom actions */}
          {actions.map(a => {
            if (a.kind === "custom") return <React.Fragment key={a.key}>{a.node}</React.Fragment>;
            const Icon = a.icon;
            return (
              <Button key={a.key} asChild variant={a.variant ?? "outline"} size="sm">
                <Link to={a.to} className="gap-2 inline-flex items-center">
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  <span className="hidden sm:inline">{a.label}</span>
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

export default RouteTopNav;
