import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User, BookOpen, MapPin, Activity, Home, ClipboardList, ImageIcon, TrendingUp, Layers, AlertTriangle, Dumbbell, Camera, Calendar, Sparkles, LogIn, LogOut, Bot, Settings, ChevronDown, Users, Heart, BarChart3, Brain, Stethoscope, HeartPulse, GraduationCap, MessageSquare, Share2, Video, GraduationCap as GraduationCapIcon, Target, Headphones, Ticket, Box, Zap, FileText, BookOpen as BookOpenIcon, Sparkles as SparklesIcon, Package, ShoppingBag, Activity as ActivityIcon, Crown, Plus, Mic, Key, Download, Upload, Watch, Shield, Video as VideoIcon } from "lucide-react";
import { useFeatureToggles } from "@/hooks/useFeatureAccess";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
export const Header = ({
  activeTab,
  onTabChange
}: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    toggles
  } = useFeatureToggles();
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const navItems = [{
    id: "home",
    label: "Home",
    icon: Home,
    show: true
  }, {
    id: "scanner",
    label: "Scanner",
    icon: Activity,
    show: true
  }, {
    id: "diary",
    label: "Diary",
    icon: BookOpen,
    show: true
  }, {
    id: "pumping",
    label: "Pumping",
    icon: TrendingUp,
    show: true
  }, {
    id: "guide",
    label: "PE Guide",
    icon: Dumbbell,
    show: toggles.peGuide
  }, {
    id: "routines",
    label: "Routines",
    icon: Calendar,
    show: toggles.peRoutineBuilder
  }, {
    id: "pe-progress",
    label: "PE Photos",
    icon: Camera,
    show: toggles.peProgressPhotos
  }, {
    id: "positions",
    label: "Positions",
    icon: Sparkles,
    show: toggles.positions
  }, {
    id: "ai-chat",
    label: "AI Chat",
    icon: Bot,
    show: true
  }, {
    id: "health-monitoring",
    label: "Health Monitor",
    icon: Heart,
    show: true
  }, {
    id: "health-dashboard",
    label: "Dashboard",
    icon: BarChart3,
    show: true
  }, {
    id: "ai-insights",
    label: "AI Insights",
    icon: Brain,
    show: true
  }, {
    id: "prostate-testicular",
    label: "Prostate/Testicular",
    icon: Stethoscope,
    show: true
  }, {
    id: "sexual-wellness",
    label: "Sexual Wellness",
    icon: HeartPulse,
    show: true
  }, {
    id: "sexual-health-education",
    label: "Health Education",
    icon: GraduationCap,
    show: true
  }, {
    id: "education",
    label: "Health Info",
    icon: AlertTriangle,
    show: true
  }, {
    id: "community-forum",
    label: "Forum",
    icon: MessageSquare,
    show: true
  }, {
    id: "progress-sharing",
    label: "Progress",
    icon: Share2,
    show: true
  }, {
    id: "video-library",
    label: "Videos",
    icon: Video,
    show: true
  }, {
    id: "interactive-learning",
    label: "Learning",
    icon: GraduationCapIcon,
    show: true
  }, {
    id: "in-app-messaging",
    label: "Messages",
    icon: MessageSquare,
    show: true
  }, {
    id: "live-support",
    label: "Support",
    icon: Headphones,
    show: true
  }, {
    id: "advanced-scanner",
    label: "Advanced Scanner",
    icon: Box,
    show: true
  }, {
    id: "ai-scanning",
    label: "AI Scanning",
    icon: Zap,
    show: true
  }, {
    id: "advanced-reporting",
    label: "Reports",
    icon: FileText,
    show: true
  }, {
    id: "enhanced-diary",
    label: "Enhanced Diary",
    icon: BookOpenIcon,
    show: true
  }, {
    id: "advanced-routines",
    label: "Advanced Routines",
    icon: SparklesIcon,
    show: true
  }, {
    id: "nsfw-videos",
    label: "NSFW Videos",
    icon: Video,
    show: true
  }, {
    id: "nsfw-forum",
    label: "NSFW Forum",
    icon: MessageSquare,
    show: true
  }, {
    id: "nsfw-wellness-analytics",
    label: "NSFW Analytics",
    icon: ActivityIcon,
    show: true
  }, {
    id: "dlc-system",
    label: "DLC",
    icon: Package,
    show: true
  }, {
    id: "premium-marketplace",
    label: "Marketplace",
    icon: ShoppingBag,
    show: true
  }, {
    id: "subscription-tiers",
    label: "Plans",
    icon: Crown,
    show: true
  }, {
    id: "premium-addons",
    label: "Add-Ons",
    icon: Plus,
    show: true
  }, {
    id: "marketplace",
    label: "Marketplace",
    icon: ShoppingBag,
    show: true
  }, {
    id: "provider-portal",
    label: "Provider Portal",
    icon: Stethoscope,
    show: true
  }, {
    id: "ai-enhancement",
    label: "AI Chat",
    icon: Mic,
    show: true
  }, {
    id: "predictive-modeling",
    label: "Predictions",
    icon: Sparkles,
    show: true
  }, {
    id: "health-integrations",
    label: "Health Apps",
    icon: Activity,
    show: true
  }, {
    id: "api-webhooks",
    label: "API",
    icon: Key,
    show: true
  }, {
    id: "export-import",
    label: "Export/Import",
    icon: Download,
    show: true
  }, {
    id: "mobile-wearable",
    label: "Mobile/Wearable",
    icon: Watch,
    show: true
  }, {
    id: "security-privacy",
    label: "Security",
    icon: Shield,
    show: true
  }, {
    id: "nsfw-advanced",
    label: "NSFW Advanced",
    icon: VideoIcon,
    show: true
  }, {
    id: "expert-content",
    label: "Expert Content",
    icon: Users,
    show: true
  }, {
    id: "community",
    label: "Community",
    icon: Users,
    show: true
  }, {
    id: "3dviewer",
    label: "3D View",
    icon: Layers,
    show: true
  }, {
    id: "questionnaire",
    label: "Assessment",
    icon: ClipboardList,
    show: true
  }, {
    id: "compare",
    label: "Compare",
    icon: ImageIcon,
    show: true
  }, {
    id: "doctors",
    label: "Doctors",
    icon: MapPin,
    show: true
  }];
  const visibleItems = navItems.filter(item => item.show);
  const midPoint = Math.ceil(visibleItems.length / 2);
  const topRowItems = visibleItems.slice(0, midPoint);
  const bottomRowItems = visibleItems.slice(midPoint);
  
  return <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-2 lg:px-4">
        {/* Desktop Navigation - Two Rows */}
        <div className="hidden lg:block py-2">
          <div className="flex items-center justify-center gap-1 mb-1.5">
            {topRowItems.map(item => (
              <Button 
                key={item.id} 
                variant={activeTab === item.id ? "scan" : "ghost"} 
                size="sm" 
                onClick={() => onTabChange(item.id)} 
                className={`flex-1 gap-1.5 whitespace-nowrap text-xs h-8 px-3 max-w-[120px] transition-colors duration-200 ${
                  activeTab === item.id ? 'shadow-primary/30 shadow-lg' : 'hover:bg-primary/10'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1">
            {bottomRowItems.map(item => (
              <Button 
                key={item.id} 
                variant={activeTab === item.id ? "scan" : "ghost"} 
                size="sm" 
                onClick={() => onTabChange(item.id)} 
                className={`flex-1 gap-1.5 whitespace-nowrap text-xs h-8 px-3 max-w-[120px] transition-colors duration-200 ${
                  activeTab === item.id ? 'shadow-primary/30 shadow-lg' : 'hover:bg-primary/10'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            ))}
            {/* Profile Dropdown or Sign In */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={activeTab === "profile" ? "scan" : "outline"} 
                    size="sm" 
                    className={`flex-1 gap-1.5 whitespace-nowrap text-xs h-8 px-3 max-w-[120px] transition-all duration-200 hover:scale-105 hover:shadow-md ${
                      activeTab === "profile" ? 'shadow-primary/30 shadow-lg' : ''
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Profile
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-lg border-border z-[100]">
                  <DropdownMenuItem 
                    onClick={() => onTabChange("profile")}
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                  >
                    <User className="w-4 h-4 mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onTabChange("profile")}
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => signOut()}
                    className="cursor-pointer text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => navigate("/auth")}
                className="flex-1 gap-1.5 whitespace-nowrap text-xs h-8 px-3 max-w-[120px] transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center justify-end h-12 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="transition-transform duration-200 hover:scale-110">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && <nav className="lg:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="grid grid-cols-2 gap-2">
              {visibleItems.map((item, index) => (
                <Button 
                  key={item.id} 
                  variant={activeTab === item.id ? "scan" : "ghost"} 
                  className={`justify-start gap-3 transition-all duration-200 hover:scale-[1.02] ${
                    activeTab === item.id ? 'shadow-primary/20 shadow-md' : ''
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Button>
              ))}
            </div>
            {/* Auth Button - Mobile */}
            <div className="mt-4 pt-4 border-t border-border/50">
              {user ? (
                <>
                  <Button 
                    variant={activeTab === "profile" ? "scan" : "outline"} 
                    className="w-full justify-start gap-3 mb-2" 
                    onClick={() => {
                      onTabChange("profile");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <User className="w-5 h-5" />
                    Profile & Settings
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10" 
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button 
                  variant="default" 
                  className="w-full justify-start gap-3" 
                  onClick={() => {
                    navigate("/auth");
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogIn className="w-5 h-5" />
                  Sign In
                </Button>
              )}
            </div>
          </nav>}
      </div>
    </header>;
};