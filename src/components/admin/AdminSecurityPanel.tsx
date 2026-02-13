/**
 * Admin Security Panel
 * Security settings, audit logs, and threat monitoring
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield,
  Lock,
  AlertTriangle,
  UserX,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  Globe,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AuditLog {
  id: string;
  action: string;
  user: string;
  ip: string;
  device: string;
  timestamp: string;
  status: "success" | "failed" | "blocked";
  details: string;
}

const auditLogs: AuditLog[] = [];

interface SecurityAlert {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: string;
  resolved: boolean;
}

const securityAlerts: SecurityAlert[] = [];

interface BlockedIp {
  ip: string;
  reason: string;
  blockedAt: string;
  attempts: number;
}

const blockedIps: BlockedIp[] = [];

export function AdminSecurityPanel() {
  const [activeTab, setActiveTab] = useState("audit");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = auditLogs.filter(
    log =>
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip.includes(searchQuery),
  );

  const unresolvedAlerts = securityAlerts.filter(a => !a.resolved).length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Security Score</p>
                <p className="text-2xl font-bold text-success">A+</p>
              </div>
              <Shield className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold text-warning">{unresolvedAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Blocked Today</p>
                <p className="text-2xl font-bold">23</p>
              </div>
              <UserX className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">2FA Enabled</p>
                <p className="text-2xl font-bold">78%</p>
              </div>
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="alerts">
              Alerts
              {unresolvedAlerts > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unresolvedAlerts}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="blocked">Blocked IPs</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <TabsContent value="audit" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Audit Logs</CardTitle>
                  <CardDescription>Track all security-related actions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search logs..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No audit logs available yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium capitalize">
                            {log.action.replace("_", " ")}
                          </TableCell>
                          <TableCell>{log.user}</TableCell>
                          <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                          <TableCell>{log.device}</TableCell>
                          <TableCell className="text-muted-foreground">{log.timestamp}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                log.status === "success"
                                  ? "default"
                                  : log.status === "failed"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>Active and recent security notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {securityAlerts.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground text-center">
                      No security alerts available yet.
                    </div>
                  ) : (
                    securityAlerts.map(alert => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border ${
                          alert.resolved
                            ? "bg-muted/30 border-border"
                            : "bg-destructive/5 border-destructive/20"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {alert.resolved ? (
                              <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{alert.type}</p>
                                <Badge variant={getSeverityColor(alert.severity) as any}>
                                  {alert.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {alert.timestamp}
                              </p>
                            </div>
                          </div>
                          {!alert.resolved && (
                            <Button size="sm" variant="outline">
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Blocked IPs</CardTitle>
                  <CardDescription>Manage IP blacklist</CardDescription>
                </div>
                <Button>
                  <UserX className="h-4 w-4 mr-2" />
                  Add IP
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {blockedIps.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground text-center">
                      No blocked IPs recorded.
                    </div>
                  ) : (
                    blockedIps.map((blocked, i) => (
                      <div
                        key={`${blocked.ip}-${i}`}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <Globe className="h-5 w-5 text-destructive" />
                          <div>
                            <p className="font-mono font-medium">{blocked.ip}</p>
                            <p className="text-sm text-muted-foreground">{blocked.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <p className="text-muted-foreground">{blocked.attempts} attempts</p>
                            <p className="text-xs text-muted-foreground">{blocked.blockedAt}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Unblock
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
