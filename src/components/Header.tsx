import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  X,
  User,
  BookOpen,
  MapPin,
  Activity,
  Home,
  ClipboardList,
  ImageIcon,
  TrendingUp,
  Layers,
  AlertTriangle,
  Dumbbell,
  Camera,
  Calendar,
  Sparkles,
  LogIn,
  LogOut,
  Bot,
  Settings,
  Users,
  Heart,
  BarChart3,
  Brain,
  Stethoscope,
  HeartPulse,
  GraduationCap,
  MessageSquare,
  Share2,
  Video,
  GraduationCap as GraduationCapIcon,
  Target,
  Headphones,
  Box,
  Zap,
  FileText,
  BookOpen as BookOpenIcon,
  Sparkles as SparklesIcon,
  Package,
  ShoppingBag,
  Activity as ActivityIcon,
  Crown,
  Plus,
  Mic,
  Key,
  Download,
  Watch,
  Shield,
  Video as VideoIcon,
  UserCheck,
} from "lucide-react";
import { useFeatureToggles } from "@/hooks/useFeatureAccess";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useUserRoles } from "@/hooks/useUserRoles";
import { ContentRatingNeonSign } from "@/components/ContentRatingNeonSign";
import { NavigationDropdown } from "@/components/navigation/NavigationDropdown";
import { useNSFWAvailable } from "@/dlc/context/DLCContext";
import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";
interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
export const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toggles } = useFeatureToggles();
  const { user, signOut } = useAuth();
  const { isAdmin, isPremium, isLoading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();
  const nsfw = useNSFWAvailable();
  const showNsfwTabs = !nsfw.isLoading && !nsfw.requiresDLC;
  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      show: true,
    },
    {
      id: "scanner",
      label: "Scanner",
      icon: Activity,
      show: true,
    },
    // curvature-scan removed - now part of unified scanner tab
    {
      id: "diary",
      label: "Diary",
      icon: BookOpen,
      show: true,
    },
    {
      id: "pumping",
      label: "Pumping",
      icon: TrendingUp,
      show: true,
    },
    {
      id: "guide",
      label: "PE Guide",
      icon: Dumbbell,
      show: true,
    },
    {
      id: "routines",
      label: "Routines",
      icon: Calendar,
      show: toggles.customRoutines,
    },
    {
      id: "pe-progress",
      label: "PE Photos",
      icon: Camera,
      show: toggles.peProgressPhotos,
    },
    {
      id: "positions",
      label: "Positions",
      icon: Sparkles,
      show: toggles.positionsGallery,
    },
    {
      id: "ai-chat",
      label: "AI Chat",
      icon: Bot,
      show: true,
    },
    {
      id: "health-monitoring",
      label: "Health Monitor",
      icon: Heart,
      show: true,
    },
    {
      id: "health-dashboard",
      label: "Dashboard",
      icon: BarChart3,
      show: true,
    },
    {
      id: "ai-insights",
      label: "AI Insights",
      icon: Brain,
      show: true,
    },
    {
      id: "prostate-testicular",
      label: "Prostate/Testicular",
      icon: Stethoscope,
      show: true,
    },
    {
      id: "sexual-wellness",
      label: "Sexual Wellness",
      icon: HeartPulse,
      show: true,
    },
    {
      id: "pelvic-floor",
      label: "Pelvic Floor",
      icon: Target,
      show: toggles.pelvicFloorHub,
    },
    {
      id: "sexual-health-education",
      label: "Health Education",
      icon: GraduationCap,
      show: true,
    },
    {
      id: "education",
      label: "Health Info",
      icon: AlertTriangle,
      show: true,
    },
    {
      id: "community-forum",
      label: "Forum",
      icon: MessageSquare,
      show: true,
    },
    {
      id: "progress-sharing",
      label: "Progress",
      icon: Share2,
      show: true,
    },
    {
      id: "video-library",
      label: "Videos",
      icon: Video,
      show: true,
    },
    {
      id: "interactive-learning",
      label: "Learning",
      icon: GraduationCapIcon,
      show: true,
    },
    {
      id: "in-app-messaging",
      label: "Messages",
      icon: MessageSquare,
      show: true,
    },
    {
      id: "live-support",
      label: "Support",
      icon: Headphones,
      show: true,
    },
    // advanced-scanner and ai-scanning removed - now part of unified scanner tab
    {
      id: "advanced-reporting",
      label: "Reports",
      icon: FileText,
      show: true,
    },
    {
      id: "enhanced-diary",
      label: "Enhanced Diary",
      icon: BookOpenIcon,
      show: true,
    },
    {
      id: "advanced-routines",
      label: "Advanced Routines",
      icon: SparklesIcon,
      show: true,
    },
    ...(BUILD_ALLOW_ADULT_BUNDLE
      ? [
          {
            id: "nsfw-videos",
            label: "NSFW Videos",
            icon: Video,
            show: showNsfwTabs,
          },
          {
            id: "nsfw-forum",
            label: "NSFW Forum",
            icon: MessageSquare,
            show: showNsfwTabs,
          },
          {
            id: "nsfw-wellness-analytics",
            label: "NSFW Analytics",
            icon: ActivityIcon,
            show: showNsfwTabs,
          },
        ]
      : []),
    {
      id: "dlc-system",
      label: "DLC",
      icon: Package,
      show: true,
    },
    {
      id: "premium-marketplace",
      label: "Marketplace",
      icon: ShoppingBag,
      show: true,
    },
    {
      id: "subscription-tiers",
      label: "Plans",
      icon: Crown,
      show: true,
    },
    {
      id: "premium-addons",
      label: "Add-Ons",
      icon: Plus,
      show: true,
    },
    {
      id: "marketplace",
      label: "Marketplace",
      icon: ShoppingBag,
      show: true,
    },
    {
      id: "provider-portal",
      label: "Provider Portal",
      icon: Stethoscope,
      show: true,
    },
    {
      id: "ai-enhancement",
      label: "AI Chat",
      icon: Mic,
      show: true,
    },
    {
      id: "predictive-modeling",
      label: "Predictions",
      icon: Sparkles,
      show: true,
    },
    {
      id: "health-integrations",
      label: "Health Apps",
      icon: Activity,
      show: true,
    },
    {
      id: "api-webhooks",
      label: "API",
      icon: Key,
      show: true,
    },
    {
      id: "export-import",
      label: "Export/Import",
      icon: Download,
      show: true,
    },
    {
      id: "mobile-wearable",
      label: "Mobile/Wearable",
      icon: Watch,
      show: true,
    },
    {
      id: "security-privacy",
      label: "Security",
      icon: Shield,
      show: true,
    },
    ...(BUILD_ALLOW_ADULT_BUNDLE
      ? [
          {
            id: "nsfw-advanced",
            label: "NSFW Advanced",
            icon: VideoIcon,
            show: showNsfwTabs,
          },
        ]
      : []),
    {
      id: "expert-consultations",
      label: "Expert Consultations",
      icon: UserCheck,
      show: true,
    },
    {
      id: "community",
      label: "Community",
      icon: Users,
      show: true,
    },
    {
      id: "3dviewer",
      label: "3D View",
      icon: Layers,
      show: true,
    },
    {
      id: "questionnaire",
      label: "Assessment",
      icon: ClipboardList,
      show: true,
    },
    {
      id: "compare",
      label: "Compare",
      icon: ImageIcon,
      show: true,
    },
    {
      id: "doctors",
      label: "Doctors",
      icon: MapPin,
      show: true,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      show: true,
    },
  ];
  const visibleItems = navItems.filter(item => item.show);
  const rowSize = Math.ceil(visibleItems.length / 3);
  const row1Items = visibleItems.slice(0, rowSize);
  const row2Items = visibleItems.slice(rowSize, rowSize * 2);
  const row3Items = visibleItems.slice(rowSize * 2);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-1 lg:px-2 max-w-[1800px]">
        {/* Brand row ("neon sign") with role badges flanking it */}
        <div className="flex items-center justify-between py-1">
          <div className="min-w-[88px] flex items-center justify-start">
            {!rolesLoading && isAdmin && (
              <Badge className="bg-destructive/90 text-destructive-foreground gap-1">
                <Shield className="w-3 h-3" />
                Admin
              </Badge>
            )}
          </div>

          <button
            type="button"
            onClick={() => onTabChange("home")}
            className="px-3 py-1 rounded-xl hover:bg-primary/10 transition-colors"
            aria-label="Go to home"
          >
            <span className="text-sm sm:text-base font-bold tracking-wide neon-text">
              MorphoScan
            </span>
          </button>

          <div className="min-w-[88px] flex items-center justify-end">
            {!rolesLoading && isPremium && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-1">
                <Crown className="w-3 h-3" />
                Premium
              </Badge>
            )}
          </div>
        </div>

        {/* Desktop Navigation - Three Rows */}
        <div className="hidden lg:block py-1.5">
          <div className="flex items-center justify-center gap-0.5 mb-1">
            {row1Items.map(item => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "scan" : "ghost"}
                size="sm"
                onClick={() => onTabChange(item.id)}
                className={`gap-1 whitespace-nowrap text-[10px] h-7 px-2 min-w-0 flex-shrink transition-colors duration-200 ${
                  activeTab === item.id ? "shadow-primary/30 shadow-lg" : "hover:bg-primary/10"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-0.5 mb-1">
            {row2Items.map(item => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "scan" : "ghost"}
                size="sm"
                onClick={() => onTabChange(item.id)}
                className={`gap-1 whitespace-nowrap text-[10px] h-7 px-2 min-w-0 flex-shrink transition-colors duration-200 ${
                  activeTab === item.id ? "shadow-primary/30 shadow-lg" : "hover:bg-primary/10"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-0.5">
            {row3Items.map(item => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "scan" : "ghost"}
                size="sm"
                onClick={() => onTabChange(item.id)}
                className={`gap-1 whitespace-nowrap text-[10px] h-7 px-2 min-w-0 flex-shrink transition-colors duration-200 ${
                  activeTab === item.id ? "shadow-primary/30 shadow-lg" : "hover:bg-primary/10"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Button>
            ))}
            {/* Sign In (profile dropdown moved down to badge slot) */}
            {!user && (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate("/auth")}
                className="gap-1 whitespace-nowrap text-[10px] h-7 px-2 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Button>
            )}
          </div>

          {/* Neon content rating sign + navigation dropdown directly under row 3 */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-start mt-0">
            <div />
            <ContentRatingNeonSign className="mx-auto" />
            <div className="flex justify-end">
              <NavigationDropdown activeTab={activeTab} onTabChange={onTabChange} />
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center justify-end h-12 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="transition-transform duration-200 hover:scale-110"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-3 border-t border-border/50 animate-fade-in">
            {/* Scrollable menu container with max height */}
            <div className="max-h-[60vh] overflow-y-auto overscroll-contain px-1 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              <div className="grid grid-cols-3 gap-1.5">
                {visibleItems.map(item => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "scan" : "ghost"}
                    size="sm"
                    className={`flex-col h-auto py-2 px-1 gap-1 text-[10px] transition-all ${
                      activeTab === item.id ? "shadow-primary/20 shadow-md bg-primary/20" : ""
                    }`}
                    onClick={() => {
                      onTabChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="truncate w-full text-center">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>
            {/* Auth Button - Mobile - Fixed at bottom */}
            <div className="mt-3 pt-3 border-t border-border/50 flex gap-2">
              {user ? (
                <>
                  <Button
                    variant={activeTab === "profile" ? "scan" : "outline"}
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => {
                      onTabChange("profile");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => {
                    navigate("/auth");
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
