import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Loader2, CheckCircle, XCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { fromExtended } from "@/lib/supabaseExtensions";

type ForumThreadRow = {
  id: string;
  thread_title: string;
  thread_content: string;
  user_id: string | null;
  is_approved: boolean | null;
  is_locked: boolean | null;
  is_pinned: boolean | null;
  created_at: string | null;
};

type ForumPostRow = {
  id: string;
  thread_id: string;
  post_content: string;
  user_id: string | null;
  is_approved: boolean | null;
  created_at: string | null;
};

type PremiumContentRow = {
  id: string;
  creator_id: string;
  title: string;
  content_type: string;
  is_active: boolean | null;
  is_verified: boolean | null;
  is_approved: boolean | null;
  moderation_notes: string | null;
  created_at: string | null;
};

export function NsfwModerationQueuePanel(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [threads, setThreads] = useState<ForumThreadRow[]>([]);
  const [posts, setPosts] = useState<ForumPostRow[]>([]);
  const [premiumItems, setPremiumItems] = useState<PremiumContentRow[]>([]);
  const [query, setQuery] = useState("");
  const [threadFilter, setThreadFilter] = useState<"all" | "pending">("pending");
  const [postFilter, setPostFilter] = useState<"all" | "pending">("pending");
  const [premiumFilter, setPremiumFilter] = useState<"all" | "pending" | "takedown">("pending");
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [threadsRes, postsRes, premiumRes] = await Promise.all([
        fromExtended("nsfw_forum_threads")
          .select(
            "id,thread_title,thread_content,user_id,is_approved,is_locked,is_pinned,created_at",
          )
          .order("created_at", { ascending: false })
          .limit(200),
        fromExtended("nsfw_forum_posts")
          .select("id,thread_id,post_content,user_id,is_approved,created_at")
          .order("created_at", { ascending: false })
          .limit(200),
        fromExtended("premium_content_items")
          .select(
            "id,creator_id,title,content_type,is_active,is_verified,is_approved,moderation_notes,created_at",
          )
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (threadsRes.error) throw new Error(threadsRes.error.message);
      if (postsRes.error) throw new Error(postsRes.error.message);
      if (premiumRes.error) throw new Error(premiumRes.error.message);

      setThreads((threadsRes.data || []) as ForumThreadRow[]);
      setPosts((postsRes.data || []) as ForumPostRow[]);
      setPremiumItems((premiumRes.data || []) as PremiumContentRow[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load moderation queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads.filter(t => {
      if (threadFilter === "pending" && t.is_approved) return false;
      if (
        q &&
        !t.thread_title.toLowerCase().includes(q) &&
        !t.thread_content.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [threads, threadFilter, query]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(p => {
      if (postFilter === "pending" && p.is_approved) return false;
      if (q && !p.post_content.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [posts, postFilter, query]);

  const filteredPremium = useMemo(() => {
    const q = query.trim().toLowerCase();
    return premiumItems.filter(item => {
      if (premiumFilter === "pending" && item.is_approved) return false;
      if (premiumFilter === "takedown" && item.is_active) return false;
      if (q && !item.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [premiumItems, premiumFilter, query]);

  const updateThread = async (id: string, patch: Partial<ForumThreadRow>) => {
    const { error } = await fromExtended("nsfw_forum_threads")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message || "Update failed");
      return;
    }
    setThreads(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
  };

  const updatePost = async (id: string, patch: Partial<ForumPostRow>) => {
    const { error } = await fromExtended("nsfw_forum_posts")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message || "Update failed");
      return;
    }
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
  };

  const updatePremium = async (id: string, patch: Partial<PremiumContentRow>) => {
    const { error } = await fromExtended("premium_content_items")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message || "Update failed");
      return;
    }
    setPremiumItems(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>NSFW Moderation Queue</CardTitle>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <Input
            placeholder="Search title/content"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : (
          <Tabs defaultValue="threads" className="space-y-4">
            <TabsList>
              <TabsTrigger value="threads">Forum Threads</TabsTrigger>
              <TabsTrigger value="posts">Forum Posts</TabsTrigger>
              <TabsTrigger value="premium">Marketplace</TabsTrigger>
            </TabsList>

            <TabsContent value="threads" className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                Pending only
                <Switch
                  checked={threadFilter === "pending"}
                  onCheckedChange={v => setThreadFilter(v ? "pending" : "all")}
                />
              </div>
              {filteredThreads.length === 0 ? (
                <div className="text-sm text-muted-foreground">No threads found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thread</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredThreads.map(thread => (
                      <TableRow key={thread.id}>
                        <TableCell>
                          <div className="font-medium">{thread.thread_title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {thread.thread_content}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={thread.is_approved ? "secondary" : "outline"}>
                            {thread.is_approved ? "Approved" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void updateThread(thread.id, { is_approved: true })}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void updateThread(thread.id, { is_approved: false })}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              void updateThread(thread.id, { is_locked: !thread.is_locked })
                            }
                          >
                            {thread.is_locked ? "Unlock" : "Lock"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="posts" className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                Pending only
                <Switch
                  checked={postFilter === "pending"}
                  onCheckedChange={v => setPostFilter(v ? "pending" : "all")}
                />
              </div>
              {filteredPosts.length === 0 ? (
                <div className="text-sm text-muted-foreground">No posts found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Post</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.map(post => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <div className="text-sm">{post.post_content}</div>
                          <div className="text-xs text-muted-foreground">
                            Thread: {post.thread_id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={post.is_approved ? "secondary" : "outline"}>
                            {post.is_approved ? "Approved" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void updatePost(post.id, { is_approved: true })}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void updatePost(post.id, { is_approved: false })}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="premium" className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                Pending only
                <Switch
                  checked={premiumFilter === "pending"}
                  onCheckedChange={v => setPremiumFilter(v ? "pending" : "all")}
                />
                <Button
                  size="sm"
                  variant={premiumFilter === "takedown" ? "default" : "outline"}
                  onClick={() =>
                    setPremiumFilter(premiumFilter === "takedown" ? "all" : "takedown")
                  }
                >
                  Show takedowns
                </Button>
              </div>
              {filteredPremium.length === 0 ? (
                <div className="text-sm text-muted-foreground">No marketplace items found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Moderation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPremium.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.content_type} • Creator: {item.creator_id.slice(0, 8)}…
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={item.is_approved ? "secondary" : "outline"}>
                              {item.is_approved ? "Approved" : "Pending"}
                            </Badge>
                            {!item.is_active && (
                              <Badge variant="destructive" className="gap-1">
                                <ShieldAlert className="w-3 h-3" /> Takedown
                              </Badge>
                            )}
                            {item.is_verified && <Badge variant="outline">Verified creator</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void updatePremium(item.id, { is_approved: true })}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                void updatePremium(item.id, { is_verified: !item.is_verified })
                              }
                            >
                              {item.is_verified ? "Unverify" : "Verify"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                void updatePremium(item.id, {
                                  is_active: false,
                                  is_approved: false,
                                  moderation_notes:
                                    notesById[item.id] || "Takedown requested by admin",
                                })
                              }
                            >
                              Takedown
                            </Button>
                          </div>
                          <Textarea
                            placeholder="Moderation notes"
                            value={notesById[item.id] ?? item.moderation_notes ?? ""}
                            onChange={e =>
                              setNotesById(prev => ({ ...prev, [item.id]: e.target.value }))
                            }
                            rows={2}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
