/**
 * Admin Database Panel
 * Database management and monitoring
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Database,
  Table,
  HardDrive,
  Activity,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface TableInfo {
  name: string;
  rows: number;
  size: string;
  lastModified: string;
  status: "healthy" | "warning" | "error";
}

const tables: TableInfo[] = [
  { name: "users", rows: 12543, size: "45.2 MB", lastModified: "2 min ago", status: "healthy" },
  { name: "scans", rows: 45678, size: "128.5 MB", lastModified: "5 min ago", status: "healthy" },
  { name: "measurements", rows: 89234, size: "256.8 MB", lastModified: "1 min ago", status: "healthy" },
  { name: "dlc_purchases", rows: 3456, size: "12.3 MB", lastModified: "15 min ago", status: "healthy" },
  { name: "habit_entries", rows: 156789, size: "89.4 MB", lastModified: "3 min ago", status: "healthy" },
  { name: "forum_posts", rows: 23456, size: "67.8 MB", lastModified: "10 min ago", status: "warning" },
  { name: "notifications", rows: 78901, size: "34.2 MB", lastModified: "1 min ago", status: "healthy" },
  { name: "audit_logs", rows: 234567, size: "456.7 MB", lastModified: "1 min ago", status: "healthy" },
];

interface BackupInfo {
  id: string;
  name: string;
  size: string;
  createdAt: string;
  status: "completed" | "in_progress" | "failed";
}

const backups: BackupInfo[] = [
  { id: "1", name: "backup_2024-01-15_daily", size: "1.2 GB", createdAt: "2024-01-15 03:00", status: "completed" },
  { id: "2", name: "backup_2024-01-14_daily", size: "1.1 GB", createdAt: "2024-01-14 03:00", status: "completed" },
  { id: "3", name: "backup_2024-01-13_daily", size: "1.1 GB", createdAt: "2024-01-13 03:00", status: "completed" },
  { id: "4", name: "backup_2024-01-08_weekly", size: "1.0 GB", createdAt: "2024-01-08 03:00", status: "completed" },
];

export function AdminDatabasePanel() {
  const [activeTab, setActiveTab] = useState("tables");

  const totalRows = tables.reduce((sum, t) => sum + t.rows, 0);
  const storageUsed = 1.2; // GB
  const storageTotal = 5; // GB
  const storagePercent = (storageUsed / storageTotal) * 100;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tables</p>
                <p className="text-2xl font-bold">{tables.length}</p>
              </div>
              <Table className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{totalRows.toLocaleString()}</p>
              </div>
              <Database className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold">{storageUsed} GB</p>
              </div>
              <HardDrive className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Health Status</p>
                <p className="text-2xl font-bold text-success">Good</p>
              </div>
              <Activity className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Progress */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Storage Usage</span>
              <span className="text-sm text-muted-foreground">
                {storageUsed} GB / {storageTotal} GB
              </span>
            </div>
            <Progress value={storagePercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="backups">Backups</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="tables" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Database Tables</CardTitle>
              <CardDescription>View and manage all database tables</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {tables.map(table => (
                    <div
                      key={table.name}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <Database className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{table.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {table.rows.toLocaleString()} rows • {table.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {table.lastModified}
                        </span>
                        {table.status === "healthy" ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : table.status === "warning" ? (
                          <AlertTriangle className="h-5 w-5 text-warning" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Backups</CardTitle>
                  <CardDescription>Manage database backups</CardDescription>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {backups.map(backup => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <HardDrive className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{backup.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {backup.size} • {backup.createdAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            backup.status === "completed"
                              ? "default"
                              : backup.status === "in_progress"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {backup.status}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Maintenance Tasks</CardTitle>
                <CardDescription>Run database maintenance operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Vacuum Database", desc: "Reclaim storage space", icon: HardDrive },
                  { name: "Analyze Tables", desc: "Update query statistics", icon: Activity },
                  { name: "Reindex Tables", desc: "Rebuild table indexes", icon: RefreshCw },
                  { name: "Clear Cache", desc: "Clear query cache", icon: Trash2 },
                ].map((task, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <task.icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{task.name}</p>
                        <p className="text-sm text-muted-foreground">{task.desc}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Run
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Scheduled Jobs</CardTitle>
                <CardDescription>Automated maintenance tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Daily Backup", schedule: "Every day at 3:00 AM", lastRun: "6 hours ago", status: "success" },
                  { name: "Weekly Vacuum", schedule: "Every Sunday at 4:00 AM", lastRun: "3 days ago", status: "success" },
                  { name: "Log Rotation", schedule: "Every day at midnight", lastRun: "8 hours ago", status: "success" },
                  { name: "Analytics Rollup", schedule: "Every hour", lastRun: "45 min ago", status: "success" },
                ].map((job, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{job.name}</p>
                        <p className="text-sm text-muted-foreground">{job.schedule}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-success">
                        {job.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{job.lastRun}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
