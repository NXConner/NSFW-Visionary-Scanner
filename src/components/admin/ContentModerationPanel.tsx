/**
 * Content Moderation Panel
 * Admin panel for managing user-submitted content - fetches real data
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Filter,
  Flag,
  Image,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Video,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

type ContentStatus = "pending" | "approved" | "rejected" | "flagged";
type ContentType = "image" | "video" | "text" | "comment";

interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  submittedBy: string;
  submittedAt: string;
  status: ContentStatus;
  reports: number;
  category: string;
}

const getTypeIcon = (type: ContentType) => {
  switch (type) {
    case "image":
      return <Image className="w-4 h-4" />;
    case "video":
      return <Video className="w-4 h-4" />;
    case "text":
      return <FileText className="w-4 h-4" />;
    case "comment":
      return <MessageSquare className="w-4 h-4" />;
  }
};

const getStatusBadge = (status: ContentStatus) => {
  switch (status) {
    case "pending":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="w-3 h-3" /> Pending
        </Badge>
      );
    case "approved":
      return (
        <Badge className="gap-1 bg-success">
          <CheckCircle className="w-3 h-3" /> Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" /> Rejected
        </Badge>
      );
    case "flagged":
      return (
        <Badge variant="outline" className="gap-1 border-amber-500 text-amber-500">
          <Flag className="w-3 h-3" /> Flagged
        </Badge>
      );
  }
};

export function ContentModerationPanel() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("queue");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const items: ContentItem[] = [];

      // Fetch video recordings
      const { data: videos } = await supabase
        .from("video_recordings")
        .select("id, recording_name, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      videos?.forEach(v => {
        items.push({
          id: v.id,
          type: "video",
          title: v.recording_name || "Untitled Video",
          submittedBy: v.user_id?.substring(0, 8) + "..." || "Unknown",
          submittedAt: v.created_at ? format(new Date(v.created_at), "MMM d, yyyy") : "Unknown",
          status: "approved" as ContentStatus,
          reports: 0,
          category: "Videos",
        });
      });

      // Fetch forum posts
      const { data: posts } = await supabase
        .from("nsfw_forum_posts")
        .select("id, post_content, user_id, created_at, is_approved")
        .order("created_at", { ascending: false })
        .limit(50);

      posts?.forEach(p => {
        items.push({
          id: p.id,
          type: "comment",
          title: p.post_content?.substring(0, 50) + "..." || "Forum Post",
          submittedBy: p.user_id?.substring(0, 8) + "..." || "Unknown",
          submittedAt: p.created_at ? format(new Date(p.created_at), "MMM d, yyyy") : "Unknown",
          status: p.is_approved ? "approved" : "pending",
          reports: 0,
          category: "Forum",
        });
      });

      // Fetch testimonials
      const { data: testimonials } = await supabase
        .from("testimonials")
        .select("id, content, user_id, created_at, verified, featured")
        .order("created_at", { ascending: false })
        .limit(50);

      testimonials?.forEach(t => {
        items.push({
          id: t.id,
          type: "text",
          title: t.content?.substring(0, 50) + "..." || "Testimonial",
          submittedBy: t.user_id?.substring(0, 8) + "..." || "Unknown",
          submittedAt: t.created_at ? format(new Date(t.created_at), "MMM d, yyyy") : "Unknown",
          status: t.verified ? "approved" : "pending",
          reports: 0,
          category: "Testimonials",
        });
      });

      // Fetch expert articles
      const { data: articles } = await supabase
        .from("expert_articles")
        .select("id, title, expert_id, created_at, published_at")
        .order("created_at", { ascending: false })
        .limit(50);

      articles?.forEach(a => {
        items.push({
          id: a.id,
          type: "text",
          title: a.title || "Article",
          submittedBy: a.expert_id?.substring(0, 8) + "..." || "Unknown",
          submittedAt: a.created_at ? format(new Date(a.created_at), "MMM d, yyyy") : "Unknown",
          status: a.published_at ? "approved" : "pending",
          reports: 0,
          category: "Articles",
        });
      });

      setContent(items);
    } catch (err) {
      console.error("Error fetching content:", err);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchContent();
  }, [fetchContent]);

  const stats = {
    pending: content.filter(c => c.status === "pending").length,
    flagged: content.filter(c => c.status === "flagged").length,
    approved: content.filter(c => c.status === "approved").length,
    rejected: content.filter(c => c.status === "rejected").length,
  };

  const filteredContent = content.filter(item => {
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    if (filterType !== "all" && item.type !== filterType) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-secondary">
                <Clock className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/10">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.flagged}</p>
                <p className="text-xs text-muted-foreground">Flagged</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="queue" className="gap-2">
              <Clock className="w-4 h-4" />
              Moderation Queue
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <Flag className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <FileText className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Shield className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={fetchContent} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <TabsContent value="queue" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredContent.map(item => (
                  <Card key={item.id} className="glass-card hover:bg-muted/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-muted/50">{getTypeIcon(item.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium truncate">{item.title}</h4>
                            {getStatusBadge(item.status)}
                            {item.reports > 0 && (
                              <Badge variant="outline" className="gap-1 text-amber-500">
                                <Flag className="w-3 h-3" /> {item.reports} reports
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            By {item.submittedBy} • {item.submittedAt} • {item.category}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" variant="outline" className="gap-1">
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 text-success">
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 text-destructive">
                            <Trash2 className="w-3 h-3" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredContent.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No content matches your filters</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>User Reports</CardTitle>
              <CardDescription>Content flagged by users for review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {content
                  .filter(c => c.reports > 0 || c.status === "flagged")
                  .map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 rounded-lg border border-border"
                    >
                      {getTypeIcon(item.type)}
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.reports} reports</p>
                      </div>
                      <Button size="sm">Review</Button>
                    </div>
                  ))}
                {content.filter(c => c.reports > 0 || c.status === "flagged").length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No reported content</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Moderation History</CardTitle>
              <CardDescription>Recent moderation actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {content
                  .filter(c => c.status !== "pending")
                  .map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 rounded-lg border border-border"
                    >
                      {getTypeIcon(item.type)}
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.submittedAt}</p>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Moderation Settings</CardTitle>
              <CardDescription>Configure auto-moderation and rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2">Auto-Moderation</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Automatically flag content based on rules
                    </p>
                    <Button variant="outline" size="sm">
                      Configure Rules
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2">Content Filters</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Manage blocked words and phrases
                    </p>
                    <Button variant="outline" size="sm">
                      Edit Filters
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2">Report Thresholds</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Set when content is auto-flagged
                    </p>
                    <Button variant="outline" size="sm">
                      Set Thresholds
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2">Moderator Roles</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Manage who can moderate content
                    </p>
                    <Button variant="outline" size="sm">
                      Manage Roles
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
