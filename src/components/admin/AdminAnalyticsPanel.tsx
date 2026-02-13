/**
 * Admin Analytics Panel
 * Analytics dashboard for admins
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  Download,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
}

function MetricCard({ title, value, change, icon }: MetricCardProps) {
  const isPositive = change >= 0;
  return (
    <Card className="glass-card">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <div className="flex items-center gap-1">
              {isPositive ? (
                <ArrowUp className="h-4 w-4 text-success" />
              ) : (
                <ArrowDown className="h-4 w-4 text-destructive" />
              )}
              <span className={`text-sm ${isPositive ? "text-success" : "text-destructive"}`}>
                {isPositive ? "+" : ""}
                {change}%
              </span>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          </div>
          <div className="p-3 rounded-full bg-primary/10 text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminAnalyticsPanel() {
  const [period, setPeriod] = useState("7d");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Analytics Overview</h3>
          <p className="text-sm text-muted-foreground">Track key metrics and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value="12,543"
          change={12.5}
          icon={<Users className="w-6 h-6" />}
        />
        <MetricCard
          title="Active Sessions"
          value="1,234"
          change={8.3}
          icon={<Activity className="w-6 h-6" />}
        />
        <MetricCard
          title="Revenue"
          value="$45,678"
          change={23.1}
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <MetricCard
          title="DLC Sales"
          value="342"
          change={15.7}
          icon={<Package className="w-6 h-6" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              User Growth
            </CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center bg-muted/20 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">User growth chart</p>
                <Badge variant="secondary" className="mt-2">
                  +12.5% this period
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Revenue Trend
            </CardTitle>
            <CardDescription>Revenue performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center bg-muted/20 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Revenue trend chart</p>
                <Badge variant="secondary" className="mt-2">
                  +23.1% this period
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Top DLC Packages</CardTitle>
            <CardDescription>Best selling packages this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Advanced Features Pack", sales: 156, revenue: "$7,800" },
                { name: "Premium Bundle", sales: 89, revenue: "$8,900" },
                { name: "Positions Gallery", sales: 67, revenue: "$3,350" },
                { name: "Video Library", sales: 45, revenue: "$2,250" },
              ].map((pkg, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{pkg.name}</p>
                    <p className="text-sm text-muted-foreground">{pkg.sales} sales</p>
                  </div>
                  <Badge variant="secondary">{pkg.revenue}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
            <CardDescription>Most used features this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Scanner", usage: "45,678 scans", growth: "+12%" },
                { name: "Health Diary", usage: "23,456 entries", growth: "+8%" },
                { name: "AI Chat", usage: "12,345 chats", growth: "+25%" },
                { name: "Video Library", usage: "8,901 views", growth: "+15%" },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{feature.name}</p>
                    <p className="text-sm text-muted-foreground">{feature.usage}</p>
                  </div>
                  <Badge className="bg-success">{feature.growth}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
