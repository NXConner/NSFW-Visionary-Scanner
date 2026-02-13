/**
 * Admin Notifications Panel
 * Manage system notifications and user alerts
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Send,
  Trash2,
  Users,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Mail,
  Smartphone,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  audience: "all" | "premium" | "free" | "specific";
  sentAt: string;
  readRate: number;
  status: "sent" | "scheduled" | "draft";
}

const notifications: Notification[] = [
  {
    id: "1",
    title: "New Feature: Video Capture",
    message: "Try our new multi-camera recording feature!",
    type: "info",
    audience: "all",
    sentAt: "2024-01-15 10:30",
    readRate: 78,
    status: "sent",
  },
  {
    id: "2",
    title: "Maintenance Notice",
    message: "Scheduled maintenance on Sunday 2AM-4AM EST",
    type: "warning",
    audience: "all",
    sentAt: "2024-01-14 09:00",
    readRate: 65,
    status: "sent",
  },
  {
    id: "3",
    title: "Premium Discount",
    message: "20% off all premium packages this week!",
    type: "success",
    audience: "free",
    sentAt: "2024-01-13 14:00",
    readRate: 82,
    status: "sent",
  },
  {
    id: "4",
    title: "Weekly Progress Summary",
    message: "Check out your weekly health insights",
    type: "info",
    audience: "premium",
    sentAt: "",
    readRate: 0,
    status: "scheduled",
  },
];

export function AdminNotificationsPanel() {
  const [activeTab, setActiveTab] = useState("sent");
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "info" as const,
    audience: "all" as const,
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const sentNotifications = notifications.filter(n => n.status === "sent");
  const scheduledNotifications = notifications.filter(n => n.status === "scheduled");

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{sentNotifications.length}</p>
              </div>
              <Send className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">{scheduledNotifications.length}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Read Rate</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    sentNotifications.reduce((sum, n) => sum + n.readRate, 0) /
                      sentNotifications.length,
                  )}
                  %
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">8,234</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose */}
        <Card className="glass-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Compose
            </CardTitle>
            <CardDescription>Create a new notification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Notification title..."
                value={newNotification.title}
                onChange={e => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your message..."
                value={newNotification.message}
                onChange={e => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newNotification.type}
                onValueChange={value =>
                  setNewNotification(prev => ({ ...prev, type: value as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select
                value={newNotification.audience}
                onValueChange={value =>
                  setNewNotification(prev => ({ ...prev, audience: value as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="premium">Premium Only</SelectItem>
                  <SelectItem value="free">Free Users</SelectItem>
                  <SelectItem value="specific">Specific Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label>Push Notification</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Email</Label>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <Label>In-App</Label>
                <Switch defaultChecked />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Send Now
              </Button>
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Notification History</CardTitle>
            <CardDescription>View and manage sent notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="drafts">Drafts</TabsTrigger>
              </TabsList>

              <TabsContent value="sent">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {sentNotifications.map(notif => (
                      <div key={notif.id} className="p-4 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(notif.type)}
                            <span className="font-semibold">{notif.title}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {notif.audience}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {notif.sentAt}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {notif.readRate}% read
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="scheduled">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {scheduledNotifications.map(notif => (
                      <div key={notif.id} className="p-4 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(notif.type)}
                            <span className="font-semibold">{notif.title}</span>
                            <Badge variant="secondary">Scheduled</Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="drafts">
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No drafts saved</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
