/**
 * Admin Dashboard
 * Comprehensive admin panel for managing the application
 */

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Users,
  Package,
  Key,
  BarChart3,
  Settings,
  Shield,
  FileText,
  Bell,
  Database,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  RefreshCw,
  Download,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ContentModerationPanel } from "@/components/admin/ContentModerationPanel";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { AdminAnalyticsPanel } from "@/components/admin/AdminAnalyticsPanel";
import { AdminDLCPanel } from "@/components/admin/AdminDLCPanel";
import { AdminLicensesPanel } from "@/components/admin/AdminLicensesPanel";
import { AdminNotificationsPanel } from "@/components/admin/AdminNotificationsPanel";
import { AdminDatabasePanel } from "@/components/admin/AdminDatabasePanel";
import { AdminSettingsPanel } from "@/components/admin/AdminSettingsPanel";
import { AdminHealthPanel } from "@/components/admin/AdminHealthPanel";
import { AdminSecurityPanel } from "@/components/admin/AdminSecurityPanel";
import {
  SUPPORT_CONTACT_EMAIL,
  PRIVACY_CONTACT_EMAIL,
  DPO_CONTACT_EMAIL,
} from "@/config/brand";
import { useAdminMetrics } from "@/hooks/useAdminMetrics";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: "up" | "down";
}

function MetricCard({ title, value, change, icon, trend }: MetricCardProps) {
  return (
    <Card className="glass-card">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className={`text-sm ${trend === "up" ? "text-success" : "text-destructive"}`}>
                  {change > 0 ? "+" : ""}
                  {change}%
                </span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-full bg-primary/10 text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string | number;
}

function NavItem({ icon, label, active, onClick, badge }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all ${
        active
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      {badge !== undefined && <Badge variant={active ? "secondary" : "default"}>{badge}</Badge>}
    </button>
  );
}

export interface AdminDashboardProps {
  /**
   * Optional initial section, used by route-specific admin deep-links
   * like `/admin/settings`, `/admin/users`, etc.
   */
  initialSection?: string;
}

export default function AdminDashboard({ initialSection }: AdminDashboardProps) {
  const allowedSections = useMemo(
    () =>
      new Set([
        "overview",
        "users",
        "dlc",
        "licenses",
        "analytics",
        "notifications",
        "content",
        "database",
        "health",
        "security",
        "settings",
      ]),
    [],
  );

  const normalizeSection = (section?: string) => {
    if (!section) return "overview";
    const cleaned = section.trim().toLowerCase();
    return allowedSections.has(cleaned) ? cleaned : "overview";
  };

  const [activeSection, setActiveSection] = useState<string>(() =>
    normalizeSection(initialSection),
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Keep dashboard in sync with route-driven deep-links.
    setActiveSection(normalizeSection(initialSection));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSection]);

  const { metrics, refresh: refreshMetrics } = useAdminMetrics();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshMetrics();
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Manage your application with ease</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button asChild>
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="glass-card sticky top-24">
              <CardHeader>
                <CardTitle>Navigation</CardTitle>
                <CardDescription>Manage your application</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-1">
                    <NavItem
                      icon={<LayoutDashboard className="h-5 w-5" />}
                      label="Overview"
                      active={activeSection === "overview"}
                      onClick={() => setActiveSection("overview")}
                    />
                    <NavItem
                      icon={<Users className="h-5 w-5" />}
                      label="Users"
                      active={activeSection === "users"}
                      onClick={() => setActiveSection("users")}
                      badge={metrics.totalUsers}
                    />
                    <NavItem
                      icon={<Package className="h-5 w-5" />}
                      label="DLC Packages"
                      active={activeSection === "dlc"}
                      onClick={() => setActiveSection("dlc")}
                      badge={9}
                    />
                    <NavItem
                      icon={<Key className="h-5 w-5" />}
                      label="Licenses"
                      active={activeSection === "licenses"}
                      onClick={() => setActiveSection("licenses")}
                      badge={542}
                    />
                    <NavItem
                      icon={<BarChart3 className="h-5 w-5" />}
                      label="Analytics"
                      active={activeSection === "analytics"}
                      onClick={() => setActiveSection("analytics")}
                    />
                    <NavItem
                      icon={<Bell className="h-5 w-5" />}
                      label="Notifications"
                      active={activeSection === "notifications"}
                      onClick={() => setActiveSection("notifications")}
                      badge={metrics.supportTickets}
                    />
                    <NavItem
                      icon={<FileText className="h-5 w-5" />}
                      label="Content"
                      active={activeSection === "content"}
                      onClick={() => setActiveSection("content")}
                    />
                    <NavItem
                      icon={<Database className="h-5 w-5" />}
                      label="Database"
                      active={activeSection === "database"}
                      onClick={() => setActiveSection("database")}
                    />
                    <NavItem
                      icon={<Settings className="h-5 w-5" />}
                      label="System Settings"
                      active={activeSection === "settings"}
                      onClick={() => setActiveSection("settings")}
                    />
                    <NavItem
                      icon={<Activity className="h-5 w-5" />}
                      label="System Health"
                      active={activeSection === "health"}
                      onClick={() => setActiveSection("health")}
                    />
                    <NavItem
                      icon={<Shield className="h-5 w-5" />}
                      label="Security"
                      active={activeSection === "security"}
                      onClick={() => setActiveSection("security")}
                    />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeSection === "overview" && (
              <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <MetricCard
                    title="Total Users"
                    value={metrics.totalUsers.toLocaleString()}
                    change={12.5}
                    trend="up"
                    icon={<Users className="h-6 w-6" />}
                  />
                  <MetricCard
                    title="Active Users"
                    value={metrics.activeUsers.toLocaleString()}
                    change={8.3}
                    trend="up"
                    icon={<Activity className="h-6 w-6" />}
                  />
                  <MetricCard
                    title="DLC Sales"
                    value={metrics.dlcSales}
                    change={18.7}
                    trend="up"
                    icon={<Package className="h-6 w-6" />}
                  />
                  <MetricCard
                    title="Support Tickets"
                    value={metrics.supportTickets}
                    change={-15.2}
                    trend="down"
                    icon={<Bell className="h-6 w-6" />}
                  />
                  <MetricCard
                    title="New Users (30d)"
                    value={metrics.newUsers}
                    change={23.1}
                    trend="up"
                    icon={<TrendingUp className="h-6 w-6" />}
                  />
                  <MetricCard
                    title="Retention Rate"
                    value={`${metrics.retention}%`}
                    change={5.2}
                    trend="up"
                    icon={<TrendingUp className="h-6 w-6" />}
                  />
                </div>

                {/* Recent Activity */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest system events and user actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          user: SUPPORT_CONTACT_EMAIL,
                          action: "Purchased DLC Package: Positions Gallery",
                          time: "2 minutes ago",
                          type: "purchase",
                        },
                        {
                          user: PRIVACY_CONTACT_EMAIL,
                          action: "Completed onboarding tutorial",
                          time: "15 minutes ago",
                          type: "signup",
                        },
                        {
                          user: DPO_CONTACT_EMAIL,
                          action: "Updated system settings",
                          time: "1 hour ago",
                          type: "admin",
                        },
                        {
                          user: SUPPORT_CONTACT_EMAIL,
                          action: "Activated license key",
                          time: "2 hours ago",
                          type: "license",
                        },
                      ].map((activity, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                        >
                          <div
                            className={`p-2 rounded-full ${
                              activity.type === "purchase"
                                ? "bg-success/10 text-success"
                                : activity.type === "admin"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted"
                            }`}
                          >
                            {activity.type === "purchase" && <Package className="h-4 w-4" />}
                            {activity.type === "signup" && <Users className="h-4 w-4" />}
                            {activity.type === "admin" && <Shield className="h-4 w-4" />}
                            {activity.type === "license" && <Key className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{activity.action}</p>
                            <p className="text-sm text-muted-foreground">{activity.user}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button variant="outline" className="h-24 flex-col gap-2">
                        <Users className="h-6 w-6" />
                        <span className="text-sm">Add User</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex-col gap-2">
                        <Package className="h-6 w-6" />
                        <span className="text-sm">New DLC</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex-col gap-2">
                        <Key className="h-6 w-6" />
                        <span className="text-sm">Generate Key</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex-col gap-2">
                        <Upload className="h-6 w-6" />
                        <span className="text-sm">Upload Content</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeSection === "users" && <AdminUsersPanel />}
            
            {activeSection === "content" && <ContentModerationPanel />}
            
            {activeSection === "analytics" && <AdminAnalyticsPanel />}

            {activeSection === "dlc" && <AdminDLCPanel />}
            
            {activeSection === "licenses" && <AdminLicensesPanel />}
            
            {activeSection === "notifications" && <AdminNotificationsPanel />}
            
            {activeSection === "database" && <AdminDatabasePanel />}
            
            {activeSection === "settings" && <AdminSettingsPanel />}
            
            {activeSection === "health" && <AdminHealthPanel />}
            
            {activeSection === "security" && <AdminSecurityPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
